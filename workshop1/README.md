# Workshop 1 — RAG & Data Ingestion

> Get your data ready for your RAG. Sets up the job pipeline that powers data ingestion, which every later workshop depends on.

## Overview

| Field | Details |
|-------|---------|
| Topic | RAG + data ingestion pipeline |
| Goals | Configure credentials, load KB files into Cosmos DB, start the chunking pipeline |
| Prerequisites | Node.js, npm, Azure Functions Core Tools (`func`), your assigned group number |
| Status | TBD |

**You will learn:** RAG · Chunking methods · Hybrid Retrieval · System Prompt · Context Engineering · Reranking · Grounding · Hallucination Reduction

## Prerequisites

Install Azure Functions Core Tools (`func`):

```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

## Steps

1. [Configure credentials](#configure-credentials)
2. [Upload KB files](#upload-kb-files-to-cosmos-db)
3. [Start the pipeline](#start-the-pipeline)
4. [Next](#next)

---

## Configure Credentials

In `workshop1/sales-intelligence-jobs`:

1. Rename `local.settings.example.json` → `local.settings.json`.
2. Open the [workshop credentials doc](https://docs.google.com/document/d/1n8jc7n50C1VxDVNuezUE2nOtSilXtP-j7D-vPMpMs20/edit?usp=sharing) and copy the values for **your group**:
   - `API_KEY`
   - `AZURE_STORAGE_CONNECTION_STRING`
   - `AzureWebJobsStorage`
   - `SQL_DB_SALESINTELLIGENCE`
   - `COSMOS_KEY`
3. Paste them into `local.settings.json`.
4. Set `AUDIENCE_NAME` to your name + group number, e.g. `yourname3`.

   > Case doesn't matter. The code lowercases it. Max 12 chars, letters/digits/hyphen only.

5. Set `COSMOS_ENDPOINT`:

   ```
   https://salesintelligence-aiworkshop-<YOURNUMBERASSIGNED>.documents.azure.com:443/
   ```

> **Check:** `AUDIENCE_NAME` is set and `COSMOS_ENDPOINT` is updated.

---

## Upload KB Files to Cosmos DB

Uploads local `knowledge-base/` to blob container `knowledge-base-<AUDIENCE_NAME>` (created if missing):

```bash
cd workshop1/sales-intelligence-jobs
npm install
npm run ingest:local
```

---

## Start the Pipeline

Once the files are copied, run in the same terminal. This chunks the KB so Cosmos DB has RAG-ready data for better search:

```bash
func start
```

---

## Next

Go to [Workshop 2](../workshop2/README.md).
