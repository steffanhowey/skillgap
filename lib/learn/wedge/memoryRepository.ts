import { randomUUID } from "crypto";
import { hashCanonicalJson } from "@/lib/ai/hash";
import type { LlmRunRecord } from "@/lib/ai/types";
import type {
  SaveArtifactVersionInput,
  SaveEvaluationInput,
  WedgeRepository,
} from "./repository";
import type {
  Artifact,
  ArtifactVersion,
  AttemptBundle,
  CapabilityApplication,
  EvaluationRecord,
  LearningAttempt,
} from "./types";

/**
 * In-memory Track F store for spine tests. Mirrors the v0 table shape.
 */
export class MemoryWedgeRepository implements WedgeRepository {
  private readonly applications = new Map<string, CapabilityApplication>();
  private readonly attempts = new Map<string, LearningAttempt>();
  private readonly artifacts = new Map<string, Artifact>();
  private readonly versions = new Map<string, ArtifactVersion>();
  private readonly evaluations = new Map<string, EvaluationRecord>();
  private readonly llmRuns = new Map<string, LlmRunRecord>();

  async getApplicationByStableKey(
    stableKey: string,
  ): Promise<CapabilityApplication | null> {
    return (
      [...this.applications.values()].find((row) => row.stableKey === stableKey) ??
      null
    );
  }

  async seedApplication(
    application: CapabilityApplication,
  ): Promise<CapabilityApplication> {
    this.applications.set(application.id, application);
    return application;
  }

  async getOrCreateAttempt(input: {
    userId: string;
    application: CapabilityApplication;
    sourcePacket: import("./types").EditorialSourcePacket;
    idempotencyKey: string;
  }): Promise<LearningAttempt> {
    const existing = [...this.attempts.values()].find(
      (row) =>
        row.userId === input.userId &&
        row.idempotencyKey === input.idempotencyKey,
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const attempt: LearningAttempt = {
      id: randomUUID(),
      userId: input.userId,
      applicationId: input.application.id,
      applicationVersion: input.application.version,
      sourcePacketId: null,
      sourcePacket: input.sourcePacket,
      sourcePacketHash: input.sourcePacket.packet_hash,
      deliveryContext: "solo",
      roomId: null,
      state: "in_progress",
      currentActivityId: "context",
      idempotencyKey: input.idempotencyKey,
      startedAt: now,
      lastActivityAt: now,
      completedAt: null,
    };
    this.attempts.set(attempt.id, attempt);
    return attempt;
  }

  async getAttempt(
    userId: string,
    attemptId: string,
  ): Promise<LearningAttempt | null> {
    const attempt = this.attempts.get(attemptId);
    if (!attempt || attempt.userId !== userId) return null;
    return attempt;
  }

  async updateAttemptActivity(
    userId: string,
    attemptId: string,
    currentActivityId: string,
  ): Promise<void> {
    const attempt = await this.getAttempt(userId, attemptId);
    if (!attempt) throw new Error("Attempt not found for user.");
    attempt.currentActivityId = currentActivityId;
    attempt.lastActivityAt = new Date().toISOString();
  }

  async saveArtifactVersion(
    input: SaveArtifactVersionInput,
  ): Promise<ArtifactVersion> {
    const attempt = this.attempts.get(input.attemptId);
    if (!attempt || attempt.userId !== input.userId) {
      throw new Error("Attempt not found for user.");
    }

    let artifact = [...this.artifacts.values()].find(
      (row) =>
        row.attemptId === input.attemptId &&
        row.artifactType === input.artifactType,
    );
    const now = new Date().toISOString();
    if (!artifact) {
      artifact = {
        id: randomUUID(),
        userId: input.userId,
        attemptId: input.attemptId,
        artifactType: input.artifactType,
        status: input.status ?? "draft",
        currentVersionId: null,
        createdAt: now,
        updatedAt: now,
      };
      this.artifacts.set(artifact.id, artifact);
    }

    const priorVersions = [...this.versions.values()]
      .filter((row) => row.artifactId === artifact.id)
      .sort((a, b) => a.version - b.version);
    const parent = priorVersions.at(-1) ?? null;
    const version: ArtifactVersion = {
      id: randomUUID(),
      userId: input.userId,
      artifactId: artifact.id,
      version: (parent?.version ?? 0) + 1,
      parentVersionId: parent?.id ?? null,
      sourcePacketHash: attempt.sourcePacketHash,
      schemaVersion: input.schemaVersion,
      content: input.content,
      contentHash: hashCanonicalJson(input.content),
      createdBy: input.createdBy,
      llmRunId: input.llmRunId ?? null,
      createdAt: now,
    };
    this.versions.set(version.id, version);
    artifact.currentVersionId = version.id;
    artifact.status = input.status ?? artifact.status;
    artifact.updatedAt = now;
    attempt.lastActivityAt = now;
    attempt.currentActivityId = input.artifactType;
    return version;
  }

  async saveEvaluation(input: SaveEvaluationInput): Promise<EvaluationRecord> {
    const attempt = this.attempts.get(input.evaluation.attemptId);
    if (!attempt || attempt.userId !== input.evaluation.userId) {
      throw new Error("Attempt not found for user.");
    }

    const existing = [...this.evaluations.values()].find(
      (row) =>
        row.artifactVersionId === input.evaluation.artifactVersionId &&
        row.evaluatorKey === input.evaluation.evaluatorKey &&
        row.evaluatorVersion === input.evaluation.evaluatorVersion &&
        row.rubricVersion === input.evaluation.rubricVersion,
    );
    const evaluationId = existing?.id ?? input.evaluation.id;
    if (existing && existing.id !== evaluationId) {
      this.evaluations.delete(existing.id);
    }
    const record: EvaluationRecord = {
      ...input.evaluation,
      id: evaluationId,
      criteria: input.criteria.map((criterion) => ({
        ...criterion,
        evaluationId,
        userId: input.evaluation.userId,
      })),
    };
    this.evaluations.set(record.id, record);
    attempt.lastActivityAt = new Date().toISOString();
    attempt.currentActivityId = "review";
    return record;
  }

  async saveLlmRun(run: LlmRunRecord): Promise<LlmRunRecord> {
    this.llmRuns.set(run.id, run);
    return run;
  }

  async getAttemptBundle(
    userId: string,
    attemptId: string,
  ): Promise<AttemptBundle | null> {
    const attempt = await this.getAttempt(userId, attemptId);
    if (!attempt) return null;

    const artifacts = [...this.artifacts.values()].filter(
      (row) => row.attemptId === attemptId && row.userId === userId,
    );
    const artifactIds = new Set(artifacts.map((row) => row.id));
    const versions = [...this.versions.values()].filter((row) =>
      artifactIds.has(row.artifactId),
    );
    const evaluations = [...this.evaluations.values()].filter(
      (row) => row.attemptId === attemptId && row.userId === userId,
    );
    const linkedRunIds = new Set(
      [
        ...evaluations.map((row) => row.llmRunId),
        ...versions.map((row) => row.llmRunId),
      ].filter((id): id is string => Boolean(id)),
    );
    const llmRuns = [...this.llmRuns.values()].filter(
      (row) => row.userId === userId && linkedRunIds.has(row.id),
    );

    return { attempt, artifacts, versions, evaluations, llmRuns };
  }
}
