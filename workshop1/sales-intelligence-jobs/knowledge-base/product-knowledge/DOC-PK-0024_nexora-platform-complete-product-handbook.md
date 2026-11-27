---
doc_id: DOC-PK-0024
title: Nexora Platform Complete Product Handbook
category: Product Knowledge
subcategory: Handbook
created_date: 2026-11-20
source: Product Management
customer_ids: []
lead_ids: []
opportunity_ids: []
sales_rep_ids: []
---

# Nexora Platform Complete Product Handbook

## 1. Purpose of this handbook

This handbook is the single long-form reference for the Nexora revenue intelligence platform. It is written for sales reps, solutions engineers, customer success managers and support staff who need to answer product questions accurately without searching ten separate pages. It covers the platform architecture, the three plans, all fifteen modules, bundling advice, implementation, support tiers and the gaps that must never be promised away. Where this document and a shorter page disagree, the Product Limitations and Known Gaps guide and the Pricing and Packaging Guide win.

## 2. Platform overview

Nexora connects three things that most companies keep in separate tools: the live sales pipeline, the contracts and subscriptions that follow a win, and the customer health signals that predict renewal. The design idea is traceability. Every number in a dashboard, forecast or AI answer can be followed back to a CRM record such as an opportunity, subscription or invoice.

### 2.1 Core objects

The platform is built on a small set of objects that every module reads and writes:

- **Accounts and contacts** - the company and the people at it, including the decision maker and champion roles.
- **Leads and campaigns** - inbound and outbound prospects with a lead score and a source channel.
- **Opportunities** - a potential sale with a stage, deal value, discount percentage, expected close date, competitor and loss reason.
- **Subscriptions** - what a customer has bought: product, plan, monthly recurring revenue, annual contract value, renewal date and status.
- **Invoices and payments** - billing documents issued in advance by billing frequency, with a payment status.
- **Customer health snapshots** - a monthly record of usage, adoption, logins, tickets and churn probability.
- **Activities** - calls, meetings, emails and tasks linked to the objects above.

### 2.2 Module families

The fifteen modules fall into seven families: Core Platform (Sales Cloud, CPQ Studio, Contract Hub, Partner Portal, Mobile Field Sales), Analytics (Revenue Analytics, Forecast Pro), Automation (Pipeline Automation), Customer Success (Customer Health Monitor, Renewal Manager), AI and Insights (Conversation Intelligence, AI Revenue Copilot), Integration (Data Connect), Security (Security and Compliance Pack) and Services (Premier Support). Sales Cloud is mandatory; everything else is an add-on.

## 3. Plans and editions

Nexora sells three plans. The plan decides which platform capabilities exist; modules are priced on top.

| Plan | Typical size | Included | Not included |
|---|---|---|---|
| Starter | Up to 25 users | Pipeline, accounts, standard support | SSO, API access, audit logs, EU data residency |
| Professional | 26 to 250 users | Everything in Starter plus SAML SSO, API access, standard integrations, custom fields, CSV export | EU data residency, advanced audit logs, premium SLA |
| Enterprise | 251+ users | Everything in Professional plus advanced audit logs, EU data residency (Frankfurt), premium SLA | APAC and India regions are still unavailable |

Two rules cause most confusion. First, SAML SSO is part of the Professional and Enterprise plans and is not sold as a separate module; a customer asking for SSO on Professional already owns it. Second, EU data residency is available only on the Enterprise plan. A Professional buyer who requires in-region hosting must move to Enterprise.

In the structured data, the subscription plan_name follows annual contract value: Starter below $25,000, Professional below $100,000 and Enterprise at $100,000 or above. This is a data-modelling convention and may not match a customer's user count exactly.

## 4. The fifteen modules

Each module below follows the same pattern so that retrieval returns a complete answer: purpose, users, usage, capabilities, dependencies, limitation and the questions buyers ask. List prices are per month; the billing frequency shows how often the invoice is raised.

### Nexora Sales Cloud

**Category:** Core Platform. **Pricing model:** Per User, list $95.00 per user per month, billed annual (product_id 1).

**What it does.** Core CRM-connected selling workspace: pipeline, accounts, activities and revenue views.

**Who uses it.** Sellers, sales managers and sales operations.

**How it is used.** Reps work opportunities on the pipeline board, log activities on the account timeline and see weighted revenue by stage. Managers inspect stalled deals and coach from the same view. Every other Nexora module reads from Sales Cloud objects (accounts, contacts, opportunities, subscriptions, invoices).

**Key capabilities.**
- Pipeline board with stage probabilities
- Account and contact timeline
- Plan-based SSO, API and audit features

**Dependencies.** None. It is the base module; all other modules require an active Sales Cloud tenant.

**Limitation to state honestly.** Starter plan excludes SSO and API.

**What buyers usually ask.** Buyers ask whether it replaces their CRM. It can run as the system of record or alongside an external CRM through Data Connect.

### Nexora Revenue Analytics

**Category:** Analytics. **Pricing model:** Tiered, list $1,500.00 per month (tiered), billed quarterly (product_id 2).

**What it does.** Dashboards and cohort analysis across pipeline and revenue.

**Who uses it.** RevOps analysts, finance partners and sales leadership.

**How it is used.** Analysts build dashboards for pipeline coverage, win rate, discount distribution, cycle time and MRR/ARR movement. Cohort retention views show how customers acquired in a given quarter renew. Scheduled exports feed finance packs.

**Key capabilities.**
- Win rate, discount and cycle-time dashboards
- MRR/ARR movement
- Scheduled exports

**Dependencies.** Requires Sales Cloud. Reads opportunities, subscriptions and invoices.

**Limitation to state honestly.** Slow above 1 million rows (NX-4412).

**What buyers usually ask.** Buyers ask about speed on large datasets. Dashboards over about one million rows are slow today (known issue NX-4412, fix targeted for the 2026-12-02 release).

### Nexora Forecast Pro

**Category:** Analytics. **Pricing model:** Flat Fee, list $900.00 flat fee per month, billed quarterly (product_id 3).

**What it does.** Weekly forecast snapshots with rep and manager overrides.

**Who uses it.** Regional managers, VP Sales and the CRO.

**How it is used.** Managers submit a commit forecast by the third business day of the quarter and adjust weekly. Forecast Pro compares forecast with booked revenue and flags opportunities whose expected close date has been pushed.

**Key capabilities.**
- Commit / best case / pipeline rollups
- Slippage detection
- Forecast vs actual tracking

**Dependencies.** Requires Sales Cloud and consistent stage hygiene in the pipeline.

**Limitation to state honestly.** Weekly snapshots only.

**What buyers usually ask.** Buyers ask for daily snapshots. Only weekly snapshots are supported today; do not promise daily.

### Nexora Pipeline Automation

**Category:** Automation. **Pricing model:** Flat Fee, list $1,200.00 flat fee per month, billed quarterly (product_id 4).

**What it does.** Rules engine for follow-ups, stale-deal alerts and approval routing.

**Who uses it.** Sales operations and front-line managers.

**How it is used.** Operations teams configure rules that raise stale-deal alerts, create follow-up tasks and route discount requests to the right approver. The rules engine is how policy such as 'no activity in 14 days' becomes an automatic alert.

**Key capabilities.**
- Stale opportunity alerts
- Discount approval routing
- Task automation

**Dependencies.** Requires Sales Cloud. Approval routing mirrors the Discount Approval Policy.

**Limitation to state honestly.** Maximum 200 active rules per tenant.

**What buyers usually ask.** Buyers ask how many rules they can run. The limit is 200 active rules per tenant.

### Nexora CPQ Studio

**Category:** Core Platform. **Pricing model:** Per User, list $45.00 per user per month, billed annual (product_id 5).

**What it does.** Configure-price-quote for guided proposals.

**Who uses it.** Reps and deal desk.

**How it is used.** Reps assemble priced proposals from templates, with guardrails that stop discounts above the rep's authority. Approved quotes hand off to e-signature in a third-party tool.

**Key capabilities.**
- Quote templates
- Discount guardrails
- E-sign handoff

**Dependencies.** Requires Sales Cloud. Pairs with Pipeline Automation for approval routing.

**Limitation to state honestly.** Single currency per quote.

**What buyers usually ask.** Buyers ask about multi-currency quotes. A quote supports one currency only.

### Nexora Contract Hub

**Category:** Core Platform. **Pricing model:** Flat Fee, list $800.00 flat fee per month, billed annual (product_id 6).

**What it does.** Contract repository and clause tracking.

**Who uses it.** Legal, finance and account managers.

**How it is used.** The repository stores signed contracts and tracks renewal dates and key clauses. The clause library speeds drafting and redline comparison shows what changed between versions.

**Key capabilities.**
- Renewal date tracking
- Clause library
- Redline comparison

**Dependencies.** Requires Sales Cloud. Feeds Renewal Manager with renewal dates.

**Limitation to state honestly.** No native e-signature.

**What buyers usually ask.** Buyers ask about e-signature. Contract Hub has no native e-signature; it integrates with external signing tools.

### Nexora Customer Health Monitor

**Category:** Customer Success. **Pricing model:** Per Account, list $6.00 per account per month, billed quarterly (product_id 7).

**What it does.** Account health scoring and trend monitoring.

**Who uses it.** Customer Success managers and account managers.

**How it is used.** Each customer gets a monthly health snapshot built from product usage, feature adoption, logins per 30 days, support ticket count and renewal risk. The result is a churn probability and a health status (Healthy, Watch, At Risk, Critical).

**Key capabilities.**
- Usage, adoption and ticket signals
- Churn probability
- At-risk alerts

**Dependencies.** Needs a product usage feed from the customer's tenant. Without it scores rely on tickets and activity only.

**Limitation to state honestly.** Needs a product usage feed from the customer.

**What buyers usually ask.** Buyers ask how accurate the score is. It is a prioritisation aid, not a verdict; a new sponsor or a re-launch can make a low score look worse than reality.

### Nexora Renewal Manager

**Category:** Customer Success. **Pricing model:** Flat Fee, list $700.00 flat fee per month, billed quarterly (product_id 8).

**What it does.** Renewal workflow from 120 days out.

**Who uses it.** Account managers, Customer Success and finance.

**How it is used.** Starts the renewal motion 120 days before renewal_date with a calendar of reviews, generates the renewal quote and triggers escalation when health falls. Renewal opportunities use the standard stages.

**Key capabilities.**
- Renewal calendar
- Quote generation
- Escalation triggers

**Dependencies.** Requires Sales Cloud and subscription records. Works on Nexora subscriptions only.

**Limitation to state honestly.** Works on Nexora subscriptions only.

**What buyers usually ask.** Buyers ask whether it can manage renewals for other vendors' products. It cannot.

### Nexora Conversation Intelligence

**Category:** AI & Insights. **Pricing model:** Per User, list $35.00 per user per month, billed monthly (product_id 9).

**What it does.** Call recording, transcription and objection detection.

**Who uses it.** Reps, sales managers and enablement.

**How it is used.** Calls from Zoom and Google Meet are recorded and transcribed. The system tags competitor mentions and objections, shows talk-time ratio and flags deals whose calls show risk language.

**Key capabilities.**
- Competitor mention detection
- Talk-time analytics
- Deal risk flags

**Dependencies.** Requires Sales Cloud and a meeting-platform connection.

**Limitation to state honestly.** English, German and French only.

**What buyers usually ask.** Buyers ask about language support. English, German and French are supported today.

### Nexora Data Connect

**Category:** Integration. **Pricing model:** Flat Fee, list $1,100.00 flat fee per month, billed annual (product_id 10).

**What it does.** Bi-directional CRM and ERP integration.

**Who uses it.** IT, CRM administrators and RevOps.

**How it is used.** Data Connect keeps Nexora and an external CRM or ERP aligned. Salesforce sync is bi-directional; HubSpot and Dynamics are one-way. NetSuite and SAP sync invoices and accounts. A field-mapping UI and conflict rules decide which side wins.

**Key capabilities.**
- Salesforce bi-directional sync
- NetSuite and SAP invoice sync
- 15-minute scheduled sync

**Dependencies.** Requires Sales Cloud. Needs API credentials and a named admin on the customer side.

**Limitation to state honestly.** Implementation takes 2-4 weeks.

**What buyers usually ask.** Buyers ask how long implementation takes. Plan 2 to 4 weeks. Sync runs every 15 minutes, not in real time.

### Nexora Security & Compliance Pack

**Category:** Security. **Pricing model:** Flat Fee, list $2,000.00 flat fee per month, billed annual (product_id 11).

**What it does.** Enterprise security controls.

**Who uses it.** Security, IT and compliance teams.

**How it is used.** Adds SOC 2 reports, audit log export, field-level encryption, IP allow-listing and SCIM provisioning. It is the answer to most security questionnaires beyond SSO.

**Key capabilities.**
- SOC 2 reports
- Field-level encryption
- SCIM and IP allow-listing

**Dependencies.** Requires Sales Cloud on Professional or Enterprise. SAML SSO is part of the plan, not this Pack.

**Limitation to state honestly.** SSO is not part of this module.

**What buyers usually ask.** The most common mistake is selling the Pack to a customer who only asked for SSO. Check the plan first.

### Nexora Partner Portal

**Category:** Core Platform. **Pricing model:** Flat Fee, list $600.00 flat fee per month, billed monthly (product_id 12).

**What it does.** Portal for channel partners.

**Who uses it.** Channel managers and partner reps.

**How it is used.** Partners register deals, share leads and see their own dashboards on a separate login domain. Registration prevents conflicts between partner and direct reps.

**Key capabilities.**
- Deal registration
- Lead sharing
- Partner dashboards

**Dependencies.** Requires Sales Cloud.

**Limitation to state honestly.** Separate login domain.

**What buyers usually ask.** Buyers ask whether partners can use the main login. They use a separate domain.

### Nexora Mobile Field Sales

**Category:** Core Platform. **Pricing model:** Per User, list $18.00 per user per month, billed monthly (product_id 13).

**What it does.** Mobile selling app.

**Who uses it.** Field sellers and visiting account managers.

**How it is used.** Reps log calls and visits, read account history and receive push alerts from the iOS and Android app.

**Key capabilities.**
- Offline read access
- Call and visit logging
- Push alerts

**Dependencies.** Requires Sales Cloud.

**Limitation to state honestly.** Offline edit not supported.

**What buyers usually ask.** Buyers ask about offline editing. Offline is read-only; edits need a connection.

### Nexora Premier Support

**Category:** Services. **Pricing model:** Flat Fee, list $1,500.00 flat fee per month, billed annual (product_id 14).

**What it does.** 24x7 premium support and named success manager.

**Who uses it.** Customer admins and executives.

**How it is used.** Gives 24x7 coverage, a one-hour response on P1 issues, a named success manager and quarterly reviews.

**Key capabilities.**
- 1-hour P1 response
- Named CSM
- Quarterly reviews

**Dependencies.** Requires an active paid plan.

**Limitation to state honestly.** Excludes custom development.

**What buyers usually ask.** Buyers ask whether custom development is included. It is not.

### Nexora AI Revenue Copilot

**Category:** AI & Insights. **Pricing model:** Usage-Based, list $55.00 per unit of usage, billed quarterly (product_id 15).

**What it does.** Natural-language assistant over pipeline and revenue data.

**Who uses it.** Executives, managers and analysts who prefer asking questions.

**How it is used.** Users ask questions in plain language over pipeline and revenue data, for example which deals slipped last quarter. Each answer cites the source records so it can be audited. Billing is by usage.

**Key capabilities.**
- Answers cite source records
- Usage-based billing
- Custom prompts

**Dependencies.** Requires Sales Cloud. Quality depends on data hygiene in opportunities and activities.

**Limitation to state honestly.** Usage caps apply per tenant.

**What buyers usually ask.** Buyers ask about governance. Answers cite records, usage caps apply per tenant and prompts can be customised.

## 5. Choosing modules: recommended paths

Selling every module to every customer is the fastest way to lose trust. Use the signals below to recommend the next module.

| Signal in the account | Recommend | Why |
|---|---|---|
| Starter customer above 90 percent usage or at the 25 user cap | Upgrade to Professional | Adds seats, SSO and API |
| Heavy spreadsheet exports and custom reporting | Revenue Analytics | Replaces manual reporting |
| Forecast calls run from spreadsheets | Forecast Pro | Weekly snapshots, slippage detection |
| Customer asks for a CRM or ERP sync | Data Connect | Bi-directional Salesforce sync |
| Security questionnaire or audit request | Security and Compliance Pack | SOC 2 reports, audit logs, SCIM |
| Renewal surprises and late escalation | Customer Health Monitor and Renewal Manager | 120-day renewal motion |
| Many partners and channel deals | Partner Portal | Deal registration |
| Field team that travels | Mobile Field Sales | Call and visit logging |

Always confirm what the current plan already includes before proposing an add-on. Customers have asked for features they already own.

### 5.1 Typical bundles

- **Revenue core:** Sales Cloud, Revenue Analytics, Forecast Pro. The common first expansion for Mid-Market teams.
- **Renewal protection:** Customer Health Monitor and Renewal Manager. Aimed at customers with a visible churn history.
- **Regulated buyer:** Sales Cloud on Enterprise, Security and Compliance Pack, Premier Support. Aimed at financial services, healthcare and pharma.
- **Integrated stack:** Sales Cloud plus Data Connect. For customers that keep Salesforce or an ERP as the system of record.

## 6. Implementation and onboarding

### 6.1 Typical timeline

A Starter tenant is usable in days. Professional deployments take 3 to 6 weeks, mostly spent on data import and stage configuration. Enterprise deployments take 8 to 14 weeks because of security review, SSO, data residency and integrations. Data Connect alone takes 2 to 4 weeks. Moving a tenant to the EU region takes about 10 business days and is enabled by Support.

### 6.2 What makes onboarding succeed

The strongest predictor of renewal is adoption in the first 90 days. Three practices matter. Import complete data before go-live; empty pipelines make users stop logging in. Train at least two administrators, not one, so a departure does not strand the account. Run an enablement session on included features such as SSO so customers do not ask for what they already have.

### 6.3 Common onboarding failures

- Go-live with an incomplete data import, leaving users to see empty views.
- A single champion who leaves, with no trained replacement.
- Dashboards built during onboarding that no manager adopts because spreadsheets are still the habit.
- Seats purchased in bulk but only a handful activated.

## 7. Support tiers

Standard support is included with every plan and covers business-hours response. Premier Support adds 24x7 coverage, a one-hour response on P1 issues, a named customer success manager and quarterly business reviews. Premier Support excludes custom development. Customer-facing escalations such as a renewal at risk or an unresolved P1 or P2 issue are co-owned by Support and Customer Success, and the account manager must contact the customer within two business days.

## 8. Known gaps and what never to promise

The following statements are true as of November 2026 and must not be softened in sales conversations.

1. There is no India or Asia-Pacific data residency region. An APAC (Sydney) region is planned for Q1 2027 but no date is committed in writing.
2. The EU (Frankfurt) region is generally available since 2026-09-15 and only for the Enterprise plan.
3. Starter has no SSO, no API access and no audit logs.
4. Dashboards over about one million rows load slowly (issue NX-4412). The fix is targeted for the 2026-12-02 release.
5. Forecast Pro supports weekly snapshots only, not daily.
6. The mobile app is read-only offline.
7. CPQ Studio quotes are limited to a single currency.
8. Contract Hub has no native e-signature.
9. Conversation Intelligence supports English, German and French.

Never promise a roadmap item in writing. Use the Product Limitations guide for what is and is not available today.

## 9. Frequently asked questions

**Does Nexora replace our CRM?** It can. Customers that keep another CRM connect it with Data Connect.

**Is SSO an add-on?** No. SAML SSO is included in Professional and Enterprise.

**Which plan includes API access?** Professional and Enterprise. Starter has no API access.

**Can we host data in Europe?** Yes, in Frankfurt, on the Enterprise plan only.

**Can we host data in India or Australia?** Not today. APAC is planned for Q1 2027; there is no India region.

**How often does Data Connect sync?** Every 15 minutes on a schedule.

**What does the AI Revenue Copilot cost?** It is billed by usage; the list unit rate is $55.00 per billing unit and usage caps apply per tenant.

**How many users does Starter allow?** Up to 25. Customers above that must move to Professional.

## 10. Glossary

- **ACV / ARR:** annual contract value and annual recurring revenue; monthly recurring revenue multiplied by 12.
- **MRR:** monthly recurring revenue of a subscription.
- **Commit:** the forecast category for late-stage deals with an engaged decision maker.
- **Health status:** Healthy, Watch, At Risk or Critical, derived from churn probability.
- **P1 / P2:** the highest support severities.
- **NX-4412:** the reporting performance issue on very large datasets.
