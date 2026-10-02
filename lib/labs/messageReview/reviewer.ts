import { completeStructured } from "@/lib/ai/gateway";
import type {
  GatewayDependencies,
  GatewayResult,
} from "@/lib/ai/types";
import { AI_OPERATIONS } from "@/lib/ai/operationRegistry";
import {
  inspectMessageReviewArtifact,
  repairBlockingMessageReviewRevision,
  reconcileSpecialistReview,
} from "./deterministicChecks";
import { buildSpecialistReviewPrompt } from "./reviewPrompt";
import {
  MessageReviewResultSchema,
  ReviewMessageArtifactInputSchema,
  createUnavailableReviewResult,
} from "./schemas";
import type {
  ClaimProofMapping,
  MessageReviewArtifact,
  MessageReviewContext,
  MessageReviewResult,
} from "./types";
import {
  validateClaimMappingIntegrity,
  validateIssueIntegrity,
} from "./validation";

export interface ReviewMessageArtifactOptions {
  userId?: string | null;
  completeStructured?: typeof completeStructured;
  gatewayDeps?: GatewayDependencies;
}

function completeRowClaimMappings(
  context: MessageReviewContext,
  artifact: MessageReviewArtifact,
  mappings: ClaimProofMapping[],
): ClaimProofMapping[] {
  const completed = [...mappings];
  const mappedRows = new Set(
    mappings
      .map((mapping) => mapping.rowId)
      .filter((rowId): rowId is string => Boolean(rowId)),
  );
  const proofStatusById = new Map(
    context.proofs.map((proof) => [proof.id, proof.status] as const),
  );
  const audit = inspectMessageReviewArtifact(context, artifact);

  for (const row of artifact.rows) {
    if (mappedRows.has(row.rowId)) continue;

    const hasClaimFailure = audit.failures.some(
      (failure) =>
        failure.rowId === row.rowId && failure.ruleId === "claim_to_proof",
    );
    const hasHypothesisProof = row.proofRefs.some(
      (proofRef) => proofStatusById.get(proofRef) === "hypothesis",
    );
    completed.push({
      rowId: row.rowId,
      field: "valueClaim",
      claim: row.valueClaim,
      proofRefs: row.proofRefs,
      status: hasHypothesisProof
        ? "hypothesis"
        : hasClaimFailure
          ? "unsupported"
          : "supported",
    });
  }

  return completed;
}

function clearedClaimMappingsAreSafe(result: MessageReviewResult): boolean {
  if (result.status !== "checklist_cleared") return true;

  return result.claimMappings.every((mapping) => {
    if (mapping.status === "unsupported") return false;
    if (mapping.status === "supported") return mapping.proofRefs.length > 0;
    return /\b(hypothesis|may|might|could|we expect|we believe|we estimate)\b/i.test(
      mapping.claim,
    );
  });
}

function unavailable(
  artifact: MessageReviewArtifact,
  reason:
    | "empty_model_response"
    | "invalid_revision"
    | "invalid_issue_location"
    | "invalid_claim_mapping"
      | "unsafe_revision"
    | "unsafe_clearance"
    | "request_failed",
): MessageReviewResult {
  console.warn(`[message-review/review] unavailable:${reason}`);
  return createUnavailableReviewResult(artifact);
}

/**
 * Run the server-authoritative pressure test and fail closed on any malformed result.
 * The model call goes through lib/ai/gateway.ts — this file does not fork a second rubric.
 */
export async function reviewMessageArtifact(
  context: MessageReviewContext,
  artifact: MessageReviewArtifact,
  options: ReviewMessageArtifactOptions = {},
): Promise<MessageReviewResult> {
  try {
    const audit = inspectMessageReviewArtifact(context, artifact);
    const prompt = buildSpecialistReviewPrompt(context, artifact);
    const operation = AI_OPERATIONS.matrix_review;
    const complete = options.completeStructured ?? completeStructured;
    const completion: GatewayResult<MessageReviewResult> = await complete(
      {
        operation: operation.operation,
        callSite: "lib/labs/messageReview/reviewer.reviewMessageArtifact",
        userId: options.userId ?? null,
        promptVersion: operation.promptVersion,
        schemaVersion: operation.schemaVersion,
        schemaName: operation.schemaName,
        schema: MessageReviewResultSchema,
        system: prompt.system,
        user: prompt.user,
        timeoutMs: operation.timeoutMs,
        maxRetry: operation.maxRetry,
        maxTokens: 4_000,
        temperature: 0,
      },
      options.gatewayDeps,
    );

    if (completion.status !== "ok") {
      return unavailable(artifact, "request_failed");
    }
    const modelResult = completion.data;
    if (!modelResult) return unavailable(artifact, "empty_model_response");

    const revisedArtifact = ReviewMessageArtifactInputSchema.safeParse(
      modelResult.revisedArtifact,
    );
    if (!revisedArtifact.success) {
      return unavailable(artifact, "invalid_revision");
    }

    const reconciledModelResult = reconcileSpecialistReview(
      artifact,
      {
        ...modelResult,
        claimMappings: completeRowClaimMappings(
          context,
          artifact,
          modelResult.claimMappings,
        ),
        revisedArtifact: revisedArtifact.data,
      },
      audit,
    );
    const repairedRevision = repairBlockingMessageReviewRevision(
      context,
      reconciledModelResult.revisedArtifact,
    );
    if (
      inspectMessageReviewArtifact(context, repairedRevision).failures.some(
        (failure) => failure.severity === "blocking",
      )
    ) {
      return unavailable(artifact, "unsafe_revision");
    }
    const reconciled: MessageReviewResult = {
      ...reconciledModelResult,
      revisedArtifact: repairedRevision,
    };

    if (
      validateIssueIntegrity(context, artifact, reconciled.issues).length > 0
    ) {
      return unavailable(artifact, "invalid_issue_location");
    }
    const claimMappingErrors = validateClaimMappingIntegrity(
      context,
      artifact,
      reconciled.claimMappings,
    );
    if (claimMappingErrors.length > 0) {
      return unavailable(artifact, "invalid_claim_mapping");
    }
    if (!clearedClaimMappingsAreSafe(reconciled)) {
      return unavailable(artifact, "unsafe_clearance");
    }

    return reconciled;
  } catch {
    return unavailable(artifact, "request_failed");
  }
}
