"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

export function SignUpButton({ className }: { className?: string }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <span className="h-10 w-[5.75rem] rounded-full bg-white/8 ring-1 ring-line" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[9rem] truncate text-sm text-ink-soft sm:inline">
          {user.name}
        </span>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="rounded-full px-3 py-2 text-sm text-ink-soft transition hover:bg-bg-muted hover:text-ink"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/signup"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#1a2744] via-violet to-[#f0c4c8] px-4 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,111,212,0.4)] transition hover:brightness-110",
        className,
      )}
    >
      Join beta
    </Link>
  );
}
