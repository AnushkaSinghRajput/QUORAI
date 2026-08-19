import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { FaqList } from "@/components/marketing/FaqList";

export const metadata: Metadata = {
  title: "FAQ",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <p className="kicker">FAQ</p>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink">
          Answers, cited in short form
        </h1>
        <p className="mt-3 text-ink-soft">
          Everything you need to know about QUORAI — from demo mode to production
          deployment.
        </p>
        <div className="mt-10">
          <FaqList />
        </div>
      </main>
      <Footer />
    </div>
  );
}
