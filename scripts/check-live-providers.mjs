#!/usr/bin/env node
/**
 * Non-secret readiness check for Tavily + OpenAI + Failproof.
 * Does not print secret values.
 */
function present(name) {
  const value = process.env[name]?.trim();
  if (!value) return { name, ok: false, reason: "missing" };
  if (/^(your_|change-me|placeholder|example)/i.test(value)) {
    return { name, ok: false, reason: "placeholder" };
  }
  return { name, ok: true, reason: `set(${value.length} chars)` };
}

const checks = [
  present("TAVILY_API_KEY"),
  present("OPENAI_API_KEY"),
  present("FAILPROOFAI_API_KEY"),
  present("AUTH_SECRET"),
  present("FAILPROOFAI_READ_API_KEY"),
];

const required = ["TAVILY_API_KEY", "OPENAI_API_KEY", "FAILPROOFAI_API_KEY", "AUTH_SECRET"];
const ready = required.every((name) => checks.find((item) => item.name === name)?.ok);

console.log(
  JSON.stringify(
    {
      liveResearchReady: ready,
      preferred: {
        search: process.env.SEARCH_PROVIDER || "tavily",
        llm: process.env.LLM_PROVIDER || "openai",
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      },
      checks,
      blockers: checks.filter((item) => required.includes(item.name) && !item.ok),
    },
    null,
    2,
  ),
);
process.exit(ready ? 0 : 2);
