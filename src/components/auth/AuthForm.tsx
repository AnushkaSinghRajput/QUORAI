"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  LoaderCircle,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { PASSWORD_RULES, passwordMeetsRules } from "@/lib/password";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  mode: "signup" | "login";
  showAltLink?: boolean;
  compact?: boolean;
}

const fieldClass =
  "w-full rounded-xl border border-white/12 bg-black/30 px-4 text-sm text-ink outline-none ring-violet/30 placeholder:text-ink-faint focus:border-white/25 focus:ring-2";

export function AuthForm({
  mode,
  showAltLink = true,
  compact = false,
}: AuthFormProps) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(
        isSignup ? "/api/auth/signup" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isSignup ? { name, email, password } : { email, password },
          ),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to continue. Please try again.");
        return;
      }
      await refresh();
      router.push("/");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-2.5" : "space-y-4"}>
      {isSignup && (
        <label className="block text-left">
          <span className={cn("block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint", compact ? "mb-1" : "mb-1.5")}>
            Full name
          </span>
          <span className="relative block">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={cn(fieldClass, compact ? "h-10 pr-11" : "h-12 pr-11")}
              placeholder="Ada Lovelace"
            />
            <User className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          </span>
        </label>
      )}
      <label className="block text-left">
          <span className={cn("block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint", compact ? "mb-1" : "mb-1.5")}>
            Email address
        </span>
        <span className="relative block">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={cn(
              fieldClass,
              compact ? "h-10" : "h-12",
              isSignup && "pr-11",
            )}
            placeholder="you@lab.quorai.ai"
          />
          {isSignup ? (
            <Mail className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          ) : null}
        </span>
      </label>
      <label className="block text-left">
          <span className={cn("block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint", compact ? "mb-1" : "mb-1.5")}>
            Password
        </span>
        <span className="relative block">
          <input
            required
            type="password"
            minLength={isSignup ? 8 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className={cn(
              fieldClass,
              compact ? "h-10" : "h-12",
              isSignup && "pr-11",
            )}
            placeholder={isSignup ? "Create a strong password" : "Your password"}
            aria-describedby={isSignup ? "password-rules" : undefined}
          />
          {isSignup ? (
            <Lock className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          ) : null}
        </span>
      </label>

      {isSignup ? (
        <ul id="password-rules" className="flex flex-wrap gap-x-4 gap-y-1.5">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li
                key={rule.id}
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px]",
                  met ? "text-success" : "text-ink-faint",
                )}
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
                {rule.label}
              </li>
            );
          })}
        </ul>
      ) : null}

      {error && (
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        size={compact ? "md" : "lg"}
        disabled={loading || (isSignup && !passwordMeetsRules(password))}
      >
        {loading ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {isSignup ? "Creating workspace…" : "Signing in…"}
          </>
        ) : isSignup ? (
          <>
            Start researching
            <ArrowRight className="h-4 w-4" />
          </>
        ) : (
          "Log in"
        )}
      </Button>

      {showAltLink ? (
        <p className="text-center text-sm text-ink-soft">
          {isSignup ? (
            <>
              Already in?{" "}
              <Link href="/login" className="text-accent hover:text-accent-strong">
                Log in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link href="/signup" className="text-accent hover:text-accent-strong">
                Join beta
              </Link>
            </>
          )}
        </p>
      ) : null}
    </form>
  );
}
