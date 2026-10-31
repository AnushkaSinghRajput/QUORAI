export type PolicyAction = "allow" | "deny" | "instruct" | "sanitize";

export interface PolicyDecision {
  policy: string;
  action: PolicyAction;
  reason: string;
}

export class PolicyDenied extends Error {
  readonly policy: string;
  readonly action = "deny" as const;

  constructor(policy: string, message: string) {
    super(message);
    this.name = "PolicyDenied";
    this.policy = policy;
  }
}

const ALLOWED_TOOLS = new Set(["web_search", "llm_complete", "llm_followups"]);
const MAX_TOOL_CALLS = 6;
const MAX_QUERY_CHARS = 2_000;

const SECRET =
  /(?:\bsk-[A-Za-z0-9]{16,}\b|\bsk-ant-[A-Za-z0-9_-]{16,}\b|Bearer\s+[A-Za-z0-9._~+/-]{12,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|AKIA[0-9A-Z]{16})/g;

const STOP = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "because",
  "been",
  "from",
  "have",
  "into",
  "that",
  "the",
  "their",
  "there",
  "these",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "your",
]);

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function toolSignature(toolName: string, query: string): string {
  return `${toolName}:${normalizeText(query)}`;
}

export function redactSecrets(value: string): { text: string; redacted: boolean } {
  let redacted = false;
  const text = value.replace(SECRET, () => {
    redacted = true;
    return "[redacted]";
  });
  return { text, redacted };
}

export function inspectToolCall(input: {
  toolName: string;
  query: string;
  provider: string;
  priorSignatures: readonly string[];
  callsSoFar: number;
}): { decision: PolicyDecision; query: string; signature: string } {
  if (!ALLOWED_TOOLS.has(input.toolName)) {
    return {
      decision: {
        policy: "tool-safeguard",
        action: "deny",
        reason: `Tool ${input.toolName} is not on the research allowlist.`,
      },
      query: input.query,
      signature: toolSignature(input.toolName, input.query),
    };
  }

  if (input.callsSoFar >= MAX_TOOL_CALLS) {
    return {
      decision: {
        policy: "tool-safeguard",
        action: "deny",
        reason: `Stopped after ${MAX_TOOL_CALLS} tool calls in one research run.`,
      },
      query: input.query,
      signature: toolSignature(input.toolName, input.query),
    };
  }

  const secrets = redactSecrets(input.query);
  const query = secrets.text.trim();
  if (secrets.redacted && query.replace("[redacted]", "").trim().length < 2) {
    return {
      decision: {
        policy: "tool-safeguard",
        action: "deny",
        reason: "The tool input was only a credential, so the call was blocked.",
      },
      query,
      signature: toolSignature(input.toolName, query),
    };
  }

  const maxChars = input.toolName === "web_search" ? MAX_QUERY_CHARS : 80_000;
  if (query.length > maxChars) {
    return {
      decision: {
        policy: "tool-safeguard",
        action: "deny",
        reason: `Tool input exceeds ${maxChars} characters.`,
      },
      query,
      signature: toolSignature(input.toolName, query),
    };
  }

  const signature = toolSignature(input.toolName, `${input.provider}:${query}`);
  const repeats = input.priorSignatures.filter((item) => item === signature).length;
  if (repeats >= 2) {
    return {
      decision: {
        policy: "loop-detection",
        action: "deny",
        reason: "The same tool input already ran twice in this research run.",
      },
      query,
      signature,
    };
  }

  if (secrets.redacted) {
    return {
      decision: {
        policy: "tool-safeguard",
        action: "sanitize",
        reason: "Removed credential-shaped text from the tool input before it ran.",
      },
      query,
      signature,
    };
  }

  if (repeats === 1) {
    return {
      decision: {
        policy: "loop-detection",
        action: "instruct",
        reason: "This tool input repeats an earlier call in the same run. One recovery is allowed.",
      },
      query,
      signature,
    };
  }

  return {
    decision: {
      policy: "tool-safeguard",
      action: "allow",
      reason: "Tool, length, secrets, and repeat count are within policy.",
    },
    query,
    signature,
  };
}

export function inspectQuestionLoop(
  query: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>,
): PolicyDecision {
  const norm = normalizeText(query);
  const prior = (history ?? []).filter(
    (item) => item.role === "user" && normalizeText(item.content) === norm,
  ).length;
  if (prior >= 2) {
    return {
      policy: "loop-detection",
      action: "instruct",
      reason: `This question already appears ${prior} times in the thread.`,
    };
  }
  if (prior === 1) {
    return {
      policy: "loop-detection",
      action: "instruct",
      reason: "This question repeats an earlier user turn in the same session.",
    };
  }
  return {
    policy: "loop-detection",
    action: "allow",
    reason: "No repeated question in this session.",
  };
}

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 3 && !STOP.has(token)),
  );
}

export function tokenOverlap(left: string, right: string): number | null {
  const source = tokens(left);
  if (source.size === 0) return null;
  const target = tokens(right);
  let hits = 0;
  for (const token of source) {
    if (target.has(token)) hits += 1;
  }
  return hits / source.size;
}

export function inspectDrift(
  query: string,
  answer: string,
  enforce: boolean,
): PolicyDecision {
  const overlap = tokenOverlap(query, answer);
  if (overlap === null) {
    return {
      policy: "context-drift",
      action: "allow",
      reason: "The query has no distinctive terms to compare.",
    };
  }
  if (overlap >= 0.25) {
    return {
      policy: "context-drift",
      action: "allow",
      reason: `Answer overlap with the query is ${overlap.toFixed(2)}.`,
    };
  }
  if (overlap < 0.1 && enforce) {
    return {
      policy: "context-drift",
      action: "deny",
      reason: `Answer overlap with the query is ${overlap.toFixed(2)}, below the enforced floor.`,
    };
  }
  return {
    policy: "context-drift",
    action: "instruct",
    reason: `Answer overlap with the query is ${overlap.toFixed(2)}. The brief was kept because it was already streamed.`,
  };
}

export interface EvidenceFinding {
  decision: PolicyDecision;
  citedDomains: string[];
  unsupportedUrls: string[];
  groundedSources: number;
  citationConfidence?: number;
  weakClaims?: number;
  uncitedClaims?: number;
}

export type ProtectionMode = "protected" | "unprotected";

/** Soften deny/instruct for unprotected demos while still recording what would have happened. */
export function applyProtection(
  decision: PolicyDecision,
  protection: ProtectionMode,
): PolicyDecision {
  if (protection === "protected") return decision;
  if (decision.action === "allow" || decision.action === "sanitize") return decision;
  return {
    ...decision,
    action: "instruct",
    reason: `[unprotected] Would have ${decision.action}: ${decision.reason}`,
  };
}

function hostOf(value: string): string | null {
  try {
    return new URL(value).host.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function inspectEvidence(
  answer: string,
  sources: Array<{
    title: string;
    url: string;
    domain: string;
    snippet?: string;
    credibility?: "high" | "medium" | "low";
    kind?: "web" | "document";
  }>,
  enforce: boolean,
): EvidenceFinding {
  const urls = answer.match(/https?:\/\/[^\s)>\]]+/g) ?? [];
  const sourceHosts = new Set(
    sources
      .map((source) => hostOf(source.url) ?? source.domain.replace(/^www\./, "").toLowerCase())
      .filter(Boolean),
  );
  const unsupportedUrls = urls.filter((url) => {
    const host = hostOf(url);
    return host !== null && !sourceHosts.has(host);
  });
  const lowered = answer.toLowerCase();
  const groundedSources = sources.filter((source) => {
    const domain = source.domain.replace(/^www\./, "").toLowerCase();
    const title = source.title.trim().toLowerCase();
    return (
      lowered.includes(domain) ||
      (title.length >= 8 && lowered.includes(title.slice(0, 48))) ||
      /\[\d+\]/.test(answer)
    );
  }).length;

  const citationMarkers = answer.match(/\[\d+(?:\s*,\s*\d+)*\]/g) ?? [];
  const citationConfidence =
    citationMarkers.length === 0
      ? 0
      : Math.min(1, citationMarkers.length / Math.max(1, sources.length));
  const claimLines = answer
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 40 && !line.startsWith("#"));
  const uncitedClaims = claimLines.filter((line) => !/\[\d+\]/.test(line)).length;
  const weakClaims = claimLines.filter((line) => {
    const markers = line.match(/\[\d+(?:\s*,\s*\d+)*\]/g) ?? [];
    if (markers.length === 0) return false;
    const numbers = markers.flatMap((marker) =>
      (marker.match(/\d+/g) ?? []).map(Number),
    );
    return numbers.some((number) => number < 1 || number > sources.length);
  }).length;

  let decision: PolicyDecision;
  if (unsupportedUrls.length > 0) {
    decision = {
      policy: "evidence-validation",
      action: enforce ? "deny" : "instruct",
      reason: `${unsupportedUrls.length} URL${unsupportedUrls.length === 1 ? "" : "s"} in the brief are not in the retrieved source set.`,
    };
  } else if (sources.length > 0 && citationMarkers.length === 0 && claimLines.length >= 2) {
    decision = {
      policy: "citation-verification",
      action: enforce ? "deny" : "instruct",
      reason: "The brief makes claims without any [n] citations against the retrieved evidence.",
    };
  } else if (weakClaims > 0) {
    decision = {
      policy: "citation-verification",
      action: enforce ? "deny" : "instruct",
      reason: `${weakClaims} claim${weakClaims === 1 ? "" : "s"} cite source numbers that do not exist.`,
    };
  } else if (sources.length > 0 && groundedSources === 0 && citationMarkers.length === 0) {
    decision = {
      policy: "evidence-validation",
      action: enforce ? "deny" : "instruct",
      reason: "The brief does not mention any retrieved source title, domain, or citation.",
    };
  } else {
    decision = {
      policy: "evidence-validation",
      action: "allow",
      reason:
        sources.length === 0
          ? "No sources were available to validate."
          : `${groundedSources} of ${sources.length} sources are reflected; ${citationMarkers.length} citation marker${citationMarkers.length === 1 ? "" : "s"}; ${uncitedClaims} uncited claim line${uncitedClaims === 1 ? "" : "s"}.`,
    };
  }

  return {
    decision,
    citedDomains: [...sourceHosts],
    unsupportedUrls,
    groundedSources,
    citationConfidence,
    weakClaims,
    uncitedClaims,
  };
}
