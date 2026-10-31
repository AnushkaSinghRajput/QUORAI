import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CompareDemo } from "@/components/reliability/CompareDemo";

export const metadata: Metadata = {
  title: "Protected vs unprotected demo",
  description:
    "Live side-by-side comparison of protected and unprotected QUORAI research executions.",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <CompareDemo />
      </main>
      <Footer />
    </div>
  );
}
