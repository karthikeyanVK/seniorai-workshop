"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  busy: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export default function Composer({ busy, disabled, onSend, onStop }: Props) {
  const [text, setText] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  const submit = () => {
    if (!text.trim() || busy || disabled) return;
    onSend(text);
    setText("");
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-zinc-300 bg-white p-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <label htmlFor="composer" className="sr-only">Ask a sales question</label>
      <textarea
        id="composer"
        ref={ta}
        rows={1}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
        }}
        placeholder="Ask about customers, revenue, pipeline, policies…"
        className="max-h-[180px] min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-zinc-400"
      />
      {busy ? (
        <button type="button" onClick={onStop} className="h-10 shrink-0 rounded-xl bg-zinc-800 px-4 text-sm font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300">
          Stop
        </button>
      ) : (
        <button type="submit" disabled={!text.trim() || disabled} className="h-10 shrink-0 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
          Send
        </button>
      )}
    </form>
  );
}
