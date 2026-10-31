"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ExternalLink, ChevronDown, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { percent, SUPPORT_META } from "@/components/research/CitationLedger";
import { CredibilityBadge } from "@/components/research/CredibilityBadge";
import type { SourceSupport } from "@/lib/citations";
import { ensureDocumentPreview, getDocumentPreview } from "@/lib/files";
import type { Source } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SourceCard({
  source,
  index,
  active = false,
  support,
  onSelect,
}: {
  source: Source;
  index: number;
  active?: boolean;
  support?: SourceSupport;
  onSelect?: (index: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(index < 2);
  const [preview, setPreview] = useState<string | undefined>(() =>
    source.kind === "document" && source.documentName
      ? getDocumentPreview(source.documentName)
      : undefined,
  );
  const ref = useRef<HTMLElement>(null);
  const relevancePct = Math.round(source.relevance * 100);
  const isDocument = source.kind === "document";
  const open = expanded || active;

  useEffect(() => {
    if (!isDocument || !source.documentName) return;
    let cancelled = false;
    void ensureDocumentPreview(source.documentName).then((url) => {
      if (!cancelled && url) setPreview(url);
    });
    return () => {
      cancelled = true;
    };
  }, [isDocument, source.documentName]);

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active]);

  return (
    <article
      ref={ref}
      id={`source-${index + 1}`}
      className={cn(
        "group scroll-mt-24 overflow-hidden rounded-2xl border bg-bg-elevated/80 transition-all duration-200",
        active
          ? "border-cyan/60 shadow-[0_0_0_3px_rgba(34,211,238,0.15),0_8px_32px_rgba(34,211,238,0.12)]"
          : open
            ? "border-accent/25 shadow-[0_4px_24px_rgba(139,92,246,0.1)]"
            : "border-line hover:border-accent/20",
      )}
    >
      <button
        type="button"
        onClick={() => {
          setExpanded(!open);
          onSelect?.(open ? null : index);
        }}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        <span
          className={cn(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-semibold transition",
            isDocument
              ? "bg-rose/20 text-rose"
              : index < 3
                ? "bg-gradient-to-br from-violet/30 to-cyan/20 text-ink"
                : "bg-bg-muted text-ink-soft",
          )}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isDocument ? (
              <FileText className="h-3.5 w-3.5 text-rose" />
            ) : source.favicon ? (
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
            {isDocument ? (
              source.page ? (
                <span className="rounded-full bg-rose/15 px-2 py-0.5 font-mono text-[10px] text-rose">
                  Page {source.page}
                </span>
              ) : null
            ) : (
              <CredibilityBadge level={source.credibility} />
            )}
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
          {support && (
            <p className="mt-2 text-[11px] text-ink-faint">
              Cited {support.citedCount}× ·{" "}
              <span className={cn("font-semibold", SUPPORT_META[support.level].text)}>
                {percent(support.probability)} support
              </span>
            </p>
          )}
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
              {isDocument ? (
                <blockquote className="border-l-2 border-rose/50 pl-3 text-sm leading-relaxed text-ink-soft">
                  {source.snippet}
                </blockquote>
              ) : (
                <p className="text-sm leading-relaxed text-ink-soft">{source.snippet}</p>
              )}
              {isDocument ? (
                preview ? (
                  <a
                    href={`${preview}${source.page ? `#page=${source.page}` : ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-muted/50 px-3 py-1.5 text-xs font-medium text-rose transition hover:border-rose/40"
                  >
                    {source.page ? `View page ${source.page}` : "Open document"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    Passage from your upload
                  </p>
                )
              ) : (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-muted/50 px-3 py-1.5 text-xs font-medium text-accent transition hover:border-accent/30 hover:text-accent-strong"
                >
                  Open source
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
