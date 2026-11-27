"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@/lib/client/useChat";
import Composer from "./Composer";
import { HealthBanner, HealthDot, useHealth } from "./HealthBanner";
import MessageView from "./MessageView";
import Sidebar from "./Sidebar";

const STARTERS = [
  "Top 5 customers by paid revenue in 2025",
  "What is our discount approval policy?",
  "How is our open pipeline split by stage and region?",
  "Ivybridge Cloudworks looks at risk. What do we know and how should we respond?",
];

export default function ChatApp() {
  const chat = useChat();
  const { health, failed } = useHealth();
  const [drawer, setDrawer] = useState(false);
  const active = chat.conversations.find((c) => c.id === chat.activeId);
  const messages = active?.messages ?? [];

  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const lastMsg = messages[messages.length - 1];
  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, lastMsg?.content, lastMsg?.steps.length, lastMsg?.status]);
  useEffect(() => { stick.current = true; }, [chat.activeId]);

  return (
    <div className="flex h-dvh">
      <Sidebar
        conversations={chat.conversations}
        activeId={chat.activeId}
        busy={chat.busy}
        open={drawer}
        onClose={() => setDrawer(false)}
        onNew={chat.newChat}
        onSelect={chat.select}
        onDelete={chat.remove}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
          <button type="button" aria-label="Open conversations" onClick={() => setDrawer(true)} className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-indigo-500 md:hidden dark:hover:bg-zinc-800">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 4h12M2 8h12M2 12h12" /></svg>
          </button>
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{active?.title ?? "New chat"}</h1>
          <HealthDot health={health} failed={failed} />
        </header>
        <HealthBanner health={health} failed={failed} />

        <div
          ref={scroller}
          role="log"
          aria-live="polite"
          aria-label="Conversation"
          onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; }}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
            {chat.loaded && messages.length === 0 && (
              <div className="pt-[8vh] text-center">
                <h2 className="text-xl font-semibold">What do you want to know about sales?</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                  I combine live sales data (customers, deals, revenue, pipeline) with the knowledge base (policies, playbooks, product and competitor docs) and cite what I use.
                </p>
                <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
                  {STARTERS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={chat.busy}
                      onClick={() => chat.send(q)}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => <MessageView key={m.id} m={m} />)}
          </div>
        </div>

        <div className="border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-800">
          <Composer busy={chat.busy} onSend={chat.send} onStop={chat.stop} />
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-zinc-400">Read-only access. Answers cite their sources; verify before acting.</p>
        </div>
      </main>
    </div>
  );
}
