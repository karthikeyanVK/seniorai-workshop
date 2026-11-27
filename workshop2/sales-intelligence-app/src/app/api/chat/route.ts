import { runAgent } from "@/lib/agent/run";
import type { ChatMessage } from "@/lib/agent/types";
import { missingConfig } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 60;
const MAX_CHARS = 8000;

function parseMessages(body: unknown): ChatMessage[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const out: ChatMessage[] = [];
  for (const m of raw) {
    const { role, content } = (m ?? {}) as Partial<ChatMessage>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || content.length > MAX_CHARS) return null;
    out.push({ role, content });
  }
  return out[out.length - 1].role === "user" ? out : null;
}

export async function POST(req: Request) {
  const missing = missingConfig();
  if (missing.length) return Response.json({ error: "Missing configuration", missing }, { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const messages = parseMessages(body);
  if (!messages) return Response.json({ error: `Expected { messages: [...] } (max ${MAX_MESSAGES}, ${MAX_CHARS} chars each) ending with a user message` }, { status: 400 });

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of runAgent(messages, req.signal)) controller.enqueue(enc.encode(`${JSON.stringify(ev)}\n`));
      } catch {
        /* client went away; nothing to send */
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" },
  });
}
