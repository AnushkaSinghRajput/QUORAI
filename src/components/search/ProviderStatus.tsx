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
  failproof?: { configured: boolean };
}

export function ProviderStatus() {
  const [health, setHealth] = useState<HealthPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/health", { cache: "no-store" })
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

  const live = health.liveReady && !health.demoMode;
  const missing = health.missingCredentials ?? [];

  return (
    <div
      className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
        live
          ? "border-success/30 bg-success/10 text-ink"
          : "border-danger/30 bg-danger-soft text-ink"
      }`}
    >
      <div className="flex items-start gap-2">
        {live ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {live
              ? `Live research ready · ${health.providers?.search}/${health.providers?.llm}`
              : "Live research credentials required"}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {live
              ? health.failproof?.configured
                ? "Failproof Cloud is connected for runtime traces."
                : "Add FAILPROOFAI_API_KEY to ship traces to the quoraai workspace."
              : health.allowMockFallback
                ? "Demo fallback is enabled. Answers will be labeled as demo, not live research."
                : "Research will not invent mock answers. Configure the keys below, then restart the server."}
          </p>
          {!live && missing.length > 0 && (
            <ul className="mt-2 space-y-1 font-mono text-[11px] text-ink-faint">
              {missing.slice(0, 6).map((item) => (
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
