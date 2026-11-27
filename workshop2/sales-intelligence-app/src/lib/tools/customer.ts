import { runQuery } from "../sql/db";
import type { Tool } from "../agent/types";
import { argStr, clean, likeEscape } from "./util";

type Row = Record<string, unknown>;

export const lookupCustomer: Tool = {
  name: "lookup_customer",
  kind: "sql",
  description:
    "Look up a customer account by company name (partial ok), customer_id, or customer_code (CUST-0001). If exactly one match, returns a full 360 view: " +
    "profile, account manager, contacts, latest health snapshots (churn probability, status), subscriptions (MRR/ACV/renewal), opportunities, invoice totals by payment status, recent activities. " +
    "If several match, returns the candidates so you can refine.",
  parameters: {
    type: "object",
    properties: { term: { type: "string", description: "Company name fragment, numeric customer_id, or CUST-#### code" } },
    required: ["term"],
    additionalProperties: false,
  },
  async run(args, ctx) {
    const term = argStr(args, "term");
    if (!term) return { ok: false, error: '"term" is required' };
    const p = { id: /^\d+$/.test(term) ? Number(term) : -1, code: term, like: `%${likeEscape(term)}%` };
    const found = await runQuery<Row>(
      `SELECT TOP 5 c.customer_id, c.customer_code, c.company_name, c.industry, c.company_size, c.country, c.region, c.annual_revenue,
              c.customer_segment, c.acquisition_channel, c.customer_since, c.customer_status,
              r.name AS account_manager, r.rep_code AS account_manager_code
         FROM dbo.customers c LEFT JOIN dbo.sales_representatives r ON r.sales_rep_id = c.account_manager_id
        WHERE c.customer_id = @id OR c.customer_code = @code OR c.company_name LIKE @like ESCAPE '\\'
        ORDER BY c.company_name`,
      p,
    );
    const matches = found.rows;
    if (!matches.length) {
      const source_id = ctx.addSource({ kind: "sql", label: `Customer lookup "${term}"`, query: "dbo.customers WHERE id/code/name matches", rowCount: 0 });
      return { ok: true, data: { source_id, matches: [], note: `No customer matches "${term}".` }, rowCount: 0 };
    }
    if (matches.length > 1) {
      const source_id = ctx.addSource({ kind: "sql", label: `Customer lookup "${term}"`, query: "dbo.customers WHERE id/code/name matches", rowCount: matches.length });
      return { ok: true, data: { source_id, matches: clean(matches), note: "Multiple matches; call again with a customer_code or a longer name." }, rowCount: matches.length };
    }
    const cid = { id: matches[0].customer_id as number };
    const [contacts, health, subs, opps, invoices, acts] = await Promise.all([
      runQuery<Row>("SELECT TOP 10 contact_id, first_name, last_name, designation, email, decision_maker, department FROM dbo.contacts WHERE customer_id = @id ORDER BY decision_maker DESC, contact_id", cid),
      runQuery<Row>("SELECT TOP 3 snapshot_date, product_usage_score, support_ticket_count, login_frequency, feature_adoption_score, renewal_risk_score, churn_probability, health_status FROM dbo.customer_health WHERE customer_id = @id ORDER BY snapshot_date DESC", cid),
      runQuery<Row>("SELECT s.subscription_code, p.product_name, s.plan_name, s.start_date, s.end_date, s.monthly_recurring_revenue, s.annual_contract_value, s.renewal_date, s.subscription_status, s.auto_renewal FROM dbo.subscriptions s JOIN dbo.products p ON p.product_id = s.product_id WHERE s.customer_id = @id ORDER BY s.start_date DESC", cid),
      runQuery<Row>("SELECT TOP 15 opportunity_code, opportunity_name, deal_stage, opportunity_status, deal_value, probability, expected_close_date, actual_close_date, competitor, loss_reason FROM dbo.opportunities WHERE customer_id = @id ORDER BY created_date DESC", cid),
      runQuery<Row>("SELECT payment_status, COUNT(*) AS invoices, SUM(total_amount) AS total_amount FROM dbo.invoices WHERE customer_id = @id GROUP BY payment_status", cid),
      runQuery<Row>("SELECT TOP 5 activity_type, activity_date, outcome, notes FROM dbo.activities WHERE customer_id = @id ORDER BY activity_date DESC", cid),
    ]);
    const rowCount = 1 + [contacts, health, subs, opps, invoices, acts].reduce((n, r) => n + r.rows.length, 0);
    const source_id = ctx.addSource({
      kind: "sql",
      label: `Customer 360: ${matches[0].company_name}`,
      query: `customers, contacts, customer_health, subscriptions, opportunities, invoices, activities WHERE customer_id = ${cid.id}`,
      rowCount,
    });
    return {
      ok: true,
      rowCount,
      data: clean({
        source_id,
        customer: matches[0],
        contacts: contacts.rows,
        recent_health: health.rows,
        subscriptions: subs.rows,
        opportunities: opps.rows,
        invoice_summary: invoices.rows,
        recent_activities: acts.rows,
      }),
    };
  },
};
