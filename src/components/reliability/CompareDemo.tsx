"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { GitCompareArrows, LoaderCircle, Shield, ShieldOff } from "lucide-react";
import type { ReliabilityRun } from "@/lib/failproof/store";
import type { Source } from "@/lib/types";

interface Lane {
  sessionId: string;
  protection: "protected" | "unprotected";
  answer: string;
  sources: Source[];
  error?: string;
  run: ReliabilityRun | null;
}

interface CompareResult {
  ok: boolean;
  query: string;
  unprotected: Lane;
  protected: Lane;
  error?: string;
}

function interventions(run: ReliabilityRun | null) {
  return run?.decisions.filter((item) => item.action !== "allow").length ?? 0;
}

function LaneCard({
  title,
  icon,
  lane,
  accent,
}: {
  title: string;
  icon: ReactNode;
  lane: Lane;
  accent: string;
}) {
  const run = lane.run;
  return (
    <article className="surface flex h-full flex-col overflow-hidden rounded-[1.5rem]">
      <div className={`border-b border-line px-5 py-4 ${accent}`}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-display text-xl text-ink">{title}</h3>
        </div>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          {run?.status ?? "unknown"} · session {lane.sessionId}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-px border-b border-line bg-line">
        {[
          { label: "Interventions", value: interventions(run) },
          { label: "Failures", value: run?.failures.length ?? 0 },
          { label: "Recoveries", value: run?.recoveries.length ?? 0 },
        ].map((item) => (
          <div key={item.label} className="bg-bg-elevated px-3 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              {item.label}
            </p>
            <p className="mt-1 font-display text-2xl text-ink">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="section-label">Evidence</p>
          <p className="mt-1 text-sm text-ink-soft">
            {run?.evidence
              ? `${run.evidence.action}. ${run.evidence.reason}`
              : lane.error ?? "No evidence record."}
          </p>
        </div>
        <div>
          <p className="section-label">Policy trail</p>
          <ul className="mt-2 max-h-40 space-y-2 overflow-auto text-sm">
            {(run?.decisions ?? []).slice(0, 8).map((decision, index) => (
              <li key={`${decision.policy}-${index}`}>
                <span className="text-ink">{decision.action}</span>
                <span className="text-ink-faint"> · {decision.policy}</span>
                <span className="block text-ink-soft">{decision.reason}</span>
              </li>
            ))}
            {(run?.decisions.length ?? 0) === 0 && (
              <li className="text-ink-soft">No policy decisions recorded.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="section-label">Brief excerpt</p>
          <p className="mt-1 line-clamp-6 whitespace-pre-wrap text-sm text-ink-soft">
            {lane.answer || lane.error || "Empty answer."}
          </p>
        </div>
        <Link href={`/reliability?session=${lane.sessionId}`} className="mt-auto text-sm text-accent">
          Open reliability record →
        </Link>
      </div>
    </article>
  );
}

export function CompareDemo() {
  const [query, setQuery] = useState(
    "Summarize global solar capacity growth and battery storage bottlenecks with citations.",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/demo/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode: "quick" }),
      });
      const body = (await response.json()) as CompareResult;
      if (!response.ok || !body.ok) {
        setError(body.error ?? "Comparison failed.");
        return;
      }
      setResult(body);
    } catch {
      setError("Could not reach the comparison API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <p className="kicker">Live demonstration</p>
      <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink">
        Protected vs unprotected research
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Run the same query twice through the real QUORAI pipeline. Protected mode
        enforces loop, tool, citation and evidence policies. Unprotected mode still
        records what would have happened, but does not block the run. Both lanes use
        live execution — not fake charts.
      </p>
      <p className="mt-2 max-w-2xl text-xs text-ink-faint">
        Tip: after the run finishes, open either reliability record, then try the same
        query from the{" "}
        <Link href="/#console" className="text-accent">
          research console
        </Link>{" "}
        with a PDF attached to see citation confidence on the brief.
      </p>

      <div className="surface mt-8 rounded-[1.5rem] p-5 sm:p-6">
        <label className="block">
          <span className="section-label">Demo query</span>
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={3}
            className="mt-2 w-full resize-none rounded-2xl border border-line bg-bg-muted/40 px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-cyan/30"
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={loading || query.trim().length < 8}
            onClick={() => void run()}
            className="btn-primary h-11 px-5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Running both pipelines…
              </>
            ) : (
              <>
                <GitCompareArrows className="h-4 w-4" />
                Run comparison
              </>
            )}
          </button>
          <Link href="/reliability" className="text-sm text-accent">
            Open reliability console
          </Link>
        </div>
        {error && (
          <p className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-ink">
            {error}
          </p>
        )}
      </div>

      {result && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <LaneCard
            title="Unprotected"
            accent="bg-danger-soft/40"
            icon={<ShieldOff className="h-5 w-5 text-danger" />}
            lane={result.unprotected}
          />
          <LaneCard
            title="Protected"
            accent="bg-success/10"
            icon={<Shield className="h-5 w-5 text-success" />}
            lane={result.protected}
          />
        </div>
      )}
    </div>
  );
}
