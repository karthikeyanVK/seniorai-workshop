---
doc_id: DOC-SO-0010
title: Churn Risk and Health Score Guide
category: Sales Operations
subcategory: Churn Management
created_date: 2025-05-05
source: Customer Success
customer_ids: []
lead_ids: []
opportunity_ids: []
sales_rep_ids: []
---

# Churn Risk and Health Score Guide

customer_health snapshots are monthly. health_status: Healthy (<0.25 churn probability), Watch (0.25-0.44), At Risk (0.45-0.69), Critical (>=0.70). Drivers: product_usage_score, feature_adoption_score, login_frequency (per 30 days), support_ticket_count and renewal_risk_score. Two consecutive falling snapshots on a customer with a renewal inside 120 days is an automatic escalation. Usage above 90 with a plan limit hit is an expansion signal, not a risk.
