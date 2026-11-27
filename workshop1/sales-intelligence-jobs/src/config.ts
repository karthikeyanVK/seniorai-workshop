const str = (k: string, d = ""): string => (process.env[k] ?? d).trim();
const num = (k: string, d: number): number => {
  const v = str(k);
  if (!v) return d;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Env ${k} must be a number, got "${v}"`);
  return n;
};

export interface Config {
  audience: string;
  openai: { endpoint: string; apiKey: string; apiVersion: string; deployment: string; dimensions: number; batchSize: number };
  cosmos: { connectionString: string; endpoint: string; key: string; database: string; container: string; autoCreate: boolean; vectorIndex: "quantizedFlat" | "diskANN" };
  blob: { connectionString: string; accountUrl: string; container: string; prefix: string; sourceContainer: string; clientId: string };
  chunk: { maxTokens: number; minTokens: number; hardMaxTokens: number; overlapTokens: number };
  concurrency: number;
  maxRetries: number;
  logLevel: string;
}

export function requireAudience(): string {
  const audience = str("AUDIENCE_NAME");
  if (!/^[a-z0-9-]{1,12}$/.test(audience)) throw new Error("AUDIENCE_NAME required: lowercase alphanumeric/hyphen, max 12 chars");
  return audience;
}

// <base>-<audience>; idempotent if the value already carries the suffix.
const withAudience = (k: string, base: string, audience: string): string => {
  const v = str(k, base);
  return v.endsWith(`-${audience}`) ? v : `${v}-${audience}`;
};

export function loadConfig(): Config {
  const audience = requireAudience();
  const blobConn = str("AZURE_STORAGE_CONNECTION_STRING");
  const cfg: Config = {
    audience,
    openai: {
      endpoint: str("API_BASE"),
      apiKey: str("API_KEY"),
      apiVersion: str("API_VERSION", "2025-01-01-preview"),
      deployment: str("EMBEDDING_DEPLOYMENT", "text-embedding-3-small"),
      dimensions: num("EMBEDDING_DIMENSIONS", 1536),
      batchSize: num("EMBEDDING_BATCH_SIZE", 16),
    },
    cosmos: {
      connectionString: str("COSMOS_CONNECTION_STRING"),
      endpoint: str("COSMOS_ENDPOINT"),
      key: str("COSMOS_KEY"),
      database: withAudience("COSMOS_DATABASE", "SALES-KB", audience),
      container: withAudience("COSMOS_CONTAINER", "sales-kb-chunks", audience),
      autoCreate: str("COSMOS_AUTO_CREATE", "true") === "true",
      vectorIndex: str("COSMOS_VECTOR_INDEX", "quantizedFlat") === "diskANN" ? "diskANN" : "quantizedFlat",
    },
    blob: {
      connectionString: blobConn,
      accountUrl: str("AZURE_STORAGE_ACCOUNT_URL"),
      container: withAudience("KB_BLOB_CONTAINER", "knowledge-base", audience),
      prefix: str("KB_BLOB_PREFIX"),
      sourceContainer: str("KB_SOURCE_CONTAINER", "knowledge-base"),
      clientId: str("AZURE_CLIENT_ID"),
    },
    chunk: {
      maxTokens: num("CHUNK_MAX_TOKENS", 512),
      minTokens: num("CHUNK_MIN_TOKENS", 80),
      hardMaxTokens: num("CHUNK_HARD_MAX_TOKENS", 800),
      overlapTokens: num("CHUNK_OVERLAP_TOKENS", 64),
    },
    concurrency: Math.max(1, num("INGEST_CONCURRENCY", 4)),
    maxRetries: num("MAX_RETRIES", 5),
    logLevel: str("LOG_LEVEL", "info"),
  };
  if (!cfg.openai.endpoint) throw new Error("API_BASE (Azure OpenAI endpoint) required");
  if (!cfg.cosmos.connectionString && !cfg.cosmos.endpoint) throw new Error("COSMOS_CONNECTION_STRING or COSMOS_ENDPOINT required");
  if (!blobConn && !cfg.blob.accountUrl) throw new Error("AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_URL required");
  // Not fatal: empty key/conn string falls back to managed identity (DefaultAzureCredential). Surface it so misconfig is visible.
  const fallbacks = [
    !cfg.openai.apiKey && "API_KEY empty -> AAD auth for OpenAI",
    !cfg.cosmos.connectionString && !cfg.cosmos.key && "COSMOS_CONNECTION_STRING/COSMOS_KEY empty -> AAD auth for Cosmos",
    !blobConn && "AZURE_STORAGE_CONNECTION_STRING empty -> AAD auth for Blob",
  ].filter(Boolean);
  if (fallbacks.length) console.warn(`[config] ${fallbacks.join("; ")}`);
  return cfg;
}
