import { loadConfig } from "../config";
import { runQuery } from "../sql/db";
import { validateSelect } from "../sql/guard";
import type { Tool } from "../agent/types";
import { argStr, clean } from "./util";

type Scalar = string | number | boolean | null;

export const runSql: Tool = {
  name: "run_sql",
  kind: "sql",
  description:
    "Run ONE read-only T-SQL SELECT on the approved sales tables (dbo schema). Use for questions the dedicated tools do not cover. " +
    "Rules: single statement, no comments, no semicolons inside, no INTO/EXEC/system objects. Put user-supplied values in `params` and reference them as @name. " +
    "Results are capped; aggregate instead of listing raw rows. Call describe_schema first if unsure of column names.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "A single T-SQL SELECT (CTEs/joins allowed), e.g. SELECT TOP 10 ... FROM dbo.customers WHERE region = @region" },
      params: { type: "object", description: "Named parameters, e.g. {\"region\":\"Europe\"}", additionalProperties: { type: ["string", "number", "boolean", "null"] } },
    },
    required: ["query"],
    additionalProperties: false,
  },
  async run(args, ctx) {
    const query = argStr(args, "query");
    if (!query) return { ok: false, error: '"query" is required' };
    const checked = validateSelect(query, loadConfig().sql.allowedTables);
    if (!checked.ok) {
      ctx.log.warn("run_sql rejected", { reason: checked.error });
      return { ok: false, error: checked.error };
    }
    const params: Record<string, Scalar> = {};
    const raw = args.params;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      for (const [k, v] of Object.entries(raw)) {
        if (v !== null && !["string", "number", "boolean"].includes(typeof v)) return { ok: false, error: `Parameter "${k}" must be a string, number, boolean or null` };
        params[k.replace(/^@/, "")] = v as Scalar;
      }
    }
    const { rows, truncated } = await runQuery(checked.sql, params);
    const source_id = ctx.addSource({ kind: "sql", label: `SQL on ${checked.tables.join(", ")}`, query: checked.sql, rowCount: rows.length });
    return { ok: true, data: { source_id, rows: clean(rows) }, rowCount: rows.length, truncated };
  },
};
