"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  BookOpen,
  FileSearch,
  Layers,
  Zap,
} from "lucide-react";

const CAPABILITIES = [
  {
    icon: Zap,
    title: "Quick Search",
    body: "Grounded answers from top sources in minutes, not hours of tab-hopping.",
    tag: "Fast",
  },
  {
    icon: Layers,
    title: "Deep Research",
    body: "Wider retrieval and denser synthesis for decisions that need evidence.",
    tag: "Depth",
  },
  {
    icon: BookOpen,
    title: "Cited briefs",
    body: "Every claim traceable. Sources ranked by relevance and credibility.",
    tag: "Verified",
  },
  {
    icon: FileSearch,
    title: "File-grounded",
    body: "Drop notes, CSVs, or briefs. QUORAI treats them as primary evidence.",
    tag: "Upload",
  },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

function CapabilityCard({
  cap,
  index,
}: {
  cap: (typeof CAPABILITIES)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: easeOut }}
      className="capability-card group flex h-full flex-col p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-line">
          <cap.icon className="h-5 w-5" aria-hidden />
        </div>
        <span className="shrink-0 rounded-full border border-line bg-bg-muted/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          {cap.tag}
        </span>
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold leading-snug text-ink">
        {cap.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
        {cap.body}
      </p>
    </motion.article>
  );
}

export function CapabilityCards() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-40px" });

  return (
    <section className="section-block">
      <div className="gradient-divider mb-12" />

      <div ref={headerRef} className="mx-auto max-w-2xl text-center">
        <motion.p
          className="section-label"
          initial={{ opacity: 0, y: 10 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: easeOut }}
        >
          Capabilities
        </motion.p>
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 12 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.06, duration: 0.45, ease: easeOut }}
        >
          Built for consequential work
        </motion.h2>
        <motion.p
          className="section-desc mx-auto max-w-lg"
          initial={{ opacity: 0 }}
          animate={headerInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.12, duration: 0.4 }}
        >
          Four core modes that cover how teams actually research, from quick
          orientation to audit-ready briefs.
        </motion.p>
      </div>

      <div className="capabilities-grid mt-10">
        {CAPABILITIES.map((cap, index) => (
          <CapabilityCard key={cap.title} cap={cap} index={index} />
        ))}
      </div>
    </section>
  );
}
