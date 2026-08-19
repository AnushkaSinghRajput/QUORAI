import Link from "next/link";
import { Globe, Lock, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SignupHeroArt } from "@/components/brand/SignupHeroArt";
import { AuthForm } from "@/components/auth/AuthForm";
import { SignupPathButtons } from "@/components/marketing/SignupPathButtons";

const TRUST = [
  { icon: ShieldCheck, label: "Cited sources" },
  { icon: Lock, label: "Private sessions" },
  { icon: Zap, label: "Quick or Deep" },
  { icon: Globe, label: "Open web" },
] as const;

export function SignupView() {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none">
      <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col px-6 sm:px-8 xl:px-10">
        <header className="flex h-12 shrink-0 items-center justify-between">
          <Logo compact />
          <p className="flex items-center gap-3 text-sm text-ink-soft">
            <span className="hidden sm:inline">Already have an account?</span>
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full border border-white/20 px-4 text-sm font-semibold text-ink transition hover:bg-white/8"
            >
              Log in
            </Link>
          </p>
        </header>

        <main className="grid min-h-0 flex-1 items-start gap-8 overflow-hidden pt-5 lg:grid-cols-[minmax(0,1fr)_24.5rem]">
          <section className="hidden lg:block">
            <div className="flex max-w-[36rem] flex-col">
              <h1 className="font-display text-[2.15rem] font-semibold leading-[1.1] tracking-[-0.045em] text-ink xl:text-[2.45rem]">
                One query. Many paths.
                <br />
                <span className="glow-text">A cited brief.</span>
              </h1>
              <p className="mt-2 max-w-[32rem] text-sm leading-snug text-ink-soft">
                Type a messy question. QUORAI searches the live web, follows a few
                paths, and writes a brief with sources you can actually use.
              </p>
              <div className="mt-4">
                <SignupPathButtons />
              </div>
              <SignupHeroArt className="mt-2" />
            </div>
          </section>

          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-[1.5rem] border border-white/12 bg-black/55 p-5 shadow-[0_24px_80px_rgba(4,2,16,0.45)] backdrop-blur-2xl sm:p-6 lg:max-w-none">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#f0c4c8]">
                QUORAI Beta
              </p>
              <h2 className="mt-2 font-display text-[1.85rem] tracking-tight text-ink">
                Join the beta.
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                Help researchers, operators, and builders solve harder problems
                with cited web research.
              </p>
              <div className="mt-5">
                <AuthForm mode="signup" showAltLink={false} compact />
              </div>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-faint">
                By continuing, you create a beta account on this workstation.{" "}
                <Link href="/faq" className="text-[#c4b5fd] hover:text-ink">
                  How sessions work
                </Link>
              </p>
              <ul className="mt-4 hidden grid-cols-4 gap-2 border-t border-white/10 pt-4 min-[420px]:grid">
                {TRUST.map((item) => (
                  <li
                    key={item.label}
                    className="flex flex-col items-center gap-1 text-center"
                  >
                    <item.icon className="h-3.5 w-3.5 text-[#c4b5fd]" aria-hidden />
                    <span className="text-[10px] leading-tight text-ink-soft">
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
