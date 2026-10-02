import { randomUUID } from "crypto";
import { completeStructured } from "@/lib/ai/gateway";
import type { GatewayDependencies, LlmRunRecord } from "@/lib/ai/types";
import { inspectMessageReviewArtifact } from "@/lib/labs/messageReview/deterministicChecks";
import { SPECIALIST_REVIEW_VERSION } from "@/lib/labs/messageReview/reviewPrompt";
import {
  reviewMessageArtifact,
  type ReviewMessageArtifactOptions,
} from "@/lib/labs/messageReview/reviewer";
import { createUnavailableReviewResult } from "@/lib/labs/messageReview/schemas";
import type {
  MessageReviewArtifact,
  MessageReviewContext,
  MessageReviewFixture,
  MessageReviewResult,
  ReviewRuleId,
} from "@/lib/labs/messageReview/types";
import {
  getSeededCapabilityApplication,
  WEDGE_APPLICATION_STABLE_KEY,
} from "./application";
import { loadEditorialSourcePacket } from "./packet";
import type { WedgeRepository } from "./repository";
import {
  DETERMINISTIC_EVALUATOR_VERSION,
  MATRIX_REVIEW_EVALUATOR_KEY,
  MESSAGE_MATRIX_SCHEMA_VERSION,
  WORK_CONTEXT_SCHEMA_VERSION,
  type AttemptBundle,
  type EvaluationCriterion,
  type EvaluationRecord,
  type EvaluationStatus,
} from "./types";

const ALL_CRITERIA: ReviewRuleId[] = [
  "claim_to_proof",
  "audience_action_fit",
  "differentiation",
  "objection_quality",
  "channel_fit",
  "constraint_compliance",
  "prompt_injection",
];

export interface PersistFixtureSpineInput {
  userId: string;
  fixture: MessageReviewFixture;
  idempotencyKey?: string;
  now?: Date;
}

/**
 * Map a deterministic audit onto the evaluation status contract.
 */
export function statusFromReviewResult(
  result: MessageReviewResult,
): EvaluationStatus {
  if (result.status === "unavailable") return "review_unavailable";
  return result.status;
}

function criteriaFromResult(
  userId: string,
  evaluationId: string,
  result: MessageReviewResult,
): EvaluationCriterion[] {
  const failed = new Map(
    result.issues.map((issue) => [issue.ruleId, issue] as const),
  );

  return ALL_CRITERIA.map((criterionKey) => {
    const issue = failed.get(criterionKey);
    return {
      evaluationId,
      userId,
      criterionKey,
      outcome:
        result.status === "unavailable"
          ? "not_evaluated"
          : issue
            ? "fail"
            : "pass",
      confidence: null,
      rationale: issue?.explanation ?? null,
      evidenceRefs: issue?.proofRefs ?? [],
    };
  });
}

function resultFromDeterministicAudit(
  context: MessageReviewContext,
  artifact: MessageReviewArtifact,
): MessageReviewResult {
  const audit = inspectMessageReviewArtifact(context, artifact);
  const hasBlocking = audit.failures.some(
    (failure) => failure.severity === "blocking",
  );
  const hasMaterial = audit.failures.some(
    (failure) => failure.severity === "material",
  );

  return {
    status: hasBlocking
      ? "blocking_issues"
      : hasMaterial
        ? "material_revisions"
        : "checklist_cleared",
    issues: audit.failures,
    claimMappings: artifact.rows.map((row) => ({
      rowId: row.rowId,
      field: "valueClaim" as const,
      claim: row.valueClaim,
      proofRefs: row.proofRefs,
      status: row.proofRefs.some((proofRef) =>
        context.proofs.some(
          (proof) => proof.id === proofRef && proof.status === "hypothesis",
        ),
      )
        ? ("hypothesis" as const)
        : audit.failures.some(
              (failure) =>
                failure.rowId === row.rowId &&
                failure.ruleId === "claim_to_proof",
            )
          ? ("unsupported" as const)
          : ("supported" as const),
    })),
    revisedArtifact: artifact,
  };
}

function hasDeterministicSpine(bundle: AttemptBundle): boolean {
  const hasContext = bundle.artifacts.some(
    (artifact) =>
      artifact.artifactType === "work_context" && artifact.currentVersionId,
  );
  const hasMatrix = bundle.artifacts.some(
    (artifact) =>
      artifact.artifactType === "message_matrix" && artifact.currentVersionId,
  );
  const hasEvaluation = bundle.evaluations.some(
    (evaluation) =>
      evaluation.evaluatorKey === MATRIX_REVIEW_EVALUATOR_KEY &&
      evaluation.evaluatorVersion === DETERMINISTIC_EVALUATOR_VERSION,
  );
  return hasContext && hasMatrix && hasEvaluation;
}

/**
 * Persist attempt → work_context → message_matrix → evaluation for one lab fixture.
 * Uses deterministic checks so CI does not call the model.
 */
export async function persistFixtureSpine(
  repo: WedgeRepository,
  input: PersistFixtureSpineInput,
): Promise<AttemptBundle> {
  const application =
    (await repo.getApplicationByStableKey(WEDGE_APPLICATION_STABLE_KEY)) ??
    (await repo.seedApplication(getSeededCapabilityApplication()));
  const sourcePacket = loadEditorialSourcePacket(input.now);
  const attempt = await repo.getOrCreateAttempt({
    userId: input.userId,
    application,
    sourcePacket,
    idempotencyKey:
      input.idempotencyKey ??
      `${WEDGE_APPLICATION_STABLE_KEY}:${input.fixture.id}`,
  });

  const existing = await repo.getAttemptBundle(input.userId, attempt.id);
  if (existing && hasDeterministicSpine(existing)) {
    return existing;
  }

  await repo.saveArtifactVersion({
    userId: input.userId,
    attemptId: attempt.id,
    artifactType: "work_context",
    content: input.fixture.context,
    schemaVersion: WORK_CONTEXT_SCHEMA_VERSION,
    createdBy: "user",
    status: "confirmed",
  });
  const matrixVersion = await repo.saveArtifactVersion({
    userId: input.userId,
    attemptId: attempt.id,
    artifactType: "message_matrix",
    content: input.fixture.artifact,
    schemaVersion: MESSAGE_MATRIX_SCHEMA_VERSION,
    createdBy: "user",
    status: "draft",
  });

  const result = resultFromDeterministicAudit(
    input.fixture.context,
    input.fixture.artifact,
  );
  const evaluationId = randomUUID();
  await repo.saveEvaluation({
    evaluation: {
      id: evaluationId,
      userId: input.userId,
      attemptId: attempt.id,
      artifactVersionId: matrixVersion.id,
      contentHash: matrixVersion.contentHash,
      evaluatorKey: MATRIX_REVIEW_EVALUATOR_KEY,
      evaluatorVersion: DETERMINISTIC_EVALUATOR_VERSION,
      promptVersion: "none",
      rubricVersion: SPECIALIST_REVIEW_VERSION,
      llmRunId: null,
      status: statusFromReviewResult(result),
      result,
      confidence: 1,
      createdAt: new Date().toISOString(),
    },
    criteria: criteriaFromResult(input.userId, evaluationId, result),
  });

  const bundle = await repo.getAttemptBundle(input.userId, attempt.id);
  if (!bundle) {
    throw new Error("Failed to reload persisted attempt.");
  }
  return bundle;
}

export interface PersistGatewayEvaluationInput {
  userId: string;
  attemptId: string;
  artifactVersionId: string;
  contentHash: string;
  context: MessageReviewContext;
  artifact: MessageReviewArtifact;
  gatewayDeps?: GatewayDependencies;
}

/**
 * Run the lab reviewer behind the gateway and persist the evaluation.
 * On timeout, malformed output, or provider error: review_unavailable,
 * original artifact preserved, no criterion treated as evidence.
 */
export async function persistGatewayEvaluation(
  repo: WedgeRepository,
  input: PersistGatewayEvaluationInput,
): Promise<EvaluationRecord> {
  let llmRunId: string | null = null;
  const persistRun = async (run: LlmRunRecord): Promise<void> => {
    await repo.saveLlmRun(run);
    llmRunId = run.id;
    await input.gatewayDeps?.persistRun?.(run);
  };
  const options: ReviewMessageArtifactOptions = {
    userId: input.userId,
    completeStructured,
    gatewayDeps: {
      ...input.gatewayDeps,
      persistRun,
    },
  };

  const result = await reviewMessageArtifact(
    input.context,
    input.artifact,
    options,
  );
  const evaluationId = randomUUID();

  return repo.saveEvaluation({
    evaluation: {
      id: evaluationId,
      userId: input.userId,
      attemptId: input.attemptId,
      artifactVersionId: input.artifactVersionId,
      contentHash: input.contentHash,
      evaluatorKey: MATRIX_REVIEW_EVALUATOR_KEY,
      evaluatorVersion: SPECIALIST_REVIEW_VERSION,
      promptVersion: SPECIALIST_REVIEW_VERSION,
      rubricVersion: SPECIALIST_REVIEW_VERSION,
      llmRunId,
      status: statusFromReviewResult(result),
      result:
        result.status === "unavailable"
          ? createUnavailableReviewResult(input.artifact)
          : result,
      confidence: result.status === "unavailable" ? null : 1,
      createdAt: new Date().toISOString(),
    },
    criteria: criteriaFromResult(input.userId, evaluationId, result),
  });
}
