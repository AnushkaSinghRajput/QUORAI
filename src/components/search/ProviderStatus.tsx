"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, KeyRound } from "lucide-react";

interface HealthPayload {
  ok: boolean;
  demoMode?: boolean;
  liveReady?: boolean;
  allowMockFallback?: boolean;
  providers?: { search: string; llm: string };
  missingCredentials?: string[];
  failproof?: {
    configured: boolean;
    capabilities?: {
      eventsAdd: boolean | null;
      eventsRead: boolean | null;
    };
  };
}

/**
 * Honest provider readiness for the research console.
 * Never hides missing live credentials when mock fallback is off.
 */
export function ProviderStatus() {
  const [health, setHealth] = useState<HealthPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/health?failproof=1", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as HealthPayload;
        if (!cancelled) setHealth(body);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!health) return null;

  const live = Boolean(health.liveReady);
  const missing = (health.missingCredentials ?? []).filter((item) =>
    ["TAVILY_API_KEY", "OPENAI_API_KEY", "SERPER_API_KEY", "ANTHROPIC_API_KEY"].includes(
      item,
    ),
  );

  if (live) {
    return (
      <div className="mt-4 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-ink">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <div>
            <p className="font-medium">
              Live research ready · {health.providers?.search}/{health.providers?.llm}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {health.failproof?.configured
                ? health.failproof.capabilities?.eventsRead === false
                  ? "Failproof can ship events; add events:read for Cloud verify."
                  : "Failproof Cloud is connected for runtime traces."
                : "Add FAILPROOFAI_API_KEY to ship traces to the quoraai workspace."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-ink">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Live research credentials required</p>
          <p className="mt-1 text-xs text-ink-soft">
            {health.allowMockFallback
              ? "Demo fallback is enabled. Answers will be labeled as demo, not live research."
              : "Research will not invent mock answers. Configure the keys below in .env.local and Vercel Production, then restart / redeploy."}
          </p>
          {missing.length > 0 && (
            <ul className="mt-2 space-y-1 font-mono text-[11px] text-ink-faint">
              {missing.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
