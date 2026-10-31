import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeCitations } from "@/lib/citations";
import type { Source } from "@/lib/types";

const sources: Source[] = [
  {
    id: "1",
    title: "Solar capacity report",
    url: "https://example.com/solar",
    domain: "example.com",
    snippet: "Global solar capacity reached 2200 GW in 2025 growing 29 percent.",
    relevance: 0.9,
    credibility: "high",
    kind: "document",
    page: 1,
    documentName: "solar.pdf",
  },
  {
    id: "2",
    title: "Battery storage outlook",
    url: "https://news.example.com/storage",
    domain: "news.example.com",
    snippet: "Battery storage installations doubled in 2025 led by China.",
    relevance: 0.8,
    credibility: "medium",
  },
];

describe("citation analysis", () => {
  it("scores cited claims and document references", () => {
    const analysis = analyzeCitations(
      "Global solar capacity reached 2200 GW in 2025 [1]. Battery storage installations doubled in 2025 [2].",
      sources,
    );
    assert.equal(analysis.citedClaims, 2);
    assert.ok(analysis.confidence > 0);
    assert.ok(analysis.documentCitations >= 1);
    assert.ok(analysis.bySource[0]?.probability > 0);
  });

  it("marks unresolved citation numbers", () => {
    const analysis = analyzeCitations("This invents a source [9].", sources);
    assert.ok(analysis.unresolved >= 1);
  });
});
