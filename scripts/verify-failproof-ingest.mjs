#!/usr/bin/env node
/**
 * Ships one official SDK session to Failproof Cloud via POST /v1/events,
 * then attempts GET /v1/events with FAILPROOFAI_READ_API_KEY (fallback: ship key).
 *
 * Usage:
 *   set -a && source .env.local && set +a && npm run verify:failproof
 */
import { configure, session, agent, flush } from "@failproofai/sdk";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const apiKey = process.env.FAILPROOFAI_API_KEY?.trim();
const readApiKey =
  process.env.FAILPROOFAI_READ_API_KEY?.trim() || apiKey || undefined;
const apiBase = (
  process.env.FAILPROOFAI_API_BASE?.trim() || "https://app.befailproof.ai/v1"
).replace(/\/$/, "");
const agentId = process.env.FAILPROOFAI_AGENT_ID?.trim() || "quorai-research";
const org = process.env.FAILPROOFAI_ORG?.trim();
const environment =
  process.env.FAILPROOFAI_ENVIRONMENT?.trim() || "development";

if (!apiKey) {
  console.error("FAILPROOFAI_API_KEY is missing.");
  process.exit(1);
}

function headers(key) {
  const result = {
    Authorization: `Bearer ${key}`,
  };
  if (org) result["X-AgentEye-Org"] = org;
  return result;
}

const baseDir = mkdtempSync(path.join(tmpdir(), "quorai-fp-verify-"));
configure({ environment, baseDir, flushInterval: 0.5 });

const sessionId = `quorai-verify-${Date.now()}`;
await session({ sessionId }, async () => {
  await agent(
    agentId,
    { goal: "local Failproof ingest verification", fw_product: "quorai" },
    async () => "ok",
  );
});
await flush();

const eventsDir = path.join(baseDir, "events");
const files = readdirSync(eventsDir)
  .filter((name) => name.endsWith(".jsonl"))
  .sort();
let body = Buffer.alloc(0);
for (const name of files) {
  body = Buffer.concat([
    body,
    readFileSync(path.join(eventsDir, name)),
    Buffer.from("\n"),
  ]);
}

const shipResponse = await fetch(`${apiBase}/events`, {
  method: "POST",
  headers: {
    ...headers(apiKey),
    "Content-Type": "application/x-ndjson",
    "X-Request-Id": `quorai-verify-${Date.now()}`,
  },
  body,
});
const shipPayload = await shipResponse.text();

const readResponse = await fetch(
  `${apiBase}/events?${new URLSearchParams({
    session_id: sessionId,
    order: "asc",
    limit: "50",
  })}`,
  {
    headers: headers(readApiKey),
    cache: "no-store",
  },
);
const readPayload = await readResponse.text();
let readOk = readResponse.ok;
let eventCount = 0;
let requiredPermission;
try {
  const parsed = JSON.parse(readPayload);
  requiredPermission = parsed.required_permission;
  const list = parsed.events || parsed.data || parsed.items || [];
  eventCount = Array.isArray(list) ? list.length : 0;
  readOk = readResponse.ok && eventCount > 0;
} catch {
  // keep raw payload
}

const result = {
  ok: shipResponse.ok && readOk,
  ship: {
    ok: shipResponse.ok,
    status: shipResponse.status,
    response: shipPayload,
  },
  read: {
    ok: readOk,
    status: readResponse.status,
    eventCount,
    requiredPermission,
    response: readPayload.slice(0, 500),
    usedReadKey: Boolean(process.env.FAILPROOFAI_READ_API_KEY?.trim()),
  },
  sessionId,
  dashboardUrl: "https://app.befailproof.ai/quoraai",
  guidance:
    !readOk && requiredPermission === "events:read"
      ? "Add events:read on the ship key in Administration → Keys, or set FAILPROOFAI_READ_API_KEY to a read-capable key. keys:update is human-session only."
      : undefined,
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 2);
