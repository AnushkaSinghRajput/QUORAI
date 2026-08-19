"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, Lock, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { AuthForm } from "@/components/auth/AuthForm";
import { SignupHeroPanel } from "@/components/marketing/SignupHeroPanel";

const TRUST = [
  { icon: ShieldCheck, label: "Cited sources" },
  { icon: Lock, label: "Private sessions" },
  { icon: Zap, label: "Quick or Deep" },
  { icon: Globe, label: "Open web" },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

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
              className="inline-flex h-9 items-center rounded-full border border-white/20 px-4 text-sm font-semibold text-ink transition hover:border-white/35 hover:bg-white/8"
            >
              Log in
            </Link>
          </p>
        </header>

        <main className="grid min-h-0 flex-1 items-center gap-10 overflow-hidden py-6 lg:grid-cols-[minmax(0,1fr)_24.5rem]">
          <section className="hidden lg:block">
            <SignupHeroPanel />
          </section>

          <motion.section
            className="flex justify-center lg:justify-end"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease: easeOut }}
          >
            <div className="signup-card w-full max-w-md p-6 sm:p-7 lg:max-w-none">
              <p className="section-label text-rose">QUORAI Beta</p>
              <h2 className="mt-2 font-display text-[1.85rem] font-semibold tracking-tight text-ink">
                Join the beta
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Help researchers, operators, and builders solve harder problems
                with cited web research.
              </p>
              <div className="mt-6">
                <AuthForm mode="signup" showAltLink={false} compact />
              </div>
              <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-faint">
                By continuing, you create a beta account on this workstation.{" "}
                <Link href="/faq" className="text-accent hover:text-accent-strong">
                  How sessions work
                </Link>
              </p>
              <ul className="mt-5 hidden grid-cols-4 gap-2 border-t border-line pt-5 min-[420px]:grid">
                {TRUST.map((item, i) => (
                  <motion.li
                    key={item.label}
                    className="flex flex-col items-center gap-1.5 text-center"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.06, duration: 0.35 }}
                  >
                    <item.icon className="h-3.5 w-3.5 text-accent" aria-hidden />
                    <span className="text-[10px] leading-tight text-ink-soft">
                      {item.label}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
