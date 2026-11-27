import { createHash } from "node:crypto";
import { Config } from "./config";
import { Logger, errInfo } from "./logger";
import { KbSource } from "./blob";
import { Store, ChunkDoc, ManifestDoc, chunkId, manifestId } from "./cosmos";
import { makeEmbedder } from "./embeddings";
import { chunkMarkdown } from "./chunker";
import { parseFrontMatter, Meta } from "./frontmatter";

export interface Summary {
  blobs: number;
  ingested: number;
  unchanged: number;
  duplicates: number;
  failed: number;
  deletedDocs: number;
  chunksWritten: number;
  chunksEmbedded: number;
  chunksReused: number;
  durationMs: number;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const asStr = (v: Meta[string] | undefined, d = "") => (Array.isArray(v) ? v.join(", ") : v ?? d);
const asArr = (v: Meta[string] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

async function mapLimit<T>(items: T[], limit: number, fn: (t: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

// ponytail: in-process guard only; timer + HTTP on scale-out instances could overlap (upserts are idempotent, so harmless).
let running = false;

export async function runIngestion(cfg: Config, log: Logger, opts: { force?: boolean } = {}): Promise<Summary> {
  if (running) throw new Error("ingestion already running in this instance");
  running = true;
  const t0 = Date.now();
  const s: Summary = { blobs: 0, ingested: 0, unchanged: 0, duplicates: 0, failed: 0, deletedDocs: 0, chunksWritten: 0, chunksEmbedded: 0, chunksReused: 0, durationMs: 0 };
  try {
    const source = new KbSource(cfg);
    const store = new Store(cfg, log);
    const embed = makeEmbedder(cfg, log);
    await store.init();

    const blobs = await source.list();
    s.blobs = blobs.length;
    const manifests = await store.listManifests();
    const byPath = new Map(manifests.map((m) => [m.blob_path, m]));
    log.info("ingestion started", { blobs: blobs.length, knownDocs: manifests.length, force: !!opts.force });

    const live = new Set<string>(); // docIds that still exist (or must be protected from deletion)
    const hashOwner = new Map<string, string>(); // doc_hash -> docId, for duplicate-content detection

    await mapLimit(blobs, cfg.concurrency, async (blob) => {
      const dlog = log.child({ blob: blob.name });
      const prev = byPath.get(blob.name);
      try {
        if (prev && !opts.force && prev.etag === blob.etag) {
          live.add(prev.docId);
          hashOwner.set(prev.doc_hash, prev.docId);
          s.unchanged++;
          return;
        }
        const raw = await source.read(blob.name);
        const docHash = sha256(raw);
        const { meta, body } = parseFrontMatter(raw);
        const docId = asStr(meta.doc_id) || `blob-${sha256(blob.name).slice(0, 12)}`;

        const owner = hashOwner.get(docHash);
        if (owner && owner !== docId) {
          dlog.warn("duplicate content skipped", { docId, duplicateOf: owner });
          s.duplicates++;
          if (prev) live.add(prev.docId);
          return;
        }
        hashOwner.set(docHash, docId);
        if (live.has(docId) && !(prev && prev.docId === docId)) {
          dlog.warn("duplicate docId across blobs skipped", { docId });
          s.duplicates++;
          return;
        }
        live.add(docId);

        const current = manifests.find((m) => m.docId === docId);
        if (current && !opts.force && current.doc_hash === docHash) {
          // same content, new etag/path: just refresh the manifest
          await store.upsertAll([{ ...current, etag: blob.etag, blob_path: blob.name }]);
          s.unchanged++;
          return;
        }

        const title = asStr(meta.title) || docId;
        const version = (current?.doc_version ?? 0) + 1;
        const seen = new Set<string>();
        const chunks = chunkMarkdown(body, cfg.chunk)
          .map((c) => {
            const embedText = `[${docId} | ${title}${c.headingPath ? " > " + c.headingPath : ""}]\n${c.text}`;
            return { ...c, embedText, hash: sha256(`${cfg.openai.deployment}:${cfg.openai.dimensions}:${embedText}`) };
          })
          .filter((c) => !seen.has(c.hash) && !!seen.add(c.hash)); // drop identical chunks within a doc

        const known = current ? await store.embeddingsByHash(docId) : new Map<string, number[]>();
        const todo = chunks.filter((c) => !known.has(c.hash));
        const fresh = todo.length ? await embed(todo.map((c) => c.embedText)) : [];
        const freshByHash = new Map(todo.map((c, i) => [c.hash, fresh[i]]));
        s.chunksEmbedded += todo.length;
        s.chunksReused += chunks.length - todo.length;

        const now = new Date().toISOString();
        const items: ChunkDoc[] = chunks.map((c, i) => ({
          id: chunkId(docId, version, i),
          type: "chunk",
          docId: docId,
          doc_version: version,
          chunk_index: i,
          chunk_count: chunks.length,
          title,
          category: asStr(meta.category),
          subcategory: asStr(meta.subcategory),
          source: asStr(meta.source),
          created_date: asStr(meta.created_date),
          customer_ids: asArr(meta.customer_ids),
          lead_ids: asArr(meta.lead_ids),
          opportunity_ids: asArr(meta.opportunity_ids),
          sales_rep_ids: asArr(meta.sales_rep_ids),
          blob_path: blob.name,
          heading_path: c.headingPath,
          token_count: c.tokens,
          content_hash: c.hash,
          text: c.text,
          embedding: (known.get(c.hash) ?? freshByHash.get(c.hash))!,
          ingested_at: now,
        }));
        const manifest: ManifestDoc = {
          id: manifestId(docId), type: "doc", docId: docId, title, category: asStr(meta.category),
          blob_path: blob.name, etag: blob.etag, doc_hash: docHash, doc_version: version, chunk_count: chunks.length, ingested_at: now,
        };

        // Write order: new chunks -> manifest -> delete old version. A crash leaves old data intact and retries next run.
        await store.upsertAll(items);
        await store.upsertAll([manifest]);
        const removed = current ? await store.deleteOldVersions(docId, version) : 0;
        s.ingested++;
        s.chunksWritten += items.length;
        dlog.info("document ingested", { docId, version, chunks: items.length, embedded: todo.length, reused: chunks.length - todo.length, removedOldChunks: removed });
      } catch (e) {
        s.failed++;
        if (prev) live.add(prev.docId); // never delete on a transient failure
        dlog.error("document failed", errInfo(e));
      }
    });

    // Deletion handling: manifests whose blob is gone. Guard against an empty/misconfigured listing wiping everything.
    const gone = manifests.filter((m) => !live.has(m.docId));
    if (blobs.length === 0 && manifests.length > 0) {
      log.warn("blob listing empty; skipping deletions", { knownDocs: manifests.length });
    } else {
      for (const m of gone) {
        try {
          const n = await store.deleteDoc(m.docId);
          s.deletedDocs++;
          log.info("document deleted", { docId: m.docId, blob: m.blob_path, itemsRemoved: n });
        } catch (e) {
          s.failed++;
          log.error("delete failed", { docId: m.docId, ...errInfo(e) });
        }
      }
    }
    s.durationMs = Date.now() - t0;
    log.info("ingestion finished", { ...s });
    return s;
  } finally {
    running = false;
  }
}
