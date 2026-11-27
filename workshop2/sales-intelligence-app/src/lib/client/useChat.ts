"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentEvent, ChatMessage } from "../agent/types";
import { applyEvent, titleFrom, uid, type Conversation, type UiMessage } from "./chatState";

const KEY = "sia.conversations.v1";
const MAX_CONVERSATIONS = 30;

/** Conversation state + NDJSON streaming. History lives in localStorage (per browser); wrapped in try/catch. */
export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const convsRef = useRef(conversations);
  convsRef.current = conversations;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { conversations: Conversation[]; activeId: string | null };
        setConversations(
          saved.conversations.map((c) => ({ ...c, messages: c.messages.map((m) => (m.status === "streaming" ? { ...m, status: "stopped" as const } : m)) })),
        );
        setActiveId(saved.activeId);
      }
    } catch {
      /* corrupt or unavailable storage: start empty */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || busy) return; // save once a turn finishes, not on every streamed token
    try {
      localStorage.setItem(KEY, JSON.stringify({ conversations: conversations.slice(0, MAX_CONVERSATIONS), activeId }));
    } catch {
      /* quota or blocked storage: history just won't persist */
    }
  }, [conversations, activeId, loaded, busy]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      const now = Date.now();
      const found = activeId ? convsRef.current.find((c) => c.id === activeId) : undefined;
      const conv: Conversation = found ?? { id: uid(), title: titleFrom(content), messages: [], updatedAt: now };

      const history: ChatMessage[] = [
        ...conv.messages.filter((m) => m.content && m.status !== "error").map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content },
      ];
      const userMsg: UiMessage = { id: uid(), role: "user", content, steps: [], sources: [], status: "done", startedAt: now };
      const asst: UiMessage = { id: uid(), role: "assistant", content: "", steps: [], sources: [], status: "streaming", startedAt: now };

      setConversations((prev) => {
        const base = prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev];
        return base.map((c) => (c.id === conv.id ? { ...c, updatedAt: now, messages: [...c.messages, userMsg, asst] } : c));
      });
      setActiveId(conv.id);
      setBusy(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const patch = (fn: (m: UiMessage) => UiMessage) =>
        setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, messages: c.messages.map((m) => (m.id === asst.id ? fn(m) : m)) } : c)));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const j = (await res.json().catch(() => ({}))) as { error?: string; missing?: string[] };
          throw new Error(j.missing?.length ? `Missing configuration: ${j.missing.join(", ")}` : (j.error ?? `Request failed (HTTP ${res.status})`));
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            let ev: AgentEvent;
            try { ev = JSON.parse(line) as AgentEvent; } catch { continue; }
            patch((m) => applyEvent(m, ev));
          }
        }
        patch((m) =>
          m.status !== "streaming" ? m : m.content ? { ...m, status: "done" } : { ...m, status: "error", error: "The connection closed before an answer was produced." },
        );
      } catch (e) {
        const aborted = (e as { name?: string })?.name === "AbortError";
        patch((m) => ({ ...m, status: aborted ? "stopped" : "error", error: aborted ? undefined : e instanceof Error ? e.message : "Request failed" }));
      } finally {
        abortRef.current = null;
        setBusy(false);
      }
    },
    [activeId, busy],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const newChat = useCallback(() => { if (!busy) setActiveId(null); }, [busy]);
  const select = useCallback((id: string) => { if (!busy) setActiveId(id); }, [busy]);
  const remove = useCallback((id: string) => {
    if (busy) return;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, [busy]);

  return { conversations, activeId, busy, loaded, send, stop, newChat, select, remove };
}
