import "server-only";
import { Container, CosmosClient } from "@azure/cosmos";
import { loadConfig } from "../config";
import { embed } from "../openai";

export const KB_CATEGORIES = [
  "Customer Intelligence",
  "Market Intelligence",
  "Product Knowledge",
  "Sales Operations",
  "Sales Playbooks",
] as const;

export interface KbHit {
  docId: string;
  title: string;
  category: string;
  subcategory: string;
  source: string;
  path: string; // <kbBlobContainer>/<blob_path>
  heading: string;
  chunkIndex: number;
  text: string;
  score: number; // cosine similarity, higher = closer
  linked: { customers: string[]; opportunities: string[]; reps: string[]; leads: string[] };
}

const g = globalThis as unknown as { __cosmos?: CosmosClient };

function getContainer(): Container {
  const { cosmos: c } = loadConfig();
  g.__cosmos ??= new CosmosClient({ endpoint: c.endpoint, key: c.key });
  return g.__cosmos.database(c.database).container(c.container);
}

interface Row {
  docId: string; title: string; category: string; subcategory: string; source: string; blob_path: string;
  heading_path: string; chunk_index: number; text: string; score: number;
  customer_ids?: string[]; opportunity_ids?: string[]; sales_rep_ids?: string[]; lead_ids?: string[];
}

/** Vector search over the KB chunks written by the ingestion job. Category filter is parameterized. */
export async function searchKb(query: string, opts: { top?: number; category?: string } = {}): Promise<KbHit[]> {
  const top = Math.min(Math.max(opts.top ?? 5, 1), 10);
  const embedding = await embed(query);
  const where = opts.category ? "c.type = 'chunk' AND c.category = @cat" : "c.type = 'chunk'";
  const parameters = [
    { name: "@top", value: top },
    { name: "@e", value: embedding },
    ...(opts.category ? [{ name: "@cat", value: opts.category }] : []),
  ];
  const { resources } = await getContainer()
    .items.query<Row>({
      query:
        `SELECT TOP @top c.docId, c.title, c.category, c.subcategory, c.source, c.blob_path, c.heading_path, c.chunk_index, c.text, ` +
        `c.customer_ids, c.opportunity_ids, c.sales_rep_ids, c.lead_ids, VectorDistance(c.embedding, @e) AS score ` +
        `FROM c WHERE ${where} ORDER BY VectorDistance(c.embedding, @e)`,
      parameters,
    })
    .fetchAll();
  const { kbBlobContainer } = loadConfig();
  return resources.map((r) => ({
    docId: r.docId,
    title: r.title,
    category: r.category,
    subcategory: r.subcategory,
    source: r.source,
    path: `${kbBlobContainer}/${r.blob_path}`,
    heading: r.heading_path ?? "",
    chunkIndex: r.chunk_index,
    text: r.text,
    score: Number(r.score.toFixed(4)),
    linked: { customers: r.customer_ids ?? [], opportunities: r.opportunity_ids ?? [], reps: r.sales_rep_ids ?? [], leads: r.lead_ids ?? [] },
  }));
}

/** Health probe: number of KB documents (manifest rows). */
export async function kbDocCount(): Promise<number> {
  const { resources } = await getContainer().items.query<number>("SELECT VALUE COUNT(1) FROM c WHERE c.type = 'doc'").fetchAll();
  return resources[0] ?? 0;
}
