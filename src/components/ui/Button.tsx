import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        variant === "primary" &&
          "bg-gradient-to-r from-[#1a2744] via-violet to-[#f0c4c8] text-white shadow-[0_0_24px_rgba(139,92,246,0.28)] hover:shadow-[0_0_32px_rgba(139,92,246,0.4)]",
        variant === "secondary" &&
          "bg-bg-muted text-ink ring-1 ring-line hover:bg-bg-elevated hover:ring-accent/25",
        variant === "ghost" && "text-ink-soft hover:bg-bg-muted hover:text-ink",
        variant === "danger" && "bg-danger-soft text-danger hover:opacity-90",
        className,
      )}
      {...props}
    >
      {variant === "primary" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </button>
  );
}
