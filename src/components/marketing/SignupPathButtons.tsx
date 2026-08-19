"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PATHS = [
  {
    id: "foundational",
    label: "Foundational",
    hint: "New to a topic? Get a clear answer with sources, not a guess.",
  },
  {
    id: "operational",
    label: "Operational",
    hint: "Comparing tools or tracking a policy change? See the tradeoffs, cited.",
  },
  {
    id: "strategic",
    label: "Strategic",
    hint: "A call that has to hold up. Deeper search, a denser brief.",
  },
] as const;

export function SignupPathButtons() {
  const [active, setActive] = useState<(typeof PATHS)[number]["id"] | null>(null);
  const current = PATHS.find((path) => path.id === active) ?? null;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {PATHS.map((path) => {
          const on = active === path.id;
          return (
            <button
              key={path.id}
              type="button"
              onMouseEnter={() => setActive(path.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(path.id)}
              onBlur={() => setActive(null)}
              className={cn(
                "h-9 rounded-full border text-[10px] font-semibold uppercase tracking-[0.16em] transition",
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
      <p className="mt-1.5 min-h-5 text-xs leading-5 text-ink-faint">
        {current?.hint ?? "Hover a path to see how QUORAI works."}
      </p>
    </div>
  );
}
