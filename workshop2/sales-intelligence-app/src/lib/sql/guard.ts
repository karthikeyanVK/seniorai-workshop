import { Parser } from "node-sql-parser";

const parser = new Parser();
const OPT = { database: "transactsql" };

export type GuardResult = { ok: true; sql: string; tables: string[] } | { ok: false; error: string };

const MAX_LEN = 4000;
// Defense in depth on top of the AST check; evaluated on SQL with string literals blanked out.
const DENY =
  /\b(into|exec|execute|openrowset|openquery|opendatasource|waitfor|bulk|xp_\w*|sp_\w*|sys|information_schema|dbcc|kill|shutdown|grant|revoke|alter|drop|create|insert|update|delete|merge|truncate)\b/i;

const blankLiterals = (s: string) => s.replace(/'(?:[^']|'')*'/g, "''");
const fail = (error: string): GuardResult => ({ ok: false, error });

/**
 * Accepts exactly one read-only SELECT (CTEs/joins/unions fine) touching only `allowed` dbo tables.
 * Anything the parser cannot understand is rejected (safe by default).
 */
export function validateSelect(input: string, allowed: string[]): GuardResult {
  const sql = input.trim().replace(/;\s*$/, "");
  if (!sql) return fail("Empty query.");
  if (sql.length > MAX_LEN) return fail(`Query too long (max ${MAX_LEN} chars).`);

  const bare = blankLiterals(sql);
  if (/--|\/\*/.test(bare)) return fail("SQL comments are not allowed.");
  if (bare.includes(";")) return fail("Only a single statement is allowed.");
  if (bare.includes("@@")) return fail("System variables (@@) are not allowed.");
  const bad = bare.match(DENY);
  if (bad) return fail(`Forbidden keyword or object: ${bad[0]}. Only read-only SELECT on approved tables is allowed.`);

  let parsed;
  try {
    parsed = parser.parse(sql, OPT);
  } catch (e) {
    return fail(`Could not parse as a T-SQL SELECT: ${e instanceof Error ? e.message.split("\n")[0] : "syntax error"}`);
  }
  const asts = Array.isArray(parsed.ast) ? parsed.ast : [parsed.ast];
  if (asts.length !== 1) return fail("Only a single statement is allowed.");
  const ast = asts[0] as { type?: string; with?: { name?: { value?: string } | string }[] | null };
  if (ast.type !== "select") return fail("Only SELECT statements are allowed.");

  const ctes = new Set(
    (ast.with ?? []).map((w) => String(typeof w.name === "string" ? w.name : w.name?.value ?? "").toLowerCase()),
  );
  const ok = new Set(allowed.map((t) => t.toLowerCase()));
  const tables: string[] = [];
  for (const entry of parsed.tableList) {
    const [, schema, table] = entry.split("::");
    const t = (table ?? "").toLowerCase();
    if (schema && schema !== "null" && schema.toLowerCase() !== "dbo") return fail(`Schema "${schema}" is not allowed; use dbo tables.`);
    if (ctes.has(t)) continue;
    if (!ok.has(t)) return fail(`Table "${table}" is not approved. Approved: ${[...ok].join(", ")}.`);
    tables.push(t);
  }
  return { ok: true, sql, tables: [...new Set(tables)] };
}
