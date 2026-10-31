import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyProtection,
  inspectEvidence,
  inspectToolCall,
  inspectQuestionLoop,
  redactSecrets,
} from "@/lib/failproof/guards";

describe("failproof guards", () => {
  it("redacts credential-shaped text", () => {
    const result = redactSecrets("token Bearer abcdefghijklmnop and sk-abcdefghijklmnopqrstuv");
    assert.equal(result.redacted, true);
    assert.match(result.text, /\[redacted\]/);
  });

  it("detects repeated tool calls", () => {
    const first = inspectToolCall({
      toolName: "web_search",
      query: "solar capacity 2025",
      provider: "mock",
      priorSignatures: [],
      callsSoFar: 0,
    });
    const second = inspectToolCall({
      toolName: "web_search",
      query: "solar capacity 2025",
      provider: "mock",
      priorSignatures: [first.signature],
      callsSoFar: 1,
    });
    const third = inspectToolCall({
      toolName: "web_search",
      query: "solar capacity 2025",
      provider: "mock",
      priorSignatures: [first.signature, first.signature],
      callsSoFar: 2,
    });
    assert.equal(second.decision.action, "instruct");
    assert.equal(third.decision.action, "deny");
    assert.equal(third.decision.policy, "loop-detection");
  });

  it("softens denies in unprotected mode", () => {
    const denied = inspectToolCall({
      toolName: "web_search",
      query: "same",
      provider: "mock",
      priorSignatures: ["web_search:mock:same", "web_search:mock:same"],
      callsSoFar: 2,
    });
    const softened = applyProtection(denied.decision, "unprotected");
    assert.equal(denied.decision.action, "deny");
    assert.equal(softened.action, "instruct");
    assert.match(softened.reason, /unprotected/i);
  });

  it("flags briefs that omit citations", () => {
    const result = inspectEvidence(
      [
        "Solar capacity grew quickly last year across every major market segment.",
        "Battery storage doubled worldwide while interconnection queues stayed long.",
      ].join("\n"),
      [
        {
          title: "Solar Energy Market Report 2026",
          url: "https://example.com/solar",
          domain: "example.com",
          credibility: "high",
        },
      ],
      true,
    );
    assert.equal(result.decision.policy, "citation-verification");
    assert.equal(result.decision.action, "deny");
  });

  it("allows cited briefs", () => {
    const result = inspectEvidence(
      "Solar capacity grew quickly last year [1]. Storage doubled worldwide [1].",
      [
        {
          title: "Solar Energy Market Report 2026",
          url: "https://example.com/solar",
          domain: "example.com",
          credibility: "high",
        },
      ],
      true,
    );
    assert.equal(result.decision.action, "allow");
  });

  it("does not treat years as citation numbers", () => {
    const result = inspectEvidence(
      "Global solar capacity reached 2,200 GW in 2025, growing 29% year over year [1].",
      [
        {
          title: "Solar Energy Market Report 2026",
          url: "https://example.com/solar",
          domain: "example.com",
          credibility: "high",
        },
      ],
      true,
    );
    assert.equal(result.decision.action, "allow");
    assert.equal(result.weakClaims ?? 0, 0);
  });

  it("detects repeated questions", () => {
    const decision = inspectQuestionLoop("What is RAG?", [
      { role: "user", content: "What is RAG?" },
      { role: "assistant", content: "Retrieval-augmented generation." },
      { role: "user", content: "What is RAG?" },
    ]);
    assert.equal(decision.action, "instruct");
  });
});
