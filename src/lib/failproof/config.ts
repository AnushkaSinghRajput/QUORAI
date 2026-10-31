import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Public Failproof coordinates. The workspace URL is the hosted dashboard for
 * the `quoraai` organization. It is not an API origin. Ingest and reads go to
 * the documented `/v1` API on the dashboard host.
 */
export const FAILPROOF_WORKSPACE = "quoraai";
export const FAILPROOF_DASHBOARD_URL = "https://app.befailproof.ai/quoraai";
export const DEFAULT_API_BASE = "https://app.befailproof.ai/v1";
export const DEFAULT_AGENT_ID = "quorai-research";

function env(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function environmentLabel(): string {
  const override = env("FAILPROOFAI_ENVIRONMENT");
  const label =
    override ??
    (process.env.NODE_ENV === "production" ? "production" : "development");
  if (label.includes(",")) return "development";
  return label;
}

function agentId(): string {
  const configured = env("FAILPROOFAI_AGENT_ID") ?? DEFAULT_AGENT_ID;
  if (configured.includes(",") || configured.length > 64) return DEFAULT_AGENT_ID;
  return configured;
}

/**
 * `/v1` base. `FAILPROOFAI_API_BASE` may override it for a documented
 * self-hosted origin, and must already include the `/v1` prefix.
 */
export function failproofApiBase(): string {
  const configured = env("FAILPROOFAI_API_BASE");
  if (!configured) return DEFAULT_API_BASE;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" || url.username || url.password) {
      return DEFAULT_API_BASE;
    }
    const path = url.pathname.replace(/\/$/, "");
    return `${url.origin}${path}`;
  } catch {
    return DEFAULT_API_BASE;
  }
}

export function getFailproofConfig() {
  const apiKey = env("FAILPROOFAI_API_KEY");
  const captureRaw = env("FAILPROOFAI_CAPTURE_CONTENT");
  return {
    apiKey,
    configured: Boolean(apiKey),
    org: env("FAILPROOFAI_ORG"),
    apiBase: failproofApiBase(),
    environment: environmentLabel(),
    agentId: agentId(),
    workspace: FAILPROOF_WORKSPACE,
    dashboardUrl: FAILPROOF_DASHBOARD_URL,
    captureContent: captureRaw !== "0" && captureRaw !== "false",
    enforceDrift: env("FAILPROOFAI_ENFORCE_DRIFT") === "1",
    enforceEvidence: env("FAILPROOFAI_ENFORCE_EVIDENCE") === "1",
    spoolDir: path.join(tmpdir(), "quorai-failproof-spool"),
  };
}

export type FailproofConfig = ReturnType<typeof getFailproofConfig>;

export function failproofRequirements(): string[] {
  const config = getFailproofConfig();
  if (config.configured) return [];
  return [
    "Set FAILPROOFAI_API_KEY in the server environment (.env.local locally). Mint an organization-scoped key inside the quoraai workspace at Administration → Keys. The ingest path needs events:add. The reliability Verify action also needs events:read. An instance-scoped key additionally needs FAILPROOFAI_ORG=quoraai. The workspace URL is the dashboard, not the API.",
  ];
}
