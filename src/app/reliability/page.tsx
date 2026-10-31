import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ReliabilityConsole } from "@/components/reliability/ReliabilityConsole";

export const metadata: Metadata = {
  title: "Reliability",
};

export default function ReliabilityPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading reliability…</div>}>
          <ReliabilityConsole />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
