# 🤖 Workshop 2 — Sales Intelligence Agent

> Set up an agentic app on a RAG + Sales database, plus the job pipeline that powers data ingestion.

## 📋 Overview

| Field | Details |
|-------|---------|
| Topic | Agentic app with RAG + Cosmos DB |
| Goals | Run the app, add hybrid retrieval, harden the system prompt |
| Prerequisites | Node.js, npm, VS Code, Claude Code, your assigned number |
| Status | TBD |

## 🗺️ Steps

1. [Install](#-install)
2. [Configure environment](#-configure-environment)
3. [Run](#️-run)
4. [Hybrid retrieval](#-hybrid-retrieval)
5. [Clear context](#-clear-context)
6. [Prompt engineering](#-prompt-engineering)

---

## 📦 Install

In a new terminal, go to `workshop2/sales-intelligence-app` and run:

```bash
npm install
```

---

## 🔑 Configure Environment

1. Rename `.env.example` → `.env`.
2. Copy the content from the [workshop env doc](https://docs.google.com/document/d/1n8jc7n50C1VxDVNuezUE2nOtSilXtP-j7D-vPMpMs20/edit?tab=t.0) into `.env`.
3. Set `AUDIENCE_NAME` to your name + assigned number, e.g. `yourname3`.

   > 💡 Case doesn't matter. The code lowercases it. Max 12 chars, letters/digits/hyphen only.

4. Set `COSMOS_ENDPOINT`:

   ```
   https://salesintelligence-aiworkshop-<YOURNUMBERASSIGNED>.documents.azure.com:443/
   ```

---

## ▶️ Run

In a new VS Code terminal:

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## 🔍 Hybrid Retrieval

Make the app handle both **keyword** and **semantic** search.

### 1. Reproduce the gap

In the chat window at `localhost:3000`, ask:

```
Which customers are likely to leave us because they are unhappy with our product?
```

Expected (broken) answer: *"There are currently no customers classified as "At Risk" or "Critical,"…"*

### 2. Fix it with Claude Code

In the terminal where Claude Code is open, paste:

```
Implement hybrid retrieval in Cosmos DB by combining vector search (semantic similarity) with keyword search (exact terms), using BM25 + Vector.
```

### 3. Verify

Ask the **same question** from step 1 again. ✅ You should now get at-risk customers back.

---

## 🧹 Clear Context

In the Claude prompt:

```
/clear
```

---

## 🎯 Prompt Engineering

Stop the agent from passing off general knowledge as company policy.

### 1. Reproduce the gap

In the chat window, ask either:

- `What's standard industry refund policy?`
- `Per policy, what's P1 SLA?`

The agent answers from general knowledge, even though the data isn't in the RAG.

### 2. Fix it with Claude Code

Paste into Claude Code:

```
Retrieve before citing any policy or playbook. If nothing relevant is found, say "No playbook guidance found" instead of using general knowledge as if it were company policy. Add this to the system prompt under Tool Rules.
```

### 3. Verify

Re-ask the two questions. ✅ Expected: `No playbook guidance found`.
