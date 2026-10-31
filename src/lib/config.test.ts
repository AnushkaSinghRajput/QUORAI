import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  credentialPresence,
  credentialsBlockerMessage,
  getAppConfig,
} from "@/lib/config";

const KEYS = [
  "TAVILY_API_KEY",
  "OPENAI_API_KEY",
  "SERPER_API_KEY",
  "ANTHROPIC_API_KEY",
  "FAILPROOFAI_API_KEY",
  "AUTH_SECRET",
  "ALLOW_MOCK_FALLBACK",
  "SEARCH_PROVIDER",
  "LLM_PROVIDER",
] as const;

const snapshot: Record<string, string | undefined> = {};

describe("app config", () => {
  beforeEach(() => {
    for (const key of KEYS) {
      snapshot[key] = process.env[key];
      delete process.env[key];
    }
    process.env.SEARCH_PROVIDER = "tavily";
    process.env.LLM_PROVIDER = "openai";
    process.env.ALLOW_MOCK_FALLBACK = "0";
  });

  afterEach(() => {
    for (const key of KEYS) {
      const value = snapshot[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("rejects missing live credentials when mock fallback is off", () => {
    const config = getAppConfig();
    assert.equal(config.liveReady, false);
    assert.equal(config.allowMockFallback, false);
    assert.ok(config.missingCredentials.includes("TAVILY_API_KEY"));
    assert.ok(config.missingCredentials.includes("OPENAI_API_KEY"));
    assert.match(credentialsBlockerMessage(config) ?? "", /TAVILY_API_KEY/);
  });

  it("marks placeholder secrets as not configured", () => {
    process.env.TAVILY_API_KEY = "your_tavily_key";
    process.env.OPENAI_API_KEY = "your_openai_key";
    assert.equal(credentialPresence("TAVILY_API_KEY"), "placeholder");
    assert.equal(credentialPresence("OPENAI_API_KEY"), "placeholder");
    const config = getAppConfig();
    assert.equal(config.liveReady, false);
  });

  it("is liveReady when real tavily and openai keys are set", () => {
    process.env.TAVILY_API_KEY = "tvly-live-test-key-abcdefghijklmnopqrstuvwxyz";
    process.env.OPENAI_API_KEY = "sk-live-test-key-abcdefghijklmnopqrstuvwxyz";
    process.env.AUTH_SECRET = "a".repeat(64);
    process.env.FAILPROOFAI_API_KEY = "b".repeat(64);
    const config = getAppConfig();
    assert.equal(config.searchProvider, "tavily");
    assert.equal(config.llmProvider, "openai");
    assert.equal(config.liveReady, true);
    assert.equal(config.demoMode, false);
  });
});
