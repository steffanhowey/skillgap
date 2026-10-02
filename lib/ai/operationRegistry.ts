import { SPECIALIST_REVIEW_VERSION } from "@/lib/labs/messageReview/reviewPrompt";

export const AI_GATEWAY_MODEL = "gpt-4o-mini" as const;

export type AiOperationName =
  | "matrix_review"
  | "context_extract"
  | "revision_propose";

export interface AiOperationDefinition {
  operation: AiOperationName;
  model: typeof AI_GATEWAY_MODEL;
  timeoutMs: number;
  maxRetry: number;
  promptVersion: string;
  schemaVersion: string;
  schemaName: string;
}

/**
 * Thin registry for Track F consequential calls.
 * Days 1–4 implement matrix_review only; other keys are reserved.
 */
export const AI_OPERATIONS: Record<AiOperationName, AiOperationDefinition> = {
  matrix_review: {
    operation: "matrix_review",
    model: AI_GATEWAY_MODEL,
    timeoutMs: 20_000,
    maxRetry: 1,
    promptVersion: SPECIALIST_REVIEW_VERSION,
    schemaVersion: "message_review_result_v1",
    schemaName: "claim_safe_message_review",
  },
  context_extract: {
    operation: "context_extract",
    model: AI_GATEWAY_MODEL,
    timeoutMs: 20_000,
    maxRetry: 1,
    promptVersion: "message_review_extract_v1",
    schemaVersion: "message_review_extraction_v1",
    schemaName: "message_review_extraction",
  },
  revision_propose: {
    operation: "revision_propose",
    model: AI_GATEWAY_MODEL,
    timeoutMs: 20_000,
    maxRetry: 1,
    promptVersion: SPECIALIST_REVIEW_VERSION,
    schemaVersion: "message_review_result_v1",
    schemaName: "claim_safe_message_review",
  },
};

/**
 * Look up a registered operation. Unknown names are a programmer error.
 */
export function getAiOperation(operation: AiOperationName): AiOperationDefinition {
  return AI_OPERATIONS[operation];
}
