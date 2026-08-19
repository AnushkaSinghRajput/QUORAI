"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MODEL_CARDS } from "@/lib/catalog";
import { beginResearch } from "@/lib/research/client";

interface StatusPayload {
  searchProvider: string;
  llmProvider: string;
  demoMode: boolean;
}

export function ModelsView({ status }: { status: StatusPayload }) {
  const router = useRouter();

  function runProbe() {
    const id = beginResearch(
      "How should a production AI research agent choose between OpenAI and Anthropic for long-form cited briefs?",
      "deep",
    );
    queueMicrotask(() => {
      void router.push(`/research/${id}`);
    });
  }

  return (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan">
        Model layer
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-ink">
        Your LLM. Our retrieval.
      </h1>

      <div className="mt-8 surface rounded-[1.5rem] p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          Active runtime
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs text-ink-faint">Search</div>
            <div className="font-display text-lg capitalize">
              {status.searchProvider}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-faint">LLM</div>
            <div className="font-display text-lg capitalize">
              {status.llmProvider}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-faint">Mode</div>
            <div className="font-display text-lg">
              {status.demoMode ? "Demo" : "Live keys"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {MODEL_CARDS.map((model) => (
          <article key={model.id} className="surface rounded-[1.4rem] p-5">
            <h2 className="font-display text-xl">{model.name}</h2>
            <p className="mt-1 text-sm text-cyan">{model.models}</p>
            <p className="mt-3 text-sm text-ink-soft">{model.use}</p>
          </article>
        ))}
      </div>

      <div className="mt-10">
        <Button onClick={runProbe}>Run a model comparison brief</Button>
      </div>
    </>
  );
}
