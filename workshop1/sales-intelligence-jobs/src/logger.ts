const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;

/** Structured JSON-lines logger; Functions host captures stdout into App Insights. */
export function makeLogger(minLevel = "info", base: Record<string, unknown> = {}) {
  const min = LEVELS[(minLevel as Level) in LEVELS ? (minLevel as Level) : "info"];
  const emit = (level: Level, msg: string, extra?: Record<string, unknown>) => {
    if (LEVELS[level] < min) return;
    const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...base, ...extra });
    (level === "error" ? console.error : console.log)(line);
  };
  return {
    debug: (m: string, e?: Record<string, unknown>) => emit("debug", m, e),
    info: (m: string, e?: Record<string, unknown>) => emit("info", m, e),
    warn: (m: string, e?: Record<string, unknown>) => emit("warn", m, e),
    error: (m: string, e?: Record<string, unknown>) => emit("error", m, e),
    child: (more: Record<string, unknown>) => makeLogger(minLevel, { ...base, ...more }),
  };
}
export type Logger = ReturnType<typeof makeLogger>;

export const errInfo = (e: unknown) => ({
  error: e instanceof Error ? e.message : String(e),
  code: (e as { code?: unknown; status?: unknown })?.code ?? (e as { status?: unknown })?.status,
});
