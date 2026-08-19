"use client";

import { MODE_META } from "@/lib/constants";
import type { ResearchMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ModeToggle({
  value,
  onChange,
}: {
  value: ResearchMode;
  onChange: (mode: ResearchMode) => void;
}) {
  return (
    <div
      className="relative inline-flex rounded-full bg-black/25 p-1 ring-1 ring-line"
      role="tablist"
      aria-label="Research mode"
    >
      {(["quick", "deep"] as ResearchMode[]).map((mode) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(mode)}
            className={cn(
              "relative z-10 rounded-full px-4 py-2 text-left transition-all duration-200 sm:min-w-[140px]",
              active
                ? "bg-gradient-to-r from-violet/90 to-cyan/80 text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                : "text-ink-soft hover:text-ink",
            )}
          >
            <div className="text-xs font-semibold tracking-wide">
              {MODE_META[mode].label}
            </div>
            <div className="hidden text-[10px] opacity-80 sm:block">
              {MODE_META[mode].description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
