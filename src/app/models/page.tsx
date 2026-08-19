import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ModelsView } from "@/components/marketing/ModelsView";
import { getAppConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Models",
};

export default function ModelsPage() {
  const config = getAppConfig();
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <ModelsView
          status={{
            searchProvider: config.searchProvider,
            llmProvider: config.llmProvider,
            demoMode: config.demoMode,
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
