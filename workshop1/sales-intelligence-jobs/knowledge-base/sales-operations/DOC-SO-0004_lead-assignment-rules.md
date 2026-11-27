---
doc_id: DOC-SO-0004
title: Lead Assignment Rules
category: Sales Operations
subcategory: Lead Assignment
created_date: 2025-01-12
source: Sales Ops
customer_ids: []
lead_ids: []
opportunity_ids: []
sales_rep_ids: []
---

# Lead Assignment Rules

Leads are assigned by region first, then company size: 1-200 employees -> SMB team, 201-1000 -> Mid-Market, 1001+ -> Enterprise. Round-robin inside the team weighted by open lead load. SLA: score >= 80 first touch within 24 hours; others within 3 business days. Reps on leave must have leads reassigned within 2 business days; leads left with a rep on leave are a known gap. Campaign leads from Global campaigns follow the same region rule.
