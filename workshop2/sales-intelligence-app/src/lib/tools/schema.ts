import { loadConfig } from "../config";
import { runQuery } from "../sql/db";
import type { Tool } from "../agent/types";

type Row = Record<string, unknown>;
interface TableInfo {
  columns: string[];
  primary_key: string[];
  foreign_keys: string[];
}

const TABLE_DESC: Record<string, string> = {
  activities: "Calls/emails/meetings/QBRs logged against leads, opportunities or customers by a rep",
  campaigns: "Marketing campaigns that generate leads",
  contacts: "People at customer companies (decision_maker flag)",
  customer_health: "Monthly health snapshots per customer (usage, churn probability, health_status)",
  customers: "Customer accounts (region, industry, segment, status, account manager)",
  invoices: "Invoices per subscription (amounts, payment_status Paid/Pending/Overdue)",
  leads: "Prospects before they become customers (score, status, source, campaign)",
  opportunities: "Deals (stage, value, probability, close dates, competitor, loss_reason)",
  products: "Product catalog (category, pricing_model, base_price)",
  sales_representatives: "Reps and managers (team, region, sales_target, manager_id)",
  subscriptions: "Customer subscriptions (plan, MRR, ACV, renewal_date, status)",
};

const g = globalThis as unknown as { __schemaCache?: Promise<Record<string, TableInfo>> };

async function loadSchema(): Promise<Record<string, TableInfo>> {
  const big = 2000;
  const [cols, pks, fks] = await Promise.all([
    runQuery<Row>(
      "SELECT TABLE_NAME AS t, COLUMN_NAME AS c, DATA_TYPE AS d, IS_NULLABLE AS n FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'dbo' ORDER BY TABLE_NAME, ORDINAL_POSITION",
      {}, big,
    ),
    runQuery<Row>(
      "SELECT KU.TABLE_NAME AS t, KU.COLUMN_NAME AS c FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS TC JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE KU ON TC.CONSTRAINT_NAME = KU.CONSTRAINT_NAME AND TC.TABLE_SCHEMA = KU.TABLE_SCHEMA WHERE TC.CONSTRAINT_TYPE = 'PRIMARY KEY' AND TC.TABLE_SCHEMA = 'dbo'",
      {}, big,
    ),
    runQuery<Row>(
      "SELECT OBJECT_NAME(f.parent_object_id) AS t, COL_NAME(fc.parent_object_id, fc.parent_column_id) AS c, OBJECT_NAME(f.referenced_object_id) AS rt, COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS rc FROM sys.foreign_keys f JOIN sys.foreign_key_columns fc ON f.object_id = fc.constraint_object_id",
      {}, big,
    ),
  ]);
  const out: Record<string, TableInfo> = {};
  const at = (t: string) => (out[t] ??= { columns: [], primary_key: [], foreign_keys: [] });
  for (const r of cols.rows) at(String(r.t)).columns.push(`${r.c} ${r.d}${r.n === "YES" ? "?" : ""}`);
  for (const r of pks.rows) at(String(r.t)).primary_key.push(String(r.c));
  for (const r of fks.rows) at(String(r.t)).foreign_keys.push(`${r.c} -> ${r.rt}.${r.rc}`);
  return out;
}

/** Cached for the process lifetime; reset on failure so a transient error is retried. */
function schema(): Promise<Record<string, TableInfo>> {
  g.__schemaCache ??= loadSchema().catch((e) => {
    g.__schemaCache = undefined;
    throw e;
  });
  return g.__schemaCache;
}

export const listTables: Tool = {
  name: "list_tables",
  kind: "sql",
  description: "Discover which sales database tables you may query, with row counts and a one-line description each. Call this first if unsure which table holds the data.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  async run() {
    const allowed = new Set(loadConfig().sql.allowedTables);
    const { rows } = await runQuery<Row>(
      "SELECT t.name AS table_name, SUM(p.rows) AS row_count FROM sys.tables t JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1) WHERE SCHEMA_NAME(t.schema_id) = 'dbo' GROUP BY t.name ORDER BY t.name",
      {}, 500,
    );
    const data = rows
      .filter((r) => allowed.has(String(r.table_name).toLowerCase()))
      .map((r) => ({ table: r.table_name, rows: Number(r.row_count), description: TABLE_DESC[String(r.table_name)] ?? "" }));
    return { ok: true, data, rowCount: data.length };
  },
};

export const describeSchema: Tool = {
  name: "describe_schema",
  kind: "sql",
  description: "Get columns (type, ? = nullable), primary keys and foreign keys for approved tables. Use before writing custom SQL with run_sql. Omit `tables` for all approved tables.",
  parameters: {
    type: "object",
    properties: { tables: { type: "array", items: { type: "string" }, description: "Table names, e.g. [\"opportunities\",\"customers\"]" } },
    additionalProperties: false,
  },
  async run(args) {
    const allowed = loadConfig().sql.allowedTables;
    const wanted = Array.isArray(args.tables) && args.tables.length ? args.tables.map((t) => String(t).toLowerCase().replace(/^dbo\./, "")) : allowed;
    const unknown = wanted.filter((t) => !allowed.includes(t));
    if (unknown.length) return { ok: false, error: `Not approved or unknown: ${unknown.join(", ")}. Approved: ${allowed.join(", ")}` };
    const all = await schema();
    const data = Object.fromEntries(wanted.filter((t) => all[t]).map((t) => [t, all[t]]));
    return { ok: true, data, rowCount: Object.keys(data).length };
  },
};
