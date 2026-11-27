import { runQuery } from "../sql/db";
import type { Tool } from "../agent/types";
import { argStr, clean, likeEscape } from "./util";

type Row = Record<string, unknown>;

export const lookupDeal: Tool = {
  name: "lookup_deal",
  kind: "sql",
  description:
    "Look up a deal/opportunity by name (partial ok), opportunity_id, or opportunity_code (OPP-0483). If exactly one match, returns the deal (stage, value, probability, dates, competitor, loss_reason, discount), " +
    "its rep, the customer or lead behind it, and the last 10 activities. If several match, returns candidates.",
  parameters: {
    type: "object",
    properties: { term: { type: "string", description: "Opportunity name fragment, numeric opportunity_id, or OPP-#### code" } },
    required: ["term"],
    additionalProperties: false,
  },
  async run(args, ctx) {
    const term = argStr(args, "term");
    if (!term) return { ok: false, error: '"term" is required' };
    const p = { id: /^\d+$/.test(term) ? Number(term) : -1, code: term, like: `%${likeEscape(term)}%` };
    const found = await runQuery<Row>(
      `SELECT TOP 5 o.opportunity_id, o.opportunity_code, o.opportunity_name, o.deal_stage, o.opportunity_status, o.deal_value, o.probability,
              o.created_date, o.expected_close_date, o.actual_close_date, o.last_activity_date, o.competitor, o.loss_reason, o.discount_percentage,
              r.name AS sales_rep, r.rep_code AS sales_rep_code,
              c.customer_id, c.customer_code, c.company_name AS customer,
              l.lead_id, l.lead_code, l.company_name AS lead_company
         FROM dbo.opportunities o
         LEFT JOIN dbo.sales_representatives r ON r.sales_rep_id = o.sales_rep_id
         LEFT JOIN dbo.customers c ON c.customer_id = o.customer_id
         LEFT JOIN dbo.leads l ON l.lead_id = o.lead_id
        WHERE o.opportunity_id = @id OR o.opportunity_code = @code OR o.opportunity_name LIKE @like ESCAPE '\\'
        ORDER BY o.created_date DESC`,
      p,
    );
    const matches = found.rows;
    const label = `Deal lookup "${term}"`;
    if (!matches.length) {
      const source_id = ctx.addSource({ kind: "sql", label, query: "dbo.opportunities WHERE id/code/name matches", rowCount: 0 });
      return { ok: true, data: { source_id, matches: [], note: `No deal matches "${term}".` }, rowCount: 0 };
    }
    if (matches.length > 1) {
      const source_id = ctx.addSource({ kind: "sql", label, query: "dbo.opportunities WHERE id/code/name matches", rowCount: matches.length });
      return { ok: true, data: { source_id, matches: clean(matches), note: "Multiple matches; call again with an opportunity_code." }, rowCount: matches.length };
    }
    const oid = { id: matches[0].opportunity_id as number };
    const acts = await runQuery<Row>(
      `SELECT TOP 10 a.activity_type, a.activity_date, a.outcome, a.next_action_date, a.notes, r.name AS rep
         FROM dbo.activities a JOIN dbo.sales_representatives r ON r.sales_rep_id = a.sales_rep_id
        WHERE a.opportunity_id = @id ORDER BY a.activity_date DESC`,
      oid,
    );
    const rowCount = 1 + acts.rows.length;
    const source_id = ctx.addSource({
      kind: "sql",
      label: `Deal: ${matches[0].opportunity_code}`,
      query: `opportunities, sales_representatives, customers, leads, activities WHERE opportunity_id = ${oid.id}`,
      rowCount,
    });
    return { ok: true, rowCount, data: clean({ source_id, deal: matches[0], recent_activities: acts.rows }) };
  },
};
