import { ResearchWorkspace } from "@/components/research/ResearchWorkspace";
import { getBrief } from "@/lib/briefs";
import { briefToSession } from "@/lib/session-map";

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brief = await getBrief(id);

  return (
    <ResearchWorkspace
      sessionId={id}
      initialSession={brief ? briefToSession(brief) : null}
    />
  );
}
