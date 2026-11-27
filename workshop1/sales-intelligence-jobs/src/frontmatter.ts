export type Meta = Record<string, string | string[]>;

/** Minimal parser for the KB's flat `key: value` / `key: [a, b]` YAML front matter. */
export function parseFrontMatter(raw: string): { meta: Meta; body: string } {
  const m = raw.replace(/^﻿/, "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: raw };
  const meta: Meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const v = kv[2].trim();
    meta[kv[1]] = v.startsWith("[") && v.endsWith("]")
      ? v.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean)
      : v.replace(/^["']|["']$/g, "");
  }
  return { meta, body: raw.slice(m[0].length) };
}
