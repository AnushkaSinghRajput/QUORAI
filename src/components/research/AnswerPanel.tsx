"use client";

import { useCallback, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { percent, SUPPORT_META } from "@/components/research/CitationLedger";
import { AnswerSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import type { CitationAnalysis } from "@/lib/citations";
import { renderMarkdownLite, type CitationRenderer } from "@/lib/markdown";
import type { ResearchStage, Source } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AnswerPanel({
  answer,
  stage,
  error,
  onRetry,
  sources = [],
  analysis,
  activeSource = null,
  onCite,
}: {
  answer: string;
  stage: ResearchStage;
  error?: string;
  onRetry?: () => void;
  sources?: Source[];
  analysis?: CitationAnalysis;
  activeSource?: number | null;
  onCite?: (sourceIndex: number) => void;
}) {
  const renderCitation = useCallback<CitationRenderer>(
    (numbers, key) => (
      <span key={key} className="ml-0.5 inline-flex gap-0.5 align-super">
        {numbers.map((number) => {
          const index = number - 1;
          const source = sources[index];
          const support = analysis?.bySource[index];
          const level = source ? (support?.level ?? "moderate") : "unresolved";
          const title = source
            ? `${source.title}${support ? ` · ${percent(support.probability)} support` : ""}`
            : "No matching source";
          return (
            <button
              key={number}
              type="button"
              title={title}
              disabled={!source || !onCite}
              onClick={() => onCite?.(index)}
              className={cn(
                "rounded px-1 text-[10px] font-semibold leading-4 ring-1 transition hover:brightness-125 focus-visible:outline-none focus-visible:ring-2",
                SUPPORT_META[level].chip,
                activeSource === index && "ring-2",
              )}
            >
              {number}
              {source?.kind === "document" && source.page ? ` · p.${source.page}` : ""}
            </button>
          );
        })}
      </span>
    ),
    [activeSource, analysis, onCite, sources],
  );

  const content = useMemo(
    () => renderMarkdownLite(answer, { renderCitation }),
    [answer, renderCitation],
  );
  const showSkeleton =
    !answer &&
    (stage === "searching" ||
      stage === "reading" ||
      stage === "analyzing" ||
      stage === "synthesizing");
  const extractive = /Extractive brief/i.test(answer);

  if (stage === "error" && error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  return (
    <section id="brief" className="surface scroll-mt-28 overflow-hidden rounded-[1.5rem]">
      <div className="border-b border-line bg-gradient-to-r from-accent-soft/30 via-transparent to-warm-soft/20 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg tracking-tight text-ink sm:text-xl">
                {extractive ? "Evidence brief" : "Synthesis"}
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {extractive
                  ? "Live sources · extractive (model billing paused)"
                  : "AI-composed brief · click a citation to inspect it"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stage === "synthesizing" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-warm-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
                Streaming
              </span>
            )}
            {stage === "complete" && answer && (
              <>
                <span className="rounded-full bg-success/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-success">
                  Complete
                </span>
                {analysis && analysis.citedClaims > 0 && (
                  <a
                    href="#citations"
                    className="hidden rounded-full border border-cyan/30 bg-warm-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan transition hover:brightness-110 sm:inline"
                  >
                    {percent(analysis.confidence)} confidence
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {showSkeleton ? (
          <AnswerSkeleton />
        ) : (
          <div className="prose-answer">
            {content}
            {stage === "synthesizing" && (
              <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-accent align-middle" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
