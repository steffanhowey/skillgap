import { randomUUID } from "crypto";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { SAFETY_PROMPT } from "@/lib/breaks/contentSafety";
import { hashCanonicalJson } from "./hash";
import {
  AI_GATEWAY_MODEL,
  getAiOperation,
} from "./operationRegistry";
import type {
  GatewayChatCompletion,
  GatewayDependencies,
  GatewayFailureReason,
  GatewayResult,
  LlmRunRecord,
  StructuredCompletionRequest,
} from "./types";

const INPUT_COST_PER_MILLION = 0.15;
const OUTPUT_COST_PER_MILLION = 0.6;

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openai) openai = new OpenAI();
  return openai;
}

function estimateCostUsd(
  inputTokens: number | null,
  outputTokens: number | null,
): number | null {
  if (inputTokens == null || outputTokens == null) return null;
  return (
    (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION
  );
}

function includesSafetyPrompt(system: string): boolean {
  return system.includes(SAFETY_PROMPT);
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    /timeout/i.test(error.message)
  );
}

function isRetryableProviderError(error: unknown): boolean {
  if (isTimeoutError(error)) return false;
  if (error instanceof OpenAI.APIError) {
    return error.status === 429 || (error.status != null && error.status >= 500);
  }
  return error instanceof TypeError;
}

function classifyError(error: unknown): GatewayFailureReason {
  if (isTimeoutError(error)) return "timeout";
  if (error instanceof OpenAI.APIError) return "provider_error";
  return "provider_error";
}

function warnUnavailable(
  reason: GatewayFailureReason,
  operation: string,
  traceId: string,
): void {
  console.warn(
    `[ai/gateway] unavailable:${reason} operation=${operation} trace=${traceId}`,
  );
}

async function defaultComplete(
  request: StructuredCompletionRequest<unknown>,
  signal: AbortSignal,
): Promise<GatewayChatCompletion> {
  const response = await getClient().chat.completions.parse(
    {
      model: AI_GATEWAY_MODEL,
      max_tokens: request.maxTokens ?? 4_000,
      temperature: request.temperature ?? 0,
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.user },
      ],
      response_format: zodResponseFormat(request.schema, request.schemaName),
    },
    { signal },
  );

  return {
    id: response.id,
    parsed: response.choices[0]?.message.parsed ?? null,
    inputTokens: response.usage?.prompt_tokens ?? null,
    outputTokens: response.usage?.completion_tokens ?? null,
  };
}

async function persistSafely(
  persistRun: GatewayDependencies["persistRun"],
  run: LlmRunRecord,
): Promise<void> {
  if (!persistRun) return;
  try {
    await persistRun(run);
  } catch {
    console.warn(
      `[ai/gateway] llm_run persist failed operation=${run.operation} trace=${run.traceId}`,
    );
  }
}

function buildRun(
  request: StructuredCompletionRequest<unknown>,
  deps: Required<Pick<GatewayDependencies, "createId" | "now">>,
  startedAt: number,
  fields: {
    status: LlmRunRecord["status"];
    failureReason: GatewayFailureReason | null;
    outputHash: string | null;
    inputTokens: number | null;
    outputTokens: number | null;
    providerRequestId: string | null;
    traceId: string;
  },
): LlmRunRecord {
  return {
    id: deps.createId(),
    userId: request.userId ?? null,
    operation: request.operation,
    callSite: request.callSite,
    model: AI_GATEWAY_MODEL,
    promptVersion: request.promptVersion,
    schemaVersion: request.schemaVersion,
    inputHash: hashCanonicalJson({
      operation: request.operation,
      promptVersion: request.promptVersion,
      schemaVersion: request.schemaVersion,
      system: request.system,
      user: request.user,
    }),
    outputHash: fields.outputHash,
    status: fields.status,
    failureReason: fields.failureReason,
    latencyMs: Math.max(0, deps.now() - startedAt),
    inputTokens: fields.inputTokens,
    outputTokens: fields.outputTokens,
    estimatedCostUsd: estimateCostUsd(fields.inputTokens, fields.outputTokens),
    providerRequestId: fields.providerRequestId,
    traceId: fields.traceId,
    createdAt: new Date(deps.now()).toISOString(),
  };
}

/**
 * Run one consequential structured completion through the shared gateway.
 * Fail closed: never throw to callers; return review_unavailable and preserve work.
 * Never logs or persists raw user content — hashes only.
 */
export async function completeStructured<T>(
  request: StructuredCompletionRequest<T>,
  deps: GatewayDependencies = {},
): Promise<GatewayResult<T>> {
  const now = deps.now ?? Date.now;
  const createId = deps.createId ?? randomUUID;
  const complete = deps.complete ?? defaultComplete;
  const startedAt = now();
  const traceId = createId();
  const operation = getAiOperation(request.operation);
  const timeoutMs = request.timeoutMs ?? operation.timeoutMs;
  const maxRetry = request.maxRetry ?? operation.maxRetry;

  const fail = async (
    reason: GatewayFailureReason,
    extras: Partial<
      Pick<
        LlmRunRecord,
        "inputTokens" | "outputTokens" | "providerRequestId" | "outputHash"
      >
    > = {},
  ): Promise<GatewayResult<T>> => {
    warnUnavailable(reason, request.operation, traceId);
    const run = buildRun(
      request,
      { createId, now },
      startedAt,
      {
        status: "review_unavailable",
        failureReason: reason,
        outputHash: extras.outputHash ?? null,
        inputTokens: extras.inputTokens ?? null,
        outputTokens: extras.outputTokens ?? null,
        providerRequestId: extras.providerRequestId ?? null,
        traceId,
      },
    );
    await persistSafely(deps.persistRun, run);
    return { status: "review_unavailable", reason, data: null, run };
  };

  if (operation.model !== AI_GATEWAY_MODEL) {
    return fail("invalid_model");
  }
  if (!includesSafetyPrompt(request.system)) {
    return fail("missing_safety_prompt");
  }

  let lastError: unknown = null;
  const attempts = maxRetry + 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const completion = await complete(
        request as StructuredCompletionRequest<unknown>,
        AbortSignal.timeout(timeoutMs),
      );

      if (completion.parsed == null) {
        return fail("empty_response", {
          inputTokens: completion.inputTokens ?? null,
          outputTokens: completion.outputTokens ?? null,
          providerRequestId: completion.id ?? null,
        });
      }

      const parsed = request.schema.safeParse(completion.parsed);
      if (!parsed.success) {
        return fail("malformed", {
          inputTokens: completion.inputTokens ?? null,
          outputTokens: completion.outputTokens ?? null,
          providerRequestId: completion.id ?? null,
          outputHash: hashCanonicalJson(completion.parsed),
        });
      }

      const run = buildRun(
        request,
        { createId, now },
        startedAt,
        {
          status: "ok",
          failureReason: null,
          outputHash: hashCanonicalJson(parsed.data),
          inputTokens: completion.inputTokens ?? null,
          outputTokens: completion.outputTokens ?? null,
          providerRequestId: completion.id ?? null,
          traceId,
        },
      );
      await persistSafely(deps.persistRun, run);
      return { status: "ok", data: parsed.data, run };
    } catch (error) {
      lastError = error;
      const retryable = isRetryableProviderError(error) && attempt < maxRetry;
      if (!retryable) {
        return fail(classifyError(error));
      }
    }
  }

  return fail(classifyError(lastError));
}

export { SAFETY_PROMPT };
