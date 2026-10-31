import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildExtractiveBrief,
  isLlmBillingFailure,
} from "@/lib/research/extractive";
import type { Source } from "@/lib/types";

describe("extractive brief", () => {
  it("detects billing failures", () => {
    assert.equal(
      isLlmBillingFailure(
        "OpenAI request failed (429): You have no credits remaining.",
      ),
      true,
    );
    assert.equal(
      isLlmBillingFailure("Anthropic request failed (400): Your credit balance is too low"),
      true,
    );
    assert.equal(isLlmBillingFailure("OpenAI request failed (500): boom"), false);
  });

  it("builds an honest extractive brief from live snippets", () => {
    const sources: Source[] = [
      {
        id: "1",
        title: "RAG overview",
        url: "https://example.com/rag",
        domain: "example.com",
        snippet: "Retrieval-augmented generation grounds answers in documents.",
        relevance: 0.9,
        credibility: "high",
      },
    ];
    const text = buildExtractiveBrief("What is RAG?", sources, "quick", [
      "openai: no credits remaining",
    ]);
    assert.match(text, /Extractive brief/);
    assert.match(text, /RAG overview/);
    assert.match(text, /no credits remaining/);
    assert.doesNotMatch(text, /demo synthesis/i);
  });

  it("strips billing portal URLs so evidence checks stay clean", () => {
    const sources: Source[] = [
      {
        id: "1",
        title: "Policy note",
        url: "https://docs.example.com/policy",
        domain: "docs.example.com",
        snippet: "Organizations should monitor retrieval quality.",
        relevance: 0.8,
        credibility: "medium",
      },
    ];
    const text = buildExtractiveBrief("retrieval quality", sources, "quick", [
      "openai: OpenAI request failed (429): Add credits at https://platform.openai.com/settings/organization/billing/",
    ]);
    assert.doesNotMatch(text, /https:\/\/platform\.openai\.com/);
    assert.match(text, /\[billing portal\]/);
  });
});
