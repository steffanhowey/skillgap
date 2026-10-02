export type MessageReviewChannel =
  | "landing_page"
  | "email"
  | "paid_social"
  | "organic_social"
  | "sales_enablement"
  | "stakeholder_review";

export type ProofStatus = "approved_fact" | "hypothesis";

export type ReviewIssueSeverity = "blocking" | "material" | "minor";

export type ReviewRuleId =
  | "claim_to_proof"
  | "audience_action_fit"
  | "differentiation"
  | "objection_quality"
  | "channel_fit"
  | "constraint_compliance"
  | "prompt_injection";

export interface MessageReviewProof {
  id: string;
  text: string;
  status: ProofStatus;
}

export interface MessageReviewContext {
  offer: string;
  audienceProblem: string;
  desiredAction: string;
  currentAlternative: string;
  channel: MessageReviewChannel;
  proofs: MessageReviewProof[];
  voiceConstraints: string;
}

export interface ExtractedMessageReviewContext
  extends Omit<MessageReviewContext, "channel"> {
  channel: MessageReviewChannel | null;
}

export interface MessageMatrixRow {
  rowId: string;
  audienceJob: string;
  desiredAction: string;
  currentAlternative: string;
  messageAngle: string;
  valueClaim: string;
  proofRefs: string[];
  objection: string;
  response: string;
  channelExpression: string;
}

export interface MessageReviewArtifact {
  rows: MessageMatrixRow[];
  channelDraft: string;
}

export interface ExtractedMessageMatrixRow
  extends Omit<MessageMatrixRow, "proofRefs"> {
  proofRefs: string[];
}

export interface MessageReviewExtraction {
  context: ExtractedMessageReviewContext;
  artifact: {
    rows: ExtractedMessageMatrixRow[];
    channelDraft: string;
  };
}

export interface MessageReviewIssue {
  issueId: string;
  ruleId: ReviewRuleId;
  severity: ReviewIssueSeverity;
  rowId: string | null;
  field: keyof MessageMatrixRow | "channelDraft";
  evidenceQuote: string;
  proofRefs: string[];
  explanation: string;
  suggestedChange: string;
}

export interface ClaimProofMapping {
  rowId: string | null;
  field:
    | "valueClaim"
    | "response"
    | "channelExpression"
    | "channelDraft";
  claim: string;
  proofRefs: string[];
  status: "supported" | "hypothesis" | "unsupported";
}

export interface MessageReviewResult {
  status:
    | "blocking_issues"
    | "material_revisions"
    | "checklist_cleared"
    | "unavailable";
  issues: MessageReviewIssue[];
  claimMappings: ClaimProofMapping[];
  revisedArtifact: MessageReviewArtifact;
}

export type MessageReviewFixtureCategory =
  | "supported_control"
  | "invented_metric"
  | "invented_customer_claim"
  | "unlabeled_hypothesis"
  | "duplicate_angles"
  | "generic_audience"
  | "action_mismatch"
  | "alternative_ignored"
  | "evasive_objection"
  | "channel_mismatch"
  | "constraint_violation"
  | "prompt_injection";

export interface MessageReviewFixtureExpectation {
  requiredRuleIds: ReviewRuleId[];
  minimumIssueSeverity: ReviewIssueSeverity | null;
  expectedCleared: boolean;
}

export interface MessageReviewFixture {
  id: string;
  label: string;
  category: MessageReviewFixtureCategory;
  context: MessageReviewContext;
  artifact: MessageReviewArtifact;
  expectation: MessageReviewFixtureExpectation;
}

export type JudgeDimensionId =
  | "factual_grounding"
  | "audience_action_fit"
  | "differentiation"
  | "objection_quality"
  | "channel_usability"
  | "material_issues_remaining"
  | "editing_burden"
  | "overall_preference";

export interface MessageReviewJudgeDimension {
  id: JudgeDimensionId;
  label: string;
  instruction: string;
  critical: boolean;
}

export interface MessageReviewJudgeDecision {
  winner: "artifact_a" | "artifact_b" | "tie";
  dimensionWinners: Array<{
    dimensionId: JudgeDimensionId;
    winner: "artifact_a" | "artifact_b" | "tie";
    reason: string;
  }>;
  materialIssuesInA: string[];
  materialIssuesInB: string[];
  rationale: string;
}

export type MessageReviewStudyEvent =
  | "message_review_started"
  | "context_confirmed"
  | "pressure_test_completed"
  | "revision_exported"
  | "second_review_started";

export type MessageReviewExportType =
  | "formatted_text"
  | "channel_asset"
  | "matrix_csv"
  | "review_report";
