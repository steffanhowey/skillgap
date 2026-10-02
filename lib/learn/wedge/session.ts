import { hashCanonicalJson } from "@/lib/ai/hash";
import {
  ConfirmedMessageReviewContextSchema,
  ReviewMessageArtifactInputSchema,
} from "@/lib/labs/messageReview/schemas";
import type {
  MessageReviewArtifact,
  MessageReviewContext,
} from "@/lib/labs/messageReview/types";
import {
  getSeededCapabilityApplication,
  WEDGE_APPLICATION_STABLE_KEY,
} from "./application";
import { WEDGE_ATTEMPT_IDEMPOTENCY_KEY } from "./config";
import { persistGatewayEvaluation } from "./evaluate";
import { formatLaunchMessagingExport } from "./exportWork";
import { loadEditorialSourcePacket } from "./packet";
import {
  latestEvaluation,
  latestVersionContent,
  toWedgePlayerSnapshot,
  type WedgePlayerSnapshot,
} from "./playerState";
import type { WedgeRepository } from "./repository";
import { SupabaseWedgeRepository } from "./supabaseRepository";
import {
  MESSAGE_MATRIX_SCHEMA_VERSION,
  WORK_CONTEXT_SCHEMA_VERSION,
  type AttemptBundle,
} from "./types";

export class WedgeSessionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "WedgeSessionError";
  }
}

/**
 * Production repository for the founder-only path.
 */
export function createWedgeRepository(): WedgeRepository {
  return new SupabaseWedgeRepository();
}

async function loadOwnedBundle(
  repo: WedgeRepository,
  userId: string,
  now?: Date,
): Promise<AttemptBundle> {
  const application =
    (await repo.getApplicationByStableKey(WEDGE_APPLICATION_STABLE_KEY)) ??
    (await repo.seedApplication(getSeededCapabilityApplication()));

  let sourcePacket;
  try {
    sourcePacket = loadEditorialSourcePacket(now);
  } catch {
    throw new WedgeSessionError("This editorial packet has expired.", 409);
  }

  const attempt = await repo.getOrCreateAttempt({
    userId,
    application,
    sourcePacket,
    idempotencyKey: WEDGE_ATTEMPT_IDEMPOTENCY_KEY,
  });
  const bundle = await repo.getAttemptBundle(userId, attempt.id);
  if (!bundle) {
    throw new WedgeSessionError("Failed to load the attempt.", 500);
  }
  return bundle;
}

async function saveIfChanged(
  repo: WedgeRepository,
  input: {
    userId: string;
    attemptId: string;
    artifactType: "work_context" | "message_matrix";
    content: MessageReviewContext | MessageReviewArtifact;
    schemaVersion: string;
    status: "draft" | "confirmed";
  },
): Promise<void> {
  const bundle = await repo.getAttemptBundle(input.userId, input.attemptId);
  const latest = bundle
    ? latestVersionContent(bundle, input.artifactType)
    : null;
  if (latest && hashCanonicalJson(latest.content) === hashCanonicalJson(input.content)) {
    return;
  }
  await repo.saveArtifactVersion({
    userId: input.userId,
    attemptId: input.attemptId,
    artifactType: input.artifactType,
    content: input.content,
    schemaVersion: input.schemaVersion,
    createdBy: "user",
    status: input.status,
  });
}

function parseContext(raw: unknown): MessageReviewContext {
  const parsed = ConfirmedMessageReviewContextSchema.safeParse(raw);
  if (!parsed.success) {
    throw new WedgeSessionError(
      "Context is incomplete.",
      400,
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }
  return parsed.data;
}

function parseMatrix(
  raw: unknown,
  context: MessageReviewContext,
): MessageReviewArtifact {
  const parsed = ReviewMessageArtifactInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new WedgeSessionError(
      "The message matrix is incomplete.",
      400,
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }
  const proofIds = new Set(context.proofs.map((proof) => proof.id));
  for (const [index, row] of parsed.data.rows.entries()) {
    for (const proofRef of row.proofRefs) {
      if (!proofIds.has(proofRef)) {
        throw new WedgeSessionError("Unknown proof reference.", 400, [
          {
            path: `rows.${index}.proofRefs`,
            message: `Unknown proof reference: ${proofRef}.`,
          },
        ]);
      }
    }
  }
  return parsed.data;
}

/**
 * Start or resume the one founder attempt.
 */
export async function loadWedgeSession(
  repo: WedgeRepository,
  userId: string,
  now?: Date,
): Promise<WedgePlayerSnapshot> {
  const bundle = await loadOwnedBundle(repo, userId, now);
  return toWedgePlayerSnapshot(bundle);
}

/**
 * Persist confirmed context and keep the same attempt.
 */
export async function saveWedgeContext(
  repo: WedgeRepository,
  userId: string,
  rawContext: unknown,
): Promise<WedgePlayerSnapshot> {
  const bundle = await loadOwnedBundle(repo, userId);
  const context = parseContext(rawContext);
  await saveIfChanged(repo, {
    userId,
    attemptId: bundle.attempt.id,
    artifactType: "work_context",
    content: context,
    schemaVersion: WORK_CONTEXT_SCHEMA_VERSION,
    status: "confirmed",
  });
  await repo.updateAttemptActivity(userId, bundle.attempt.id, "matrix");
  return loadWedgeSession(repo, userId);
}

/**
 * Persist the three-row matrix and keep the same attempt.
 */
export async function saveWedgeMatrix(
  repo: WedgeRepository,
  userId: string,
  rawMatrix: unknown,
): Promise<WedgePlayerSnapshot> {
  const bundle = await loadOwnedBundle(repo, userId);
  const context = latestVersionContent(bundle, "work_context");
  if (!context) {
    throw new WedgeSessionError("Confirm context before building the matrix.", 409);
  }
  const matrix = parseMatrix(rawMatrix, context.content as MessageReviewContext);
  await saveIfChanged(repo, {
    userId,
    attemptId: bundle.attempt.id,
    artifactType: "message_matrix",
    content: matrix,
    schemaVersion: MESSAGE_MATRIX_SCHEMA_VERSION,
    status: "draft",
  });
  await repo.updateAttemptActivity(userId, bundle.attempt.id, "review");
  return loadWedgeSession(repo, userId);
}

/**
 * Server-owned pressure test. Client evaluation JSON is ignored.
 */
export async function evaluateWedgeMatrix(
  repo: WedgeRepository,
  userId: string,
  rawMatrix: unknown,
): Promise<WedgePlayerSnapshot> {
  await saveWedgeMatrix(repo, userId, rawMatrix);
  const bundle = await loadOwnedBundle(repo, userId);
  const context = latestVersionContent(bundle, "work_context");
  const matrix = latestVersionContent(bundle, "message_matrix");
  if (!context || !matrix) {
    throw new WedgeSessionError("Context and matrix are required to review.", 409);
  }

  await persistGatewayEvaluation(repo, {
    userId,
    attemptId: bundle.attempt.id,
    artifactVersionId: matrix.id,
    contentHash: hashCanonicalJson(matrix.content),
    context: context.content as MessageReviewContext,
    artifact: matrix.content as MessageReviewArtifact,
  });
  await repo.updateAttemptActivity(userId, bundle.attempt.id, "review");
  return loadWedgeSession(repo, userId);
}

/**
 * Persist accepted/rejected revisions as a new matrix version.
 */
export async function reviseWedgeMatrix(
  repo: WedgeRepository,
  userId: string,
  rawMatrix: unknown,
): Promise<WedgePlayerSnapshot> {
  const bundle = await loadOwnedBundle(repo, userId);
  const context = latestVersionContent(bundle, "work_context");
  if (!context) {
    throw new WedgeSessionError("Confirm context before saving revisions.", 409);
  }
  const matrix = parseMatrix(rawMatrix, context.content as MessageReviewContext);
  await saveIfChanged(repo, {
    userId,
    attemptId: bundle.attempt.id,
    artifactType: "message_matrix",
    content: matrix,
    schemaVersion: MESSAGE_MATRIX_SCHEMA_VERSION,
    status: "confirmed",
  });
  await repo.updateAttemptActivity(userId, bundle.attempt.id, "export");
  return loadWedgeSession(repo, userId);
}

/**
 * Build a downloadable export from persisted work.
 */
export async function exportWedgeWork(
  repo: WedgeRepository,
  userId: string,
): Promise<{ filename: string; text: string }> {
  const bundle = await loadOwnedBundle(repo, userId);
  const context = latestVersionContent(bundle, "work_context");
  const matrix = latestVersionContent(bundle, "message_matrix");
  if (!context || !matrix) {
    throw new WedgeSessionError("Nothing to export yet.", 409);
  }
  const evaluation = latestEvaluation(bundle);
  return {
    filename: "launch-messaging-export.md",
    text: formatLaunchMessagingExport({
      context: context.content as MessageReviewContext,
      artifact: matrix.content as MessageReviewArtifact,
      result: evaluation?.result ?? null,
    }),
  };
}
