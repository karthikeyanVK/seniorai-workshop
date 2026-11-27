import type { Args } from "../agent/types";

export const argStr = (a: Args, k: string): string | undefined => {
  const v = a[k];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
};

export const argInt = (a: Args, k: string, def: number, min: number, max: number): number => {
  const v = a[k];
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : def;
  if (!Number.isFinite(n)) throw new Error(`"${k}" must be a number`);
  return Math.min(Math.max(Math.trunc(n), min), max);
};

export const argEnum = <T extends string>(a: Args, k: string, allowed: readonly T[], def?: T): T => {
  const v = a[k];
  if (v === undefined || v === null || v === "") {
    if (def !== undefined) return def;
    throw new Error(`"${k}" is required; one of: ${allowed.join(", ")}`);
  }
  if (typeof v !== "string" || !(allowed as readonly string[]).includes(v)) throw new Error(`"${k}" must be one of: ${allowed.join(", ")}`);
  return v as T;
};

/** YYYY-MM-DD -> Date (UTC midnight); throws on anything else. */
export const argDate = (a: Args, k: string): Date | undefined => {
  const v = argStr(a, k);
  if (!v) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw new Error(`"${k}" must be YYYY-MM-DD`);
  return new Date(`${v}T00:00:00Z`);
};

/** Escape %, _, [ and \ for use with LIKE ... ESCAPE '\'. */
export const likeEscape = (s: string): string => s.replace(/[\\%_[]/g, "\\$&");

/** Dates -> 'YYYY-MM-DD' (or full ISO if it has a time part); bigint -> string. Keeps tool output compact and JSON-safe. */
export function clean<T>(v: T): T {
  if (v instanceof Date) {
    const iso = v.toISOString();
    return (iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso) as unknown as T;
  }
  if (typeof v === "bigint") return v.toString() as unknown as T;
  if (Array.isArray(v)) return v.map(clean) as unknown as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)])) as T;
  return v;
}
