import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { loadConfig } from "../config";
import { blobService } from "../blob";

// npm run ingest:local : upload local knowledge-base/**/*.md to KB_BLOB_CONTAINER (e.g. knowledge-base-karthik), creating it if missing.
async function main() {
  const { Values } = JSON.parse(readFileSync(join(__dirname, "../../local.settings.json"), "utf8"));
  for (const [k, v] of Object.entries(Values ?? {})) process.env[k] ??= String(v);
  const cfg = loadConfig();
  const root = join(__dirname, "../../knowledge-base");
  const files = (readdirSync(root, { recursive: true }) as string[])
    .map((f) => f.replace(/\\/g, "/"))
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .sort();
  const dst = blobService(cfg).getContainerClient(cfg.blob.container);
  const { succeeded } = await dst.createIfNotExists();
  console.log(`${succeeded ? "Created" : "Using existing"} container ${cfg.blob.container}`);
  console.log(`Uploading ${files.length} files: local -> ${cfg.blob.container}`);
  let n = 0;
  for (const name of files) {
    console.log(`[${n + 1}/${files.length}] ${name}`);
    await dst.getBlockBlobClient(name).uploadData(readFileSync(join(root, name)), { blobHTTPHeaders: { blobContentType: "text/markdown" } });
    n++;
  }
  console.log(`Uploaded ${n} markdown blobs: local -> ${cfg.blob.container}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
