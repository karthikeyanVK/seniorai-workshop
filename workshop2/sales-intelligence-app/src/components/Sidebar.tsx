"use client";
import type { Conversation } from "@/lib/client/chatState";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  busy: boolean;
  open: boolean; // mobile drawer
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({ conversations, activeId, busy, open, onClose, onNew, onSelect, onDelete }: Props) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <>
      {open && <div aria-hidden onClick={onClose} className="fixed inset-0 z-30 bg-black/40 md:hidden" />}
      <aside
        aria-label="Conversations"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-900 md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-2 p-3">
          <div aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">SI</div>
          <span className="text-sm font-semibold">Sales Intelligence</span>
        </div>
        <div className="px-3 pb-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => { onNew(); onClose(); }}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-left text-sm font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            + New chat
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {sorted.length === 0 && <p className="px-3 py-4 text-xs text-zinc-500">No conversations yet. History is stored in this browser only.</p>}
          <ul className="space-y-0.5">
            {sorted.map((c) => (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  disabled={busy}
                  aria-current={c.id === activeId ? "true" : undefined}
                  onClick={() => { onSelect(c.id); onClose(); }}
                  className={`w-full truncate rounded-lg px-3 py-2 pr-9 text-left text-sm focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-60 ${c.id === activeId ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                >
                  {c.title}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Delete conversation ${c.title}`}
                  onClick={() => onDelete(c.id)}
                  className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-200 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-indigo-500 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 dark:hover:bg-zinc-700"
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.5 8h5l.5-8" /></svg>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
