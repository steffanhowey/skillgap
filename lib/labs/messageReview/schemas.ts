import { z } from "zod";
import {
  MESSAGE_REVIEW_DISCLOSURE_VERSION,
  MESSAGE_REVIEW_EXPERIMENT_VERSION,
  MESSAGE_REVIEW_EXPORT_TYPES,
  MESSAGE_REVIEW_LIMITS,
} from "./config";
import type {
  MessageReviewArtifact,
  MessageReviewJudgeDecision,
  MessageReviewResult,
} from "./types";

const MessageReviewChannelSchema = z.enum([
  "landing_page",
  "email",
  "paid_social",
  "organic_social",
  "sales_enablement",
  "stakeholder_review",
]);

const ProofStatusSchema = z.enum(["approved_fact", "hypothesis"]);

export const MessageMatrixRowSchema = z
  .object({
    rowId: z.string().min(1),
    audienceJob: z.string().min(1),
    desiredAction: z.string().min(1),
    currentAlternative: z.string().min(1),
    messageAngle: z.string().min(1),
    valueClaim: z.string().min(1),
    proofRefs: z.array(z.string().min(1)),
    objection: z.string().min(1),
    response: z.string().min(1),
    channelExpression: z.string().min(1),
  })
  .strict();

export const MessageReviewArtifactSchema = z
  .object({
    rows: z.array(MessageMatrixRowSchema).length(3),
    channelDraft: z.string().min(1),
  })
  .strict();

export const ConfirmedMessageReviewContextSchema = z
  .object({
    offer: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.offer.min)
      .max(MESSAGE_REVIEW_LIMITS.offer.max),
    audienceProblem: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.audienceProblem.min)
      .max(MESSAGE_REVIEW_LIMITS.audienceProblem.max),
    desiredAction: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.desiredAction.min)
      .max(MESSAGE_REVIEW_LIMITS.desiredAction.max),
    currentAlternative: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.currentAlternative.min)
      .max(MESSAGE_REVIEW_LIMITS.currentAlternative.max),
    channel: MessageReviewChannelSchema,
    proofs: z
      .array(
        z
          .object({
            id: z.string().regex(/^proof-\d+$/),
            text: z
              .string()
              .trim()
              .min(MESSAGE_REVIEW_LIMITS.proofText.min)
              .max(MESSAGE_REVIEW_LIMITS.proofText.max),
            status: ProofStatusSchema,
          })
          .strict(),
      )
      .min(MESSAGE_REVIEW_LIMITS.proofs.min)
      .max(MESSAGE_REVIEW_LIMITS.proofs.max),
    voiceConstraints: z
      .string()
      .trim()
      .max(MESSAGE_REVIEW_LIMITS.voiceConstraints.max),
  })
  .strict()
  .superRefine((context, refinement) => {
    const proofIds = new Set(context.proofs.map((proof) => proof.id));
    if (proofIds.size !== context.proofs.length) {
      refinement.addIssue({
        code: "custom",
        message: "Proof IDs must be unique.",
        path: ["proofs"],
      });
    }
  });

const ReviewMatrixRowInputSchema = z
  .object({
    rowId: z.string().regex(/^row-[1-3]$/),
    audienceJob: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.matrixField.min)
      .max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    desiredAction: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.matrixField.min)
      .max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    currentAlternative: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.matrixField.min)
      .max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    messageAngle: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.matrixField.min)
      .max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    valueClaim: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.matrixField.min)
      .max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    proofRefs: z.array(z.string().regex(/^proof-\d+$/)).min(1),
    objection: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.matrixField.min)
      .max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    response: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.matrixField.min)
      .max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    channelExpression: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.matrixField.min)
      .max(MESSAGE_REVIEW_LIMITS.matrixField.max),
  })
  .strict();

export const ReviewMessageArtifactInputSchema = z
  .object({
    rows: z.array(ReviewMatrixRowInputSchema).length(3),
    channelDraft: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.channelDraft.min)
      .max(MESSAGE_REVIEW_LIMITS.channelDraft.max),
  })
  .strict()
  .superRefine((artifact, context) => {
    const rowIds = new Set(artifact.rows.map((row) => row.rowId));
    if (rowIds.size !== 3) {
      context.addIssue({
        code: "custom",
        message: "Matrix rows must use three unique row IDs.",
        path: ["rows"],
      });
    }
  });

export const MessageReviewExtractRequestSchema = z
  .object({
    brief: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.brief.min)
      .max(MESSAGE_REVIEW_LIMITS.brief.max),
    artifactText: z
      .string()
      .trim()
      .min(MESSAGE_REVIEW_LIMITS.artifactText.min)
      .max(MESSAGE_REVIEW_LIMITS.artifactText.max),
    studyParticipantId: z.string().uuid(),
    disclosureVersion: z.literal(MESSAGE_REVIEW_DISCLOSURE_VERSION),
    processingDisclosureAccepted: z.literal(true),
  })
  .strict();

export const MessageReviewReviewRequestSchema = z
  .object({
    context: ConfirmedMessageReviewContextSchema,
    artifact: ReviewMessageArtifactInputSchema,
    studyParticipantId: z.string().uuid(),
    experimentVersion: z.literal(MESSAGE_REVIEW_EXPERIMENT_VERSION),
    disclosureVersion: z.literal(MESSAGE_REVIEW_DISCLOSURE_VERSION),
    processingDisclosureAccepted: z.literal(true),
    humanResearchConsent: z.boolean(),
  })
  .strict()
  .superRefine((request, context) => {
    const proofIds = new Set(request.context.proofs.map((proof) => proof.id));
    for (const [rowIndex, row] of request.artifact.rows.entries()) {
      for (const proofRef of row.proofRefs) {
        if (!proofIds.has(proofRef)) {
          context.addIssue({
            code: "custom",
            message: `Unknown proof reference: ${proofRef}.`,
            path: ["artifact", "rows", rowIndex, "proofRefs"],
          });
        }
      }
    }
  });

export const MessageReviewEventRequestSchema = z
  .object({
    event: z.enum([
      "message_review_started",
      "context_confirmed",
      "pressure_test_completed",
      "revision_exported",
      "second_review_started",
    ]),
    experimentVersion: z.literal(MESSAGE_REVIEW_EXPERIMENT_VERSION),
    studyParticipantId: z.string().uuid(),
    durationBucket: z
      .enum(["under_2m", "2_to_5m", "5_to_10m", "over_10m"])
      .optional(),
    issueCounts: z
      .object({
        blocking: z.number().int().min(0).max(100),
        material: z.number().int().min(0).max(100),
        minor: z.number().int().min(0).max(100),
      })
      .strict()
      .optional(),
    exportType: z.enum(MESSAGE_REVIEW_EXPORT_TYPES).optional(),
    operatorRescue: z.boolean().optional(),
  })
  .strict();

const ExtractedMatrixRowSchema = z
  .object({
    rowId: z.enum(["row-1", "row-2", "row-3"]),
    audienceJob: z.string().max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    desiredAction: z.string().max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    currentAlternative: z
      .string()
      .max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    messageAngle: z.string().max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    valueClaim: z.string().max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    proofRefs: z.array(z.string().regex(/^proof-\d+$/)),
    objection: z.string().max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    response: z.string().max(MESSAGE_REVIEW_LIMITS.matrixField.max),
    channelExpression: z
      .string()
      .max(MESSAGE_REVIEW_LIMITS.matrixField.max),
  })
  .strict();

export const MessageReviewExtractionModelSchema = z
  .object({
    context: z
      .object({
        offer: z.string().max(MESSAGE_REVIEW_LIMITS.offer.max),
        audienceProblem: z
          .string()
          .max(MESSAGE_REVIEW_LIMITS.audienceProblem.max),
        desiredAction: z
          .string()
          .max(MESSAGE_REVIEW_LIMITS.desiredAction.max),
        currentAlternative: z
          .string()
          .max(MESSAGE_REVIEW_LIMITS.currentAlternative.max),
        channel: MessageReviewChannelSchema.nullable(),
        proofs: z
          .array(
            z
              .object({
                text: z.string().max(MESSAGE_REVIEW_LIMITS.proofText.max),
                status: ProofStatusSchema,
              })
              .strict(),
          )
          .max(MESSAGE_REVIEW_LIMITS.proofs.max),
        voiceConstraints: z
          .string()
          .max(MESSAGE_REVIEW_LIMITS.voiceConstraints.max),
      })
      .strict(),
    artifactRows: z.array(ExtractedMatrixRowSchema).length(3),
  })
  .strict();

export const MessageReviewExtractionResponseSchema = z
  .object({
    context: z
      .object({
        offer: z.string().max(MESSAGE_REVIEW_LIMITS.offer.max),
        audienceProblem: z
          .string()
          .max(MESSAGE_REVIEW_LIMITS.audienceProblem.max),
        desiredAction: z
          .string()
          .max(MESSAGE_REVIEW_LIMITS.desiredAction.max),
        currentAlternative: z
          .string()
          .max(MESSAGE_REVIEW_LIMITS.currentAlternative.max),
        channel: MessageReviewChannelSchema.nullable(),
        proofs: z.array(
          z
            .object({
              id: z.string().regex(/^proof-\d+$/),
              text: z.string().max(MESSAGE_REVIEW_LIMITS.proofText.max),
              status: ProofStatusSchema,
            })
            .strict(),
        ),
        voiceConstraints: z
          .string()
          .max(MESSAGE_REVIEW_LIMITS.voiceConstraints.max),
      })
      .strict(),
    artifact: z
      .object({
        rows: z.array(ExtractedMatrixRowSchema).length(3),
        channelDraft: z
          .string()
          .max(MESSAGE_REVIEW_LIMITS.artifactText.max),
      })
      .strict(),
  })
  .strict();

export const MessageReviewResultSchema = z
  .object({
    status: z.enum([
      "blocking_issues",
      "material_revisions",
      "checklist_cleared",
      "unavailable",
    ]),
    issues: z.array(
      z
        .object({
          issueId: z.string().min(1),
          ruleId: z.enum([
            "claim_to_proof",
            "audience_action_fit",
            "differentiation",
            "objection_quality",
            "channel_fit",
            "constraint_compliance",
            "prompt_injection",
          ]),
          severity: z.enum(["blocking", "material", "minor"]),
          rowId: z.string().min(1).nullable(),
          field: z.enum([
            "rowId",
            "audienceJob",
            "desiredAction",
            "currentAlternative",
            "messageAngle",
            "valueClaim",
            "proofRefs",
            "objection",
            "response",
            "channelExpression",
            "channelDraft",
          ]),
          evidenceQuote: z.string().min(1).max(500),
          proofRefs: z.array(z.string().min(1)),
          explanation: z.string().min(1).max(1_000),
          suggestedChange: z.string().min(1).max(1_000),
        })
        .strict(),
    ),
    claimMappings: z.array(
      z
        .object({
          rowId: z.string().min(1).nullable(),
          field: z.enum([
            "valueClaim",
            "response",
            "channelExpression",
            "channelDraft",
          ]),
          claim: z.string().min(1),
          proofRefs: z.array(z.string().min(1)),
          status: z.enum(["supported", "hypothesis", "unsupported"]),
        })
        .strict(),
    ),
    revisedArtifact: MessageReviewArtifactSchema,
  })
  .strict();

const JudgeDimensionIdSchema = z.enum([
  "factual_grounding",
  "audience_action_fit",
  "differentiation",
  "objection_quality",
  "channel_usability",
  "material_issues_remaining",
  "editing_burden",
  "overall_preference",
]);

export const MessageReviewJudgeDecisionSchema = z
  .object({
    winner: z.enum(["artifact_a", "artifact_b", "tie"]),
    dimensionWinners: z
      .array(
        z
          .object({
            dimensionId: JudgeDimensionIdSchema,
            winner: z.enum(["artifact_a", "artifact_b", "tie"]),
            reason: z.string().min(1).max(1_000),
          })
          .strict(),
      )
      .length(8),
    materialIssuesInA: z.array(z.string().min(1).max(1_000)),
    materialIssuesInB: z.array(z.string().min(1).max(1_000)),
    rationale: z.string().min(1).max(1_500),
  })
  .strict();

/**
 * Parse a model response using the fixed pressure-test contract.
 */
export function parseMessageReviewResult(value: unknown): MessageReviewResult {
  return MessageReviewResultSchema.parse(value);
}

/**
 * Parse a blinded judge response using the fixed comparison contract.
 */
export function parseJudgeDecision(
  value: unknown,
): MessageReviewJudgeDecision {
  return MessageReviewJudgeDecisionSchema.parse(value);
}

/**
 * Return the only permitted user-visible result when review execution fails.
 */
export function createUnavailableReviewResult(
  originalArtifact: MessageReviewArtifact,
): MessageReviewResult {
  return {
    status: "unavailable",
    issues: [],
    claimMappings: [],
    revisedArtifact: originalArtifact,
  };
}
