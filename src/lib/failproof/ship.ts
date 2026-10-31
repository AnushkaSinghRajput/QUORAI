import { randomBytes } from "node:crypto";
import { readdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { getFailproofConfig } from "@/lib/failproof/config";
import { logger } from "@/lib/logger";

export interface ShipResult {
  attempted: boolean;
  outcome: "not_configured" | "empty" | "delivered" | "rejected" | "error";
  accepted: number;
  skipped: number;
  batches: number;
  status?: number;
  requestId?: string;
  requiredPermission?: string;
  message?: string;
}

const EMPTY: ShipResult = {
  attempted: false,
  outcome: "empty",
  accepted: 0,
  skipped: 0,
  batches: 0,
};

function requestId(): string {
  return randomBytes(16).toString("hex");
}

async function postBatch(
  body: Buffer,
  id: string,
): Promise<{
  ok: boolean;
  status: number;
  accepted: number;
  skipped: number;
  requestId?: string;
  requiredPermission?: string;
  message?: string;
}> {
  const config = getFailproofConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/x-ndjson",
    "X-Request-Id": id,
  };
  if (config.org) headers["X-AgentEye-Org"] = config.org;

  const response = await fetch(`${config.apiBase}/events`, {
    method: "POST",
    headers,
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(12_000),
  });
  const returnedId = response.headers.get("x-request-id") ?? id;
  let payload: {
    accepted?: number;
    skipped?: number;
    error?: string;
    message?: string;
    required_permission?: string;
    request_id?: string;
  } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    payload = {};
  }
  return {
    ok: response.ok,
    status: response.status,
    accepted: typeof payload.accepted === "number" ? payload.accepted : 0,
    skipped: typeof payload.skipped === "number" ? payload.skipped : 0,
    requestId: payload.request_id ?? returnedId,
    requiredPermission: payload.required_permission,
    message: payload.message ?? payload.error,
  };
}

/**
 * Upload JSONL batches the official SDK flushed to disk.
 * This is the documented `POST /v1/events` ingest. The TypeScript SDK itself
 * only spools; the Failproof daemon is what normally uploads, and a Next.js
 * server does not run that daemon.
 */
export async function shipSpool(): Promise<ShipResult> {
  const config = getFailproofConfig();
  if (!config.apiKey) {
    return {
      attempted: false,
      outcome: "not_configured",
      accepted: 0,
      skipped: 0,
      batches: 0,
      message:
        "FAILPROOFAI_API_KEY is not set, so this run stayed on the local reliability record.",
    };
  }

  const dir = path.join(config.spoolDir, "events");
  let names: string[] = [];
  try {
    names = (await readdir(dir))
      .filter((name) => name.endsWith(".jsonl"))
      .sort()
      .slice(0, 20);
  } catch {
    return EMPTY;
  }
  if (names.length === 0) return EMPTY;

  const result: ShipResult = {
    attempted: true,
    outcome: "delivered",
    accepted: 0,
    skipped: 0,
    batches: 0,
  };

  for (const name of names) {
    const file = path.join(dir, name);
    const body = await readFile(file);
    if (body.length === 0) {
      await unlink(file).catch(() => undefined);
      continue;
    }

    let posted: Awaited<ReturnType<typeof postBatch>> | null = null;
    let lastError = "ingest failed";
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        posted = await postBatch(body, requestId());
        if (posted.ok || (posted.status < 500 && posted.status !== 429)) break;
        lastError = posted.message ?? `HTTP ${posted.status}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        posted = null;
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }

    result.batches += 1;
    if (!posted || !posted.ok) {
      result.outcome = posted && posted.status < 500 ? "rejected" : "error";
      result.status = posted?.status;
      result.requestId = posted?.requestId;
      result.requiredPermission = posted?.requiredPermission;
      result.message = posted?.message ?? lastError;
      logger.warn("Failproof ingest did not accept a batch", {
        status: result.status,
        requestId: result.requestId,
        requiredPermission: result.requiredPermission,
      });
      return result;
    }

    result.accepted += posted.accepted;
    result.skipped += posted.skipped;
    result.requestId = posted.requestId;
    result.status = posted.status;
    await unlink(file).catch(() => undefined);
    if (posted.skipped > 0) {
      logger.warn("Failproof ingest skipped events", {
        accepted: posted.accepted,
        skipped: posted.skipped,
        requestId: posted.requestId,
      });
    }
  }

  if (result.accepted === 0 && result.skipped > 0) {
    result.outcome = "rejected";
    result.message = "Ingest skipped every event in the batch.";
  }
  return result;
}
