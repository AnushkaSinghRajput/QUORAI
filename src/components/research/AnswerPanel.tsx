"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { AnswerSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { renderMarkdownLite } from "@/lib/markdown";
import type { ResearchStage } from "@/lib/types";

export function AnswerPanel({
  answer,
  stage,
  error,
  onRetry,
}: {
  answer: string;
  stage: ResearchStage;
  error?: string;
  onRetry?: () => void;
}) {
  const content = useMemo(() => renderMarkdownLite(answer), [answer]);
  const showSkeleton =
    !answer &&
    (stage === "searching" ||
      stage === "reading" ||
      stage === "analyzing" ||
      stage === "synthesizing");

  if (stage === "error" && error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  return (
    <section className="surface overflow-hidden rounded-[1.5rem]">
      <div className="border-b border-line bg-gradient-to-r from-accent-soft/30 via-transparent to-warm-soft/20 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg tracking-tight text-ink sm:text-xl">
                Synthesis
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                AI-composed brief
              </p>
            </div>
          </div>
          {stage === "synthesizing" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-warm-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
              Streaming
            </span>
          )}
          {stage === "complete" && answer && (
            <span className="rounded-full bg-success/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-success">
              Complete
            </span>
          )}
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
