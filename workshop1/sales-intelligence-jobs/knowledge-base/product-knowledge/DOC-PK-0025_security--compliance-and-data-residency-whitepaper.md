---
doc_id: DOC-PK-0025
title: Security, Compliance and Data Residency Whitepaper
category: Product Knowledge
subcategory: Security Whitepaper
created_date: 2026-11-20
source: Product Management / Security
customer_ids: []
lead_ids: []
opportunity_ids: []
sales_rep_ids: []
---

# Security, Compliance and Data Residency Whitepaper

## 1. Purpose and audience

This whitepaper explains how Nexora protects customer data, which controls come with which plan, where data can be hosted and how to answer the questions that appear in security reviews and procurement questionnaires. It is written so that a seller or solutions engineer can answer a buyer's IT lead accurately and without overstating capability. Residency and plan boundaries are the two areas where over-promising has stalled the most deals, so those get the most space.

## 2. Security model at a glance

Nexora is a multi-tenant cloud service. Each customer is a tenant with logically separated data. Access is governed by roles, plan-based features and optional add-on controls. Security capability is layered:

| Layer | What it provides | Where it comes from |
|---|---|---|
| Identity | SAML SSO | Professional and Enterprise plans |
| Access control | Role-based permissions, IP allow-listing | Roles in all plans; IP allow-listing in the Security and Compliance Pack |
| Provisioning | SCIM user lifecycle | Security and Compliance Pack |
| Data protection | Encryption in transit; field-level encryption | In transit by default; field-level in the Pack |
| Auditability | Audit logs | Advanced audit logs on Enterprise; export in the Pack |
| Assurance | SOC 2 reports | Security and Compliance Pack |
| Residency | EU (Frankfurt) region | Enterprise plan only |

## 3. Identity and access

### 3.1 Single sign-on

SAML SSO is included in Professional and Enterprise and is enabled by an administrator in Security Settings. It is not part of the Security and Compliance Pack. Starter does not include SSO. The recurring support case is a customer asking for SSO as a feature request when it is already in their plan; the fix is an admin enablement session, not a roadmap discussion.

### 3.2 SCIM provisioning

SCIM provisioning automates account creation and removal from the customer's identity provider. It is part of the Security and Compliance Pack. Without it, administrators manage users manually or through the API on plans that include it.

### 3.3 IP allow-listing

Customers can restrict access to approved IP ranges. This is a Pack capability and is commonly requested by financial services buyers.

### 3.4 Roles

Permissions follow sales roles: rep, manager, operations, finance, administrator. Managers see their team's pipeline; administrators configure rules, integrations and security settings. Role design should be reviewed at every renewal because departures and reorganisations leave stale administrators.

## 4. Data protection

### 4.1 In transit and at rest

Data is encrypted in transit between users, integrations and the platform. Storage is encrypted at rest at the platform level. For regulated data fields, the Pack adds field-level encryption so that selected fields are encrypted individually.

### 4.2 Data export and deletion

Customers can export data as CSV and through the API on Professional and above. Starter customers do not have API access. Deletion and retention requests are handled by the customer's administrator and by Support for tenant-level actions.

### 4.3 Backups

The platform maintains regular backups for service continuity. Backup retention details are contractual and appear in the order form for Enterprise customers; do not quote retention periods from memory.

## 5. Auditability

Enterprise includes advanced audit logs. The Security and Compliance Pack adds audit log export so logs can be sent to a customer's monitoring system. Starter has no audit logs. Auditors usually ask three things: who changed a discount, who exported data and who changed a permission. All three are covered by audit logs on the plans above.

## 6. Compliance and assurance

SOC 2 reports are provided through the Security and Compliance Pack and are shared under NDA. For GDPR, Nexora acts as a processor; a data processing agreement is part of the contract. Legal redlines on the DPA liability cap are a frequent source of delay in Enterprise negotiations, so start the legal review at Proposal stage, not Negotiation. Healthcare and financial buyers often add questionnaires; route them to Solutions Engineering early.

## 7. Data residency

### 7.1 Current availability

| Region | Status | Plan |
|---|---|---|
| EU (Frankfurt) | Generally available since 2026-09-15 | Enterprise only |
| Asia-Pacific (Sydney) | Planned for Q1 2027, no committed date in writing | Not available |
| India | No region | Not available |
| North America | Default hosting | All plans |

### 7.2 How EU residency works

Residency is enabled per tenant by Support. Migration of an existing tenant takes about 10 business days. Customers that sign on Enterprise can choose the EU region during implementation. It is not available on Professional; a Professional buyer who needs it must move to Enterprise.

### 7.3 How to handle residency in a deal

1. Ask in the first two discovery calls where data must be hosted and why. Surfacing the requirement after the proposal is the most common reason deals stall.
2. For EU buyers, qualify for the Enterprise plan before discounting.
3. For APAC and India buyers, flag the deal to Product, state the roadmap honestly and do not write dates into the order form.
4. Never say 'EU hosting available' without adding 'on the Enterprise plan'.

### 7.4 Competitive context

Vantara Revenue Cloud has offered EU hosting longer than Nexora and appears on many European Mid-Market deals. Strata Sales Suite offers APAC hosting. The honest answer is that Nexora wins on forecasting depth and renewal workflows and loses when residency is a hard requirement outside the Enterprise EU case.

## 8. Security questionnaire answer bank

Use these as starting answers and confirm against the contract.

**Do you support SSO?** Yes. SAML SSO on Professional and Enterprise.

**Do you support SCIM?** Yes, in the Security and Compliance Pack.

**Is data encrypted?** Yes, in transit and at rest; field-level encryption is available in the Pack.

**Can we restrict access by IP?** Yes, with the Pack.

**Do you have SOC 2?** Yes. Reports are shared under NDA through the Pack.

**Where is data stored?** North America by default. EU (Frankfurt) on Enterprise. No India or APAC region today.

**Do you provide audit logs?** Advanced audit logs on Enterprise, with export in the Pack. Starter has none.

**Can we export our data?** Yes, CSV and API on Professional and above.

**Is the AI assistant trained on our data?** The AI Revenue Copilot answers questions over the customer's own records and cites its sources. Confirm training terms against the contract before answering in writing.

## 9. Common mistakes in security reviews

- Promising in-region hosting on Professional.
- Selling the Pack to a customer who only needs SSO.
- Quoting a date for an APAC region.
- Sending the questionnaire to the buyer late; security review should start at Proposal.
- Letting procurement own the questionnaire with no named owner on the customer side.

## 10. Escalation

Questions the answer bank cannot settle go to Solutions Engineering. Residency questions outside Enterprise EU go to Product. Contractual exceptions and DPA changes go to Legal. Level 3 commercial exceptions go to the CRO.
