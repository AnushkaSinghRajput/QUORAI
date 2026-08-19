"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CredibilityBadge } from "@/components/research/CredibilityBadge";
import type { Source } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SourceCard({
  source,
  index,
}: {
  source: Source;
  index: number;
}) {
  const [open, setOpen] = useState(index < 2);
  const relevancePct = Math.round(source.relevance * 100);

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border bg-bg-elevated/80 transition-all duration-200",
        open
          ? "border-accent/25 shadow-[0_4px_24px_rgba(139,92,246,0.1)]"
          : "border-line hover:border-accent/20",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        <span
          className={cn(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-semibold transition",
            index < 3
              ? "bg-gradient-to-br from-violet/30 to-cyan/20 text-ink"
              : "bg-bg-muted text-ink-soft",
          )}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {source.favicon ? (
              <Image
                src={source.favicon}
                alt=""
                width={14}
                height={14}
                className="h-3.5 w-3.5 rounded-sm"
                unoptimized
              />
            ) : null}
            <span className="text-xs text-ink-faint">{source.domain}</span>
            <CredibilityBadge level={source.credibility} />
          </div>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-ink group-hover:text-accent-strong">
            {source.title}
          </h3>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet to-cyan transition-all duration-500"
                  style={{ width: `${relevancePct}%` }}
                />
              </div>
              <span className="shrink-0 text-[11px] font-medium text-cyan">
                {relevancePct}%
              </span>
            </div>
            {source.publishedAt && (
              <span className="shrink-0 text-[11px] text-ink-faint">
                {source.publishedAt}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200",
            open && "rotate-180 text-accent",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-line bg-bg-muted/20 px-4 pb-4 pt-3">
              <p className="text-sm leading-relaxed text-ink-soft">
                {source.snippet}
              </p>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-muted/50 px-3 py-1.5 text-xs font-medium text-accent transition hover:border-accent/30 hover:text-accent-strong"
              >
                Open source
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
