import { nanoid } from "nanoid";
import type { Source } from "@/lib/types";
import { extractDomain, faviconUrl, scoreToCredibility } from "@/lib/utils";

const MOCK_POOL: Array<Omit<Source, "id" | "favicon" | "credibility" | "domain">> = [
  {
    title: "Attention Is All You Need: foundational overview",
    url: "https://arxiv.org/abs/1706.03762",
    snippet:
      "The Transformer architecture relies entirely on attention mechanisms, enabling parallelization and strong performance on sequence transduction tasks.",
    relevance: 0.94,
    publishedAt: "2017-06-12",
  },
  {
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP",
    url: "https://arxiv.org/abs/2005.11401",
    snippet:
      "RAG combines parametric memory with a non-parametric dense vector index of Wikipedia, improving factuality on open-domain questions.",
    relevance: 0.91,
    publishedAt: "2020-05-22",
  },
  {
    title: "Production patterns for streaming LLM interfaces",
    url: "https://vercel.com/blog/ai-sdk",
    snippet:
      "Streaming tokens reduces perceived latency. Prefer server-sent events, backpressure-aware clients, and graceful cancellation for research UIs.",
    relevance: 0.86,
    publishedAt: "2024-11-03",
  },
  {
    title: "EU Artificial Intelligence Act: compliance timeline",
    url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    snippet:
      "Risk-based obligations phase in across high-risk systems, transparency duties, and general-purpose AI model requirements.",
    relevance: 0.88,
    publishedAt: "2025-08-01",
  },
  {
    title: "Solid-state battery commercialization roadmap",
    url: "https://www.nature.com/articles/s41560-024-example",
    snippet:
      "Pilot lines are expanding, but interfacial resistance and manufacturing yield remain the primary bottlenecks for mass-market EV adoption.",
    relevance: 0.82,
    publishedAt: "2025-03-18",
  },
  {
    title: "Vector database selection guide for semantic search",
    url: "https://www.pinecone.io/learn/vector-database/",
    snippet:
      "Trade-offs include recall vs latency, hybrid sparse-dense retrieval, filtering, and operational cost at scale.",
    relevance: 0.84,
    publishedAt: "2024-09-12",
  },
  {
    title: "Evaluating source credibility for AI research agents",
    url: "https://www.nist.gov/artificial-intelligence",
    snippet:
      "Credibility heuristics include publisher reputation, citation density, recency, and methodological transparency.",
    relevance: 0.79,
    publishedAt: "2025-01-09",
  },
  {
    title: "Multi-hop web research agent design notes",
    url: "https://blog.langchain.dev/reflection-agents",
    snippet:
      "Deep research loops benefit from query decomposition, evidence scoring, and iterative synthesis with explicit citations.",
    relevance: 0.87,
    publishedAt: "2025-06-21",
  },
  {
    title: "Next.js App Router patterns for AI products",
    url: "https://nextjs.org/docs/app/building-your-application/routing/route-handlers",
    snippet:
      "Route handlers can stream responses, validate inputs, and keep provider secrets on the server while the UI remains interactive.",
    relevance: 0.8,
    publishedAt: "2025-10-02",
  },
  {
    title: "How web search APIs differ for agent workloads",
    url: "https://docs.tavily.com/",
    snippet:
      "Agent-oriented search APIs emphasize clean snippets, relevance ranking, and content extraction suitable for LLM context windows.",
    relevance: 0.83,
    publishedAt: "2025-04-14",
  },
  {
    title: "Practical guide to citation UX in answer engines",
    url: "https://www.nngroup.com/articles/citations/",
    snippet:
      "Users trust answers more when citations are scannable, expandable, and mapped to specific claims rather than dumped as footnotes.",
    relevance: 0.77,
    publishedAt: "2024-02-28",
  },
  {
    title: "Hybrid search: dense vectors meet keyword filters",
    url: "https://www.elastic.co/search-labs/blog/hybrid-search",
    snippet:
      "Combining BM25 with dense retrieval often improves precision for technical queries that mix entities and conceptual language.",
    relevance: 0.81,
    publishedAt: "2024-07-19",
  },
];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getMockSources(query: string, count: number): Source[] {
  const seed = hashSeed(query.toLowerCase());
  const rotated = [...MOCK_POOL];
  const start = seed % rotated.length;
  const ordered = [...rotated.slice(start), ...rotated.slice(0, start)];

  return ordered.slice(0, count).map((item, index) => {
    const domain = extractDomain(item.url);
    const relevance = Math.min(0.98, item.relevance - index * 0.02 + (seed % 7) * 0.002);
    return {
      id: nanoid(8),
      title: item.title,
      url: item.url,
      domain,
      snippet: item.snippet,
      relevance: Number(relevance.toFixed(2)),
      credibility: scoreToCredibility(relevance),
      publishedAt: item.publishedAt,
      favicon: faviconUrl(domain),
    };
  });
}

export function buildMockAnswer(
  query: string,
  sources: Source[],
  mode: "quick" | "deep",
): string {
  const lead =
    mode === "deep"
      ? `## Research brief\n\n**Query:** ${query}\n\nI cross-checked ${sources.length} sources and synthesized the strongest consensus below.`
      : `## Answer\n\n**Query:** ${query}\n\nHere’s a concise synthesis from the top web sources.`;

  const bullets = sources
    .slice(0, mode === "deep" ? 5 : 3)
    .map(
      (source, i) =>
        `${i + 1}. **${source.title}** (${source.domain}): ${source.snippet}`,
    )
    .join("\n");

  const deepExtra =
    mode === "deep"
      ? `\n\n### Trade-offs & open questions\n- Evidence quality varies; prioritize primary literature and official docs.\n- Recency matters for regulatory and product claims.\n- Where sources disagree, treat conclusions as provisional and verify upstream.\n\n### Suggested next steps\n- Narrow the question to a specific constraint (cost, latency, jurisdiction).\n- Ask a follow-up to compare two approaches side-by-side.`
      : `\n\n### Quick takeaway\nFocus on the highest-relevance citations first, then refine with a follow-up if you need depth.`;

  return `${lead}\n\n### Key findings\n${bullets}${deepExtra}\n\n*Citations are listed in the Sources panel. This ${mode === "deep" ? "deep research" : "quick search"} run used demo synthesis because live LLM keys are optional.*`;
}

export function buildMockFollowUps(query: string): string[] {
  const short = query.length > 48 ? `${query.slice(0, 48)}…` : query;
  return [
    `What are the main risks or caveats around “${short}”?`,
    `Compare two leading approaches related to this topic`,
    `Give a practical implementation checklist`,
  ];
}
