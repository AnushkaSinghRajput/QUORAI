import { getFailproofConfig } from "@/lib/failproof/config";

export interface CloudVerification {
  ok: boolean;
  checkedAt: string;
  sessionId: string;
  dashboardUrl: string;
  events?: {
    count: number;
    types: Record<string, number>;
    nextCursor: string | null;
  };
  sessions?: {
    count: number;
  };
  error?: string;
  status?: number;
  requestId?: string;
  requiredPermission?: string;
}

function headers(forRead = false): Record<string, string> {
  const config = getFailproofConfig();
  const apiKey = forRead
    ? (config.readApiKey ?? config.apiKey)
    : config.apiKey;
  const result: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (config.org) result["X-AgentEye-Org"] = config.org;
  return result;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const body = (await response.json()) as unknown;
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function eventList(body: Record<string, unknown>): unknown[] {
  if (Array.isArray(body.events)) return body.events;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.items)) return body.items;
  return [];
}

function eventType(event: unknown): string {
  if (!event || typeof event !== "object") return "unknown";
  const record = event as Record<string, unknown>;
  const type = record.type ?? record.event_type;
  return typeof type === "string" ? type : "unknown";
}

/**
 * Read a session back from Cloud. `GET /v1/events` needs `events:read`.
 * `GET /v1/sessions` needs `evaluations:read` and is reported separately when
 * that grant is missing.
 */
export async function verifyCloudSession(sessionId: string): Promise<CloudVerification> {
  const config = getFailproofConfig();
  const checkedAt = new Date().toISOString();
  if (!config.apiKey && !config.readApiKey) {
    return {
      ok: false,
      checkedAt,
      sessionId,
      dashboardUrl: config.dashboardUrl,
      error:
        "FAILPROOFAI_API_KEY is not set. Mint an organization key for quoraai with events:add. Add events:read on that key or set FAILPROOFAI_READ_API_KEY.",
    };
  }

  const params = new URLSearchParams({
    session_id: sessionId,
    order: "asc",
    limit: "200",
  });
  const response = await fetch(`${config.apiBase}/events?${params}`, {
    headers: headers(true),
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  const body = await readJson(response);
  const requestId =
    (typeof body.request_id === "string" ? body.request_id : undefined) ??
    response.headers.get("x-request-id") ??
    undefined;

  if (!response.ok) {
    const requiredPermission =
      typeof body.required_permission === "string"
        ? body.required_permission
        : undefined;
    const baseError =
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : `Failproof events read failed (${response.status}).`;
    const guidance =
      requiredPermission === "events:read"
        ? " Open Administration → Keys in the quoraai workspace, add events:read to the ship key, or mint a read-only key and set FAILPROOFAI_READ_API_KEY. keys:update is human-session only."
        : "";
    return {
      ok: false,
      checkedAt,
      sessionId,
      dashboardUrl: config.dashboardUrl,
      status: response.status,
      requestId,
      requiredPermission,
      error: `${baseError}${guidance}`,
    };
  }

  const events = eventList(body);
  const types: Record<string, number> = {};
  for (const item of events) {
    const type = eventType(item);
    types[type] = (types[type] ?? 0) + 1;
  }

  const verification: CloudVerification = {
    ok: events.length > 0,
    checkedAt,
    sessionId,
    dashboardUrl: config.dashboardUrl,
    requestId,
    events: {
      count: events.length,
      types,
      nextCursor: typeof body.next_cursor === "string" ? body.next_cursor : null,
    },
  };
  if (events.length === 0) {
    verification.error =
      "Cloud accepted the query and returned no events for this session yet.";
  }

  const sessions = await fetch(
    `${config.apiBase}/sessions?${new URLSearchParams({ session_id: sessionId, limit: "5" })}`,
    {
      headers: headers(true),
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    },
  );
  const sessionsBody = await readJson(sessions);
  if (sessions.ok) {
    const rows = eventList({
      events: sessionsBody.sessions,
      data: sessionsBody.data,
      items: sessionsBody.items,
    });
    const list = Array.isArray(sessionsBody.sessions)
      ? sessionsBody.sessions
      : rows;
    verification.sessions = { count: list.length };
  } else if (typeof sessionsBody.required_permission === "string") {
    verification.requiredPermission = sessionsBody.required_permission;
  }

  return verification;
}
