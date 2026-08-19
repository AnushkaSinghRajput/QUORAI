"use client";

import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-4">
        <EmptyState
          title="Something broke"
          description={
            error.message ||
            "An unexpected error occurred while loading this page."
          }
          actionLabel="Try again"
          onAction={reset}
        />
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
