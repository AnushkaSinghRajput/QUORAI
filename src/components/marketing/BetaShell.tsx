import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ReasoningTree } from "@/components/brand/ReasoningTree";

export function BetaShell({
  kicker,
  title,
  subtitle,
  children,
  altHref,
  altLabel,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  altHref: string;
  altLabel: string;
}) {
  return (
    <div className="grid h-dvh max-h-dvh overflow-hidden lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between px-8 py-6 lg:flex xl:px-12">
        <Logo compact />
        <div className="flex flex-1 flex-col justify-center py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#f0c4c8]">
            {kicker}
          </p>
          <h2 className="mt-4 whitespace-nowrap font-display text-[clamp(1.05rem,2.4vw,1.75rem)] font-semibold tracking-[0.06em] text-ink">
            <span className="glow-text">One query</span>
            <span className="mx-2.5 inline-block bg-gradient-to-r from-violet to-[#f0c4c8] bg-clip-text text-transparent">
              ·
            </span>
            <span>Many paths</span>
            <span className="mx-2.5 inline-block bg-gradient-to-r from-violet to-[#f0c4c8] bg-clip-text text-transparent">
              ·
            </span>
            <span className="glow-text">A cited brief</span>
          </h2>
          <div
            aria-hidden
            className="mt-3 h-px w-full max-w-xl bg-gradient-to-r from-[#6d5bb8] via-[#c4b5fd] to-[#f3cfc8]"
          />
          <ReasoningTree className="mt-6" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          AI-powered web research
        </p>
      </aside>

      <section className="relative flex min-h-0 flex-col px-5 py-5 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="ml-auto">
            <Link
              href={altHref}
              className="inline-flex h-9 items-center rounded-full border border-white/20 px-4 text-sm font-semibold text-ink transition hover:bg-white/8"
            >
              {altLabel}
            </Link>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
          <div className="rounded-[1.5rem] border border-white/12 bg-black/50 p-6 shadow-[0_24px_80px_rgba(4,2,16,0.45)] backdrop-blur-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#f0c4c8]">
              {kicker}
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
