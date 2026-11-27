import { loadConfig } from "../config";
import { makeLogger } from "../logger";
import { runIngestion } from "../ingest";

// npm run ingest:run [-- --force] : one-shot ingestion without the Functions host.
const cfg = loadConfig();
runIngestion(cfg, makeLogger(cfg.logLevel, { trigger: "cli" }), { force: process.argv.includes("--force") })
  .then((s) => { console.log(JSON.stringify(s, null, 2)); process.exit(s.failed ? 1 : 0); })
  .catch((e) => { console.error(e); process.exit(1); });
