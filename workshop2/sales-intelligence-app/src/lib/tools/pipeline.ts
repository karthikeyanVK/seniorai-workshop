import { runQuery } from "../sql/db";
import type { Tool } from "../agent/types";
import { argDate, argEnum, argInt, argStr, clean, likeEscape } from "./util";
import { timeExpr } from "./revenue";

export const VIEWS = ["open_pipeline", "win_rate", "target_attainment"] as const;
const OPEN_GROUPS = ["stage", "rep", "region", "quarter", "month", "competitor", "none"] as const;
const WIN_GROUPS = ["rep", "region", "quarter", "month", "competitor", "loss_reason", "none"] as const;
const SORTS = ["won_value_desc", "attainment_asc", "attainment_desc"] as const;

const OPP_FROM =
  "dbo.opportunities o LEFT JOIN dbo.customers c ON c.customer_id = o.customer_id LEFT JOIN dbo.leads l ON l.lead_id = o.lead_id " +
  "LEFT JOIN dbo.sales_representatives r ON r.sales_rep_id = o.sales_rep_id";
const REGION = "COALESCE(c.region, l.region)";
const round2 = (n: unknown) => Math.round(Number(n) * 100) / 100;

type Row = Record<string, unknown>;

function dimension(group: string, dateCol: string): { expr: string; time: boolean } {
  switch (group) {
    case "stage": return { expr: "o.deal_stage", time: false };
    case "rep": return { expr: "r.name", time: false };
    case "region": return { expr: REGION, time: false };
    case "competitor": return { expr: "COALESCE(o.competitor, 'None')", time: false };
    case "loss_reason": return { expr: "COALESCE(o.loss_reason, 'n/a')", time: false };
    case "quarter": case "month": return { expr: timeExpr(group, dateCol), time: true };
    default: return { expr: "'All'", time: false };
  }
}

export const pipelineReport: Tool = {
  name: "pipeline_report",
  kind: "sql",
  description:
    "Pipeline and sales-performance reporting. view=open_pipeline: open deals (status Open) count, pipeline value and probability-weighted value, grouped by stage/rep/region/quarter/month (by expected close)/competitor/none. " +
    "view=win_rate: closed deals won vs lost, win rate %, won/lost value, grouped by rep/region/quarter/month (by actual close)/competitor/loss_reason/none; optional from/to. " +
    "view=target_attainment: per sales rep sales_target vs won value (optional from/to), open and weighted pipeline, attainment %. " +
    "Optional filters: region (North America, Europe, India, Asia-Pacific), rep (name fragment or REP-## code).",
  parameters: {
    type: "object",
    properties: {
      view: { type: "string", enum: [...VIEWS] },
      group_by: { type: "string", description: `open_pipeline: ${OPEN_GROUPS.join("|")}; win_rate: ${WIN_GROUPS.join("|")}; ignored for target_attainment` },
      sort: { type: "string", enum: [...SORTS], description: "target_attainment only: attainment_asc = furthest below target first (use for 'behind/underperforming'), attainment_desc = best first, won_value_desc (default)" },
      region: { type: "string" },
      rep: { type: "string" },
      from: { type: "string", description: "YYYY-MM-DD (win_rate / target_attainment)" },
      to: { type: "string", description: "YYYY-MM-DD (win_rate / target_attainment)" },
      limit: { type: "integer", description: "Max groups/reps, default 25, max 200" },
    },
    required: ["view"],
    additionalProperties: false,
  },
  async run(args, ctx) {
    const view = argEnum(args, "view", VIEWS);
    const region = argStr(args, "region");
    const rep = argStr(args, "rep");
    const from = argDate(args, "from");
    const to = argDate(args, "to");
    const limit = argInt(args, "limit", 25, 1, 200);
    const params: Record<string, unknown> = { limit };
    if (region) params.region = region;
    if (rep) { params.rep = rep; params.repLike = `%${likeEscape(rep)}%`; }
    const repFilter = "(r.rep_code = @rep OR r.name LIKE @repLike ESCAPE '\\')";
    const notes: string[] = [];
    let sql: string;
    let shape: (rows: Row[]) => unknown;
    let label: string;

    if (view === "target_attainment") {
      const dateWhere = (from ? " AND o.actual_close_date >= @from" : "") + (to ? " AND o.actual_close_date < DATEADD(day, 1, @to)" : "");
      if (from) params.from = from;
      if (to) params.to = to;
      const sort = argEnum(args, "sort", SORTS, "won_value_desc");
      const orderBy = sort === "attainment_asc" ? "attainment_pct ASC" : sort === "attainment_desc" ? "attainment_pct DESC" : "won_value DESC";
      // Aggregate first, then rank, so TOP (@limit) applies after the requested ordering.
      sql =
        `WITH x AS (SELECT r.rep_code, r.name, r.team, r.region, r.sales_target, ` +
        `COALESCE(SUM(CASE WHEN o.opportunity_status = 'Won'${dateWhere} THEN o.deal_value END), 0) AS won_value, ` +
        `COALESCE(SUM(CASE WHEN o.opportunity_status = 'Open' THEN o.deal_value END), 0) AS open_pipeline, ` +
        `COALESCE(SUM(CASE WHEN o.opportunity_status = 'Open' THEN o.deal_value * o.probability / 100.0 END), 0) AS weighted_pipeline ` +
        `FROM dbo.sales_representatives r LEFT JOIN dbo.opportunities o ON o.sales_rep_id = r.sales_rep_id ` +
        `WHERE r.sales_target IS NOT NULL${region ? " AND r.region = @region" : ""}${rep ? ` AND ${repFilter}` : ""} ` +
        `GROUP BY r.rep_code, r.name, r.team, r.region, r.sales_target) ` +
        `SELECT TOP (@limit) *, won_value * 100.0 / NULLIF(sales_target, 0) AS attainment_pct FROM x ORDER BY ${orderBy}`;
      notes.push("sales_target is the stored target (its period is not recorded); attainment % = won_value / sales_target for the chosen period.");
      label = "Pipeline: target attainment";
      shape = (rows) => rows.map((r) => ({
        ...r,
        won_value: round2(r.won_value), open_pipeline: round2(r.open_pipeline), weighted_pipeline: round2(r.weighted_pipeline),
        attainment_pct: r.attainment_pct === null ? null : round2(r.attainment_pct),
      }));
    } else if (view === "open_pipeline") {
      const group = argEnum(args, "group_by", OPEN_GROUPS, "stage");
      const { expr, time } = dimension(group, "o.expected_close_date");
      sql =
        `SELECT TOP (@limit) ${expr} AS grp, COUNT(*) AS deals, SUM(o.deal_value) AS pipeline_value, SUM(o.deal_value * o.probability / 100.0) AS weighted_value ` +
        `FROM ${OPP_FROM} WHERE o.opportunity_status = 'Open'${region ? ` AND ${REGION} = @region` : ""}${rep ? ` AND ${repFilter}` : ""}` +
        (group === "none" ? "" : ` GROUP BY ${expr} ORDER BY ${time ? "grp ASC" : "pipeline_value DESC"}`);
      label = `Pipeline: open by ${group}`;
      shape = (rows) => rows.map((r) => ({ group: r.grp, deals: r.deals, pipeline_value: round2(r.pipeline_value), weighted_value: round2(r.weighted_value) }));
    } else {
      const group = argEnum(args, "group_by", WIN_GROUPS, "none");
      const { expr, time } = dimension(group, "o.actual_close_date");
      if (from) params.from = from;
      if (to) params.to = to;
      sql =
        `SELECT TOP (@limit) ${expr} AS grp, ` +
        `SUM(CASE WHEN o.opportunity_status = 'Won' THEN 1 ELSE 0 END) AS won, SUM(CASE WHEN o.opportunity_status = 'Lost' THEN 1 ELSE 0 END) AS lost, ` +
        `SUM(CASE WHEN o.opportunity_status = 'Won' THEN o.deal_value ELSE 0 END) AS won_value, SUM(CASE WHEN o.opportunity_status = 'Lost' THEN o.deal_value ELSE 0 END) AS lost_value ` +
        `FROM ${OPP_FROM} WHERE o.opportunity_status IN ('Won', 'Lost')` +
        `${from ? " AND o.actual_close_date >= @from" : ""}${to ? " AND o.actual_close_date < DATEADD(day, 1, @to)" : ""}` +
        `${region ? ` AND ${REGION} = @region` : ""}${rep ? ` AND ${repFilter}` : ""}` +
        (group === "none" ? "" : ` GROUP BY ${expr} ORDER BY ${time ? "grp ASC" : "won_value DESC"}`);
      label = `Pipeline: win rate by ${group}`;
      shape = (rows) => rows.map((r) => ({
        group: r.grp, won: r.won, lost: r.lost, win_rate_pct: Number(r.won) + Number(r.lost) ? round2((Number(r.won) / (Number(r.won) + Number(r.lost))) * 100) : null,
        won_value: round2(r.won_value), lost_value: round2(r.lost_value),
      }));
    }

    const { rows, truncated } = await runQuery<Row>(sql, params, 200);
    const out = shape(rows);
    const source_id = ctx.addSource({ kind: "sql", label, query: sql, rowCount: rows.length });
    return { ok: true, rowCount: rows.length, truncated, data: clean({ source_id, view, filters: { region: region ?? null, rep: rep ?? null }, rows: out, notes }) };
  },
};
