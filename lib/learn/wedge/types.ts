import type { LlmRunRecord } from "@/lib/ai/types";
import type {
  MessageReviewArtifact,
  MessageReviewContext,
  MessageReviewResult,
  ReviewRuleId,
} from "@/lib/labs/messageReview/types";

export type WedgeArtifactType = "work_context" | "message_matrix";
export type WedgeAttemptState = "in_progress" | "completed" | "abandoned";
export type WedgeArtifactStatus = "draft" | "confirmed" | "superseded";
export type WedgeDeliveryContext = "solo" | "room";
export type EvaluationStatus =
  | "blocking_issues"
  | "material_revisions"
  | "checklist_cleared"
  | "review_unavailable";
export type CriterionOutcome = "pass" | "fail" | "abstain" | "not_evaluated";

export interface EvidenceRubricCriterion {
  key: ReviewRuleId;
  blocking: boolean;
  summary: string;
}

export interface EvidenceRubric {
  schema_version: string;
  evaluator_key: string;
  allowed_copy: string;
  criteria: readonly EvidenceRubricCriterion[];
}

export interface CapabilityApplication {
  id: string;
  stableKey: string;
  version: number;
  professionalFunction: string;
  roleArchetype: string;
  workflow: string;
  targetBehavior: string;
  evidenceRubric: EvidenceRubric;
  status: "draft" | "allowlisted" | "retired";
}

export interface EditorialSourcePacket {
  schema_version: "editorial_source_packet_v0";
  application_stable_key: string;
  dated: string;
  expires_at: string;
  status: "editorial_approved";
  why_now_label: "editorial_next_step";
  why_now: string;
  audience: string;
  workflow: string;
  proof_hygiene: string[];
  sources: Array<{
    title: string;
    kind: "editorial";
    note: string;
  }>;
  packet_hash: string;
}

export interface LearningAttempt {
  id: string;
  userId: string;
  applicationId: string;
  applicationVersion: number;
  sourcePacketId: string | null;
  sourcePacket: EditorialSourcePacket;
  sourcePacketHash: string;
  deliveryContext: WedgeDeliveryContext;
  roomId: string | null;
  state: WedgeAttemptState;
  currentActivityId: string | null;
  idempotencyKey: string | null;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
}

export interface Artifact {
  id: string;
  userId: string;
  attemptId: string;
  artifactType: WedgeArtifactType;
  status: WedgeArtifactStatus;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactVersion {
  id: string;
  userId: string;
  artifactId: string;
  version: number;
  parentVersionId: string | null;
  sourcePacketHash: string;
  schemaVersion: string;
  content: MessageReviewContext | MessageReviewArtifact;
  contentHash: string;
  createdBy: "user" | "system";
  llmRunId: string | null;
  createdAt: string;
}

export interface EvaluationCriterion {
  evaluationId: string;
  userId: string;
  criterionKey: ReviewRuleId;
  outcome: CriterionOutcome;
  confidence: number | null;
  rationale: string | null;
  evidenceRefs: string[];
}

export interface EvaluationRecord {
  id: string;
  userId: string;
  attemptId: string;
  artifactVersionId: string;
  contentHash: string;
  evaluatorKey: string;
  evaluatorVersion: string;
  promptVersion: string;
  rubricVersion: string;
  llmRunId: string | null;
  status: EvaluationStatus;
  result: MessageReviewResult;
  confidence: number | null;
  createdAt: string;
  criteria: EvaluationCriterion[];
}

export interface AttemptBundle {
  attempt: LearningAttempt;
  artifacts: Artifact[];
  versions: ArtifactVersion[];
  evaluations: EvaluationRecord[];
  llmRuns: LlmRunRecord[];
}

export const WORK_CONTEXT_SCHEMA_VERSION = "work_context_v0";
export const MESSAGE_MATRIX_SCHEMA_VERSION = "message_matrix_v0";
export const DETERMINISTIC_EVALUATOR_VERSION = "deterministic_v1";
export const MATRIX_REVIEW_EVALUATOR_KEY = "matrix_review";
