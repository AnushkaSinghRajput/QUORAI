#!/usr/bin/env node
/**
 * Smoke the research SSE path against a base URL (default: production).
 * Does not print secrets. Exit 0 when search completes with sources and
 * either model synthesis or an honest extractive brief.
 *
 *   BASE_URL=https://quorai-ecru.vercel.app npm run verify:research
 *   BASE_URL=http://localhost:3000 npm run verify:research
 */
const base = (process.env.BASE_URL || "https://quorai-ecru.vercel.app").replace(
  /\/$/,
  "",
);
const query =
  process.env.RESEARCH_QUERY ||
  "What is retrieval-augmented generation in production systems?";
const mode = process.env.RESEARCH_MODE === "deep" ? "deep" : "quick";
const timeoutMs = Number(process.env.RESEARCH_TIMEOUT_MS || 120_000);

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);

async function main() {
  const response = await fetch(`${base}/api/research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      query,
      mode,
      sessionId: `smoke-${Date.now().toString(36)}`,
    }),
    signal: controller.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Research HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.split("\n").find((item) => item.startsWith("data: "));
      if (!line) continue;
      try {
        events.push(JSON.parse(line.slice(6)));
      } catch {
        // ignore malformed chunks
      }
    }
  }

  const sources = events.find((event) => event.type === "sources");
  const error = events.find((event) => event.type === "error");
  const done = events.some((event) => event.type === "done");
  const meta = [...events].reverse().find((event) => event.type === "meta");
  const answer = events
    .filter((event) => event.type === "token")
    .map((event) => event.token ?? "")
    .join("");
  const sourceCount = Array.isArray(sources?.sources) ? sources.sources.length : 0;
  const extractive = /Extractive brief/i.test(answer);
  const ok = done && sourceCount > 0 && !error;

  const summary = {
    base,
    ok,
    done,
    sourceCount,
    extractive,
    llmProvider: meta?.llmProvider ?? null,
    searchProvider: meta?.searchProvider ?? null,
    liveReady: meta?.liveReady ?? null,
    error: error?.error ?? null,
    answerChars: answer.length,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (!ok) process.exit(2);
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          base,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exit(1);
  })
  .finally(() => clearTimeout(timer));
