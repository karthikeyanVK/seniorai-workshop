# Workshop 4 - EVAL, Observability and Monitoring

This module eveluation for LLM and agent , observability and monitoring to use it in production.

Tidewater Medical Group KK has a $150,000 opportunity, 80% closing probability and a target closing date this month. Calculate expected revenue. - LLM Evaluation
What is our discount approval policy for enterprise customers? - RAG Evaluation

Prompt - 'Implement an evaluation framework for the existing Sales Intelligence Agent covering LLM and RAG evaluation.

LLM Evaluation:
- Correctness, relevance, groundedness, consistency and format adherence.
- Use test questions with expected answers and scoring criteria.

RAG Evaluation:
- Context precision, context recall, MRR, faithfulness and answer relevance.
- Evaluate retrieved documents against ground-truth relevance labels.

Create a test dataset based on existing sales KB and SQL data. Run automated evaluations and generate a consolidated JSON/CSV report with individual scores and overall metrics.

Reuse existing architecture and connections. Avoid modifying agent functionality. give me npm to run the eval and test and it should have better details about the rag and llm

'
run 'npm test eval:local'
output will be 

Image tag

# Observability

`Enhance the existing Sales Intelligence Agent with observability, distributed tracing and monitoring.

Implement end-to-end tracing across LangGraph nodes, LLM calls, SQL execution, RAG retrieval and agent orchestration.

Capture:
- Request ID and execution flow.
- Node start/end times and duration.
- LLM model, token usage and API latency.
- SQL execution time, rows returned and errors.
- Retrieval performance and document references.
- Agent failures, retries and total execution cost.

Add an observability dashboard to the existing UI showing execution traces, latency, token consumption, error rates and agent status.

Use structured logging and OpenTelemetry-compatible tracing. Ensure sensitive data and credentials are not logged.

Reuse existing architecture and infrastructure. Avoid unrelated changes.`

Output will be 

Image tag - placeholder

| Field | Details |
|-------|---------|
| Topic | TBD |
| Goals | TBD |
| Prerequisites | TBD |
| Status | TBD |
