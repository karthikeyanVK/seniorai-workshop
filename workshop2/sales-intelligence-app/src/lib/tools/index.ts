import type { Tool, ToolContext, ToolResult } from "../agent/types";
import { errMsg } from "../logger";
import { lookupCustomer } from "./customer";
import { lookupDeal } from "./deal";
import { searchKnowledgeBase } from "./kb";
import { pipelineReport } from "./pipeline";
import { revenueAnalysis } from "./revenue";
import { runSql } from "./runSql";
import { describeSchema, listTables } from "./schema";

export const TOOLS: Tool[] = [listTables, describeSchema, runSql, lookupCustomer, lookupDeal, revenueAnalysis, pipelineReport, searchKnowledgeBase];
const byName = new Map(TOOLS.map((t) => [t.name, t]));

export const openAiTools = () =>
  TOOLS.map((t) => ({ type: "function" as const, function: { name: t.name, description: t.description, parameters: t.parameters } }));

export const toolKind = (name: string) => byName.get(name)?.kind;

/** Never throws: bad JSON, unknown tool and handler errors all become {ok:false,error} the model can react to. */
export async function executeTool(name: string, rawArgs: string, ctx: ToolContext): Promise<{ args: unknown; result: ToolResult; ms: number }> {
  const t0 = Date.now();
  let args: Record<string, unknown> = {};
  try {
    args = rawArgs?.trim() ? JSON.parse(rawArgs) : {};
    if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("arguments must be a JSON object");
  } catch (e) {
    return { args: rawArgs, result: { ok: false, error: `Invalid tool arguments: ${errMsg(e)}` }, ms: Date.now() - t0 };
  }
  const tool = byName.get(name);
  if (!tool) return { args, result: { ok: false, error: `Unknown tool "${name}"` }, ms: Date.now() - t0 };
  try {
    const result = await tool.run(args, ctx);
    return { args, result, ms: Date.now() - t0 };
  } catch (e) {
    ctx.log.warn("tool failed", { tool: name, error: errMsg(e) });
    return { args, result: { ok: false, error: errMsg(e).slice(0, 300) }, ms: Date.now() - t0 };
  }
}
