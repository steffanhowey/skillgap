import type { z } from "zod";
import type { AiOperationName } from "./operationRegistry";

export type GatewayFailureReason =
  | "timeout"
  | "malformed"
  | "provider_error"
  | "missing_safety_prompt"
  | "invalid_model"
  | "empty_response";

export type LlmRunStatus = "ok" | "review_unavailable";

export interface LlmRunRecord {
  id: string;
  userId: string | null;
  operation: AiOperationName;
  callSite: string;
  model: "gpt-4o-mini";
  promptVersion: string;
  schemaVersion: string;
  inputHash: string;
  outputHash: string | null;
  status: LlmRunStatus;
  failureReason: GatewayFailureReason | null;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
  providerRequestId: string | null;
  traceId: string;
  createdAt: string;
}

export interface StructuredCompletionRequest<T> {
  operation: AiOperationName;
  callSite: string;
  userId?: string | null;
  promptVersion: string;
  schemaVersion: string;
  schemaName: string;
  schema: z.ZodType<T>;
  system: string;
  user: string;
  timeoutMs?: number;
  maxRetry?: number;
  maxTokens?: number;
  temperature?: number;
}

export type GatewayResult<T> =
  | { status: "ok"; data: T; run: LlmRunRecord }
  | {
      status: "review_unavailable";
      reason: GatewayFailureReason;
      data: null;
      run: LlmRunRecord;
    };

export interface GatewayChatCompletion {
  id?: string | null;
  parsed: unknown;
  inputTokens?: number | null;
  outputTokens?: number | null;
}

export interface GatewayDependencies {
  complete?: (
    request: StructuredCompletionRequest<unknown>,
    signal: AbortSignal,
  ) => Promise<GatewayChatCompletion>;
  persistRun?: (run: LlmRunRecord) => Promise<void>;
  now?: () => number;
  createId?: () => string;
}
