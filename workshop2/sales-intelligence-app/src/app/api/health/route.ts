import { configWarnings, loadConfig, missingConfig } from "@/lib/config";
import { kbDocCount } from "@/lib/kb/search";
import { runQuery } from "@/lib/sql/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = { ok: boolean; code?: string; detail?: number };
const fail = (e: unknown): Check => ({ ok: false, code: String((e as { code?: unknown })?.code ?? "ERROR") });

/** Readiness probe. Returns setting NAMES and booleans only, never values, endpoints or credentials. */
export async function GET() {
  const cfg = loadConfig();
  const missing = missingConfig(cfg);
  let sql: Check = { ok: false, code: "NOT_CONFIGURED" };
  let cosmos: Check = { ok: false, code: "NOT_CONFIGURED" };
  if (!missing.length) {
    [sql, cosmos] = await Promise.all([
      runQuery("SELECT 1 AS ok").then((): Check => ({ ok: true })).catch(fail),
      kbDocCount().then((n): Check => ({ ok: true, detail: n })).catch(fail),
    ]);
  }
  return Response.json({
    ready: !missing.length && sql.ok && cosmos.ok,
    missing,
    warnings: configWarnings(),
    resolved: { audience: cfg.audience, cosmosDatabase: cfg.cosmos.database, cosmosContainer: cfg.cosmos.container, kbBlobContainer: cfg.kbBlobContainer },
    sql,
    cosmos: { ok: cosmos.ok, code: cosmos.code, documents: cosmos.detail },
  });
}
