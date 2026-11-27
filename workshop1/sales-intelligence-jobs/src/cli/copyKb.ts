import { readFileSync } from "fs";
import { join } from "path";
import { loadConfig } from "../config";
import { KbSource, blobService } from "../blob";

// npm run ingest:local : seed KB_BLOB_CONTAINER (e.g. knowledge-base-karthik) from KB_SOURCE_CONTAINER (default: knowledge-base).
async function main() {
  const { Values } = JSON.parse(readFileSync(join(__dirname, "../../local.settings.json"), "utf8"));
  for (const [k, v] of Object.entries(Values ?? {})) process.env[k] ??= String(v);
  const cfg = loadConfig();
  const src = new KbSource(cfg, cfg.blob.sourceContainer, "");
  const dst = blobService(cfg).getContainerClient(cfg.blob.container);
  await dst.createIfNotExists();
  const blobs = await src.list();
  console.log(`Copying ${blobs.length} blobs: ${cfg.blob.sourceContainer} -> ${cfg.blob.container}`);
  let n = 0;
  for (const b of blobs) {
    console.log(`[${n + 1}/${blobs.length}] ${b.name}`);
    const data = await src.container.getBlobClient(b.name).downloadToBuffer();
    await dst.getBlockBlobClient(b.name).uploadData(data, { blobHTTPHeaders: { blobContentType: "text/markdown" } });
    n++;
  }
  console.log(`Copied ${n} markdown blobs: ${cfg.blob.sourceContainer} -> ${cfg.blob.container}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
