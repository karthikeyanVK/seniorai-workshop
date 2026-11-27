import type { AgentEvent, Route, Source } from "../agent/types";

export interface ToolStep {
  id: string;
  name: string;
  args: unknown;
  step: number;
  status: "running" | "ok" | "error";
  ms?: number;
  rowCount?: number;
  truncated?: boolean;
  error?: string;
  preview?: string;
}

export interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps: ToolStep[];
  sources: Source[];
  route?: Route;
  status: "streaming" | "done" | "error" | "stopped";
  error?: string;
  stepCount?: number;
  startedAt: number;
  durationMs?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: UiMessage[];
  updatedAt: number;
}

/** Pure reducer: fold one streamed AgentEvent into the assistant message. */
export function applyEvent(m: UiMessage, ev: AgentEvent, now = Date.now()): UiMessage {
  switch (ev.type) {
    case "step":
      return { ...m, stepCount: ev.step };
    case "tool_start":
      return { ...m, steps: [...m.steps, { id: ev.id, name: ev.name, args: ev.args, step: m.stepCount ?? 1, status: "running" }] };
    case "tool_end":
      return {
        ...m,
        steps: m.steps.map((s) =>
          s.id === ev.id ? { ...s, status: ev.ok ? "ok" : "error", ms: ev.ms, rowCount: ev.rowCount, truncated: ev.truncated, error: ev.error, preview: ev.preview } : s,
        ),
      };
    case "text":
      return { ...m, content: m.content + ev.delta };
    case "citations":
      return { ...m, sources: ev.items };
    case "done":
      return { ...m, status: "done", route: ev.route, stepCount: ev.steps, durationMs: now - m.startedAt };
    case "error":
      return { ...m, status: "error", error: ev.message, durationMs: now - m.startedAt };
  }
}

export const titleFrom = (text: string): string => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 48 ? `${t.slice(0, 47)}…` : t || "New chat";
};

export const uid = (): string => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
