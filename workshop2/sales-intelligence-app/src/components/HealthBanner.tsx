"use client";
import { useEffect, useState } from "react";

export interface Health {
  ready: boolean;
  missing: string[];
  warnings: string[];
  resolved: { audience: string; cosmosDatabase: string; cosmosContainer: string; kbBlobContainer: string };
  sql: { ok: boolean; code?: string };
  cosmos: { ok: boolean; code?: string; documents?: number };
}

/** Reads /api/health once. Only setting NAMES and booleans come back, never values. */
export function useHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json() as Promise<Health>)
      .then((h) => live && setHealth(h))
      .catch(() => live && setFailed(true));
    return () => { live = false; };
  }, []);
  return { health, failed };
}

export function HealthDot({ health, failed }: { health: Health | null; failed: boolean }) {
  const state = failed ? "bad" : !health ? "loading" : health.ready ? "ok" : "bad";
  const color = state === "ok" ? "bg-emerald-500" : state === "bad" ? "bg-red-500" : "bg-zinc-400 animate-pulse";
  const text = state === "ok" ? `SQL and knowledge base connected (${health?.cosmos.documents ?? "?"} docs)` : state === "bad" ? "Setup needed" : "Checking connections…";
  return (
    <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400" title={health ? `${health.resolved.cosmosDatabase} / ${health.resolved.cosmosContainer}` : undefined}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${color}`} />
      <span className="hidden sm:inline">{text}</span>
      <span className="sr-only sm:hidden">{text}</span>
    </span>
  );
}

export function HealthBanner({ health, failed }: { health: Health | null; failed: boolean }) {
  if (!health && !failed) return null;
  if (health?.ready) return null;
  const problems: string[] = [];
  if (failed) problems.push("Could not reach /api/health.");
  if (health?.missing.length) problems.push(`Missing configuration in .env: ${health.missing.join(", ")}.`);
  if (health && !health.missing.length) {
    if (!health.sql.ok) problems.push(`SQL database unreachable (${health.sql.code ?? "error"}).`);
    if (!health.cosmos.ok) problems.push(`Cosmos DB knowledge base unreachable (${health.cosmos.code ?? "error"}). Has the workshop 1 ingestion run for this AUDIENCE_NAME?`);
  }
  return (
    <div role="alert" className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <p className="font-semibold">The agent is not fully set up.</p>
      <ul className="mt-0.5 list-disc pl-4">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
    </div>
  );
}
