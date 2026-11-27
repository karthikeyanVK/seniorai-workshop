// npm run settings : builds local.settings.json (gitignored) from .env so `func start` works.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const values = {};
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !line.trim().startsWith("#")) values[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

// The timer trigger needs a storage account for leases; reuse the KB storage account locally.
values.AzureWebJobsStorage = values.AzureWebJobsStorage || values.AZURE_STORAGE_CONNECTION_STRING || "UseDevelopmentStorage=true";
values.FUNCTIONS_WORKER_RUNTIME = "node";
values.INGEST_SCHEDULE = values.INGEST_SCHEDULE || "0 0 */6 * * *";

fs.writeFileSync(
  path.join(root, "local.settings.json"),
  JSON.stringify({ IsEncrypted: false, Values: values }, null, 2) + "\n",
);
console.log(`local.settings.json written (${Object.keys(values).length} settings)`);
