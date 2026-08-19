import { Compass, SearchX, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-line bg-bg-elevated/50 px-6 py-14 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-soft/20 via-transparent to-transparent"
      />
      <div className="relative mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet/20 to-cyan/20 text-accent ring-1 ring-line">
        <Compass className="h-6 w-6" />
      </div>
      <h3 className="relative font-display text-xl tracking-tight text-ink">
        {title}
      </h3>
      <p className="relative mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button className="relative mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-danger/20 bg-danger-soft">
      <div className="flex items-start gap-3 px-5 py-6">
        <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bg-elevated text-danger ring-1 ring-danger/20">
          <TriangleAlert className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-medium text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {description}
          </p>
          {onRetry && (
            <Button className="mt-4" variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NoSourcesState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-bg-muted/30 px-4 py-10 text-center">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-bg-muted text-ink-faint">
        <SearchX className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-ink-soft">Gathering sources…</p>
      <p className="mt-1 text-xs text-ink-faint">
        Citations will appear here as the pipeline runs.
      </p>
    </div>
  );
}
