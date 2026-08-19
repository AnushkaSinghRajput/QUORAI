import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function AnswerSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-7 w-2/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[92%]" />
      <Skeleton className="h-4 w-[86%]" />
      <Skeleton className="mt-4 h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[88%]" />
      <Skeleton className="h-4 w-[70%]" />
    </div>
  );
}

export function SourceSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line p-4">
          <Skeleton className="mb-3 h-4 w-2/3" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}
