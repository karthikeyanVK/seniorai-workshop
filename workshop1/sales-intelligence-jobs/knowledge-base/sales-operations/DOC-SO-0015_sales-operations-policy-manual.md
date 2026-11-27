---
doc_id: DOC-SO-0015
title: Sales Operations Policy Manual
category: Sales Operations
subcategory: Policy Manual
created_date: 2026-11-20
source: Sales Operations / RevOps
customer_ids: []
lead_ids: []
opportunity_ids: []
sales_rep_ids: []
---

# Sales Operations Policy Manual

## 1. Purpose

The Sales Operations Policy Manual consolidates the rules that govern how deals are staged, forecast, discounted, paid and recognised. It is the reference for managers, RevOps, Finance and sales leaders. It combines commission, targets, lead assignment, stage definitions, forecasting, discounts, escalation, pipeline hygiene, revenue recognition and health scoring in one document so that policy questions are answered from one place.

## 2. Targets and attainment

### 2.1 How targets are set

Annual targets are set per rep from territory capacity and prior-year bookings. Managers' targets equal the sum of their direct reports. Targets are prorated for joiners.

### 2.2 What counts

Bookings are new business and expansion; renewals are excluded. Attainment equals year-to-date closed-won new and expansion ACV divided by the prorated target.

### 2.3 Changes

A mid-year target change needs VP Sales approval and a documented reason such as a territory reassignment.

### 2.4 Performance management

A rep under 60 percent attainment for two consecutive quarters enters a performance plan. Before concluding that a rep is weak, check whether the shortfall comes from one large deal that slipped, a territory change or a competitor pattern that affects the whole team.

## 3. Commission

### 3.1 Rates

Commission is paid on first-year ACV: new business 8 percent, expansion 4 percent and renewals 1.5 percent.

### 3.2 Accelerator

Bookings above 120 percent of target earn a 1.5 times accelerator.

### 3.3 Payment and clawback

Commission is paid on cash receipt of the first invoice. A clawback applies if the customer cancels, or if the first invoice remains unpaid after 90 days.

## 4. Lead assignment

### 4.1 Routing

Leads are assigned by region first, then company size: 1 to 200 employees to the SMB team, 201 to 1,000 to Mid-Market and 1,001 or more to Enterprise. Within a team, assignment is round-robin weighted by open lead load. Campaign leads from global campaigns follow the same region rule.

### 4.2 Service levels

Score of 80 or more: first touch within 24 hours. Others: within 3 business days.

### 4.3 Leave and gaps

Reps on leave must have leads reassigned within 2 business days. Leads left with an absent rep are a known gap. A region mismatch between the lead record and the company headquarters can leave a lead with nobody; the regional manager resolves it.

## 5. Stage definitions

| Stage | Probability | Definition |
|---|---|---|
| Prospecting | 10% | Target identified, no confirmed need |
| Qualification | 20% | Need and budget confirmed |
| Discovery | 40% | Requirements and stakeholders mapped |
| Proposal | 60% | Priced proposal delivered |
| Negotiation | 80% | Commercial and legal terms under discussion |
| Closed Won | 100% | Signed |
| Closed Lost | 0% | Lost with a recorded reason |

Renewal opportunities use the same stages. Discovery is the health review, Proposal is the renewal quote sent and Negotiation is the paperwork. Expected close dates in the past must be re-dated with a reason.

## 6. Forecasting methodology

### 6.1 Categories

**Commit:** Negotiation stage, decision maker engaged, activity in the last 14 days. **Best Case:** Proposal and above. **Pipeline:** earlier stages.

### 6.2 Calculation

Weighted forecast equals the sum of deal value multiplied by probability.

### 6.3 Cadence

Managers submit a commit by the third business day of the quarter and update weekly.

### 6.4 Known biases and haircuts

Reps over-call Proposal-stage deals and under-date slippage. Apply a 15 percent haircut to deals whose expected close date has already been pushed once. Enterprise deals slip most.

### 6.5 Forecast review

At quarter end compare the commit with actual closed-won bookings (new and expansion; renewals excluded), list opportunities whose expected close fell in the quarter but closed later or stayed open, and record why each was re-dated.

## 7. Discount approval

### 7.1 Authority matrix

| Discount | Approver |
|---|---|
| 0 to 10% | Rep (Starter capped at 10%) |
| Above 10% to 20% | Regional Sales Manager |
| Above 20% to 30% | VP Sales and Finance |
| Above 30% | CRO, written exception, multi-year or strategic logo only |

### 7.2 Workflow

The rep submits the request in the CRM with justification and competitor evidence. The system routes by percentage. The approver responds within 2 business days. The approval is stamped on the opportunity and then the order form is generated. Approvals are required before the proposal is sent; retroactive approvals are tracked as exceptions.

### 7.3 Deal desk

The weekly deal desk reviews any discount above 20 percent and any won deal with a discount above policy. Renewals may not be discounted more than 5 percent without regional manager approval.

## 8. Escalation

| Level | Route | Triggers |
|---|---|---|
| 1 | Rep to regional manager | Deal inactive 30 days, discount above authority, objection unresolved after two calls |
| 2 | Manager to VP Sales | Deal above $150,000 inactive 21 days, competitor price war, executive request |
| 3 | VP to CRO | Discount above 30 percent, contractual exceptions |

Customer-facing escalations such as a renewal at risk or an unresolved P1 or P2 product issue are co-owned with Customer Success and Support. The account manager must contact the customer within 2 business days.

## 9. Pipeline hygiene

Every open opportunity needs a next action date, a decision maker, a competitor if known and activity in the last 14 days. No activity in 14 days puts the deal on the manager dashboard; 30 days triggers escalation. Capacity is 25 open opportunities per rep and 15 for Enterprise reps. Reps above capacity hand off or close out low-probability deals. When a colleague leaves, the regional manager redistributes accounts instead of piling them on one rep.

## 10. Revenue recognition and billing

### 10.1 Recognition

Subscription revenue is recognised ratably over the term. Monthly recurring revenue multiplied by 12 equals annual contract value.

### 10.2 Invoicing

Invoices are issued in advance by product billing frequency: monthly, quarterly or annual. Some products bill annually, which creates billing peaks in particular months, so a monthly invoiced revenue fall does not always mean contraction.

### 10.3 Discounts on invoices

discount_amount on an invoice is a one-off credit. Contract discounts are already reflected in deal_value.

### 10.4 Tax

US and Canada sales tax averages 7 percent, EU VAT 20 percent, India GST 18 percent and APAC 10 percent.

### 10.5 Terms

Standard payment terms are net 30; the Enterprise plan is net 45. Invoice history in the reporting database starts at the billing-system cut-over date.

### 10.6 Overdue renewal invoices

Typical causes are a missing purchase order number, a bounced billing contact or a disputed price uplift. Confirm the billing contact before chasing payment.

## 11. Churn risk and health scoring

### 11.1 Snapshots

customer_health snapshots are monthly.

### 11.2 Status bands

| Churn probability | Status |
|---|---|
| Below 0.25 | Healthy |
| 0.25 to 0.44 | Watch |
| 0.45 to 0.69 | At Risk |
| 0.70 or above | Critical |

### 11.3 Drivers

product_usage_score, feature_adoption_score, login_frequency per 30 days, support_ticket_count and renewal_risk_score.

### 11.4 Escalation rules

Two consecutive falling snapshots on a customer with a renewal inside 120 days is an automatic escalation. Usage above 90 with a plan limit reached is an expansion signal and not a risk.

### 11.5 Interpreting the score

A high churn probability can be a false alarm. A new sponsor who re-launches the programme, or a data feed gap, can depress a score. Confirm with the account manager before executive escalation.

## 12. Operating rhythm

| Cadence | Meeting | Owner | Output |
|---|---|---|---|
| Weekly | Pipeline review | Regional managers | Stalled deals, capacity, re-dated deals |
| Weekly | Deal desk | VP Sales and Finance | Discounts above 20 percent reviewed |
| Monthly | Revenue review | Finance and RevOps | Bookings, billings and variance |
| Monthly | Health review | Customer Success | At Risk and Critical accounts |
| Quarterly | Forecast review | RevOps | Commit versus actual and slippage |
| Quarterly | Target and territory review | VP Sales | Target changes and reassignments |

## 13. Reporting definitions

- **Bookings:** closed-won new business and expansion ACV.
- **Billings:** invoiced amount less discount in the period.
- **Revenue:** ratable recognition of subscription value.
- **Pipeline coverage:** open weighted pipeline divided by remaining target.
- **Win rate:** closed-won divided by closed-won plus closed-lost in the period.

Always report bookings and billings separately. They move for different reasons, and confusing them produces false conclusions about contraction.
