import { nanoid } from "nanoid";
import { analyzeCsv, isCsvFile } from "@/lib/csv";
import type { Source } from "@/lib/types";
import { faviconUrl, scoreToCredibility } from "@/lib/utils";

function cleanQuery(query: string): string {
  return query
    .replace(/^analyze\s+["“]?(.*?)["”]?(?:\s+and\s+verify.*)?$/i, "$1")
    .replace(/^what\s+(?:is|are)\s+/i, "")
    .replace(/^how\s+(?:to|does)\s+/i, "")
    .trim();
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        ![
          "the",
          "and",
          "for",
          "with",
          "about",
          "from",
          "that",
          "this",
          "what",
          "how",
          "why",
          "when",
          "where",
          "your",
          "user",
          "query",
          "analyze",
          "verify",
          "claims",
          "against",
          "current",
          "sources",
          "attached",
          "files",
        ].includes(w),
    );
  return Array.from(new Set(words));
}

type TopicCategory = "business" | "tech" | "science" | "policy" | "general";

function detectTopic(query: string, text = ""): TopicCategory {
  const combined = `${query} ${text}`.toLowerCase();
  if (
    /(sales|revenue|profit|margin|customer|mrr|arr|cost|churn|price|market|ebitda|quarter|q[1-4]|roi|financial|conversion|growth)/i.test(
      combined,
    )
  ) {
    return "business";
  }
  if (
    /(ai|llm|software|code|database|api|model|neural|cloud|security|latency|gpu|token|stack|deploy|docker|react|next\.js|python)/i.test(
      combined,
    )
  ) {
    return "tech";
  }
  if (
    /(clinical|patient|drug|dna|protein|gene|health|medical|disease|trial|biology|chemistry|vaccine|therapy)/i.test(
      combined,
    )
  ) {
    return "science";
  }
  if (
    /(act|regulation|compliance|law|legal|eu|sec|ftc|policy|tariff|government|treaty|court)/i.test(
      combined,
    )
  ) {
    return "policy";
  }
  return "general";
}

interface DomainPreset {
  domain: string;
  urlBase: string;
  sourceName: string;
}

const DOMAIN_PRESETS: Record<TopicCategory, DomainPreset[]> = {
  business: [
    { domain: "bloomberg.com", urlBase: "https://www.bloomberg.com/news/articles", sourceName: "Bloomberg Market Intelligence" },
    { domain: "wsj.com", urlBase: "https://www.wsj.com/articles", sourceName: "Wall Street Journal Analysis" },
    { domain: "statista.com", urlBase: "https://www.statista.com/statistics", sourceName: "Statista Industry Benchmarks" },
    { domain: "mckinsey.com", urlBase: "https://www.mckinsey.com/capabilities", sourceName: "McKinsey Insights" },
    { domain: "gartner.com", urlBase: "https://www.gartner.com/en/research", sourceName: "Gartner Research" },
    { domain: "hbr.org", urlBase: "https://hbr.org/research", sourceName: "Harvard Business Review" },
    { domain: "reuters.com", urlBase: "https://www.reuters.com/business", sourceName: "Reuters Business" },
    { domain: "ft.com", urlBase: "https://www.ft.com/content", sourceName: "Financial Times Analytics" },
  ],
  tech: [
    { domain: "arxiv.org", urlBase: "https://arxiv.org/abs", sourceName: "arXiv Preprints" },
    { domain: "techcrunch.com", urlBase: "https://techcrunch.com/insights", sourceName: "TechCrunch Enterprise" },
    { domain: "nature.com", urlBase: "https://www.nature.com/articles", sourceName: "Nature Technology" },
    { domain: "github.com", urlBase: "https://github.com/topics", sourceName: "Open Source Ecosystem Review" },
    { domain: "spectrum.ieee.org", urlBase: "https://spectrum.ieee.org", sourceName: "IEEE Spectrum" },
    { domain: "acm.org", urlBase: "https://dl.acm.org/doi", sourceName: "ACM Digital Library" },
    { domain: "vercel.com", urlBase: "https://vercel.com/blog", sourceName: "Modern Engineering Practices" },
    { domain: "ycombinator.com", urlBase: "https://news.ycombinator.com", sourceName: "Practitioner Perspectives" },
  ],
  science: [
    { domain: "nih.gov", urlBase: "https://www.ncbi.nlm.nih.gov/pmc/articles", sourceName: "NIH / PubMed Central" },
    { domain: "nature.com", urlBase: "https://www.nature.com/articles", sourceName: "Nature Research" },
    { domain: "who.int", urlBase: "https://www.who.int/news-room", sourceName: "World Health Organization" },
    { domain: "thelancet.com", urlBase: "https://www.thelancet.com/journals", sourceName: "The Lancet" },
    { domain: "science.org", urlBase: "https://www.science.org/doi", sourceName: "Science Magazine" },
    { domain: "cdc.gov", urlBase: "https://www.cdc.gov/reports", sourceName: "Centers for Disease Control" },
  ],
  policy: [
    { domain: "europa.eu", urlBase: "https://digital-strategy.ec.europa.eu/policies", sourceName: "European Commission Regulatory Monitor" },
    { domain: "reuters.com", urlBase: "https://www.reuters.com/legal", sourceName: "Reuters Legal & Governance" },
    { domain: "ft.com", urlBase: "https://www.ft.com/global-policy", sourceName: "Financial Times Policy" },
    { domain: "brookings.edu", urlBase: "https://www.brookings.edu/research", sourceName: "Brookings Institution" },
    { domain: "nist.gov", urlBase: "https://www.nist.gov/publications", sourceName: "NIST Standards & Frameworks" },
  ],
  general: [
    { domain: "reuters.com", urlBase: "https://www.reuters.com/investigates", sourceName: "Reuters In-Depth" },
    { domain: "economist.com", urlBase: "https://www.economist.com/special-report", sourceName: "The Economist" },
    { domain: "apnews.com", urlBase: "https://apnews.com/hub", sourceName: "Associated Press Investigations" },
    { domain: "bbc.com", urlBase: "https://www.bbc.com/news/world", sourceName: "BBC Global Monitor" },
    { domain: "nature.com", urlBase: "https://www.nature.com/news", sourceName: "Nature Consensus" },
    { domain: "wsj.com", urlBase: "https://www.wsj.com/world", sourceName: "WSJ International" },
  ],
};

function formatTitleCase(str: string): string {
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Dynamically builds query- and data-aware sources so evidence is never a static generic list.
 */
export function getMockSources(query: string, count: number): Source[] {
  const cleaned = cleanQuery(query);
  const keywords = extractKeywords(cleaned);
  const topic = detectTopic(cleaned);
  const presets = DOMAIN_PRESETS[topic] || DOMAIN_PRESETS.general;

  const topicName = keywords.slice(0, 3).map(formatTitleCase).join(" ") || formatTitleCase(cleaned.slice(0, 30)) || "Current Topic";

  const sources: Source[] = [];
  const now = new Date();

  for (let i = 0; i < count; i += 1) {
    const preset = presets[i % presets.length];
    const pubMonth = new Date(now.getTime() - i * 86400000 * 14).toISOString().split("T")[0];
    const relevance = Math.max(0.72, Number((0.96 - i * 0.03).toFixed(2)));

    let title = "";
    let snippet = "";

    switch (topic) {
      case "business":
        title =
          i === 0
            ? `${topicName}: Comprehensive Industry Performance & Benchmarks`
            : i === 1
            ? `Empirical Market Trends and Historical Revenue Metrics in ${topicName}`
            : i === 2
            ? `Comparative Margin Analysis & Operational Efficiency for ${topicName}`
            : i === 3
            ? `Macro Volatility and Key Growth Indicators: ${topicName} Overview`
            : `Forecast Models and Strategic Risk Outlook for ${topicName}`;
        snippet = `Empirical benchmarking data confirming key distribution metrics, cost factors, and sequential indicators across ${topicName}. Cross-referenced with audited enterprise records and sector percentiles.`;
        break;

      case "tech":
        title =
          i === 0
            ? `${topicName}: Architectural Patterns, Performance Benchmarks & Trade-offs`
            : i === 1
            ? `Production Implementations and Scalability Constraints in ${topicName}`
            : i === 2
            ? `State of the Art Evaluation: Latency, Cost, and Memory Trade-offs in ${topicName}`
            : i === 3
            ? `Comparative Analysis of Production Implementations for ${topicName}`
            : `Reliability Guarantees, Edge Cases, and Migration Strategies in ${topicName}`;
        snippet = `Technical evaluation and stress-test benchmarks analyzing performance trade-offs, resource consumption, and best practices for ${topicName}.`;
        break;

      case "science":
        title =
          i === 0
            ? `Peer-Reviewed Evidence and Meta-Analysis on ${topicName}`
            : i === 1
            ? `Clinical Endpoints, Efficacy, and Statistical Validation in ${topicName}`
            : i === 2
            ? `Mechanistic Insights and Multi-Cohort Observations: ${topicName}`
            : i === 3
            ? `Standardized Protocols and Methodological Safeguards in ${topicName}`
            : `Longitudinal Cohort Data and Population-Level Findings for ${topicName}`;
        snippet = `Rigorous empirical study cross-verifying primary laboratory measurements, sample sizes, confidence intervals, and controlled observational trials for ${topicName}.`;
        break;

      case "policy":
        title =
          i === 0
            ? `${topicName}: Regulatory Mandates, Compliance Timelines & Frameworks`
            : i === 1
            ? `Legal Precedents, Enforcement Guidance, and Risk Assessments for ${topicName}`
            : i === 2
            ? `Cross-Jurisdictional Comparison of Statutory Requirements: ${topicName}`
            : i === 3
            ? `Institutional Governance Standards and Audit Criteria for ${topicName}`
            : `Impact Assessment and Implementation Roadmap Concerning ${topicName}`;
        snippet = `Authoritative analysis detailing binding statutory provisions, liability structures, compliance thresholds, and oversight guidelines applicable to ${topicName}.`;
        break;

      default:
        title =
          i === 0
            ? `${topicName}: Primary Evidence & Current Consensus Overview`
            : i === 1
            ? `Fact-Checking Investigation and Contextual Background on ${topicName}`
            : i === 2
            ? `Comprehensive Assessment and Verified Chronology of ${topicName}`
            : i === 3
            ? `Global Perspectives and Empirical Grounding: ${topicName}`
            : `In-Depth Comparative Analysis and Outlook on ${topicName}`;
        snippet = `Consensus reporting and verified documentation synthesizing primary records, verified chronological milestones, and independent expert evaluations regarding ${topicName}.`;
        break;
    }

    const domain = preset.domain;
    sources.push({
      id: nanoid(8),
      title,
      url: `${preset.urlBase}/${encodeURIComponent(topicName.toLowerCase().replace(/\s+/g, "-"))}-${i + 1}`,
      domain,
      snippet,
      relevance,
      credibility: scoreToCredibility(relevance),
      publishedAt: pubMonth,
      favicon: faviconUrl(domain),
    });
  }

  return sources;
}

/**
 * Builds rich, tailored synthesis that respects uploaded CSV datasets and user query specifics.
 */
export function buildMockAnswer(
  query: string,
  sources: Source[],
  mode: "quick" | "deep",
  attachments?: Array<{ name: string; mime?: string; text: string }>,
): string {
  // 1. Check if any attachment is a CSV
  const csvAttachment = attachments?.find((att) => isCsvFile(att.name, att.mime));
  if (csvAttachment) {
    const analysis = analyzeCsv(csvAttachment.name, csvAttachment.text);
    return buildCsvSynthesis(query, analysis, sources, mode);
  }

  // 2. Check if any source is an uploaded document / PDF (from buildDocumentEvidence)
  const docSources = sources.filter((s) => s.kind === "document");
  if (docSources.length > 0) {
    return buildDocumentSynthesis(query, docSources, sources, mode);
  }

  // 3. Non-CSV attachment fallback
  if (attachments && attachments.length > 0) {
    const first = attachments[0];
    return buildGenericAttachmentSynthesis(query, first, sources, mode);
  }

  // 4. General query synthesis
  return buildQuerySynthesis(query, sources, mode);
}

function buildCsvSynthesis(
  query: string,
  analysis: import("@/lib/csv").CsvAnalysis,
  sources: Source[],
  mode: "quick" | "deep",
): string {
  const { filename, rowCount, colCount, columns, keyInsights, markdownOverview } = analysis;

  const lead =
    mode === "deep"
      ? `## Deep Research Brief: Empirical Data Synthesis\n\n**Query:** ${query}\n\n**Primary Dataset:** \`${filename}\` (${rowCount.toLocaleString()} records, ${colCount} attributes) cross-verified against ${sources.length} corroborating research sources.`
      : `## Data Synthesis & Verification\n\n**Query:** ${query}\n\n**Target Dataset:** \`${filename}\` (${rowCount.toLocaleString()} rows). Synthesized primary figures with live benchmark citations below.`;

  const datasetBullets = keyInsights
    .map((insight) => `- ${insight} [1]`)
    .join("\n");

  const externalSources = sources.filter(
    (s) => !s.domain.includes("dataset") && !s.domain.includes("uploaded"),
  );

  const benchmarkBullets = externalSources
    .slice(0, mode === "deep" ? 4 : 2)
    .map(
      (source, i) =>
        `- **${source.title}** (${source.domain}): ${source.snippet} [${i + 2}]`,
    )
    .join("\n");

  const numericCols = columns.filter((c) => c.type === "number" && c.sum !== undefined);
  const categoricalCols = columns.filter((c) => c.type === "string" && c.topValues.length > 0);

  let dataInterpretation = "";
  if (numericCols.length > 0) {
    const primaryNum = numericCols[0];
    dataInterpretation = `\n### Primary Metric Analysis ([1])\n- **Aggregate Volume**: Total recorded ${primaryNum.name} stands at **${(primaryNum.sum ?? 0).toLocaleString()}** across all rows.\n- **Central Tendency & Dispersion**: The mean per record is **${(primaryNum.avg ?? 0).toFixed(2)}**, with a range spanning from **${primaryNum.min}** to **${primaryNum.max}**.\n- **Statistical Distribution**: Distribution patterns indicate distinct operational tiers; records near the upper boundary represent high-leverage concentration.`;
  }

  let segmentationSection = "";
  if (categoricalCols.length > 0) {
    const cat = categoricalCols[0];
    segmentationSection = `\n### Category Breakdown ([1])\n- Primary segment **${cat.name}** contains **${cat.distinctCount}** unique categories.\n` +
      cat.topValues.map((tv) => `  - **${tv.value}**: ${tv.count.toLocaleString()} occurrences (${((tv.count / rowCount) * 100).toFixed(1)}% of total volume)`).join("\n");
  }

  const deepExtra =
    mode === "deep"
      ? `\n\n### Cross-Verification & Benchmark Comparison\n${benchmarkBullets}\n\n### Anomalies, Outliers & Data Hygiene\n- **Missing / Null Check**: Verified attribute completeness across ${colCount} columns.\n- **Variance Assessment**: Metric bounds should be monitored against empirical baseline standards [2].\n- **Sample Integrity**: High confidence in primary record schema without syntax corruption.\n\n### Strategic Takeaways & Recommended Actions\n1. **Focus on Core Drivers**: Allocate resources toward the top-volume segments identified in \`${filename}\`.\n2. **Benchmark Alignment**: Calibrate internal conversion and growth metrics against external sector percentiles [2, 3].\n3. **Follow-Up Inquiries**: Run segmented queries or correlation tests across numeric indicators to isolate underlying factors.`
      : `\n\n### Industry Benchmark Context\n${benchmarkBullets}\n\n### Key Takeaways\n- Primary findings from \`${filename}\` are verified against external industry standards.\n- Examine top categorical drivers and monitor dispersion bounds for operational planning.`;

  return `${lead}\n\n${markdownOverview}\n\n### Key Findings from Dataset\n${datasetBullets}${dataInterpretation}${segmentationSection}${deepExtra}\n\n*Primary empirical data extracted from \`${filename}\` [1]. External citations [2+] reflect live comparative research.*`;
}

function buildDocumentSynthesis(
  query: string,
  docSources: Source[],
  allSources: Source[],
  mode: "quick" | "deep",
): string {
  const primaryDocName = docSources[0].documentName || "Uploaded Document";
  const lead =
    mode === "deep"
      ? `## Research brief\n\n**Query:** ${query}\n\nI cross-checked key claims extracted from \`${primaryDocName}\` against ranked authoritative web citations.`
      : `## Answer\n\n**Query:** ${query}\n\nKey claims extracted from \`${primaryDocName}\` synthesized and verified against current authoritative web sources.`;

  const webSources = allSources.filter((s) => s.kind !== "document");

  // Document key findings with page numbers
  const docBullets = docSources.slice(0, mode === "deep" ? 5 : 3).map((doc, idx) => {
    return `${idx + 1}. **From ${doc.documentName}${doc.page ? `, page ${doc.page}` : ""}:** ${doc.snippet.slice(0, 320)} [${idx + 1}]`;
  });

  // Web corroboration findings
  const webBullets = webSources.slice(0, mode === "deep" ? 3 : 2).map((web, idx) => {
    const citationIndex = docSources.length + idx + 1;
    return `${docBullets.length + idx + 1}. **${web.title}** (${web.domain}): ${web.snippet.slice(0, 260)} [${citationIndex}]`;
  });

  const bullets = [...docBullets, ...webBullets].join("\n\n");

  const deepExtra =
    mode === "deep"
      ? `\n\n### Document Claim Verification & Legal Context\n- **Primary Evidence**: Claims grounded directly in the text and specific page passages of \`${primaryDocName}\` [1-${docSources.length}].\n- **External Verification**: Corroborating sources confirm relevant statutory provisions, regulatory timelines, and precedent context [${docSources.length + 1}+].\n- **Methodological Note**: Citations map directly to page numbers in your browser's PDF viewer.\n\n### Strategic Takeaway\nReview the cited page passages in the Evidence panel. Cross-referenced web authorities support the factual and procedural claims identified in \`${primaryDocName}\`.`
      : `\n\n### Quick takeaway\nClaims from \`${primaryDocName}\` are cited directly with page references [1-${docSources.length}] and cross-verified against high-relevance web sources.`;

  return `${lead}\n\n### Key findings\n${bullets}${deepExtra}\n\n*Citations are listed in the Sources panel. Click any document citation chip to view the exact page in the document viewer.*`;
}

function buildGenericAttachmentSynthesis(
  query: string,
  attachment: { name: string; text: string },
  sources: Source[],
  mode: "quick" | "deep",
): string {
  const lead = `## Research Synthesis & Document Verification\n\n**Query:** ${query}\n**Primary Document:** \`${attachment.name}\` (${attachment.text.length} characters analyzed).`;
  const bullets = sources
    .slice(0, mode === "deep" ? 4 : 2)
    .map((s, i) => `${i + 1}. **${s.title}** (${s.domain}): ${s.snippet} [${i + 1}]`)
    .join("\n");

  return `${lead}\n\n### Document Assessment\n- Extracted text from primary document \`${attachment.name}\` [1].\n- Cross-referenced core assertions against ranked authoritative citations.\n\n### Corroborating Evidence\n${bullets}\n\n### Takeaways\nVerified document claims against current empirical sources. Proceed with primary document recommendations while monitoring external consensus.`;
}

function buildQuerySynthesis(
  query: string,
  sources: Source[],
  mode: "quick" | "deep",
): string {
  const cleaned = cleanQuery(query);
  const title = formatTitleCase(cleaned);

  const lead =
    mode === "deep"
      ? `## Deep Research Brief\n\n**Topic:** ${title}\n\nSynthesized findings across ${sources.length} ranked authoritative sources with consensus analysis and trade-offs.`
      : `## Synthesis\n\n**Topic:** ${title}\n\nConcise consensus derived from top-ranked independent citations.`;

  const bullets = sources
    .slice(0, mode === "deep" ? 5 : 3)
    .map(
      (source, i) =>
        `${i + 1}. **${source.title}** (${source.domain}) [${i + 1}]: ${source.snippet}`,
    )
    .join("\n\n");

  const deepExtra =
    mode === "deep"
      ? `\n\n### Core Consensus & Analytical Trade-offs\n- **Consensus**: High agreement across primary authorities [1, 2] on foundational mechanics and core drivers.\n- **Points of Divergence**: Emerging literature indicates nuance regarding execution costs, regulatory timelines, and regional adoption [3, 4].\n- **Verification Standard**: Claims are corroborated by peer-reviewed literature and accredited reporting.\n\n### Strategic Takeaways & Next Steps\n- Prioritize the highest-credibility primary benchmarks before committing to architecture or budget decisions.\n- Formulate targeted constraints (budget, jurisdiction, scale) to narrow remaining open questions.`
      : `\n\n### Key Takeaways\nConsensus confirms key operational parameters [1, 2]. Review citations in the Evidence panel for source-level methodological detail.`;

  return `${lead}\n\n### Synthesized Evidence\n${bullets}${deepExtra}\n\n*All assertions are grounded in the Evidence panel citations listed alongside this brief.*`;
}

export function buildMockFollowUps(
  query: string,
  attachments?: Array<{ name: string; mime?: string; text: string }>,
): string[] {
  const csv = attachments?.find((att) => isCsvFile(att.name, att.mime));
  if (csv) {
    const analysis = analyzeCsv(csv.name, csv.text);
    const numCol = analysis.columns.find((c) => c.type === "number")?.name;
    const catCol = analysis.columns.find((c) => c.type === "string")?.name;

    const followUps: string[] = [];
    if (numCol && catCol) {
      followUps.push(`Break down ${numCol} segmented by ${catCol}`);
    } else {
      followUps.push(`Identify the top 3 statistical outliers in ${csv.name}`);
    }
    followUps.push(`What industry benchmark percentiles apply to these numbers?`);
    followUps.push(`Analyze correlation and potential data anomalies in this dataset`);
    return followUps.slice(0, 3);
  }

  const cleaned = cleanQuery(query);
  const short = cleaned.length > 40 ? `${cleaned.slice(0, 40)}…` : cleaned;
  return [
    `What are the principal risks or caveats concerning “${short}”?`,
    `Compare leading industry benchmarks for ${short}`,
    `Provide a step-by-step implementation checklist for ${short}`,
  ];
}
