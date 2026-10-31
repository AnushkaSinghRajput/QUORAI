import { getFailproofConfig } from "@/lib/failproof/config";
import type { PolicyAction } from "@/lib/failproof/guards";
import type { ShipResult } from "@/lib/failproof/ship";
import { loadCollection, saveCollection } from "@/lib/persist";

export interface PolicyRecord {
  policy: string;
  action: PolicyAction;
  reason: string;
  at: string;
}

export interface FailureRecord {
  errorType: string;
  message: string;
  recovered: boolean;
  at: string;
}

export interface RecoveryRecord {
  from: string;
  to: string;
  reason: string;
  at: string;
}

export interface EvidenceRecord {
  action: PolicyAction;
  reason: string;
  groundedSources: number;
  unsupportedUrls: string[];
  citationConfidence?: number;
  weakClaims?: number;
  uncitedClaims?: number;
}

export interface ReliabilityRun {
  id: string;
  sessionId: string;
  query: string;
  mode: "quick" | "deep";
  protection?: "protected" | "unprotected";
  environment: string;
  agentId: string;
  status: "running" | "success" | "failed" | "blocked";
  startedAt: string;
  endedAt?: string;
  decisions: PolicyRecord[];
  failures: FailureRecord[];
  recoveries: RecoveryRecord[];
  evidence?: EvidenceRecord;
  delivery?: ShipResult;
}

export function summarizeReliability(runs: ReliabilityRun[]) {
  const interventions = runs.reduce(
    (sum, run) => sum + run.decisions.filter((item) => item.action !== "allow").length,
    0,
  );
  const blocked = runs.filter((run) => run.status === "blocked").length;
  const recovered = runs.reduce((sum, run) => sum + run.recoveries.length, 0);
  const delivered = runs.filter((run) => run.delivery?.outcome === "delivered").length;
  return {
    totalRuns: runs.length,
    interventions,
    blocked,
    recovered,
    delivered,
    successRate:
      runs.length === 0
        ? 0
        : runs.filter((run) => run.status === "success").length / runs.length,
  };
}

const MAX_RUNS = 80;

export async function listReliabilityRuns(): Promise<ReliabilityRun[]> {
  const runs = await loadCollection<ReliabilityRun[]>("reliability", []);
  return [...runs].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

export async function getReliabilityRun(id: string): Promise<ReliabilityRun | null> {
  const runs = await listReliabilityRuns();
  return runs.find((run) => run.id === id || run.sessionId === id) ?? null;
}

export async function listRunsForSession(sessionId: string): Promise<ReliabilityRun[]> {
  const runs = await listReliabilityRuns();
  return runs.filter((run) => run.sessionId === sessionId);
}

export async function saveReliabilityRun(run: ReliabilityRun): Promise<void> {
  const runs = await loadCollection<ReliabilityRun[]>("reliability", []);
  const next = [run, ...runs.filter((item) => item.id !== run.id)];
  await saveCollection("reliability", next.slice(0, MAX_RUNS));
}

export function publicFailproofStatus() {
  const config = getFailproofConfig();
  return {
    configured: config.configured,
    workspace: config.workspace,
    dashboardUrl: config.dashboardUrl,
    apiBase: config.apiBase,
    environment: config.environment,
    agentId: config.agentId,
    captureContent: config.captureContent,
    orgHeader: Boolean(config.org),
    readKeyConfigured: Boolean(config.readApiKey),
    missing: config.configured
      ? []
      : [
          "FAILPROOFAI_API_KEY with events:add, minted in the quoraai organization. Add events:read to verify traces (or set FAILPROOFAI_READ_API_KEY). Set FAILPROOFAI_ORG=quoraai only for an instance-scoped key.",
        ],
  };
}
