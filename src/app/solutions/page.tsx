import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SolutionsGrid } from "@/components/marketing/SolutionsGrid";

export const metadata: Metadata = {
  title: "Solutions",
};

export default function SolutionsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan">
          Solutions
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink">
          Pick a path. Run it.
        </h1>
        <div className="mt-10">
          <SolutionsGrid />
        </div>
      </main>
      <Footer />
    </div>
  );
}
