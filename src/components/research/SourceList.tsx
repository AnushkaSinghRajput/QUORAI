import { ShieldCheck } from "lucide-react";
import { SourceCard } from "@/components/research/SourceCard";
import { NoSourcesState } from "@/components/ui/EmptyState";
import { SourceSkeleton } from "@/components/ui/Skeleton";
import type { Source } from "@/lib/types";

export function SourceList({
  sources,
  loading,
}: {
  sources: Source[];
  loading?: boolean;
}) {
  return (
    <aside className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan" />
            <h2 className="font-display text-xl tracking-tight text-ink">
              Evidence
            </h2>
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Ranked by relevance & credibility
          </p>
        </div>
        <span className="rounded-full bg-gradient-to-r from-violet/20 to-cyan/20 px-2.5 py-1 text-xs font-medium text-ink-soft ring-1 ring-line">
          {sources.length}
        </span>
      </div>

      {loading && sources.length === 0 ? (
        <SourceSkeleton />
      ) : sources.length === 0 ? (
        <NoSourcesState />
      ) : (
        <div className="space-y-2.5">
          {sources.map((source, index) => (
            <SourceCard key={source.id} source={source} index={index} />
          ))}
        </div>
      )}
    </aside>
  );
}
