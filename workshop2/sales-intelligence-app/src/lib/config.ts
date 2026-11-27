import "server-only";

const str = (k: string, d = ""): string => (process.env[k] ?? d).trim();
const num = (k: string, d: number): number => {
  const v = str(k);
  if (!v) return d;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Env ${k} must be a positive number`);
  return n;
};

/** <base>-<audience>; idempotent if the value already carries the suffix (same rule as the ingestion job). */
export const withAudience = (base: string, audience: string): string =>
  !base ? "" : base.endsWith(`-${audience}`) ? base : `${base}-${audience}`;

export const AUDIENCE_RE = /^[a-z0-9-]{1,12}$/;

export const ALL_TABLES = [
  "activities", "campaigns", "contacts", "customer_health", "customers", "invoices",
  "leads", "opportunities", "products", "sales_representatives", "subscriptions",
] as const;

export interface Config {
  audience: string;
  openai: { endpoint: string; apiKey: string; apiVersion: string; chatDeployment: string; embeddingDeployment: string; dimensions: number };
  cosmos: { endpoint: string; key: string; database: string; container: string };
  kbBlobContainer: string;
  sql: { connectionString: string; allowedTables: string[]; maxRows: number; timeoutMs: number };
  agent: { maxSteps: number; historyMessages: number };
  logLevel: string;
}

let cached: Config | undefined;

export function loadConfig(): Config {
  if (cached) return cached;
  const audience = str("AUDIENCE_NAME");
  const tables = str("SQL_ALLOWED_TABLES").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  cached = {
    audience,
    openai: {
      endpoint: str("API_BASE"),
      apiKey: str("API_KEY"),
      apiVersion: str("API_VERSION"),
      chatDeployment: str("DEPLOYMENT_NAME"),
      embeddingDeployment: str("EMBEDDING_DEPLOYMENT"),
      dimensions: num("EMBEDDING_DIMENSIONS", 1536),
    },
    cosmos: {
      endpoint: str("COSMOS_ENDPOINT"),
      key: str("COSMOS_KEY"),
      database: withAudience(str("COSMOS_DATABASE"), audience),
      container: withAudience(str("COSMOS_CONTAINER"), audience),
    },
    kbBlobContainer: withAudience(str("KB_BLOB_CONTAINER"), audience),
    sql: {
      // Prefer the read-only login when provided.
      connectionString: str("SQL_DB_SALESINTELLIGENCE_READONLY") || str("SQL_DB_SALESINTELLIGENCE"),
      allowedTables: tables.length ? tables : [...ALL_TABLES],
      maxRows: num("SQL_MAX_ROWS", 200),
      timeoutMs: num("SQL_TIMEOUT_MS", 15000),
    },
    agent: { maxSteps: num("AGENT_MAX_STEPS", 6), historyMessages: num("AGENT_HISTORY_MESSAGES", 20) },
    logLevel: str("LOG_LEVEL", "info"),
  };
  return cached;
}

/** Names (never values) of required settings that are absent or invalid. Nothing is invented. */
export function missingConfig(cfg: Config = loadConfig()): string[] {
  const m: string[] = [];
  if (!AUDIENCE_RE.test(cfg.audience)) m.push("AUDIENCE_NAME (lowercase alphanumeric/hyphen, max 12)");
  if (!cfg.openai.endpoint) m.push("API_BASE");
  if (!cfg.openai.apiVersion) m.push("API_VERSION");
  if (!cfg.openai.chatDeployment) m.push("DEPLOYMENT_NAME");
  if (!cfg.openai.embeddingDeployment) m.push("EMBEDDING_DEPLOYMENT");
  if (!cfg.cosmos.endpoint) m.push("COSMOS_ENDPOINT");
  if (!cfg.cosmos.key) m.push("COSMOS_KEY");
  if (!str("COSMOS_DATABASE")) m.push("COSMOS_DATABASE");
  if (!str("COSMOS_CONTAINER")) m.push("COSMOS_CONTAINER");
  if (!str("KB_BLOB_CONTAINER")) m.push("KB_BLOB_CONTAINER");
  if (!cfg.sql.connectionString) m.push("SQL_DB_SALESINTELLIGENCE");
  return m;
}

/** Non-fatal config warnings (no values). */
export function configWarnings(): string[] {
  const w: string[] = [];
  if (!str("SQL_DB_SALESINTELLIGENCE_READONLY")) w.push("SQL_DB_SALESINTELLIGENCE_READONLY not set; using main SQL login (app-level read-only guard only)");
  return w;
}
