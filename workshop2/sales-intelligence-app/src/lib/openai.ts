import "server-only";
import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { loadConfig } from "./config";

const g = globalThis as unknown as { __aoai?: AzureOpenAI };

/** Azure OpenAI client: API key if set, else Managed Identity / `az login` (same rule as the ingestion job). */
export function getOpenAI(): AzureOpenAI {
  if (g.__aoai) return g.__aoai;
  const { openai: o } = loadConfig();
  const common = { endpoint: o.endpoint, apiVersion: o.apiVersion };
  g.__aoai = o.apiKey
    ? new AzureOpenAI({ ...common, apiKey: o.apiKey })
    : new AzureOpenAI({
        ...common,
        azureADTokenProvider: getBearerTokenProvider(new DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"),
      });
  return g.__aoai;
}

export async function embed(text: string): Promise<number[]> {
  const { openai: o } = loadConfig();
  // `dimensions` is only accepted by text-embedding-3-* models.
  const dims = /embedding-3/.test(o.embeddingDeployment) ? { dimensions: o.dimensions } : {};
  const res = await getOpenAI().embeddings.create({ model: o.embeddingDeployment, input: [text], ...dims });
  const v = res.data[0]?.embedding;
  if (!v || v.length !== o.dimensions) throw new Error(`Embedding has ${v?.length ?? 0} dims, expected ${o.dimensions}`);
  return v;
}
