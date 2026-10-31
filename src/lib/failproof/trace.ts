import { flush, session, agent, toolCall, event } from "@failproofai/sdk";
import { nanoid } from "nanoid";
import { getFailproofConfig } from "@/lib/failproof/config";
import {
  PolicyDenied,
  applyProtection,
  inspectDrift,
  inspectEvidence,
  inspectQuestionLoop,
  inspectToolCall,
  type PolicyDecision,
  type ProtectionMode,
} from "@/lib/failproof/guards";
import { ensureFailproof } from "@/lib/failproof/runtime";
import { shipSpool } from "@/lib/failproof/ship";
import {
  saveReliabilityRun,
  type EvidenceRecord,
  type ReliabilityRun,
} from "@/lib/failproof/store";
import { logger } from "@/lib/logger";
import type { Source } from "@/lib/types";

export interface ModelCallResult {
  text: string;
  model?: string;
  stopReason?: string;
  inputTokens?: number;
  outputTokens?: number;
}

interface TraceMeta {
  sessionId: string;
  query: string;
  mode: "quick" | "deep";
  protection?: ProtectionMode;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

function asU32(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isInteger(value) || value < 0) return undefined;
  if (value > 2 ** 32 - 1) return undefined;
  return value;
}

export class ResearchTrace {
  readonly run: ReliabilityRun;
  private readonly ready: boolean;
  private readonly capture: boolean;
  private readonly protection: ProtectionMode;
  private readonly signatures: string[] = [];
  private calls = 0;

  constructor(meta: TraceMeta, ready: boolean) {
    const config = getFailproofConfig();
    this.ready = ready;
    this.capture = config.captureContent;
    this.protection = meta.protection ?? "protected";
    this.run = {
      id: nanoid(12),
      sessionId: meta.sessionId,
      query: meta.query,
      mode: meta.mode,
      protection: this.protection,
      environment: config.environment,
      agentId: config.agentId,
      status: "running",
      startedAt: new Date().toISOString(),
      decisions: [],
      failures: [],
      recoveries: [],
    };
  }

  private decide(decision: PolicyDecision): PolicyDecision {
    return applyProtection(decision, this.protection);
  }

  private note(decision: PolicyDecision) {
    this.run.decisions.push({
      policy: decision.policy,
      action: decision.action,
      reason: decision.reason,
      at: new Date().toISOString(),
    });
  }

  private emitHook(decision: PolicyDecision, trigger: string, input?: unknown) {
    this.note(decision);
    if (!this.ready) return;
    const hookId = nanoid(10);
    try {
      event.hookTriggered({
        hookName: decision.policy,
        hookId,
        triggerEvent: trigger,
        input: this.capture ? input : { policy: decision.policy },
      });
      event.hookCompleted({
        hookName: decision.policy,
        hookId,
        outcome: decision.action,
        output: { reason: decision.reason },
      });
    } catch (error) {
      logger.warn("Failproof hook event failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  observeHistory(
    history?: Array<{ role: "user" | "assistant"; content: string }>,
  ) {
    const decision = this.decide(inspectQuestionLoop(this.run.query, history));
    this.emitHook(decision, "agent_start");
  }

  prepareTool(toolName: string, query: string, provider: string): string {
    const inspected = inspectToolCall({
      toolName,
      query,
      provider,
      priorSignatures: this.signatures,
      callsSoFar: this.calls,
    });
    const decision = this.decide(inspected.decision);
    this.emitHook(decision, "tool_use", {
      toolName,
      provider,
      queryChars: query.length,
      protection: this.protection,
    });
    if (decision.action === "deny") {
      this.run.status = "blocked";
      throw new PolicyDenied(decision.policy, decision.reason);
    }
    this.signatures.push(inspected.signature);
    this.calls += 1;
    return inspected.query;
  }

  async tool<T>(
    toolName: string,
    input: Record<string, unknown>,
    outputOf: (value: T) => unknown,
    run: () => Promise<T>,
  ): Promise<T> {
    if (!this.ready) return run();
    const toolCallId = nanoid(12);
    return toolCall(
      toolName,
      {
        toolCallId,
        input: this.capture ? input : { tool: toolName },
      },
      async (call) => {
        const value = await run();
        call.output = outputOf(value);
        return value;
      },
    );
  }

  async model(
    purpose: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    run: () => Promise<ModelCallResult>,
  ): Promise<ModelCallResult> {
    if (!this.ready) return run();
    const requestId = nanoid(12);
    const started = Date.now();
    try {
      event.modelRequest({
        model,
        requestId,
        messages: this.capture
          ? messages.map((message) => ({
              role: message.role,
              content: message.content,
            }))
          : undefined,
      });
    } catch (error) {
      logger.warn("Failproof model_request failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const result = await run();
      this.respondModel(requestId, model, started, result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      try {
        event.modelResponse({
          model,
          requestId,
          stopReason: "error",
          duration_ms: Math.max(0, Math.round(Date.now() - started)),
          error: message,
          fw_purpose: purpose,
        });
      } catch (emitError) {
        logger.warn("Failproof model_response failed", {
          error: emitError instanceof Error ? emitError.message : String(emitError),
        });
      }
      throw error;
    }
  }

  private respondModel(
    requestId: string,
    model: string,
    started: number,
    result: ModelCallResult,
  ) {
    try {
      event.modelResponse({
        model: result.model ?? model,
        requestId,
        stopReason: result.stopReason ?? "stop",
        inputTokens: asU32(result.inputTokens),
        outputTokens: asU32(result.outputTokens),
        content: this.capture ? result.text : undefined,
        duration_ms: Math.max(0, Math.round(Date.now() - started)),
      });
    } catch (error) {
      logger.warn("Failproof model_response failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async stage<T>(name: string, run: () => Promise<T>): Promise<T> {
    if (!this.ready) return run();
    const hookId = nanoid(10);
    try {
      event.hookTriggered({
        hookName: `stage:${name}`,
        hookId,
        triggerEvent: "stage",
      });
    } catch {
      return run();
    }
    try {
      const value = await run();
      event.hookCompleted({
        hookName: `stage:${name}`,
        hookId,
        outcome: "success",
      });
      return value;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      try {
        event.hookCompleted({
          hookName: `stage:${name}`,
          hookId,
          outcome: "failed",
          error: message,
        });
      } catch {
        // The original failure is the one that matters.
      }
      throw error;
    }
  }

  noteFailure(errorType: string, message: string, recovered: boolean) {
    const last = this.run.failures.at(-1);
    if (last && last.message === message && last.recovered === recovered) return;
    this.run.failures.push({
      errorType,
      message,
      recovered,
      at: new Date().toISOString(),
    });
  }

  noteRecovery(from: string, to: string, reason: string) {
    this.run.recoveries.push({
      from,
      to,
      reason,
      at: new Date().toISOString(),
    });
    this.emitHook(
      {
        policy: "recovery",
        action: "instruct",
        reason,
      },
      "tool_result",
      { from, to },
    );
  }

  observeAnswer(answer: string, sources: Source[]) {
    const config = getFailproofConfig();
    const drift = this.decide(
      inspectDrift(
        this.run.query,
        answer,
        this.protection === "protected" && config.enforceDrift,
      ),
    );
    this.emitHook(drift, "model_response");
    const evidence = inspectEvidence(
      answer,
      sources,
      this.protection === "protected",
    );
    const evidenceDecision = this.decide(evidence.decision);
    this.emitHook(evidenceDecision, "model_response", {
      groundedSources: evidence.groundedSources,
      unsupported: evidence.unsupportedUrls.length,
      citationConfidence: evidence.citationConfidence,
      weakClaims: evidence.weakClaims,
      uncitedClaims: evidence.uncitedClaims,
    });
    this.run.evidence = {
      action: evidenceDecision.action,
      reason: evidenceDecision.reason,
      groundedSources: evidence.groundedSources,
      unsupportedUrls: evidence.unsupportedUrls.slice(0, 8),
      citationConfidence: evidence.citationConfidence,
      weakClaims: evidence.weakClaims,
      uncitedClaims: evidence.uncitedClaims,
    } satisfies EvidenceRecord;
    if (drift.action === "deny" || evidenceDecision.action === "deny") {
      this.run.status = "blocked";
      throw new PolicyDenied(
        drift.action === "deny" ? drift.policy : evidenceDecision.policy,
        drift.action === "deny" ? drift.reason : evidenceDecision.reason,
      );
    }
  }

  fail(error: unknown) {
    if (this.run.status === "running") {
      this.run.status = error instanceof PolicyDenied ? "blocked" : "failed";
    }
    if (error instanceof PolicyDenied) {
      logger.warn("Research policy blocked a step", {
        policy: error.policy,
        sessionId: this.run.sessionId,
      });
    }
  }
}

export async function withResearchSession(
  meta: TraceMeta,
  body: (trace: ResearchTrace) => Promise<void>,
): Promise<ReliabilityRun> {
  const ready = ensureFailproof();
  const trace = new ResearchTrace(meta, ready);
  const config = getFailproofConfig();

  const execute = async () => {
    trace.observeHistory(meta.history);
    await body(trace);
  };

  try {
    if (!ready) {
      await execute();
    } else {
      await session({ sessionId: meta.sessionId }, async () => {
        await agent(
          config.agentId,
          {
            goal: config.captureContent ? meta.query : undefined,
            fw_mode: meta.mode,
            fw_product: "quorai",
            fw_protection: meta.protection ?? "protected",
          },
          execute,
        );
      });
    }
    if (trace.run.status === "running") trace.run.status = "success";
    return trace.run;
  } catch (error) {
    trace.fail(error);
    throw error;
  } finally {
    trace.run.endedAt = new Date().toISOString();
    if (ready) {
      try {
        await flush();
      } catch (error) {
        logger.warn("Failproof flush failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    try {
      trace.run.delivery = await shipSpool();
    } catch (error) {
      trace.run.delivery = {
        attempted: true,
        outcome: "error",
        accepted: 0,
        skipped: 0,
        batches: 0,
        message: error instanceof Error ? error.message : String(error),
      };
    }
    try {
      await saveReliabilityRun(trace.run);
    } catch (error) {
      logger.warn("Reliability record was not saved", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
