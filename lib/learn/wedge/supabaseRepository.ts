import { createClient as createAdminClient } from "@/lib/supabase/admin";
import type { LlmRunRecord } from "@/lib/ai/types";
import type { AiOperationName } from "@/lib/ai/operationRegistry";
import { hashCanonicalJson } from "@/lib/ai/hash";
import type {
  MessageReviewArtifact,
  MessageReviewContext,
  MessageReviewResult,
  ReviewRuleId,
} from "@/lib/labs/messageReview/types";
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
  EditorialSourcePacket,
  EvaluationCriterion,
  EvaluationRecord,
  EvaluationStatus,
  LearningAttempt,
  WedgeArtifactType,
} from "./types";

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error("Expected a database row object.");
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Expected string for ${field}.`);
  }
  return value;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function mapApplication(row: Record<string, unknown>): CapabilityApplication {
  return {
    id: asString(row.id, "id"),
    stableKey: asString(row.stable_key, "stable_key"),
    version: Number(row.version),
    professionalFunction: asString(
      row.professional_function,
      "professional_function",
    ),
    roleArchetype: asString(row.role_archetype, "role_archetype"),
    workflow: asString(row.workflow, "workflow"),
    targetBehavior: asString(row.target_behavior, "target_behavior"),
    evidenceRubric: row.evidence_rubric as CapabilityApplication["evidenceRubric"],
    status: asString(row.status, "status") as CapabilityApplication["status"],
  };
}

function mapAttempt(row: Record<string, unknown>): LearningAttempt {
  return {
    id: asString(row.id, "id"),
    userId: asString(row.user_id, "user_id"),
    applicationId: asString(row.application_id, "application_id"),
    applicationVersion: Number(row.application_version),
    sourcePacketId: asStringOrNull(row.source_packet_id),
    sourcePacket: row.source_packet as EditorialSourcePacket,
    sourcePacketHash: asString(row.source_packet_hash, "source_packet_hash"),
    deliveryContext:
      asString(row.delivery_context, "delivery_context") as LearningAttempt["deliveryContext"],
    roomId: asStringOrNull(row.room_id),
    state: asString(row.state, "state") as LearningAttempt["state"],
    currentActivityId: asStringOrNull(row.current_activity_id),
    idempotencyKey: asStringOrNull(row.idempotency_key),
    startedAt: asString(row.started_at, "started_at"),
    lastActivityAt: asString(row.last_activity_at, "last_activity_at"),
    completedAt: asStringOrNull(row.completed_at),
  };
}

function mapArtifact(row: Record<string, unknown>): Artifact {
  return {
    id: asString(row.id, "id"),
    userId: asString(row.user_id, "user_id"),
    attemptId: asString(row.attempt_id, "attempt_id"),
    artifactType: asString(row.artifact_type, "artifact_type") as WedgeArtifactType,
    status: asString(row.status, "status") as Artifact["status"],
    currentVersionId: asStringOrNull(row.current_version_id),
    createdAt: asString(row.created_at, "created_at"),
    updatedAt: asString(row.updated_at, "updated_at"),
  };
}

function mapVersion(row: Record<string, unknown>): ArtifactVersion {
  return {
    id: asString(row.id, "id"),
    userId: asString(row.user_id, "user_id"),
    artifactId: asString(row.artifact_id, "artifact_id"),
    version: Number(row.version),
    parentVersionId: asStringOrNull(row.parent_version_id),
    sourcePacketHash: asString(row.source_packet_hash, "source_packet_hash"),
    schemaVersion: asString(row.schema_version, "schema_version"),
    content: row.content as MessageReviewContext | MessageReviewArtifact,
    contentHash: asString(row.content_hash, "content_hash"),
    createdBy: asString(row.created_by, "created_by") as ArtifactVersion["createdBy"],
    llmRunId: asStringOrNull(row.llm_run_id),
    createdAt: asString(row.created_at, "created_at"),
  };
}

function mapEvaluation(
  row: Record<string, unknown>,
  criteria: EvaluationCriterion[],
): EvaluationRecord {
  return {
    id: asString(row.id, "id"),
    userId: asString(row.user_id, "user_id"),
    attemptId: asString(row.attempt_id, "attempt_id"),
    artifactVersionId: asString(row.artifact_version_id, "artifact_version_id"),
    contentHash: asString(row.content_hash, "content_hash"),
    evaluatorKey: asString(row.evaluator_key, "evaluator_key"),
    evaluatorVersion: asString(row.evaluator_version, "evaluator_version"),
    promptVersion: asString(row.prompt_version, "prompt_version"),
    rubricVersion: asString(row.rubric_version, "rubric_version"),
    llmRunId: asStringOrNull(row.llm_run_id),
    status: asString(row.status, "status") as EvaluationStatus,
    result: row.result as MessageReviewResult,
    confidence: row.confidence == null ? null : Number(row.confidence),
    createdAt: asString(row.created_at, "created_at"),
    criteria,
  };
}

function mapCriterion(row: Record<string, unknown>): EvaluationCriterion {
  return {
    evaluationId: asString(row.evaluation_id, "evaluation_id"),
    userId: asString(row.user_id, "user_id"),
    criterionKey: asString(row.criterion_key, "criterion_key") as ReviewRuleId,
    outcome: asString(row.outcome, "outcome") as EvaluationCriterion["outcome"],
    confidence: row.confidence == null ? null : Number(row.confidence),
    rationale: asStringOrNull(row.rationale),
    evidenceRefs: Array.isArray(row.evidence_refs)
      ? (row.evidence_refs as string[])
      : [],
  };
}

function mapLlmRun(row: Record<string, unknown>): LlmRunRecord {
  return {
    id: asString(row.id, "id"),
    userId: asStringOrNull(row.user_id),
    operation: asString(row.operation, "operation") as AiOperationName,
    callSite: asString(row.call_site, "call_site"),
    model: "gpt-4o-mini",
    promptVersion: asString(row.prompt_version, "prompt_version"),
    schemaVersion: asStringOrNull(row.schema_version) ?? "",
    inputHash: asString(row.input_hash, "input_hash"),
    outputHash: asStringOrNull(row.output_hash),
    status: asString(row.status, "status") as LlmRunRecord["status"],
    failureReason:
      asStringOrNull(row.failure_reason) as LlmRunRecord["failureReason"],
    latencyMs: Number(row.latency_ms ?? 0),
    inputTokens: row.input_tokens == null ? null : Number(row.input_tokens),
    outputTokens: row.output_tokens == null ? null : Number(row.output_tokens),
    estimatedCostUsd:
      row.estimated_cost_usd == null ? null : Number(row.estimated_cost_usd),
    providerRequestId: asStringOrNull(row.provider_request_id),
    traceId: asString(row.trace_id, "trace_id"),
    createdAt: asString(row.created_at, "created_at"),
  };
}

/**
 * Service-role persistence for Track F. Callers must pass the authenticated user id.
 * Evaluation and LLM-run writes are service-role only; RLS still blocks cross-user reads.
 */
export class SupabaseWedgeRepository implements WedgeRepository {
  constructor(private readonly admin = createAdminClient()) {}

  async getApplicationByStableKey(
    stableKey: string,
  ): Promise<CapabilityApplication | null> {
    const { data, error } = await this.admin
      .from("fp_capability_applications")
      .select("*")
      .eq("stable_key", stableKey)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(`[wedge] load application failed: ${error.message}`);
    }
    return data ? mapApplication(asRecord(data)) : null;
  }

  async seedApplication(
    application: CapabilityApplication,
  ): Promise<CapabilityApplication> {
    const { data, error } = await this.admin
      .from("fp_capability_applications")
      .upsert({
        id: application.id,
        stable_key: application.stableKey,
        version: application.version,
        professional_function: application.professionalFunction,
        role_archetype: application.roleArchetype,
        workflow: application.workflow,
        target_behavior: application.targetBehavior,
        evidence_rubric: application.evidenceRubric,
        status: application.status,
      })
      .select("*")
      .single();
    if (error) {
      throw new Error(`[wedge] seed application failed: ${error.message}`);
    }
    return mapApplication(asRecord(data));
  }

  async getOrCreateAttempt(input: {
    userId: string;
    application: CapabilityApplication;
    sourcePacket: EditorialSourcePacket;
    idempotencyKey: string;
  }): Promise<LearningAttempt> {
    const { data: existing, error: existingError } = await this.admin
      .from("fp_learning_attempts")
      .select("*")
      .eq("user_id", input.userId)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existingError) {
      throw new Error(`[wedge] load attempt failed: ${existingError.message}`);
    }
    if (existing) return mapAttempt(asRecord(existing));

    const { data, error } = await this.admin
      .from("fp_learning_attempts")
      .insert({
        user_id: input.userId,
        application_id: input.application.id,
        application_version: input.application.version,
        source_packet_id: null,
        source_packet: input.sourcePacket,
        source_packet_hash: input.sourcePacket.packet_hash,
        delivery_context: "solo",
        state: "in_progress",
        current_activity_id: "context",
        idempotency_key: input.idempotencyKey,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        const { data: raced, error: raceError } = await this.admin
          .from("fp_learning_attempts")
          .select("*")
          .eq("user_id", input.userId)
          .eq("idempotency_key", input.idempotencyKey)
          .maybeSingle();
        if (raceError) {
          throw new Error(`[wedge] load attempt failed: ${raceError.message}`);
        }
        if (raced) return mapAttempt(asRecord(raced));
      }
      throw new Error(`[wedge] create attempt failed: ${error.message}`);
    }
    return mapAttempt(asRecord(data));
  }

  async getAttempt(
    userId: string,
    attemptId: string,
  ): Promise<LearningAttempt | null> {
    const { data, error } = await this.admin
      .from("fp_learning_attempts")
      .select("*")
      .eq("id", attemptId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      throw new Error(`[wedge] get attempt failed: ${error.message}`);
    }
    return data ? mapAttempt(asRecord(data)) : null;
  }

  async updateAttemptActivity(
    userId: string,
    attemptId: string,
    currentActivityId: string,
  ): Promise<void> {
    const { error } = await this.admin
      .from("fp_learning_attempts")
      .update({
        current_activity_id: currentActivityId,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", attemptId)
      .eq("user_id", userId);
    if (error) {
      throw new Error(`[wedge] update attempt activity failed: ${error.message}`);
    }
  }

  async saveArtifactVersion(
    input: SaveArtifactVersionInput,
  ): Promise<ArtifactVersion> {
    const attempt = await this.getAttempt(input.userId, input.attemptId);
    if (!attempt) throw new Error("Attempt not found for user.");

    const { data: existingArtifact, error: artifactError } = await this.admin
      .from("fp_artifacts")
      .select("*")
      .eq("attempt_id", input.attemptId)
      .eq("user_id", input.userId)
      .eq("artifact_type", input.artifactType)
      .maybeSingle();
    if (artifactError) {
      throw new Error(`[wedge] load artifact failed: ${artifactError.message}`);
    }

    let artifact = existingArtifact
      ? mapArtifact(asRecord(existingArtifact))
      : null;
    if (!artifact) {
      const { data, error } = await this.admin
        .from("fp_artifacts")
        .insert({
          user_id: input.userId,
          attempt_id: input.attemptId,
          artifact_type: input.artifactType,
          status: input.status ?? "draft",
        })
        .select("*")
        .single();
      if (error) {
        if (error.code === "23505") {
          const { data: raced, error: raceError } = await this.admin
            .from("fp_artifacts")
            .select("*")
            .eq("attempt_id", input.attemptId)
            .eq("user_id", input.userId)
            .eq("artifact_type", input.artifactType)
            .maybeSingle();
          if (raceError || !raced) {
            throw new Error(`[wedge] create artifact failed: ${error.message}`);
          }
          artifact = mapArtifact(asRecord(raced));
        } else {
          throw new Error(`[wedge] create artifact failed: ${error.message}`);
        }
      } else {
        artifact = mapArtifact(asRecord(data));
      }
    }

    const { data: latest, error: latestError } = await this.admin
      .from("fp_artifact_versions")
      .select("id, version")
      .eq("artifact_id", artifact.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) {
      throw new Error(`[wedge] load versions failed: ${latestError.message}`);
    }

    const nextVersion = latest ? Number(asRecord(latest).version) + 1 : 1;
    const { data: versionRow, error: versionError } = await this.admin
      .from("fp_artifact_versions")
      .insert({
        user_id: input.userId,
        artifact_id: artifact.id,
        version: nextVersion,
        parent_version_id: latest ? asRecord(latest).id : null,
        source_packet_hash: attempt.sourcePacketHash,
        schema_version: input.schemaVersion,
        content: input.content,
        content_hash: hashCanonicalJson(input.content),
        created_by: input.createdBy,
        llm_run_id: input.llmRunId ?? null,
      })
      .select("*")
      .single();
    if (versionError) {
      throw new Error(`[wedge] create version failed: ${versionError.message}`);
    }

    const version = mapVersion(asRecord(versionRow));
    const { error: updateError } = await this.admin
      .from("fp_artifacts")
      .update({
        current_version_id: version.id,
        status: input.status ?? artifact.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", artifact.id)
      .eq("user_id", input.userId);
    if (updateError) {
      throw new Error(`[wedge] update artifact failed: ${updateError.message}`);
    }

    await this.admin
      .from("fp_learning_attempts")
      .update({
        last_activity_at: new Date().toISOString(),
        current_activity_id: input.artifactType,
      })
      .eq("id", input.attemptId)
      .eq("user_id", input.userId);

    return version;
  }

  async saveEvaluation(input: SaveEvaluationInput): Promise<EvaluationRecord> {
    const attempt = await this.getAttempt(
      input.evaluation.userId,
      input.evaluation.attemptId,
    );
    if (!attempt) throw new Error("Attempt not found for user.");

    const { data: existing, error: existingError } = await this.admin
      .from("fp_evaluations")
      .select("id")
      .eq("artifact_version_id", input.evaluation.artifactVersionId)
      .eq("evaluator_key", input.evaluation.evaluatorKey)
      .eq("evaluator_version", input.evaluation.evaluatorVersion)
      .eq("rubric_version", input.evaluation.rubricVersion)
      .maybeSingle();
    if (existingError) {
      throw new Error(`[wedge] load evaluation failed: ${existingError.message}`);
    }
    const evaluationId = existing
      ? asString(asRecord(existing).id, "id")
      : input.evaluation.id;

    const { data, error } = await this.admin
      .from("fp_evaluations")
      .upsert({
        id: evaluationId,
        user_id: input.evaluation.userId,
        attempt_id: input.evaluation.attemptId,
        artifact_version_id: input.evaluation.artifactVersionId,
        content_hash: input.evaluation.contentHash,
        evaluator_key: input.evaluation.evaluatorKey,
        evaluator_version: input.evaluation.evaluatorVersion,
        prompt_version: input.evaluation.promptVersion,
        rubric_version: input.evaluation.rubricVersion,
        llm_run_id: input.evaluation.llmRunId,
        status: input.evaluation.status,
        result: input.evaluation.result,
        confidence: input.evaluation.confidence,
      })
      .select("*")
      .single();
    if (error) {
      throw new Error(`[wedge] save evaluation failed: ${error.message}`);
    }

    await this.admin
      .from("fp_evaluation_criteria")
      .delete()
      .eq("evaluation_id", evaluationId)
      .eq("user_id", input.evaluation.userId);

    if (input.criteria.length > 0) {
      const { error: criteriaError } = await this.admin
        .from("fp_evaluation_criteria")
        .insert(
          input.criteria.map((criterion) => ({
            evaluation_id: evaluationId,
            user_id: input.evaluation.userId,
            criterion_key: criterion.criterionKey,
            outcome: criterion.outcome,
            confidence: criterion.confidence,
            rationale: criterion.rationale,
            evidence_refs: criterion.evidenceRefs,
          })),
        );
      if (criteriaError) {
        throw new Error(
          `[wedge] save evaluation criteria failed: ${criteriaError.message}`,
        );
      }
    }

    await this.admin
      .from("fp_learning_attempts")
      .update({
        last_activity_at: new Date().toISOString(),
        current_activity_id: "review",
      })
      .eq("id", input.evaluation.attemptId)
      .eq("user_id", input.evaluation.userId);

    return mapEvaluation(
      asRecord(data),
      input.criteria.map((criterion) => ({
        ...criterion,
        evaluationId,
        userId: input.evaluation.userId,
      })),
    );
  }

  async saveLlmRun(run: LlmRunRecord): Promise<LlmRunRecord> {
    const { data, error } = await this.admin
      .from("fp_llm_runs")
      .insert({
        id: run.id,
        user_id: run.userId,
        operation: run.operation,
        call_site: run.callSite,
        model: run.model,
        prompt_version: run.promptVersion,
        schema_version: run.schemaVersion,
        input_hash: run.inputHash,
        output_hash: run.outputHash,
        status: run.status,
        failure_reason: run.failureReason,
        latency_ms: run.latencyMs,
        input_tokens: run.inputTokens,
        output_tokens: run.outputTokens,
        estimated_cost_usd: run.estimatedCostUsd,
        provider_request_id: run.providerRequestId,
        trace_id: run.traceId,
      })
      .select("*")
      .single();
    if (error) {
      throw new Error(`[wedge] save llm run failed: ${error.message}`);
    }
    return mapLlmRun(asRecord(data));
  }

  async getAttemptBundle(
    userId: string,
    attemptId: string,
  ): Promise<AttemptBundle | null> {
    const attempt = await this.getAttempt(userId, attemptId);
    if (!attempt) return null;

    const { data: artifactRows, error: artifactError } = await this.admin
      .from("fp_artifacts")
      .select("*")
      .eq("attempt_id", attemptId)
      .eq("user_id", userId);
    if (artifactError) {
      throw new Error(`[wedge] load artifacts failed: ${artifactError.message}`);
    }
    const artifacts = (artifactRows ?? []).map((row) =>
      mapArtifact(asRecord(row)),
    );

    const versions =
      artifacts.length === 0
        ? []
        : await this.loadVersions(
            userId,
            artifacts.map((row) => row.id),
          );

    const { data: evaluationRows, error: evaluationError } = await this.admin
      .from("fp_evaluations")
      .select("*")
      .eq("attempt_id", attemptId)
      .eq("user_id", userId);
    if (evaluationError) {
      throw new Error(
        `[wedge] load evaluations failed: ${evaluationError.message}`,
      );
    }

    const evaluationIds = (evaluationRows ?? []).map(
      (row) => asRecord(row).id as string,
    );
    const criteria =
      evaluationIds.length === 0
        ? []
        : await this.loadCriteria(userId, evaluationIds);

    const evaluations = (evaluationRows ?? []).map((row) => {
      const mapped = asRecord(row);
      return mapEvaluation(
        mapped,
        criteria.filter((criterion) => criterion.evaluationId === mapped.id),
      );
    });

    const linkedRunIds = [
      ...evaluations.map((row) => row.llmRunId),
      ...versions.map((row) => row.llmRunId),
    ].filter((id): id is string => Boolean(id));
    const llmRuns =
      linkedRunIds.length === 0
        ? []
        : await this.loadLlmRuns(userId, linkedRunIds);

    return {
      attempt,
      artifacts,
      versions,
      evaluations,
      llmRuns,
    };
  }

  private async loadVersions(
    userId: string,
    artifactIds: string[],
  ): Promise<ArtifactVersion[]> {
    const { data, error } = await this.admin
      .from("fp_artifact_versions")
      .select("*")
      .eq("user_id", userId)
      .in("artifact_id", artifactIds);
    if (error) {
      throw new Error(`[wedge] load versions failed: ${error.message}`);
    }
    return (data ?? []).map((row) => mapVersion(asRecord(row)));
  }

  private async loadCriteria(
    userId: string,
    evaluationIds: string[],
  ): Promise<EvaluationCriterion[]> {
    const { data, error } = await this.admin
      .from("fp_evaluation_criteria")
      .select("*")
      .eq("user_id", userId)
      .in("evaluation_id", evaluationIds);
    if (error) {
      throw new Error(`[wedge] load criteria failed: ${error.message}`);
    }
    return (data ?? []).map((row) => mapCriterion(asRecord(row)));
  }

  private async loadLlmRuns(
    userId: string,
    runIds: string[],
  ): Promise<LlmRunRecord[]> {
    const { data, error } = await this.admin
      .from("fp_llm_runs")
      .select("*")
      .eq("user_id", userId)
      .in("id", runIds)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(`[wedge] load llm runs failed: ${error.message}`);
    }
    return (data ?? []).map((row) => mapLlmRun(asRecord(row)));
  }
}
