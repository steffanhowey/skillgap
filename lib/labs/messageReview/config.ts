export const MESSAGE_REVIEW_EXPERIMENT_VERSION =
  "claim_safe_message_review_2026_08_27_v1";

export const MESSAGE_REVIEW_DISCLOSURE_VERSION =
  "message_review_disclosure_2026_08_27_v1";

export const MESSAGE_REVIEW_LIMITS = {
  brief: { min: 200, max: 20_000 },
  artifactText: { min: 50, max: 20_000 },
  offer: { min: 20, max: 1_500 },
  audienceProblem: { min: 20, max: 1_500 },
  desiredAction: { min: 10, max: 500 },
  currentAlternative: { min: 10, max: 1_000 },
  voiceConstraints: { min: 0, max: 1_500 },
  proofText: { min: 10, max: 500 },
  matrixField: { min: 3, max: 1_500 },
  channelDraft: { min: 20, max: 10_000 },
  proofs: { min: 1, max: 20 },
} as const;

export const MESSAGE_REVIEW_ALLOWED_EVENTS = [
  "message_review_started",
  "context_confirmed",
  "pressure_test_completed",
  "revision_exported",
  "second_review_started",
] as const;

export const MESSAGE_REVIEW_EXPORT_TYPES = [
  "formatted_text",
  "channel_asset",
  "matrix_csv",
  "review_report",
] as const;
