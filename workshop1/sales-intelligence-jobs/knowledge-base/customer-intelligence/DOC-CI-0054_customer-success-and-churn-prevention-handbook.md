---
doc_id: DOC-CI-0054
title: Customer Success and Churn Prevention Handbook
category: Customer Intelligence
subcategory: Customer Success Handbook
created_date: 2026-11-20
source: Customer Success
customer_ids: []
lead_ids: []
opportunity_ids: []
sales_rep_ids: []
---

# Customer Success and Churn Prevention Handbook

## 1. Purpose

This handbook describes how Customer Success and account management keep customers healthy, renew them on time and grow them. It turns the health score, the renewal cadence and the escalation rules into runbooks that can be followed step by step. It also lists the recurring situations seen in customer conversations and the right response to each.

## 2. Principles

1. Adoption is the leading indicator of renewal. Low adoption predicts churn more reliably than feature complaints.
2. Contact frequency matters. Churned customers typically had little contact in the 60 days before renewal.
3. The health score prioritises attention; it does not replace judgement.
4. A customer asking for something they already own is an enablement problem, not a product gap.
5. Say what exists today. Never promise roadmap items in writing.

## 3. The health score

### 3.1 Inputs

Monthly snapshots combine product_usage_score, feature_adoption_score, login_frequency per 30 days, support_ticket_count and renewal_risk_score into a churn probability.

### 3.2 Bands

| Churn probability | Status | Default action |
|---|---|---|
| Below 0.25 | Healthy | Maintain cadence, look for expansion |
| 0.25 to 0.44 | Watch | Check in, review adoption |
| 0.45 to 0.69 | At Risk | Escalate to regional manager, involve Customer Success |
| 0.70 or above | Critical | Executive outreach and a written recovery plan |

### 3.3 Reading the score honestly

A low score can be wrong. A new VP re-launching the programme, a missing usage feed or a recent onboarding delay can all produce a score that overstates risk. Always call the account manager before sending an executive outreach. Conversely, a Healthy score on a customer whose champion has just left should not be trusted.

## 4. Onboarding and adoption

### 4.1 First 90 days

The first 90 days decide the account. Targets: complete data import before go-live, at least two trained administrators, dashboards adopted by managers and weekly logins stable.

### 4.2 Adoption playbook

1. Confirm the success criteria agreed in discovery.
2. Hold an admin training session and a manager session.
3. Check login frequency weekly in the first month.
4. If active seats are far below purchased seats, run an adoption workshop.
5. If dashboards are unused, rebuild them with the manager's real questions.

### 4.3 Typical adoption failures and responses

| Situation | Response |
|---|---|
| Only a fraction of purchased seats are active | Seat activation campaign and manager sponsorship |
| Dashboards from onboarding never adopted | Co-design with managers, retire spreadsheets with a date |
| Data import incomplete after go-live | Complete the import immediately; empty pipelines kill adoption |
| Champion left, replacement untrained | Admin training for the replacement within two weeks |

## 5. Renewal runbook

### 5.1 Timeline

| Days before renewal | Activity |
|---|---|
| 120 | Health review and risk call |
| 90 | Value review with the sponsor |
| 60 | Renewal quote sent |
| 30 | Paperwork and purchase order |

### 5.2 Escalation

Escalate when churn probability is 0.45 or higher or usage fell for two consecutive snapshots, especially with a renewal inside 120 days. The regional manager joins the account plan and Customer Success runs the adoption recovery.

### 5.3 Renewal pricing

Renewals may not be discounted more than 5 percent without regional manager approval. A price uplift must appear in the renewal paperwork; an uplift the customer did not see causes invoice disputes.

### 5.4 After signature

Confirm the billing contact and the purchase order number before the renewal invoice goes out. Overdue renewal invoices are almost always a missing purchase order, a bounced billing contact or a disputed uplift. Finance should not discover these first; the account manager must be told.

## 6. Situation guide

### 6.1 Champion left the company

Contact the economic buyer within 5 days with a short value recap. Identify the replacement and train them. Record both contacts. Check whether usage has dropped since the departure.

### 6.2 Customer mentions a competitor

Ask what they like about it. Do not argue price first; compare total cost and capability. Log the competitor. If the customer is on a Professional plan in Europe and the issue is hosting, explain the Enterprise EU option honestly.

### 6.3 Support tickets rising

Check whether escalations are unanswered. Two unanswered escalations for ten days is a relationship risk. Assign an owner, give the customer a date and update them weekly.

### 6.4 Customer complaint about reporting performance

Dashboards on very large datasets are slow today (issue NX-4412, fix targeted for the 2026-12-02 release). Share the date in writing, escalate to Product and offer a workaround such as narrower date ranges. If the renewal depends on the fix, align paperwork with the release.

### 6.5 Customer asks for a feature

First check whether they already own it. SAML SSO is in Professional and Enterprise. CRM sync is available with Data Connect. Security audits point to the Security and Compliance Pack. Only after that treat it as a product request.

### 6.6 Usage far above contract

Usage growth with no change in subscription is an expansion conversation. The contract allows 10 percent overage without charge. Propose a true-up and open an expansion opportunity.

### 6.7 Customer hits plan limits

A Starter customer at the 25-user cap, or needing SSO or API access, should be offered Professional. Offer a Revenue Analytics trial when reporting is the pain.

### 6.8 Low usage but a new sponsor

Do not treat the score as final. Meet the new sponsor, understand the re-launch plan and set a 30-day adoption checkpoint.

## 7. Expansion

### 7.1 Signals

Usage above 90 percent, plan limits reached, requests for features in a higher plan, rapid headcount growth.

### 7.2 Which module

Starter above 90 percent usage: Professional. Spreadsheet exports: Revenue Analytics. Manual forecast calls: Forecast Pro. CRM sync: Data Connect. Security questionnaires: Security and Compliance Pack. Preferred cross-sell order: Data Connect, Revenue Analytics, Conversation Intelligence, Security and Compliance Pack.

### 7.3 Process

Open an expansion opportunity in the CRM before the proposal. Commission on expansion is 4 percent of first-year ACV.

## 8. Churn post-mortem template

When a customer does not renew, record the following within 30 days: end reason, ARR lost, usage trend in the 60 days before renewal, contact history, competitor if any and the earliest warning sign. The lesson that recurs is to escalate when two consecutive health snapshots decline.

## 9. Roles and responsibilities

| Role | Responsibility |
|---|---|
| Account manager | Owns the relationship, renewal and commercial conversation |
| Customer Success manager | Owns adoption, health review and onboarding |
| Support | Owns tickets and technical escalations |
| Finance | Owns invoicing and collections |
| Regional manager | Owns escalations above account manager authority |
| Product | Owns known issues and roadmap statements |

## 10. Metrics

- **Gross revenue retention:** share of starting ARR kept after churn and downgrades.
- **Net revenue retention:** retention including expansion.
- **Health distribution:** share of customers in each status band.
- **Time to first value:** days from signature to the first adopted dashboard.
- **Overdue renewal invoices:** count of renewed accounts with invoices past due.

Review each monthly in the health review and share the At Risk and Critical lists with sales leadership.
