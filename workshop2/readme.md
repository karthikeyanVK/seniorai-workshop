# 🤖 Workshop 2

> Set up your agentic application using a RAG and Sales Database, and set up the job pipeline that powers data ingestion, which is critical for your

---



## 📦 Install

Navigate to the `workshop2` folder, then `sales-intelligence-app`, and run in a new terminal:

```bash
npm install
```

---

## 🔑 Configure Environment

1. Rename `.env.example` to `.env`.
2. Copy the content from this URL - https://docs.google.com/document/d/1n8jc7n50C1VxDVNuezUE2nOtSilXtP-j7D-vPMpMs20/edit?tab=t.0
3. Paste the content into the `.env` file.
4. Set `AUDIENCE_NAME` to your name + the number assigned to you, e.g. `yourname3`.
5. Update `COSMOS_ENDPOINT` with:

   ```
   https://salesintelligence-aiworkshop-<YOURNUMBERASSIGNED>.documents.azure.com:443/
   ```

---

## ▶️ Run

Once the app is created, run it in a new command terminal in VS Code:

```bash
npm run dev
```

Navigate to the app in browser: <http://localhost:3000>

---

## 🧹 Clear Context

In the Claude prompt, enter this command to clear the context:

```
/clear
```

---

## Hybrid Retrievl - Make your app works on both keyword and symentic search compatible

In the localhost:3000 opened chat window, enter the below question:

`Show notes for CUST-10482`

You will get "No Data" message

Now navigate to terminal which as claude code opened, paste the following prompt and press enter 

` Implement hybrid retrieval in Cosmos DB by combining vector search (semantic similarity) with keyword search (exact terms). using BM25 + Vector`

## 📋 Overview

| Field | Details |
|-------|---------|
| Topic | TBD |
| Goals | TBD |
| Prerequisites | TBD |
| Status | TBD |
