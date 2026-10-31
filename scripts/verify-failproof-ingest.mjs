#!/usr/bin/env node
/**
 * Ships one official SDK session to Failproof Cloud via POST /v1/events.
 * Reads FAILPROOFAI_API_KEY from the environment (.env.local is not auto-loaded).
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs) && node scripts/verify-failproof-ingest.mjs
 */
import { configure, session, agent, flush } from "@failproofai/sdk";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const apiKey = process.env.FAILPROOFAI_API_KEY?.trim();
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

const headers = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/x-ndjson",
  "X-Request-Id": `quorai-verify-${Date.now()}`,
};
if (org) headers["X-AgentEye-Org"] = org;

const response = await fetch(`${apiBase}/events`, {
  method: "POST",
  headers,
  body,
});
const payload = await response.text();
console.log(
  JSON.stringify(
    {
      ok: response.ok,
      status: response.status,
      sessionId,
      dashboardUrl: `https://app.befailproof.ai/quoraai`,
      response: payload,
    },
    null,
    2,
  ),
);
process.exit(response.ok ? 0 : 2);
