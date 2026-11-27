import "server-only";
import sql from "mssql";
import { loadConfig } from "../config";

/** ADO.NET-style connection string -> mssql config. Credentials stay inside this module. */
export function toSqlConfig(cs: string, timeoutMs: number): sql.config {
  const kv = Object.fromEntries(
    cs.split(";").filter(Boolean).map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim().toLowerCase(), p.slice(i + 1).trim()];
    }),
  );
  const [host, port] = (kv["server"] ?? kv["data source"] ?? "").replace(/^tcp:/i, "").split(",");
  const flag = (k: string, d: boolean) => (kv[k] === undefined ? d : /^(true|yes)$/i.test(kv[k]));
  return {
    server: host,
    port: port ? Number(port) : 1433,
    database: kv["initial catalog"] ?? kv["database"],
    user: kv["user id"] ?? kv["uid"],
    password: kv["password"] ?? kv["pwd"],
    connectionTimeout: 30000,
    requestTimeout: timeoutMs,
    options: { encrypt: flag("encrypt", true), trustServerCertificate: flag("trustservercertificate", false) },
    pool: { max: 5, idleTimeoutMillis: 30000 },
  };
}

// Survive Next.js dev hot-reloads: one pool per process.
const g = globalThis as unknown as { __salesPool?: Promise<sql.ConnectionPool> };

function getPool(): Promise<sql.ConnectionPool> {
  if (!g.__salesPool) {
    const { sql: c } = loadConfig();
    g.__salesPool = new sql.ConnectionPool(toSqlConfig(c.connectionString, c.timeoutMs)).connect().catch((e) => {
      g.__salesPool = undefined; // allow retry on next call
      throw e;
    });
  }
  return g.__salesPool;
}

export interface QueryResult<T> {
  rows: T[];
  truncated: boolean;
}

/**
 * Parameterized query inside a transaction that is ALWAYS rolled back, so even a statement that slipped past
 * the guard cannot persist. Rows beyond maxRows are dropped and flagged.
 * ponytail: cap applied after fetch (largest table is 5k rows); push a TOP into the SQL if tables grow.
 */
export async function runQuery<T = Record<string, unknown>>(
  text: string,
  params: Record<string, unknown> = {},
  maxRows = loadConfig().sql.maxRows,
): Promise<QueryResult<T>> {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const req = new sql.Request(tx);
    for (const [k, v] of Object.entries(params)) {
      if (!/^[A-Za-z_]\w*$/.test(k)) throw new Error(`Invalid parameter name "${k}"`);
      req.input(k, v as never);
    }
    const res = await req.query(text);
    const all = (res.recordset ?? []) as T[];
    return { rows: all.slice(0, maxRows), truncated: all.length > maxRows };
  } finally {
    await tx.rollback().catch(() => undefined);
  }
}
