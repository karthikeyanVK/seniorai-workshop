import { KB_CATEGORIES, searchKb } from "../kb/search";
import type { Tool } from "../agent/types";
import { argEnum, argInt, argStr } from "./util";

export const searchKnowledgeBase: Tool = {
  name: "search_knowledge_base",
  kind: "rag",
  description:
    "Semantic search over the sales knowledge base (Cosmos DB vector index): policies (discount approval, commission, targets, forecasting, revenue recognition), sales playbooks, product docs/pricing/FAQ/limitations/integrations, " +
    "competitor profiles and market trends, and customer intelligence (meeting notes, churn-warning conversations, lead intake notes). Use for 'what is the policy/process/how should we/what does the doc say' and for qualitative context about an account. " +
    "Returns passages with source_id; cite them as [S#]. Chunks list linked customer/opportunity/rep/lead codes that match SQL *_code columns.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Natural-language search query" },
      category: { type: "string", enum: [...KB_CATEGORIES], description: "Optional category filter" },
      top: { type: "integer", description: "Passages to return, default 5, max 10" },
    },
    required: ["query"],
    additionalProperties: false,
  },
  async run(args, ctx) {
    const query = argStr(args, "query");
    if (!query) return { ok: false, error: '"query" is required' };
    const category = args.category ? argEnum(args, "category", KB_CATEGORIES) : undefined;
    const hits = await searchKb(query, { category, top: argInt(args, "top", 5, 1, 10) });
    const data = hits.map((h) => ({
      source_id: ctx.addSource({ kind: "kb", docId: h.docId, title: h.title, category: h.category, path: h.path, heading: h.heading, snippet: h.text.replace(/\s+/g, " ").slice(0, 320), score: h.score }),
      title: h.title,
      category: h.category,
      subcategory: h.subcategory,
      heading: h.heading,
      score: h.score,
      linked: h.linked,
      text: h.text.length > 1800 ? `${h.text.slice(0, 1800)}…` : h.text,
    }));
    return { ok: true, data: data.length ? data : { note: "No matching passages." }, rowCount: data.length };
  },
};
