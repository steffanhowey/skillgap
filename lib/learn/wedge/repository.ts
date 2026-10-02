import type { LlmRunRecord } from "@/lib/ai/types";
import type {
  MessageReviewArtifact,
  MessageReviewContext,
} from "@/lib/labs/messageReview/types";
import type {
  ArtifactVersion,
  AttemptBundle,
  CapabilityApplication,
  EditorialSourcePacket,
  EvaluationRecord,
  LearningAttempt,
  WedgeArtifactStatus,
  WedgeArtifactType,
} from "./types";

export interface SaveArtifactVersionInput {
  userId: string;
  attemptId: string;
  artifactType: WedgeArtifactType;
  content: MessageReviewContext | MessageReviewArtifact;
  schemaVersion: string;
  createdBy: "user" | "system";
  status?: WedgeArtifactStatus;
  llmRunId?: string | null;
}

export interface SaveEvaluationInput {
  evaluation: Omit<EvaluationRecord, "criteria">;
  criteria: EvaluationRecord["criteria"];
}

export interface WedgeRepository {
  getApplicationByStableKey(
    stableKey: string,
  ): Promise<CapabilityApplication | null>;
  seedApplication(
    application: CapabilityApplication,
  ): Promise<CapabilityApplication>;
  getOrCreateAttempt(input: {
    userId: string;
    application: CapabilityApplication;
    sourcePacket: EditorialSourcePacket;
    idempotencyKey: string;
  }): Promise<LearningAttempt>;
  getAttempt(userId: string, attemptId: string): Promise<LearningAttempt | null>;
  updateAttemptActivity(
    userId: string,
    attemptId: string,
    currentActivityId: string,
  ): Promise<void>;
  saveArtifactVersion(input: SaveArtifactVersionInput): Promise<ArtifactVersion>;
  saveEvaluation(input: SaveEvaluationInput): Promise<EvaluationRecord>;
  saveLlmRun(run: LlmRunRecord): Promise<LlmRunRecord>;
  getAttemptBundle(
    userId: string,
    attemptId: string,
  ): Promise<AttemptBundle | null>;
}
