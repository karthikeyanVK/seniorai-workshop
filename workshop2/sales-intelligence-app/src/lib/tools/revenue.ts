import { runQuery } from "../sql/db";
import type { Tool } from "../agent/types";
import { argDate, argEnum, argInt, clean } from "./util";

export const METRICS = ["invoiced", "collected", "outstanding", "mrr", "arr", "bookings"] as const;
export const GROUPS = ["month", "quarter", "year", "region", "industry", "segment", "product", "rep", "customer", "none"] as const;
export type Metric = (typeof METRICS)[number];
export type Group = (typeof GROUPS)[number];
const TIME: readonly Group[] = ["month", "quarter", "year"];

const INV_FROM =
  "dbo.invoices i JOIN dbo.customers c ON c.customer_id = i.customer_id LEFT JOIN dbo.subscriptions s ON s.subscription_id = i.subscription_id " +
  "LEFT JOIN dbo.products p ON p.product_id = s.product_id LEFT JOIN dbo.sales_representatives r ON r.sales_rep_id = c.account_manager_id";
const SUB_FROM =
  "dbo.subscriptions s JOIN dbo.customers c ON c.customer_id = s.customer_id JOIN dbo.products p ON p.product_id = s.product_id " +
  "LEFT JOIN dbo.sales_representatives r ON r.sales_rep_id = c.account_manager_id";
const OPP_FROM =
  "dbo.opportunities o LEFT JOIN dbo.customers c ON c.customer_id = o.customer_id LEFT JOIN dbo.leads l ON l.lead_id = o.lead_id " +
  "LEFT JOIN dbo.sales_representatives r ON r.sales_rep_id = o.sales_rep_id";

export const timeExpr = (g: Group, d: string): string =>
  g === "month" ? `FORMAT(${d}, 'yyyy-MM')` : g === "quarter" ? `CONCAT(YEAR(${d}), '-Q', DATEPART(quarter, ${d}))` : `CAST(YEAR(${d}) AS varchar(4))`;

/** Pure SQL builder (no user text is interpolated; only whitelisted fragments). Params: @limit, optional @from/@to. */
export function buildRevenueSql(metric: Metric, group: Group, hasFrom: boolean, hasTo: boolean): { sql: string; notes: string[] } {
  const notes: string[] = [];
  let from: string, date: string, amount: string;
  const where: string[] = [];
  let dims: Partial<Record<Group, string>>;

  if (metric === "invoiced" || metric === "collected" || metric === "outstanding") {
    from = INV_FROM; date = "i.invoice_date"; amount = "i.total_amount";
    if (metric === "collected") where.push("i.payment_status = 'Paid'");
    if (metric === "outstanding") where.push("i.payment_status IN ('Pending', 'Overdue')");
    dims = { region: "c.region", industry: "c.industry", segment: "c.customer_segment", product: "p.product_name", rep: "r.name", customer: "c.company_name" };
    notes.push("Periods use invoice_date; amounts are total_amount (incl. tax, net of discount).");
  } else if (metric === "mrr" || metric === "arr") {
    from = SUB_FROM; date = "s.start_date";
    amount = metric === "mrr" ? "s.monthly_recurring_revenue" : "s.annual_contract_value";
    where.push("s.subscription_status = 'Active'");
    dims = { region: "c.region", industry: "c.industry", segment: "c.customer_segment", product: "p.product_name", rep: "r.name", customer: "c.company_name" };
    if (TIME.includes(group)) throw new Error(`${metric} is a current snapshot of Active subscriptions; group by region, industry, segment, product, rep, customer or none (not time).`);
    if (hasFrom || hasTo) notes.push("from/to ignored: mrr/arr are current snapshots.");
    hasFrom = hasTo = false;
  } else {
    from = OPP_FROM; date = "o.actual_close_date"; amount = "o.deal_value";
    where.push("o.deal_stage = 'Closed Won'");
    dims = {
      region: "COALESCE(c.region, l.region)", industry: "COALESCE(c.industry, l.industry)", segment: "COALESCE(c.customer_segment, 'New logo')",
      rep: "r.name", customer: "COALESCE(c.company_name, l.company_name)",
    };
    if (group === "product") throw new Error("bookings (Closed Won deals) have no product; group by month, quarter, year, region, industry, segment, rep, customer or none.");
    notes.push("Bookings = deal_value of Closed Won opportunities, periods by actual_close_date.");
  }
  if (hasFrom) where.push(`${date} >= @from`);
  if (hasTo) where.push(`${date} < DATEADD(day, 1, @to)`);

  const isTime = TIME.includes(group);
  const dim = group === "none" ? "'All'" : isTime ? timeExpr(group, date) : `COALESCE(CAST(${dims[group]} AS nvarchar(200)), '(unknown)')`;
  const sql =
    `SELECT TOP (@limit) ${dim} AS grp, SUM(${amount}) AS total, COUNT(*) AS records FROM ${from}` +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    (group === "none" ? "" : ` GROUP BY ${dim} ORDER BY ${isTime ? "grp ASC" : "total DESC"}`);
  return { sql, notes };
}

export const revenueAnalysis: Tool = {
  name: "revenue_analysis",
  kind: "sql",
  description:
    "Revenue analytics from the sales DB. metric: invoiced (all invoices), collected (Paid invoices), outstanding (Pending+Overdue), mrr / arr (current Active subscriptions), bookings (Closed Won deals). " +
    "group_by: month, quarter, year, region, industry, segment, product, rep (account manager; deal owner for bookings), customer, or none for a single total. " +
    "Optional from/to (YYYY-MM-DD) filter the period (not for mrr/arr). Returns rows {grp,total,records} sorted by period or by total desc.",
  parameters: {
    type: "object",
    properties: {
      metric: { type: "string", enum: [...METRICS] },
      group_by: { type: "string", enum: [...GROUPS] },
      from: { type: "string", description: "Start date YYYY-MM-DD (inclusive)" },
      to: { type: "string", description: "End date YYYY-MM-DD (inclusive)" },
      limit: { type: "integer", description: "Max groups, default 25, max 200" },
    },
    required: ["metric", "group_by"],
    additionalProperties: false,
  },
  async run(args, ctx) {
    const metric = argEnum(args, "metric", METRICS);
    const group = argEnum(args, "group_by", GROUPS);
    const from = argDate(args, "from");
    const to = argDate(args, "to");
    const limit = argInt(args, "limit", 25, 1, 200);
    const { sql, notes } = buildRevenueSql(metric, group, !!from, !!to);
    const params: Record<string, unknown> = { limit };
    if (from && !(metric === "mrr" || metric === "arr")) params.from = from;
    if (to && !(metric === "mrr" || metric === "arr")) params.to = to;
    const { rows, truncated } = await runQuery<{ grp: string; total: number; records: number }>(sql, params, 200);
    const out = rows.map((r) => ({ group: r.grp, total: Math.round(Number(r.total) * 100) / 100, records: r.records }));
    const grand_total = Math.round(out.reduce((a, r) => a + r.total, 0) * 100) / 100;
    const source_id = ctx.addSource({ kind: "sql", label: `Revenue: ${metric} by ${group}`, query: sql, rowCount: out.length });
    return {
      ok: true,
      rowCount: out.length,
      truncated,
      data: clean({ source_id, metric, group_by: group, period: { from: args.from ?? null, to: args.to ?? null }, rows: out, grand_total, notes }),
    };
  },
};
