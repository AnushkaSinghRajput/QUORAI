"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { CloudVerification } from "@/lib/failproof/cloud";
import type { ReliabilityRun } from "@/lib/failproof/store";

interface Status {
  configured: boolean;
  workspace: string;
  dashboardUrl: string;
  apiBase: string;
  environment: string;
  agentId: string;
  captureContent: boolean;
  missing: string[];
}

interface Metrics {
  totalRuns: number;
  interventions: number;
  blocked: number;
  recovered: number;
  delivered: number;
  successRate: number;
}

interface Payload {
  ok: boolean;
  failproof: Status;
  metrics?: Metrics;
  runs: ReliabilityRun[];
}

const ACTION_STYLE: Record<string, string> = {
  allow: "text-success",
  instruct: "text-cyan",
  sanitize: "text-warm",
  deny: "text-danger",
};

export function ReliabilityConsole() {
  const params = useSearchParams();
  const focus = params.get("session");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [cloud, setCloud] = useState<CloudVerification | null>(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/reliability", { cache: "no-store" });
    const body = (await response.json()) as Payload & { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not load reliability records.");
      return;
    }
    setPayload(body);
    setError(null);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch(() => setError("Could not load reliability records."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const runs = payload?.runs ?? [];
  const selected = picked ?? focus;
  const active =
    runs.find((run) => run.sessionId === selected || run.id === selected) ??
    runs[0] ??
    null;

  async function verify(sessionId: string) {
    setChecking(true);
    setCloud(null);
    try {
      const response = await fetch(`/api/reliability/${sessionId}?verify=1`, {
        cache: "no-store",
      });
      const body = (await response.json()) as {
        cloud?: CloudVerification;
        error?: string;
      };
      if (body.cloud) setCloud(body.cloud);
      else setError(body.error ?? "Verification did not return a Cloud result.");
    } catch {
      setError("Could not reach the reliability API.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <p className="kicker">Reliability</p>
      <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink">
        Research execution
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Each research run records model calls, search calls, failures, recoveries,
        and the policy decisions made inside QUORAI. Traces are shipped to the
        Failproof workspace when a server key is configured.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/demo" className="btn-primary h-10 px-4 text-sm">
          Protected vs unprotected demo
        </Link>
        <a
          href="https://app.befailproof.ai/quoraai/usage"
          className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm text-ink-soft transition hover:text-ink"
          target="_blank"
          rel="noreferrer"
        >
          Failproof usage
        </a>
      </div>

      {payload?.metrics && (
        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Runs", value: String(payload.metrics.totalRuns) },
            { label: "Interventions", value: String(payload.metrics.interventions) },
            { label: "Blocked", value: String(payload.metrics.blocked) },
            { label: "Recoveries", value: String(payload.metrics.recovered) },
            {
              label: "Cloud delivered",
              value: String(payload.metrics.delivered),
            },
          ].map((item) => (
            <div key={item.label} className="surface rounded-2xl px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {item.label}
              </p>
              <p className="mt-1 font-display text-2xl text-ink">{item.value}</p>
            </div>
          ))}
        </section>
      )}

      {payload && (
        <section className="surface mt-8 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-label">Failproof workspace</p>
              <p className="mt-2 font-display text-2xl text-ink">{payload.failproof.workspace}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {payload.failproof.configured
                  ? `Connected for ${payload.failproof.environment}. Agent ${payload.failproof.agentId}.`
                  : "Not connected. Research still runs. Traces stay in this console until a key is set."}
              </p>
            </div>
            <a
              href={payload.failproof.dashboardUrl}
              className="btn-primary h-10 px-4 text-sm"
              target="_blank"
              rel="noreferrer"
            >
              Open dashboard
            </a>
          </div>
          {!payload.failproof.configured && (
            <div className="mt-4 rounded-2xl border border-cyan/25 bg-warm-soft/40 px-4 py-4 text-sm text-ink">
              <p className="font-display text-base text-ink">Connect Failproof in 3 steps</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-ink-soft">
                <li>
                  Open{" "}
                  <a
                    href="https://app.befailproof.ai/quoraai"
                    className="text-accent"
                    target="_blank"
                    rel="noreferrer"
                  >
                    the quoraai workspace
                  </a>{" "}
                  → Administration → Keys
                </li>
                <li>
                  Mint an organization key with <code className="font-mono text-xs">events:add</code>.
                  Add <code className="font-mono text-xs">events:read</code> on the same key
                  (dashboard; human session) or set{" "}
                  <code className="font-mono text-xs">FAILPROOFAI_READ_API_KEY</code>
                </li>
                <li>
                  Set <code className="font-mono text-xs">FAILPROOFAI_API_KEY</code> in Vercel
                  Production (and <code className="font-mono text-xs">.env.local</code> locally), then
                  redeploy
                </li>
              </ol>
              <p className="mt-3 text-xs text-ink-faint">
                Research, PDF uploads, citations, and this console keep working without the key.
                Cloud traces appear in Failproof only after the key is set.
              </p>
            </div>
          )}
          {payload.failproof.missing.map((item) => (
            <p
              key={item}
              className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-ink"
            >
              {item}
            </p>
          ))}
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-faint">Environment</dt>
              <dd className="text-ink">{payload.failproof.environment}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Content capture</dt>
              <dd className="text-ink">
                {payload.failproof.captureContent ? "Full, secrets redacted" : "Metadata only"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">Ingest API</dt>
              <dd className="truncate font-mono text-xs text-ink">{payload.failproof.apiBase}/events</dd>
            </div>
          </dl>
        </section>
      )}

      {error && (
        <p className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.4fr)]">
        <section className="surface rounded-3xl p-4">
          <p className="section-label">Runs</p>
          <ul className="mt-3 space-y-2">
            {runs.length === 0 && (
              <li className="text-sm text-ink-soft">
                No research runs yet. Start one from the{" "}
                <Link href="/" className="text-accent">
                  console
                </Link>
                .
              </li>
            )}
            {runs.map((run) => (
              <li key={run.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPicked(run.sessionId);
                    setCloud(null);
                  }}
                  className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                    active?.id === run.id ? "bg-accent-soft" : "hover:bg-bg-muted"
                  }`}
                >
                  <span className="block truncate text-sm text-ink">{run.query}</span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    {run.status} · {run.mode} · {run.protection ?? "protected"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface rounded-3xl p-5 sm:p-6">
          {!active && <p className="text-sm text-ink-soft">Select a run to inspect it.</p>}
          {active && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="section-label">{active.status}</p>
                  <h2 className="mt-2 font-display text-2xl text-ink">{active.query}</h2>
                  <p className="mt-1 font-mono text-xs text-ink-faint">
                    session {active.sessionId}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary h-10 px-4 text-sm"
                  disabled={checking}
                  onClick={() => void verify(active.sessionId)}
                >
                  {checking ? "Checking Cloud…" : "Verify in Failproof"}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Failures" value={String(active.failures.length)} />
                <Metric
                  label="Interventions"
                  value={String(
                    active.decisions.filter((item) => item.action !== "allow").length,
                  )}
                />
                <Metric label="Recoveries" value={String(active.recoveries.length)} />
              </div>

              <Block title="Delivery">
                <p className="text-sm text-ink-soft">
                  {active.delivery
                    ? `${active.delivery.outcome}. Accepted ${active.delivery.accepted}, skipped ${active.delivery.skipped}.`
                    : "This run has no delivery record."}
                </p>
                {active.delivery?.message && (
                  <p className="mt-2 text-sm text-ink">{active.delivery.message}</p>
                )}
                {active.delivery?.requiredPermission && (
                  <p className="mt-2 text-sm text-danger">
                    Missing grant: {active.delivery.requiredPermission}
                  </p>
                )}
              </Block>

              <Block title="Policy decisions">
                <ul className="space-y-2">
                  {active.decisions.map((decision, index) => (
                    <li key={`${decision.policy}-${index}`} className="text-sm">
                      <span className={ACTION_STYLE[decision.action] ?? "text-ink"}>
                        {decision.action}
                      </span>
                      <span className="text-ink-faint"> · {decision.policy}</span>
                      <span className="block text-ink-soft">{decision.reason}</span>
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Failures">
                {active.failures.length === 0 ? (
                  <p className="text-sm text-ink-soft">No execution failures.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-ink-soft">
                    {active.failures.map((failure, index) => (
                      <li key={`${failure.at}-${index}`}>
                        {failure.errorType}: {failure.message}
                        {failure.recovered ? " Recovered." : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </Block>

              <Block title="Recovery attempts">
                {active.recoveries.length === 0 ? (
                  <p className="text-sm text-ink-soft">No recovery was needed.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-ink-soft">
                    {active.recoveries.map((recovery, index) => (
                      <li key={`${recovery.at}-${index}`}>
                        {recovery.from} → {recovery.to}. {recovery.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </Block>

              <Block title="Evidence validation">
                <p className="text-sm text-ink-soft">
                  {active.evidence
                    ? `${active.evidence.action}. ${active.evidence.reason}`
                    : "This run ended before evidence was checked."}
                </p>
                {active.evidence && active.evidence.unsupportedUrls.length > 0 && (
                  <ul className="mt-2 space-y-1 font-mono text-xs text-danger">
                    {active.evidence.unsupportedUrls.map((url) => (
                      <li key={url}>{url}</li>
                    ))}
                  </ul>
                )}
              </Block>

              {cloud && (
                <Block title="Cloud verification">
                  <p className="text-sm text-ink-soft">
                    {cloud.ok
                      ? `Found ${cloud.events?.count ?? 0} events in workspace quoraai.`
                      : cloud.error}
                  </p>
                  {cloud.events && (
                    <p className="mt-2 font-mono text-xs text-ink-faint">
                      {Object.entries(cloud.events.types)
                        .map(([type, count]) => `${type} ${count}`)
                        .join(" · ")}
                    </p>
                  )}
                  {cloud.requiredPermission && (
                    <p className="mt-2 text-sm text-danger">
                      Missing grant: {cloud.requiredPermission}
                    </p>
                  )}
                  <a
                    href={cloud.dashboardUrl}
                    className="mt-3 inline-block text-sm text-accent"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View the workspace dashboard
                  </a>
                </Block>
              )}

              <Link href={`/research/${active.sessionId}`} className="text-sm text-accent">
                Open the research brief
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-bg-muted/40 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="section-label">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
