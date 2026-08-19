"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ReasoningTree } from "@/components/brand/ReasoningTree";
import { SignupPathButtons } from "@/components/marketing/SignupPathButtons";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function SignupHeroPanel() {
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

  return (
    <motion.div
      className="flex max-w-[36rem] flex-col"
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: easeOut }}
    >
      <h1 className="font-display text-[2.15rem] font-semibold leading-[1.1] tracking-[-0.045em] text-ink xl:text-[2.45rem]">
        One query. Many paths.
        <br />
        <span className="glow-text">A cited brief.</span>
      </h1>
      <p className="mt-3 max-w-[32rem] text-sm leading-relaxed text-ink-soft">
        Type a messy question. QUORAI searches the live web, follows a few
        paths, and writes a brief with sources you can actually use.
      </p>
      <div className="mt-5">
        <SignupPathButtons onHighlight={setHighlightedPath} />
      </div>
      <div className="signup-tree-panel relative mt-4 overflow-hidden rounded-[1.25rem] p-4 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet/10 via-transparent to-cyan/8"
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet/15 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <ReasoningTree
          ambient
          highlightedPath={highlightedPath}
          className="relative"
        />
      </div>
    </motion.div>
  );
}
