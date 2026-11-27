"use client";
import type { Source } from "@/lib/agent/types";

interface Props {
  msgId: string;
  sources: Source[];
  open: boolean;
  onToggleOpen: () => void;
  expanded: Set<string>;
  onToggleSource: (id: string) => void;
}

function Chip({ id, cited }: { id: string; cited: boolean }) {
  return (
    <span className={`mt-0.5 inline-flex h-5 min-w-[1.9rem] shrink-0 items-center justify-center rounded-md px-1 text-[11px] font-semibold ${cited ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
      {id}
    </span>
  );
}

/** Evidence behind the answer: cited sources first; click a [S#] chip in the text to jump and expand here. */
export default function SourceList({ msgId, sources, open, onToggleOpen, expanded, onToggleSource }: Props) {
  if (!sources.length) return null;
  const ordered = [...sources].sort((a, b) => Number(!!b.cited) - Number(!!a.cited) || a.id.localeCompare(b.id, undefined, { numeric: true }));
  const citedN = sources.filter((s) => s.cited).length;
  return (
    <section aria-label="Sources" className="mt-3 border-t border-zinc-200 pt-2 dark:border-zinc-800">
      <button type="button" aria-expanded={open} onClick={onToggleOpen} className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-zinc-400 dark:hover:text-zinc-100">
        <svg viewBox="0 0 16 16" className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5" /></svg>
        Sources ({citedN} cited{sources.length > citedN ? `, ${sources.length - citedN} consulted` : ""})
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5">
          {ordered.map((s) => {
            const isOpen = expanded.has(s.id);
            const kb = s.kind === "kb";
            return (
              <li key={s.id} id={`src-${msgId}-${s.id}`} className="rounded-lg border border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/40">
                <button type="button" aria-expanded={isOpen} onClick={() => onToggleSource(s.id)} className="flex w-full items-start gap-2 p-2 text-left focus-visible:outline-2 focus-visible:outline-indigo-500">
                  <Chip id={s.id} cited={!!s.cited} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{kb ? s.title : s.label}</span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {kb ? `${s.category}${s.heading ? ` › ${s.heading}` : ""}` : `SQL · ${s.rowCount} row${s.rowCount === 1 ? "" : "s"}`}
                    </span>
                  </span>
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${kb ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" : "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"}`}>{kb ? "KB" : "SQL"}</span>
                </button>
                {isOpen && (
                  <div className="space-y-1.5 border-t border-zinc-200 p-2 text-xs dark:border-zinc-800">
                    {kb ? (
                      <>
                        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{s.snippet}</p>
                        <p className="break-all text-zinc-500 dark:text-zinc-400">{s.path} · doc {s.docId} · relevance {s.score}</p>
                      </>
                    ) : (
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-zinc-100 p-2 dark:bg-zinc-900">{s.query}</pre>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
