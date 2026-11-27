"use client";
import { useCallback, useState } from "react";
import type { UiMessage } from "@/lib/client/chatState";
import ActivityPanel from "./ActivityPanel";
import Markdown from "./Markdown";
import SourceList from "./SourceList";

export default function MessageView({ m }: { m: UiMessage }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleSource = useCallback((id: string) => setExpanded((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const onCite = useCallback(
    (id: string) => {
      setSourcesOpen(true);
      setExpanded((p) => new Set(p).add(id));
      setTimeout(() => {
        const el = document.getElementById(`src-${m.id}-${id}`);
        if (!el) return;
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        el.classList.remove("flash");
        void el.offsetWidth; // restart the animation
        el.classList.add("flash");
      }, 60);
    },
    [m.id],
  );

  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white sm:max-w-[75%]">{m.content}</div>
      </div>
    );
  }

  const streaming = m.status === "streaming";
  return (
    <div className="flex gap-3">
      <div aria-hidden className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-bold text-white">SI</div>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <ActivityPanel m={m} />
        {m.content ? <Markdown text={m.content} onCite={onCite} /> : streaming && m.steps.length > 0 ? null : streaming ? <span className="text-zinc-500">Working on it…</span> : null}
        {streaming && m.content && <span aria-hidden className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-indigo-500 align-text-bottom" />}
        {m.status === "stopped" && <p className="mt-2 text-xs text-zinc-500">Stopped.</p>}
        {m.status === "error" && (
          <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">{m.error ?? "Something went wrong."}</p>
        )}
        <SourceList msgId={m.id} sources={m.sources} open={sourcesOpen} onToggleOpen={() => setSourcesOpen((o) => !o)} expanded={expanded} onToggleSource={toggleSource} />
      </div>
    </div>
  );
}
