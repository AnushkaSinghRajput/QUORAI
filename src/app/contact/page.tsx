import type { Metadata } from "next";
import { Mail, Users } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ContactForm, WaitlistForm } from "@/components/marketing/LeadForms";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="kicker">Contact</p>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-ink">
            Tell us the problem
          </h1>
          <p className="mt-4 leading-relaxed text-ink-soft">
            From a single analyst workflow to an enterprise research desk —
            QUORAI can be configured with your search and LLM keys.
          </p>
          <div className="mt-8 surface rounded-[1.6rem] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <h2 className="font-display text-lg text-ink">Join the beta</h2>
            </div>
            <WaitlistForm />
          </div>
        </div>
        <div className="surface rounded-[1.6rem] p-6">
          <div className="mb-5 flex items-center gap-2">
            <Mail className="h-4 w-4 text-cyan" />
            <h2 className="font-display text-2xl text-ink">Send a brief</h2>
          </div>
          <ContactForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
