"use client";

import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

export function InfinityMark({ className }: { className?: string }) {
  const ribbon = `${useId()}-ribbon`;

  return (
    <svg
      viewBox="0 0 168 76"
      className={cn("shrink-0 transition-transform duration-300 group-hover:scale-105", className)}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={ribbon} x1="10" y1="38" x2="158" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10182c" />
          <stop offset="38%" stopColor="#6d5bb8" />
          <stop offset="62%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#f3cfc8" />
        </linearGradient>
      </defs>
      <path
        d="M84 38C74 16 56 8 38 8 18 8 6 20 6 38s12 30 32 30c18 0 36-8 46-30 10 22 28 30 46 30 20 0 32-12 32-30S150 8 130 8c-18 0-36 8-46 30Z"
        stroke={`url(#${ribbon})`}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex shrink-0 items-center no-underline",
        compact ? "gap-2.5" : "gap-3.5",
        className,
      )}
      aria-label="QUORAI home"
    >
      <InfinityMark className={compact ? "h-7 w-[3.85rem]" : "h-8 w-[4.35rem]"} />
      <span className="flex flex-col items-start">
        <span className="font-display text-[0.98rem] font-semibold uppercase tracking-[0.34em] text-ink transition group-hover:text-accent-strong sm:text-[1.05rem]">
          QUORAI
        </span>
        <span
          className={cn(
            "hidden uppercase tracking-[0.22em] text-ink-faint transition group-hover:text-ink-soft lg:block",
            compact ? "mt-0.5 text-[0.5rem]" : "mt-1 text-[0.55rem]",
          )}
        >
          AI-powered web research
        </span>
      </span>
    </Link>
  );
}
