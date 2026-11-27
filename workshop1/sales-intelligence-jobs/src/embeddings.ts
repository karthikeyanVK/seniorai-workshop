import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { Config } from "./config";
import { Logger } from "./logger";
import { withRetry } from "./retry";

export type Embedder = (texts: string[]) => Promise<number[][]>;

export function makeEmbedder(cfg: Config, log: Logger): Embedder {
  const { endpoint, apiKey, apiVersion, deployment, dimensions, batchSize } = cfg.openai;
  const common = { endpoint, apiVersion, deployment, maxRetries: 0 }; // retries handled by withRetry
  const client = apiKey
    ? new AzureOpenAI({ ...common, apiKey })
    : new AzureOpenAI({
        ...common,
        azureADTokenProvider: getBearerTokenProvider(
          new DefaultAzureCredential({ managedIdentityClientId: cfg.blob.clientId || undefined }),
          "https://cognitiveservices.azure.com/.default",
        ),
      });
  // `dimensions` is only accepted by text-embedding-3-* models.
  const dims = /embedding-3/.test(deployment) ? { dimensions } : {};

  return async (texts) => {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const res = await withRetry("embeddings", cfg.maxRetries, log, () =>
        client.embeddings.create({ model: deployment, input: batch, ...dims }),
      );
      const sorted = [...res.data].sort((a, b) => a.index - b.index);
      for (const d of sorted) {
        if (d.embedding.length !== dimensions) throw new Error(`Embedding dims ${d.embedding.length} != EMBEDDING_DIMENSIONS ${dimensions}`);
        out.push(d.embedding);
      }
      log.debug("embedded batch", { count: batch.length, tokens: res.usage?.total_tokens });
    }
    return out;
  };
}
