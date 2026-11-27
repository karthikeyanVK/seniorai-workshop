import "server-only";
import type OpenAI from "openai";
import { loadConfig } from "../config";
import { errMsg, makeLogger } from "../logger";
import { getOpenAI } from "../openai";
import { executeTool, openAiTools, toolKind } from "../tools";
import { buildSystemPrompt } from "./prompt";
import type { AgentEvent, ChatMessage, Route, Source, ToolContext } from "./types";

type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const TOOL_MSG_MAX = 24_000;
const PREVIEW_MAX = 700;
const CITE_RE = /\[(S\d+(?:\s*[,;]\s*S\d+)*)\]/g;

const safeParse = (s: string): unknown => {
  try { return JSON.parse(s || "{}"); } catch { return s; }
};

function friendly(e: unknown): string {
  const status = (e as { status?: number })?.status;
  if (status === 401 || status === 403) return "Azure OpenAI rejected the credentials. Check API_KEY / API_BASE.";
  if (status === 404) return "Azure OpenAI deployment not found. Check DEPLOYMENT_NAME / API_VERSION.";
  if (status === 429) return "Azure OpenAI is rate limiting requests. Try again in a moment.";
  return "The agent hit an unexpected error. See server logs.";
}

export const routeOf = (used: Set<"sql" | "rag">): Route =>
  used.has("sql") && used.has("rag") ? "SQL+RAG" : used.has("sql") ? "SQL" : used.has("rag") ? "RAG" : "DIRECT";

/** Tool-calling loop. Yields NDJSON-ready events; never throws (errors become an `error` event). */
export async function* runAgent(history: ChatMessage[], signal?: AbortSignal): AsyncGenerator<AgentEvent> {
  const cfg = loadConfig();
  const log = makeLogger(cfg.logLevel).child({ req: crypto.randomUUID().slice(0, 8) });
  const sources: Source[] = [];
  const ctx: ToolContext = {
    log,
    addSource(s) {
      const id = `S${sources.length + 1}`;
      sources.push({ ...s, id } as Source);
      return id;
    },
  };
  const messages: Msg[] = [{ role: "system", content: buildSystemPrompt(cfg) }, ...history.slice(-cfg.agent.historyMessages)];
  const used = new Set<"sql" | "rag">();
  let answer = "";
  let steps = 0;

  try {
    for (let step = 1; step <= cfg.agent.maxSteps; step++) {
      steps = step;
      yield { type: "step", step };
      const lastStep = step === cfg.agent.maxSteps;
      const stream = await getOpenAI().chat.completions.create(
        { model: cfg.openai.chatDeployment, messages, tools: openAiTools(), tool_choice: lastStep ? "none" : "auto", stream: true, temperature: 0.2 },
        { signal },
      );

      let content = "";
      let sepSent = answer.length === 0;
      const calls: { id: string; name: string; args: string }[] = [];
      for await (const chunk of stream) {
        const d = chunk.choices[0]?.delta;
        if (!d) continue;
        if (d.content) {
          if (!sepSent) { sepSent = true; answer += "\n\n"; yield { type: "text", delta: "\n\n" }; }
          content += d.content;
          answer += d.content;
          yield { type: "text", delta: d.content };
        }
        for (const tc of d.tool_calls ?? []) {
          const c = (calls[tc.index] ??= { id: "", name: "", args: "" });
          if (tc.id) c.id = tc.id;
          if (tc.function?.name) c.name += tc.function.name;
          if (tc.function?.arguments) c.args += tc.function.arguments;
        }
      }

      const batch = calls.filter(Boolean);
      if (!batch.length) break;

      messages.push({
        role: "assistant",
        content: content || null,
        tool_calls: batch.map((c) => ({ id: c.id, type: "function" as const, function: { name: c.name, arguments: c.args } })),
      });
      for (const c of batch) yield { type: "tool_start", id: c.id, name: c.name, args: safeParse(c.args) };

      // Per-call ctx records which source ids each call produced, so every tool result can say exactly how to cite it.
      const citeIds: string[][] = batch.map(() => []);
      const results = await Promise.all(
        batch.map((c, i) => executeTool(c.name, c.args, { ...ctx, addSource: (s) => { const id = ctx.addSource(s); citeIds[i].push(id); return id; } })),
      );
      for (let i = 0; i < batch.length; i++) {
        const c = batch[i];
        const { args, result, ms } = results[i];
        const kind = toolKind(c.name);
        if (kind && result.ok) used.add(kind);
        log.info("tool", { tool: c.name, ms, ok: result.ok, rowCount: result.rowCount, truncated: result.truncated, args });
        const cite_with = citeIds[i].map((id) => `[${id}]`).join("");
        const payload = JSON.stringify(
          result.ok ? { ok: true, cite_with, truncated: result.truncated ?? false, data: result.data } : { ok: false, error: result.error },
        );
        messages.push({ role: "tool", tool_call_id: c.id, content: payload.length > TOOL_MSG_MAX ? `${payload.slice(0, TOOL_MSG_MAX)}…[truncated]` : payload });
        yield {
          type: "tool_end", id: c.id, name: c.name, ok: result.ok, ms, rowCount: result.rowCount, truncated: result.truncated, error: result.error,
          preview: (result.ok ? JSON.stringify(result.data) : result.error ?? "").slice(0, PREVIEW_MAX),
        };
      }
    }

    const cited = new Set<string>();
    for (const m of answer.matchAll(CITE_RE)) for (const id of m[1].split(/[,;]\s*/)) cited.add(id.trim());
    if (sources.length) yield { type: "citations", items: sources.map((s) => ({ ...s, cited: cited.has(s.id) })) };
    yield { type: "done", route: routeOf(used), steps };
  } catch (e) {
    if (signal?.aborted) return;
    log.error("agent failed", { error: errMsg(e) });
    yield { type: "error", message: friendly(e) };
  }
}
