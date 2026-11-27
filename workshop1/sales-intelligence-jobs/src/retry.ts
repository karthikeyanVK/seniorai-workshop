import { Logger } from "./logger";

const TRANSIENT = new Set([408, 409, 429, 500, 502, 503, 504]);
const NET = new Set(["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"]);

function isTransient(e: any): boolean {
  const status = Number(e?.status ?? e?.statusCode ?? e?.code);
  return TRANSIENT.has(status) || NET.has(e?.code) || e?.name === "TimeoutError" || e?.name === "APIConnectionError";
}

function retryAfterMs(e: any): number | undefined {
  const h = e?.headers;
  const v = h?.get?.("retry-after-ms") ?? h?.["retry-after-ms"] ?? e?.retryAfterInMs ?? e?.retryAfterInMilliseconds;
  if (v != null) return Number(v);
  const s = h?.get?.("retry-after") ?? h?.["retry-after"];
  return s != null ? Number(s) * 1000 : undefined;
}

/** Exponential backoff + jitter; honours Retry-After. Non-transient errors fail immediately. */
export async function withRetry<T>(op: string, maxRetries: number, log: Logger, fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= maxRetries || !isTransient(e)) throw e;
      const delay = Math.min(30_000, retryAfterMs(e) ?? 500 * 2 ** attempt) + Math.random() * 250;
      log.warn("retrying", { op, attempt: attempt + 1, delayMs: Math.round(delay), error: (e as Error).message });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
