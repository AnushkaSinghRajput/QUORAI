import type { CredibilityLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const META: Record<
  CredibilityLevel,
  { label: string; className: string }
> = {
  high: {
    label: "High trust",
    className: "bg-accent-soft text-accent",
  },
  medium: {
    label: "Moderate",
    className: "bg-warm-soft text-warm",
  },
  low: {
    label: "Verify",
    className: "bg-danger-soft text-danger",
  },
};

export function CredibilityBadge({ level }: { level: CredibilityLevel }) {
  const meta = META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}
