import type { ResearchMode } from "@/lib/types";

export type ProblemLevel = "foundational" | "operational" | "strategic";

export interface Solution {
  id: string;
  level: ProblemLevel;
  title: string;
  problem: string;
  outcome: string;
  query: string;
  mode: ResearchMode;
}

export const SOLUTIONS: Solution[] = [
  {
    id: "explain",
    level: "foundational",
    title: "Explain anything clearly",
    problem: "A dense topic you need in plain language, with sources.",
    outcome: "A cited briefing you can share with a non-expert.",
    query: "Explain retrieval-augmented generation as if briefing a product manager, with current caveats.",
    mode: "quick",
  },
  {
    id: "fact-check",
    level: "foundational",
    title: "Fact-check a claim",
    problem: "A viral statement or board slide that may be outdated.",
    outcome: "Support, contradict, or qualify the claim with citations.",
    query: "Fact-check: open-source LLMs now match GPT-4 on most enterprise summarization tasks. What does current evidence say?",
    mode: "quick",
  },
  {
    id: "compare",
    level: "operational",
    title: "Compare vendors or architectures",
    problem: "Two options, too many blogs, no scored evidence.",
    outcome: "A side-by-side with trade-offs and source quality.",
    query: "Compare Tavily vs Serper vs Exa as search backends for an AI research agent. Include latency, coverage, and citation quality.",
    mode: "deep",
  },
  {
    id: "policy",
    level: "operational",
    title: "Policy & compliance scan",
    problem: "A regulation changed and your team needs the delta.",
    outcome: "What changed, who is in scope, what to do next.",
    query: "What changed in EU AI Act obligations for general-purpose model providers through 2026? Summarize duties and timelines.",
    mode: "deep",
  },
  {
    id: "market",
    level: "strategic",
    title: "Market & competitive thesis",
    problem: "Leadership needs a cited landscape, not a vibe.",
    outcome: "Actors, momentum, risks, and open questions.",
    query: "Map the 2026 competitive landscape for AI-powered web research and answer engines. Who is shipping, who is stalled, and what differentiates them?",
    mode: "deep",
  },
  {
    id: "diligence",
    level: "strategic",
    title: "High-stakes diligence brief",
    problem: "A decision that cannot rest on a single model’s memory.",
    outcome: "Multi-source brief with credibility scoring and follow-ups.",
    query: "Produce an investment-style diligence brief on commercial solid-state battery timelines: pilots vs mass production, remaining bottlenecks, and which claims are overstated.",
    mode: "deep",
  },
];

export const LEVEL_META: Record<
  ProblemLevel,
  { label: string; blurb: string }
> = {
  foundational: {
    label: "Foundational",
    blurb: "Everyday questions — explain, check, orient.",
  },
  operational: {
    label: "Operational",
    blurb: "Team work — compare, scan policy, brief stakeholders.",
  },
  strategic: {
    label: "Strategic",
    blurb: "Consequential work — markets, diligence, long-horizon research.",
  },
};

export const MODEL_CARDS = [
  {
    id: "openai",
    name: "OpenAI",
    models: "GPT-4o mini / GPT-4o",
    use: "Fast streaming synthesis with strong instruction following.",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: "Claude 3.5 Haiku / Sonnet",
    use: "Careful long-form briefs and conservative citations.",
  },
  {
    id: "mock",
    name: "QUORAI Demo",
    models: "On-device mock synthesis",
    use: "Full product tour with no keys — same pipeline, sample evidence.",
  },
] as const;

export const METRICS = [
  { value: "12+", label: "sources per Deep Research pass" },
  { value: "4", label: "live pipeline stages you can watch" },
  { value: "3", label: "pluggable LLM families" },
  { value: "0", label: "keys required to demo" },
] as const;
