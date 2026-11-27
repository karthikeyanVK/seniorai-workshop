import type { Logger } from "../logger";

/** A piece of evidence the answer can cite as [S#]. Assigned server-side per request. */
export type SourceInput =
  | { kind: "kb"; docId: string; title: string; category: string; path: string; heading: string; snippet: string; score: number }
  | { kind: "sql"; label: string; query: string; rowCount: number };
export type Source = SourceInput & { id: string; cited?: boolean };

export interface ToolContext {
  log: Logger;
  addSource(s: SourceInput): string; // returns "S1", "S2", ...
}

export interface ToolResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  rowCount?: number;
  truncated?: boolean;
}

export type Args = Record<string, unknown>;

export interface Tool {
  name: string;
  description: string;
  /** JSON Schema for the arguments. */
  parameters: Record<string, unknown>;
  /** "sql" | "rag" drives the route label shown in the UI. */
  kind: "sql" | "rag";
  run(args: Args, ctx: ToolContext): Promise<ToolResult>;
}

export type Route = "SQL" | "RAG" | "SQL+RAG" | "DIRECT";

/** NDJSON events streamed from /api/chat. */
export type AgentEvent =
  | { type: "step"; step: number }
  | { type: "tool_start"; id: string; name: string; args: unknown }
  | { type: "tool_end"; id: string; name: string; ok: boolean; ms: number; rowCount?: number; truncated?: boolean; error?: string; preview: string }
  | { type: "text"; delta: string }
  | { type: "citations"; items: Source[] }
  | { type: "done"; route: Route; steps: number }
  | { type: "error"; message: string };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
