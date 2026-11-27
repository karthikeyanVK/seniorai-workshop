import { loadConfig } from "../config";
import { makeLogger } from "../logger";
import { Store } from "../cosmos";
import { makeEmbedder } from "../embeddings";

// npm run search -- "does the professional plan include SSO?"  : vector-search smoke test.
async function main() {
  const q = process.argv.slice(2).join(" ");
  if (!q) throw new Error('usage: npm run search -- "your question"');
  const cfg = loadConfig();
  const log = makeLogger("warn");
  const store = new Store(cfg, log);
  await store.init();
  const [emb] = await makeEmbedder(cfg, log)([q]);
  for (const r of await store.vectorSearch(emb, 5)) {
    console.log(`\n${r.score.toFixed(4)}  ${r.docId} #${r.chunk_index}  ${r.title}${r.heading_path ? " > " + r.heading_path : ""}\n  ${r.text.replace(/\s+/g, " ").slice(0, 220)}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
