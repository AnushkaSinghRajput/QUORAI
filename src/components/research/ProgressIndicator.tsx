"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  PenLine,
  Search,
} from "lucide-react";
import { STAGE_LABELS } from "@/lib/constants";
import type { ResearchStage } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAGES = [
  "searching",
  "reading",
  "analyzing",
  "synthesizing",
] as const;

type PipelineStage = (typeof STAGES)[number];

const STAGE_ICONS: Record<
  PipelineStage,
  typeof Search
> = {
  searching: Search,
  reading: BookOpen,
  analyzing: Brain,
  synthesizing: PenLine,
};

export function ProgressIndicator({
  stage,
}: {
  stage: ResearchStage;
}) {
  if (stage === "idle" || stage === "complete") return null;

  const activeIndex =
    stage === "error" ? -1 : Math.max(0, STAGES.indexOf(stage as PipelineStage));

  return (
    <div className="surface overflow-hidden rounded-[1.4rem] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative pulse-dot h-2.5 w-2.5 rounded-full bg-cyan" />
          <span className="text-sm font-medium text-ink">
            {STAGE_LABELS[stage]}
          </span>
        </div>
        <span className="rounded-full bg-bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          Live pipeline
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {STAGES.map((item, index) => {
          const done = activeIndex > index;
          const active = activeIndex === index;
          const Icon = STAGE_ICONS[item];
          return (
            <div key={item} className="space-y-2">
              <div
                className={cn(
                  "relative h-1.5 overflow-hidden rounded-full",
                  active ? "bg-accent-soft" : "bg-bg-muted",
                )}
              >
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    done || active
                      ? "bg-gradient-to-r from-violet via-accent to-cyan"
                      : "bg-transparent",
                  )}
                  initial={{ width: "0%" }}
                  animate={{
                    width: done ? "100%" : active ? "70%" : "0%",
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Icon
                  className={cn(
                    "h-3 w-3 shrink-0",
                    active ? "text-cyan" : done ? "text-accent" : "text-ink-faint",
                  )}
                />
                <span
                  className={cn(
                    "truncate font-mono text-[9px] uppercase tracking-[0.1em] sm:text-[10px] sm:tracking-[0.12em]",
                    active ? "text-cyan" : done ? "text-ink-soft" : "text-ink-faint",
                  )}
                >
                  {item}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
