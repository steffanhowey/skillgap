import type { MessageReviewArtifact, MessageReviewContext } from "@/lib/labs/messageReview/types";
import { WEDGE_PLAYER_STEPS, type WedgePlayerStep } from "./config";
import type { AttemptBundle, EvaluationRecord } from "./types";

export interface WedgePlayerSnapshot {
  attemptId: string;
  step: WedgePlayerStep;
  context: MessageReviewContext | null;
  matrix: MessageReviewArtifact | null;
  evaluatedMatrix: MessageReviewArtifact | null;
  evaluation: EvaluationRecord | null;
  reviewUnavailable: boolean;
  hasSavedArtifact: boolean;
}

/**
 * Latest artifact version of a type, if present.
 */
export function latestVersionContent(
  bundle: AttemptBundle,
  artifactType: "work_context" | "message_matrix",
): { id: string; content: MessageReviewContext | MessageReviewArtifact } | null {
  const artifact = bundle.artifacts.find((row) => row.artifactType === artifactType);
  if (!artifact?.currentVersionId) return null;
  const version = bundle.versions.find((row) => row.id === artifact.currentVersionId);
  if (!version) return null;
  return { id: version.id, content: version.content };
}

/**
 * Evaluation bound to the current matrix version, or the newest evaluation.
 */
export function latestEvaluation(bundle: AttemptBundle): EvaluationRecord | null {
  const matrix = latestVersionContent(bundle, "message_matrix");
  const matching = matrix
    ? bundle.evaluations.filter((row) => row.artifactVersionId === matrix.id)
    : bundle.evaluations;
  return (
    [...matching].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1) ??
    null
  );
}

/**
 * Resume the founder path from persisted work, not from client memory.
 */
export function deriveWedgePlayerStep(bundle: AttemptBundle): WedgePlayerStep {
  if (bundle.attempt.currentActivityId === "export") return "export";

  const context = latestVersionContent(bundle, "work_context");
  if (!context) return "context";

  const matrix = latestVersionContent(bundle, "message_matrix");
  if (!matrix) return "matrix";

  const evaluation = latestEvaluation(bundle);
  if (!evaluation || evaluation.status === "review_unavailable") {
    return "review";
  }

  if (evaluation.artifactVersionId === matrix.id) return "diff";
  return "export";
}

/**
 * Owner-safe snapshot for the allowlisted player.
 */
export function toWedgePlayerSnapshot(bundle: AttemptBundle): WedgePlayerSnapshot {
  const context = latestVersionContent(bundle, "work_context");
  const matrix = latestVersionContent(bundle, "message_matrix");
  const evaluation = latestEvaluation(bundle);
  const evaluatedVersion = evaluation
    ? bundle.versions.find((row) => row.id === evaluation.artifactVersionId)
    : null;

  return {
    attemptId: bundle.attempt.id,
    step: deriveWedgePlayerStep(bundle),
    context: context ? (context.content as MessageReviewContext) : null,
    matrix: matrix ? (matrix.content as MessageReviewArtifact) : null,
    evaluatedMatrix: evaluatedVersion
      ? (evaluatedVersion.content as MessageReviewArtifact)
      : null,
    evaluation,
    reviewUnavailable: evaluation?.status === "review_unavailable",
    hasSavedArtifact: bundle.artifacts.length > 0,
  };
}

/**
 * Narrow an API payload to the owner-safe player snapshot.
 */
export function isWedgePlayerSnapshot(
  value: unknown,
): value is WedgePlayerSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.attemptId === "string" &&
    typeof row.step === "string" &&
    WEDGE_PLAYER_STEPS.includes(row.step as WedgePlayerStep)
  );
}
