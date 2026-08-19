"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PATHS = [
  {
    id: "foundational",
    treeId: "explain",
    label: "Foundational",
    hint: "New to a topic? Get a clear answer with sources, not a guess.",
  },
  {
    id: "operational",
    treeId: "compare",
    label: "Operational",
    hint: "Comparing tools or tracking a policy change? See the tradeoffs, cited.",
  },
  {
    id: "strategic",
    treeId: "diligence",
    label: "Strategic",
    hint: "A call that has to hold up. Deeper search, a denser brief.",
  },
] as const;

export function SignupPathButtons({
  onHighlight,
}: {
  onHighlight?: (treeId: string | null) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const current = PATHS.find((path) => path.id === active) ?? null;

  function set(pathId: string | null, treeId: string | null) {
    setActive(pathId);
    onHighlight?.(treeId);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {PATHS.map((path) => {
          const on = active === path.id;
          return (
            <button
              key={path.id}
              type="button"
              onMouseEnter={() => set(path.id, path.treeId)}
              onMouseLeave={() => set(null, null)}
              onFocus={() => set(path.id, path.treeId)}
              onBlur={() => set(null, null)}
              className={cn(
                "h-9 rounded-full border text-[10px] font-semibold uppercase tracking-[0.16em] transition-all duration-300",
                on
                  ? "border-white/35 bg-gradient-to-r from-[#1a2744] via-violet to-[#f0c4c8] text-white shadow-[0_8px_24px_rgba(109,91,184,0.35)]"
                  : "border-white/15 bg-black/25 text-ink-soft hover:border-white/30 hover:text-ink",
              )}
            >
              {path.label}
            </button>
          );
        })}
      </div>
      <div className="mt-2 min-h-[2.75rem]">
        <AnimatePresence mode="wait">
          <motion.p
            key={current?.id ?? "default"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-xs leading-relaxed text-ink-faint"
          >
            {current?.hint ?? "Hover a path to see how QUORAI works."}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
