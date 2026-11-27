"use client";
import { useEffect, useRef, useState } from "react";
import type { Route } from "@/lib/agent/types";
import type { ToolStep, UiMessage } from "@/lib/client/chatState";

const LABEL: Record<string, string> = {
  list_tables: "List tables",
  describe_schema: "Describe schema",
  run_sql: "Run SQL",
  lookup_customer: "Customer lookup",
  lookup_deal: "Deal lookup",
  revenue_analysis: "Revenue analysis",
  pipeline_report: "Pipeline report",
  search_knowledge_base: "Knowledge base search",
};

const ROUTE_STYLE: Record<Route, string> = {
  SQL: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  RAG: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "SQL+RAG": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  DIRECT: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300",
};

export function RouteBadge({ route }: { route: Route }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROUTE_STYLE[route]}`}>{route}</span>;
}

const summarize = (args: unknown): string => {
  if (!args || typeof args !== "object") return String(args ?? "");
  const s = Object.entries(args as Record<string, unknown>)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("  ");
  return s.length > 110 ? `${s.slice(0, 109)}…` : s;
};

function StatusIcon({ status }: { status: ToolStep["status"] }) {
  if (status === "running")
    return <span aria-label="running" className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-500 dark:border-zinc-600" />;
  return status === "ok" ? (
    <svg aria-label="succeeded" viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3 3 7-7" /></svg>
  ) : (
    <svg aria-label="failed" viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
  );
}

function StepRow({ s }: { s: ToolStep }) {
  const rag = s.name === "search_knowledge_base";
  return (
    <li>
      <details className="rounded-lg border border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/40">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-1.5 text-xs [&::-webkit-details-marker]:hidden">
          <StatusIcon status={s.status} />
          <span className={`shrink-0 font-semibold ${rag ? "text-violet-600 dark:text-violet-300" : "text-sky-700 dark:text-sky-300"}`}>{LABEL[s.name] ?? s.name}</span>
          <span className="min-w-0 flex-1 truncate text-zinc-500 dark:text-zinc-400">{summarize(s.args)}</span>
          <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
            {s.ms !== undefined ? `${s.ms} ms` : "…"}
            {s.rowCount !== undefined ? ` · ${s.rowCount} ${rag ? "passages" : "rows"}` : ""}
          </span>
        </summary>
        <div className="space-y-2 border-t border-zinc-200 px-2.5 py-2 text-xs dark:border-zinc-800">
          <div>
            <div className="mb-0.5 font-medium text-zinc-500">Arguments</div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-zinc-100 p-2 dark:bg-zinc-900">{JSON.stringify(s.args, null, 2)}</pre>
          </div>
          {s.error && <div className="rounded bg-red-50 p-2 text-red-700 dark:bg-red-500/10 dark:text-red-300">{s.error}</div>}
          {s.preview && !s.error && (
            <div>
              <div className="mb-0.5 font-medium text-zinc-500">Result preview{s.truncated ? " (row cap reached)" : ""}</div>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-zinc-100 p-2 dark:bg-zinc-900">{s.preview}</pre>
            </div>
          )}
        </div>
      </details>
    </li>
  );
}

/** Expandable agent activity: route, every tool call with args, timing, row counts and a result preview. */
export default function ActivityPanel({ m }: { m: UiMessage }) {
  const streaming = m.status === "streaming";
  const [open, setOpen] = useState(streaming);
  const touched = useRef(false);
  useEffect(() => {
    if (!streaming && !touched.current) setOpen(false); // collapse when finished unless the user toggled it
  }, [streaming]);

  if (!streaming && m.steps.length === 0) return null;
  const secs = m.durationMs !== undefined ? `${(m.durationMs / 1000).toFixed(1)}s` : null;

  return (
    <section aria-label="Agent activity" className="mb-3 rounded-xl border border-zinc-200 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900/50">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => { touched.current = true; setOpen((o) => !o); }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-indigo-500"
      >
        <svg viewBox="0 0 16 16" className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5" /></svg>
        <span className="font-semibold">Agent activity</span>
        {m.route && <RouteBadge route={m.route} />}
        <span className="text-zinc-500 dark:text-zinc-400">
          {streaming ? (m.steps.length ? `${m.steps.length} tool call${m.steps.length > 1 ? "s" : ""} · working…` : "Thinking…") : `${m.steps.length} tool call${m.steps.length === 1 ? "" : "s"}${secs ? ` · ${secs}` : ""}`}
        </span>
      </button>
      {open && (
        <ol className="space-y-1.5 px-3 pb-3">
          {m.steps.length === 0 && <li className="text-xs text-zinc-500">Deciding which tools to use…</li>}
          {m.steps.map((s) => <StepRow key={s.id} s={s} />)}
        </ol>
      )}
    </section>
  );
}
