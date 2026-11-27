# 📖 Workshop 1 — Everything About RAG and Data Ingestion

> Get your data ready for your RAG. This workshop sets up the job pipeline that powers data ingestion, which is critical for the workshops ahead.

**You will learn:** RAG · Chunking methods · Hybrid Retrieval · System Prompt · Context Engineering · Reranking · Grounding · Hallucination Reduction

---

## 🔑 Configure Credentials

1. Rename `local.settings.example.json` to `local.settings.json` of workshop1\sales-intelligence-jobs\local.settings.example.json.
2. Copy the credentials from the [workshop credentials doc](https://docs.google.com/document/d/1n8jc7n50C1VxDVNuezUE2nOtSilXtP-j7D-vPMpMs20/edit?usp=sharing).
3. Paste the copied credentials into `local.settings.json`.
4. Set `AUDIENCE_NAME` to your name + group number assigned to you, e.g. `yourname3`.
5. Get the following details `COSMOS_ENDPOINT` and  `COSMOS_KEY`  based on your group from  [workshop credentials doc](https://docs.google.com/document/d/1n8jc7n50C1VxDVNuezUE2nOtSilXtP-j7D-vPMpMs20/edit?usp=sharing).:

   ```
   https://salesintelligence-aiworkshop-<YOURNUMBERASSIGNED>.documents.azure.com:443/
   ```

> **Check:** `AUDIENCE_NAME` is set and `COSMOS_ENDPOINT` is updated.

---

## 📥 Upload KB Files to Cosmos DB

Navigate to `workshop1/sales-intelligence-jobs` in terminal. This command copies the files to `SALES-KB-<AUDIENCE_NAME>`:

```bash
cd workshop1/sales-intelligence-jobs
npm install
npm run ingest:local
```

---

## ▶️ Start the Pipeline, so Cosmos db has chunked RAG for better search.

Once the files are copied, run in the same terminal:

```bash
func start
```

---

## ➡️ Next

Navigate to [Workshop 2](../workshop2/readme.md).
