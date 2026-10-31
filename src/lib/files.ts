export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 180_000;
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
export const ACCEPTED_ATTACHMENT_TYPES = [
  ".pdf",
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".json",
  ".html",
  ".htm",
  ".xml",
  ".log",
] as const;

const TEXT_MIME = /^(text\/|application\/(json|xml|csv))/i;
const DB_NAME = "quorai-documents";
const STORE = "previews";
const DB_VERSION = 1;

export interface ResearchAttachment {
  name: string;
  mime: string;
  text: string;
  pageCount?: number;
}

const objectUrls = new Map<string, string>();
const pendingLoads = new Map<string, Promise<string | undefined>>();

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

async function rememberBlob(name: string, blob: Blob) {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    });
    db.close();
  } catch {
    // Preview persistence is best-effort; research still works without it.
  }
}

async function readBlob(name: string): Promise<Blob | undefined> {
  try {
    const db = await openDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(name);
      request.onsuccess = () => {
        const value = request.result;
        resolve(value instanceof Blob ? value : undefined);
      };
      request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
    });
    db.close();
    return blob;
  } catch {
    return undefined;
  }
}

function setObjectUrl(name: string, blob: Blob) {
  const previous = objectUrls.get(name);
  if (previous) URL.revokeObjectURL(previous);
  const url = URL.createObjectURL(blob);
  objectUrls.set(name, url);
  return url;
}

/** Synchronous cache hit used by already-hydrated UI. */
export function getDocumentPreview(name: string) {
  return objectUrls.get(name);
}

/** Resolve a PDF object URL, restoring from IndexedDB after a refresh when needed. */
export async function ensureDocumentPreview(name: string) {
  const cached = objectUrls.get(name);
  if (cached) return cached;

  const inflight = pendingLoads.get(name);
  if (inflight) return inflight;

  const load = (async () => {
    const blob = await readBlob(name);
    if (!blob) return undefined;
    return setObjectUrl(name, blob);
  })();

  pendingLoads.set(name, load);
  try {
    return await load;
  } finally {
    pendingLoads.delete(name);
  }
}

export function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isAcceptedAttachment(file: File) {
  const name = file.name.toLowerCase();
  return (
    ACCEPTED_ATTACHMENT_TYPES.some((ext) => name.endsWith(ext)) ||
    TEXT_MIME.test(file.type) ||
    isPdf(file)
  );
}

async function readPdf(file: File): Promise<ResearchAttachment> {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`${file.name} is over 15 MB.`);
  }
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/files/extract", { method: "POST", body });
  const data = (await response.json().catch(() => null)) as {
    error?: string;
    file?: ResearchAttachment;
  } | null;
  if (!response.ok || !data?.file) {
    throw new Error(data?.error ?? `Couldn’t read ${file.name}.`);
  }

  setObjectUrl(data.file.name, file);
  void rememberBlob(data.file.name, file);

  return {
    name: data.file.name,
    mime: data.file.mime,
    text: data.file.text,
    pageCount: data.file.pageCount,
  };
}

export async function readAttachment(file: File): Promise<ResearchAttachment> {
  if (!isAcceptedAttachment(file)) {
    throw new Error(`${file.name} isn’t a supported file. Use PDF or a text format.`);
  }
  if (isPdf(file)) return readPdf(file);
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`${file.name} is over 180 KB. Trim it and try again.`);
  }

  const text = (await file.text()).replace(/\u0000/g, "").trim();
  if (text.length < 8) {
    throw new Error(`${file.name} doesn’t contain readable text.`);
  }

  return {
    name: file.name.slice(0, 180),
    mime: file.type || "text/plain",
    text: text.slice(0, 24_000),
  };
}

export function defaultQueryForAttachments(files: ResearchAttachment[]) {
  if (files.length === 1) {
    const file = files[0];
    if (file.pageCount) {
      return `Analyze “${file.name}” (${file.pageCount} pages), extract the key claims, and verify them against current web sources with citations.`;
    }
    return `Analyze “${file.name}” and verify its claims against current web sources.`;
  }
  return `Analyze the attached files (${files.map((file) => file.name).join(", ")}) and verify the claims against current web sources.`;
}
