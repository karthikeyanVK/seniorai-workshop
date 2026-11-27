import {
  Container, CosmosClient, VectorEmbeddingPolicy, IndexingPolicy,
  VectorEmbeddingDataType, VectorEmbeddingDistanceFunction, VectorIndexType,
} from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { Config } from "./config";
import { Logger } from "./logger";
import { withRetry } from "./retry";

export interface ChunkDoc {
  id: string;
  type: "chunk";
  docId: string; // partition key
  doc_version: number;
  chunk_index: number;
  chunk_count: number;
  title: string;
  category: string;
  subcategory: string;
  source: string;
  created_date: string;
  customer_ids: string[];
  lead_ids: string[];
  opportunity_ids: string[];
  sales_rep_ids: string[];
  blob_path: string;
  heading_path: string;
  token_count: number;
  content_hash: string;
  text: string;
  embedding: number[];
  ingested_at: string;
}

export interface ManifestDoc {
  id: string;
  type: "doc";
  docId: string;
  title: string;
  category: string;
  blob_path: string;
  etag: string;
  doc_hash: string;
  doc_version: number;
  chunk_count: number;
  ingested_at: string;
}

const safeId = (s: string) => s.replace(/[\/\\?#]/g, "_");
export const manifestId = (docId: string) => `doc:${safeId(docId)}`;
export const chunkId = (docId: string, v: number, i: number) => `${safeId(docId)}:v${v}:${i}`;

export class Store {
  private container!: Container;
  private client: CosmosClient;

  constructor(private cfg: Config, private log: Logger) {
    const { connectionString, endpoint, key } = cfg.cosmos;
    this.client = connectionString
      ? new CosmosClient(connectionString)
      : new CosmosClient({
          endpoint,
          ...(key ? { key } : { aadCredentials: new DefaultAzureCredential({ managedIdentityClientId: cfg.blob.clientId || undefined }) }),
        });
  }

  private retry<T>(op: string, fn: () => Promise<T>) {
    return withRetry(op, this.cfg.maxRetries, this.log, fn);
  }

  async init(): Promise<void> {
    const { database, container, autoCreate, vectorIndex } = this.cfg.cosmos;
    if (autoCreate) {
      const vectorEmbeddingPolicy: VectorEmbeddingPolicy = {
        vectorEmbeddings: [{ path: "/embedding", dataType: VectorEmbeddingDataType.Float32, dimensions: this.cfg.openai.dimensions, distanceFunction: VectorEmbeddingDistanceFunction.Cosine }],
      };
      const indexingPolicy: IndexingPolicy = {
        indexingMode: "consistent",
        includedPaths: [{ path: "/*" }],
        excludedPaths: [{ path: "/embedding/*" }, { path: "/text/*" }, { path: '/"_etag"/?' }],
        vectorIndexes: [{ path: "/embedding", type: vectorIndex === "diskANN" ? VectorIndexType.DiskANN : VectorIndexType.QuantizedFlat }],
      };
      await this.retry("cosmos.createDatabase", () => this.client.databases.createIfNotExists({ id: database }));
      await this.retry("cosmos.createContainer", () =>
        this.client.database(database).containers.createIfNotExists({
          id: container,
          partitionKey: { paths: ["/docId"] },
          vectorEmbeddingPolicy,
          indexingPolicy,
        }),
      );
      this.log.info("cosmos ready", { database, container, vectorIndex });
    }
    this.container = this.client.database(database).container(container);
  }

  async listManifests(): Promise<ManifestDoc[]> {
    const { resources } = await this.retry("cosmos.listManifests", () =>
      this.container.items.query<ManifestDoc>("SELECT * FROM c WHERE c.type = 'doc'").fetchAll(),
    );
    return resources;
  }

  /** content_hash -> embedding for a doc's current chunks, to skip re-embedding unchanged text. */
  async embeddingsByHash(docId: string): Promise<Map<string, number[]>> {
    const { resources } = await this.retry("cosmos.embeddingsByHash", () =>
      this.container.items
        .query<{ content_hash: string; embedding: number[] }>(
          { query: "SELECT c.content_hash, c.embedding FROM c WHERE c.type = 'chunk'" },
          { partitionKey: docId },
        )
        .fetchAll(),
    );
    return new Map(resources.map((r) => [r.content_hash, r.embedding]));
  }

  async upsertAll(items: (ChunkDoc | ManifestDoc)[], parallel = 8): Promise<void> {
    for (let i = 0; i < items.length; i += parallel) {
      await Promise.all(items.slice(i, i + parallel).map((it) => this.retry("cosmos.upsert", () => this.container.items.upsert(it))));
    }
  }

  private async deleteWhere(docId: string, where: string, parameters: { name: string; value: string | number }[] = []): Promise<number> {
    const { resources } = await this.retry("cosmos.queryIds", () =>
      this.container.items.query<{ id: string }>({ query: `SELECT c.id FROM c WHERE ${where}`, parameters }, { partitionKey: docId }).fetchAll(),
    );
    for (let i = 0; i < resources.length; i += 8) {
      await Promise.all(
        resources.slice(i, i + 8).map((r) =>
          this.retry("cosmos.delete", () =>
            this.container.item(r.id, docId).delete().catch((e) => {
              if (e.code !== 404) throw e;
            }),
          ),
        ),
      );
    }
    return resources.length;
  }

  /** Drop chunks from superseded versions after the new version is fully written. */
  deleteOldVersions(docId: string, keep: number) {
    return this.deleteWhere(docId, "c.type = 'chunk' AND c.doc_version != @v", [{ name: "@v", value: keep }]);
  }

  /** Remove a document entirely (chunks + manifest). */
  deleteDoc(docId: string) {
    return this.deleteWhere(docId, "true");
  }

  /** Vector search (used by the search CLI / smoke test). */
  async vectorSearch(embedding: number[], top: number) {
    const { resources } = await this.retry("cosmos.vectorSearch", () =>
      this.container.items
        .query<{ docId: string; title: string; heading_path: string; chunk_index: number; text: string; score: number }>({
          query:
            "SELECT TOP @top c.docId, c.title, c.heading_path, c.chunk_index, c.text, VectorDistance(c.embedding, @e) AS score FROM c WHERE c.type = 'chunk' ORDER BY VectorDistance(c.embedding, @e)",
          parameters: [
            { name: "@top", value: top },
            { name: "@e", value: embedding as unknown as string },
          ],
        })
        .fetchAll(),
    );
    return resources;
  }
}
