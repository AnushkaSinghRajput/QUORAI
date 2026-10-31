"use client";

import { useMemo, useState } from "react";
import { FileText, Globe, Scale } from "lucide-react";
import type { CitationAnalysis, SupportLevel } from "@/lib/citations";
import type { Source } from "@/lib/types";
import { cn } from "@/lib/utils";

export const SUPPORT_META: Record<
  SupportLevel,
  { label: string; text: string; bar: string; chip: string }
> = {
  strong: {
    label: "Strong",
    text: "text-success",
    bar: "bg-success",
    chip: "bg-success/12 text-success ring-success/30",
  },
  moderate: {
    label: "Moderate",
    text: "text-cyan",
    bar: "bg-cyan",
    chip: "bg-warm-soft text-cyan ring-cyan/30",
  },
  weak: {
    label: "Weak",
    text: "text-danger",
    bar: "bg-danger",
    chip: "bg-danger-soft text-danger ring-danger/30",
  },
  unresolved: {
    label: "Unresolved",
    text: "text-ink-faint",
    bar: "bg-ink-faint",
    chip: "bg-bg-muted text-ink-faint ring-line",
  },
};

export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function ConfidenceRing({ value }: { value: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const level = value >= 0.7 ? "strong" : value >= 0.45 ? "moderate" : "weak";
  return (
    <div className="relative grid h-16 w-16 shrink-0 place-items-center">
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" className="stroke-bg-muted" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          stroke="currentColor"
          className={cn("transition-all duration-700", SUPPORT_META[level].text)}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value)}
        />
      </svg>
      <span className="font-display text-sm font-semibold text-ink">{percent(value)}</span>
    </div>
  );
}

export function CitationLedger({
  analysis,
  sources,
  activeSource,
  onSelectSource,
}: {
  analysis: CitationAnalysis;
  sources: Source[];
  activeSource: number | null;
  onSelectSource: (index: number) => void;
}) {
  const [weakestFirst, setWeakestFirst] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const claims = useMemo(() => {
    const list = [...analysis.claims];
    if (weakestFirst) list.sort((a, b) => a.probability - b.probability);
    return list;
  }, [analysis.claims, weakestFirst]);

  if (analysis.totalClaims === 0) return null;

  const visible = expanded ? claims : claims.slice(0, 6);
  const weakCount = analysis.claims.filter((claim) => claim.level === "weak").length;
  const uncited = analysis.totalClaims - analysis.citedClaims;

  return (
    <section
      id="citations"
      className="surface scroll-mt-28 overflow-hidden rounded-[1.5rem]"
    >
      <div className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4 sm:px-6">
        <ConfidenceRing value={analysis.confidence} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-cyan" />
            <h2 className="font-display text-lg tracking-tight text-ink">Citation confidence</h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-faint">
            Estimated probability that each cited source supports its claim, based on
            evidence overlap and source credibility. Click a chip to jump to that evidence —
            uploaded pages open at the cited page when the PDF is still in this browser.
          </p>
        </div>
        <a
          href="#brief"
          className="rounded-full border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft transition hover:border-accent/30 hover:text-ink"
        >
          Back to brief
        </a>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        {[
          { label: "Claims cited", value: `${analysis.citedClaims}/${analysis.totalClaims}` },
          { label: "Weak support", value: String(weakCount), tone: weakCount ? "text-danger" : "text-ink" },
          {
            label: "Document · Web",
            value: `${analysis.documentCitations} · ${analysis.webCitations}`,
          },
          {
            label: "Uncited",
            value: String(uncited),
            tone: uncited ? "text-rose" : "text-ink",
          },
        ].map((item) => (
          <div key={item.label} className="bg-bg-elevated px-4 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              {item.label}
            </dt>
            <dd className={cn("mt-1 font-display text-lg text-ink", item.tone)}>{item.value}</dd>
          </div>
        ))}
      </dl>

      {claims.length > 0 && (
        <div className="px-5 py-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="section-label">Claim ledger</p>
            <button
              type="button"
              onClick={() => setWeakestFirst((value) => !value)}
              className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft transition hover:border-accent/30 hover:text-ink"
            >
              {weakestFirst ? "Answer order" : "Weakest first"}
            </button>
          </div>
          <ul className="space-y-2">
            {visible.map((claim) => {
              const meta = SUPPORT_META[claim.level];
              return (
                <li key={claim.id} className="rounded-2xl border border-line bg-bg-muted/25 p-3">
                  <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{claim.text}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <div className="flex min-w-[120px] flex-1 items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", meta.bar)}
                          style={{ width: percent(claim.probability) }}
                        />
                      </div>
                      <span className={cn("shrink-0 text-[11px] font-semibold", meta.text)}>
                        {percent(claim.probability)} · {meta.label}
                      </span>
                    </div>
                    {claim.citations.map((citation) => {
                      const source = sources[citation.sourceIndex];
                      const isDoc = source?.kind === "document";
                      return (
                        <button
                          key={citation.sourceIndex}
                          type="button"
                          disabled={!source}
                          onClick={() => onSelectSource(citation.sourceIndex)}
                          title={source ? source.title : "This citation has no matching source"}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 transition hover:brightness-125",
                            SUPPORT_META[citation.level].chip,
                            activeSource === citation.sourceIndex && "ring-2",
                          )}
                        >
                          {isDoc ? <FileText className="h-3 w-3" /> : <Globe className="h-3 w-3" />}[
                          {citation.sourceIndex + 1}]
                          {isDoc && source.page ? ` p.${source.page}` : ""}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
          {claims.length > 6 && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-3 text-xs font-medium text-accent hover:text-accent-strong"
            >
              {expanded ? "Show fewer" : `Show all ${claims.length} claims`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
