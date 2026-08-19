"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PRIMARY = [
  "M48 272 H168",
  "M168 272 C176 272 188 196 268 188 H560",
  "M268 188 C276 188 292 108 372 98 H1048",
  "M560 188 C568 188 584 78 656 68 H860",
];

const SECONDARY = [
  "M168 272 C168 272 176 364 256 372 H520",
  "M400 188 C408 188 416 142 468 134 H640",
];

const TREE_PATHS = [
  {
    id: "explain",
    label: "Foundational",
    hint: "Explain concepts",
    x: 520,
    y: 372,
  },
  {
    id: "compare",
    label: "Operational",
    hint: "Compare options",
    x: 560,
    y: 188,
  },
  {
    id: "diligence",
    label: "Strategic",
    hint: "Due diligence",
    x: 860,
    y: 68,
  },
] as const;

export function ReasoningTree({
  className,
  interactive = false,
  onPick,
}: {
  className?: string;
  interactive?: boolean;
  onPick?: (id: string) => void;
}) {
  const uid = useId();
  const ribbon = `${uid}-ribbon`;
  const glow = `${uid}-glow`;
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 1100 430"
        className="relative h-auto w-full text-ink"
        fill="none"
        role="img"
        aria-label="Research paths branching from a single query"
      >
        <defs>
          <linearGradient
            id={ribbon}
            x1="48"
            y1="200"
            x2="1048"
            y2="200"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#6d5bb8" />
            <stop offset="48%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#f3cfc8" />
          </linearGradient>
          <filter id={glow} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {SECONDARY.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            stroke="rgba(196,181,253,0.32)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: "easeOut" }}
          />
        ))}
        {PRIMARY.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            stroke={`url(#${ribbon})`}
            strokeWidth="4.2"
            strokeLinecap="round"
            filter={hovered ? `url(#${glow})` : undefined}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, delay: i * 0.12, ease: "easeOut" }}
          />
        ))}

        {/* Origin node */}
        <motion.circle
          cx="48"
          cy="272"
          r="8"
          fill="var(--cyan)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        />
        <text
          x="48"
          y="302"
          textAnchor="middle"
          fill="currentColor"
          fontSize="10"
          fontFamily="var(--font-jetbrains), ui-monospace, monospace"
          letterSpacing="0.14em"
          className="text-ink-faint"
        >
          QUERY
        </text>

        {TREE_PATHS.map((path) =>
          interactive ? (
            <g
              key={path.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer outline-none"
              onMouseEnter={() => setHovered(path.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(path.id)}
              onBlur={() => setHovered(null)}
              onClick={() => onPick?.(path.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onPick?.(path.id);
                }
              }}
            >
              <motion.circle
                cx={path.x}
                cy={path.y}
                r={hovered === path.id ? 10 : 7}
                fill={
                  hovered === path.id
                    ? "var(--violet)"
                    : "color-mix(in oklab, var(--accent) 60%, transparent)"
                }
                stroke={hovered === path.id ? "var(--cyan)" : "transparent"}
                strokeWidth="2"
                animate={
                  hovered === path.id
                    ? { scale: [1, 1.15, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.8, repeat: hovered === path.id ? Infinity : 0 }}
              />
              <rect
                x={path.x - 60}
                y={path.y - 38}
                width="120"
                height="28"
                rx="14"
                fill={
                  hovered === path.id
                    ? "color-mix(in oklab, var(--bg-elevated) 95%, var(--accent))"
                    : "color-mix(in oklab, var(--bg) 70%, transparent)"
                }
                stroke={
                  hovered === path.id
                    ? "color-mix(in oklab, var(--accent) 50%, transparent)"
                    : "var(--line)"
                }
                strokeWidth="1"
              />
              <text
                x={path.x}
                y={path.y - 24}
                textAnchor="middle"
                fill="currentColor"
                fontSize="9"
                fontFamily="var(--font-sora), system-ui, sans-serif"
                fontWeight="600"
                letterSpacing="0.16em"
                className={cn(
                  "transition-colors",
                  hovered === path.id ? "text-ink" : "text-ink-soft",
                )}
              >
                {path.label.toUpperCase()}
              </text>
              {hovered === path.id && (
                <text
                  x={path.x}
                  y={path.y + 22}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="9"
                  fontFamily="var(--font-outfit), system-ui, sans-serif"
                  className="text-cyan"
                >
                  {path.hint} →
                </text>
              )}
            </g>
          ) : null,
        )}
      </svg>
    </div>
  );
}
