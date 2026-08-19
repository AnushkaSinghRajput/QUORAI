"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import {
  LEVEL_META,
  SOLUTIONS,
  type ProblemLevel,
  type Solution,
} from "@/lib/catalog";
import { beginResearch } from "@/lib/research/client";
import { cn } from "@/lib/utils";

export function SolutionsGrid({
  levels,
}: {
  levels?: ProblemLevel[];
}) {
  const router = useRouter();
  const shown = levels
    ? SOLUTIONS.filter((item) => levels.includes(item.level))
    : SOLUTIONS;

  function launch(item: Solution) {
    const id = beginResearch(item.query, item.mode);
    queueMicrotask(() => {
      void router.push(`/research/${id}`);
    });
  }

  const groups: ProblemLevel[] = levels ?? [
    "foundational",
    "operational",
    "strategic",
  ];

  return (
    <div className="space-y-10">
      {groups.map((level) => {
        const items = shown.filter((item) => item.level === level);
        if (items.length === 0) return null;
        return (
          <section key={level} id={level}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
              {LEVEL_META[level].label}
            </p>
            <h2 className="mt-2 font-display text-2xl tracking-tight text-ink">
              {LEVEL_META[level].blurb}
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => launch(item)}
                  className={cn(
                    "surface group rounded-[1.4rem] p-5 text-left transition hover:-translate-y-0.5 hover:border-white/25",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg tracking-tight text-ink">
                      {item.title}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-faint transition group-hover:text-cyan" />
                  </div>
                  <span className="mt-4 inline-flex rounded-full bg-white/8 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan">
                    Run {item.mode === "deep" ? "Deep Research" : "Quick Search"}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
