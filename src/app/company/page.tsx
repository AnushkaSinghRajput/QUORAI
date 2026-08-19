import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Rocket, Shield } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ContactForm } from "@/components/marketing/LeadForms";
import { COMPANY } from "@/lib/site-content";

const POINT_ICONS = [Shield, CheckCircle2, Rocket] as const;

export const metadata: Metadata = {
  title: "Company",
};

export default function CompanyPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <p className="kicker">Company</p>
        <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          {COMPANY.headline}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft">
          {COMPANY.mission}
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {COMPANY.points.map((point, i) => {
            const Icon = POINT_ICONS[i] ?? Shield;
            return (
              <article
                key={point.title}
                className="surface-interactive rounded-[1.4rem] p-6"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl text-ink">{point.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {point.body}
                </p>
              </article>
            );
          })}
        </div>
        <div className="gradient-divider my-14" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="section-label">Get in touch</p>
            <h2 className="mt-2 font-display text-2xl text-ink">Talk to us</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Partnerships, research desks, and press, or{" "}
              <Link href="/contact" className="font-medium text-cyan hover:underline">
                the contact page
              </Link>
              .
            </p>
          </div>
          <div className="surface rounded-[1.5rem] p-6">
            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
