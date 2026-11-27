import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { Config } from "./config";

export interface BlobInfo {
  name: string;
  etag: string;
}

export function blobService(cfg: Config): BlobServiceClient {
  const { connectionString, accountUrl, clientId } = cfg.blob;
  return connectionString
    ? BlobServiceClient.fromConnectionString(connectionString)
    : new BlobServiceClient(accountUrl, new DefaultAzureCredential({ managedIdentityClientId: clientId || undefined }));
}

export class KbSource {
  readonly container: ContainerClient;
  constructor(cfg: Config, containerName = cfg.blob.container, private prefix = cfg.blob.prefix) {
    this.container = blobService(cfg).getContainerClient(containerName);
  }

  /** Recursively lists every .md blob (flat listing covers all virtual sub-directories). */
  async list(): Promise<BlobInfo[]> {
    const out: BlobInfo[] = [];
    for await (const b of this.container.listBlobsFlat({ prefix: this.prefix || undefined })) {
      if (b.name.toLowerCase().endsWith(".md")) out.push({ name: b.name, etag: b.properties.etag });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  async read(name: string): Promise<string> {
    return (await this.container.getBlobClient(name).downloadToBuffer()).toString("utf8");
  }
}
