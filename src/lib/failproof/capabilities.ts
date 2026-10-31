import { getFailproofConfig } from "@/lib/failproof/config";

export interface FailproofCapabilities {
  checkedAt: string;
  configured: boolean;
  eventsAdd: boolean | null;
  eventsRead: boolean | null;
  readKeyConfigured: boolean;
  message?: string;
  requiredPermission?: string;
}

function authHeaders(apiKey: string, org?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (org) headers["X-AgentEye-Org"] = org;
  return headers;
}

/**
 * Probe Cloud grants without inventing APIs.
 * `events:add` is confirmed by a dry POST of zero events returning 200/4xx identity,
 * and `events:read` by GET /v1/events (403 + required_permission when missing).
 */
export async function probeFailproofCapabilities(): Promise<FailproofCapabilities> {
  const config = getFailproofConfig();
  const checkedAt = new Date().toISOString();
  if (!config.apiKey) {
    return {
      checkedAt,
      configured: false,
      eventsAdd: null,
      eventsRead: null,
      readKeyConfigured: false,
      message: "FAILPROOFAI_API_KEY is not set.",
    };
  }

  const readKey = config.readApiKey ?? config.apiKey;
  const readKeyConfigured = Boolean(config.readApiKey);

  let eventsAdd: boolean | null = null;
  let eventsRead: boolean | null = null;
  let message: string | undefined;
  let requiredPermission: string | undefined;

  try {
    const addResponse = await fetch(`${config.apiBase}/events`, {
      method: "POST",
      headers: {
        ...authHeaders(config.apiKey, config.org),
        "Content-Type": "application/x-ndjson",
        "X-Request-Id": `quorai-cap-add-${Date.now()}`,
      },
      body: "",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (addResponse.status === 401) {
      eventsAdd = false;
      message = "FAILPROOFAI_API_KEY was rejected (401).";
    } else if (addResponse.status === 403) {
      const body = (await addResponse.json().catch(() => ({}))) as {
        required_permission?: string;
        message?: string;
      };
      eventsAdd = body.required_permission !== "events:add";
      requiredPermission = body.required_permission;
      if (body.required_permission === "events:add") {
        eventsAdd = false;
        message = "Key is missing events:add.";
      } else {
        eventsAdd = true;
      }
    } else {
      // Empty body often returns 200 with accepted:0 or 422; both prove auth + add path.
      eventsAdd = addResponse.ok || addResponse.status === 422;
      if (!eventsAdd) {
        message = `events:add probe returned HTTP ${addResponse.status}.`;
      }
    }
  } catch (error) {
    eventsAdd = null;
    message = error instanceof Error ? error.message : String(error);
  }

  try {
    const params = new URLSearchParams({ limit: "1", order: "desc" });
    const readResponse = await fetch(`${config.apiBase}/events?${params}`, {
      headers: authHeaders(readKey, config.org),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (readResponse.status === 401) {
      eventsRead = false;
      message =
        message ??
        "Read key was rejected (401). Set FAILPROOFAI_READ_API_KEY or update grants.";
    } else if (readResponse.status === 403) {
      const body = (await readResponse.json().catch(() => ({}))) as {
        required_permission?: string;
      };
      eventsRead = false;
      requiredPermission = body.required_permission ?? "events:read";
      message =
        "Key is missing events:read. In Administration → Keys, add events:read to this key, or mint a read-only key and set FAILPROOFAI_READ_API_KEY. keys:update is human-session only.";
    } else {
      eventsRead = readResponse.ok;
      if (!eventsRead) {
        message =
          message ?? `events:read probe returned HTTP ${readResponse.status}.`;
      }
    }
  } catch (error) {
    eventsRead = null;
    message = message ?? (error instanceof Error ? error.message : String(error));
  }

  return {
    checkedAt,
    configured: true,
    eventsAdd,
    eventsRead,
    readKeyConfigured,
    message,
    requiredPermission,
  };
}
