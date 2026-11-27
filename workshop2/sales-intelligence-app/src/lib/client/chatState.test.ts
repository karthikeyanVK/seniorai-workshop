import { describe, expect, it } from "vitest";
import type { AgentEvent } from "../agent/types";
import { applyEvent, titleFrom, type UiMessage } from "./chatState";

const base: UiMessage = { id: "a", role: "assistant", content: "", steps: [], sources: [], status: "streaming", startedAt: 1000 };
const run = (events: AgentEvent[]) => events.reduce((m, e) => applyEvent(m, e, 3500), base);

describe("applyEvent", () => {
  it("folds a full tool-calling turn", () => {
    const m = run([
      { type: "step", step: 1 },
      { type: "tool_start", id: "t1", name: "revenue_analysis", args: { metric: "collected" } },
      { type: "tool_end", id: "t1", name: "revenue_analysis", ok: true, ms: 120, rowCount: 5, preview: "{}" },
      { type: "step", step: 2 },
      { type: "text", delta: "Top " },
      { type: "text", delta: "customer [S1]" },
      { type: "citations", items: [{ id: "S1", kind: "sql", label: "Revenue", query: "SELECT 1", rowCount: 5, cited: true }] },
      { type: "done", route: "SQL", steps: 2 },
    ]);
    expect(m.content).toBe("Top customer [S1]");
    expect(m.steps).toEqual([expect.objectContaining({ id: "t1", step: 1, status: "ok", ms: 120, rowCount: 5 })]);
    expect(m.sources).toHaveLength(1);
    expect(m).toMatchObject({ status: "done", route: "SQL", stepCount: 2, durationMs: 2500 });
  });

  it("marks failed tools and error turns", () => {
    const m = run([
      { type: "tool_start", id: "t1", name: "run_sql", args: {} },
      { type: "tool_end", id: "t1", name: "run_sql", ok: false, ms: 5, error: "Only SELECT statements are allowed.", preview: "x" },
      { type: "error", message: "boom" },
    ]);
    expect(m.steps[0]).toMatchObject({ status: "error", error: "Only SELECT statements are allowed." });
    expect(m).toMatchObject({ status: "error", error: "boom" });
  });
});

describe("titleFrom", () => {
  it("collapses whitespace and truncates", () => {
    expect(titleFrom("  hello \n world ")).toBe("hello world");
    expect(titleFrom("x".repeat(80))).toHaveLength(48);
    expect(titleFrom("   ")).toBe("New chat");
  });
});
