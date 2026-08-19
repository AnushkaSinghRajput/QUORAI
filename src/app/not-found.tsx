import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="relative mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-violet/20 to-cyan/20 ring-1 ring-line">
          <Compass className="h-8 w-8 text-accent animate-float" />
          <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-bg-elevated font-mono text-[10px] font-medium text-cyan ring-1 ring-line">
            404
          </span>
        </div>
        <p className="section-label">Signal lost</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
          This route doesn&apos;t exist
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          That path isn&apos;t in QUORAI. Return to the console and launch a
          new research query.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#1a2744] via-violet to-[#f0c4c8] px-6 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(109,91,184,0.35)] transition hover:brightness-110"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to console
        </Link>
      </main>
    </div>
  );
}
