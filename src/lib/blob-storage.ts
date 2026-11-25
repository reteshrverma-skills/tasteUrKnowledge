import crypto from "node:crypto";

/**
 * Azure Blob Storage for files students keep (exam papers), talking to the
 * REST API directly with short-lived service SAS URLs signed by the account
 * key - no SDK needed.
 *
 * Configuration (.env.local / App Service settings):
 *   AZURE_STORAGE_CONNECTION_STRING  the storage account's connection string
 *                                    (Portal > Storage account > Access keys)
 *   AZURE_STORAGE_PAPERS_CONTAINER   a PRIVATE container for exam papers
 *
 * The container is never public: every read is a link that works for a few
 * minutes, handed out only after the server has checked the file is the
 * student's own.
 */

const SAS_VERSION = "2022-11-02";

interface BlobConfig {
  account: string;
  key: Buffer;
  container: string;
  endpoint: string;
}

function config(): BlobConfig {
  const connection = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const container = process.env.AZURE_STORAGE_PAPERS_CONTAINER;
  if (!connection || !container) throw new Error("Paper storage is not configured");

  const parts: Record<string, string> = {};
  for (const part of connection.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) parts[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  if (!parts.AccountName || !parts.AccountKey) throw new Error("Paper storage is not configured");
  const suffix = parts.EndpointSuffix || "core.windows.net";
  return {
    account: parts.AccountName,
    key: Buffer.from(parts.AccountKey, "base64"),
    container,
    endpoint: `https://${parts.AccountName}.blob.${suffix}`,
  };
}

export function blobStorageConfigured(): boolean {
  try {
    config();
    return true;
  } catch {
    return false;
  }
}

const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
const encodePath = (name: string) => name.split("/").map(encodeURIComponent).join("/");

/**
 * A URL that allows `permissions` ("r" read, "cw" create/write, "d" delete) on
 * one blob for `minutes`. rscd / rsct make Azure send that
 * Content-Disposition / Content-Type when the blob is read.
 */
function sasUrl(
  blobName: string,
  permissions: string,
  minutes: number,
  response: { contentDisposition?: string; contentType?: string } = {}
): string {
  const c = config();
  const now = Date.now();
  const st = iso(now - 5 * 60_000); // allow for clock skew
  const se = iso(now + minutes * 60_000);
  const rscd = response.contentDisposition ?? "";
  const rsct = response.contentType ?? "";

  // Service SAS string-to-sign for versions 2020-12-06 and later.
  const toSign = [
    permissions,
    st,
    se,
    `/blob/${c.account}/${c.container}/${blobName}`,
    "", // signed identifier
    "", // signed IP
    "https",
    SAS_VERSION,
    "b", // resource: blob
    "", // snapshot time
    "", // encryption scope
    "", // rscc
    rscd,
    "", // rsce
    "", // rscl
    rsct,
  ].join("\n");
  const sig = crypto.createHmac("sha256", c.key).update(toSign, "utf8").digest("base64");

  const query: [string, string][] = [
    ["sv", SAS_VERSION],
    ["sp", permissions],
    ["st", st],
    ["se", se],
    ["spr", "https"],
    ["sr", "b"],
    ...(rscd ? ([["rscd", rscd]] as [string, string][]) : []),
    ...(rsct ? ([["rsct", rsct]] as [string, string][]) : []),
    ["sig", sig],
  ];
  const qs = query.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  return `${c.endpoint}/${c.container}/${encodePath(blobName)}?${qs}`;
}

export async function putBlob(blobName: string, bytes: Uint8Array<ArrayBuffer>, contentType: string): Promise<void> {
  const res = await fetch(sasUrl(blobName, "cw", 10), {
    method: "PUT",
    headers: {
      "x-ms-version": SAS_VERSION,
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": contentType,
    },
    body: bytes,
  });
  if (res.status !== 201) {
    throw new Error(`Blob upload failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
}

/** Deletes a blob; one that is already gone counts as deleted. */
export async function deleteBlob(blobName: string): Promise<void> {
  const res = await fetch(sasUrl(blobName, "d", 5), {
    method: "DELETE",
    headers: { "x-ms-version": SAS_VERSION },
  });
  if (res.status !== 202 && res.status !== 404) {
    throw new Error(`Blob delete failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
}

/**
 * The blob's bytes as a stream, read by the server - for when the browser
 * needs the file itself (the page may only talk to this site, not to Azure).
 */
export async function getBlob(blobName: string): Promise<Response> {
  const res = await fetch(sasUrl(blobName, "r", 5), { headers: { "x-ms-version": SAS_VERSION } });
  if (!res.ok) throw new Error(`Blob read failed (${res.status})`);
  return res;
}

/** A link that opens (or downloads) the blob for the next few minutes. */
export function readUrl(blobName: string, fileName: string, contentType: string, download = false): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const disposition = `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
  return sasUrl(blobName, "r", 5, { contentDisposition: disposition, contentType });
}
