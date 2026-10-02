import { describe, expect, it } from "vitest";
import {
  MESSAGE_REVIEW_DISCLOSURE_VERSION,
  MESSAGE_REVIEW_EXPERIMENT_VERSION,
} from "./config";
import {
  createMessageMatrixCsv,
  formatChannelAsset,
  formatMessageMatrix,
  formatReviewReport,
} from "./export";
import { diffMessageText } from "./diff";
import { MESSAGE_REVIEW_FIXTURES } from "./fixtures";
import {
  MessageReviewEventRequestSchema,
  MessageReviewExtractRequestSchema,
  MessageReviewReviewRequestSchema,
} from "./schemas";
import {
  isMessageReviewLabAllowed,
  parseMessageReviewAllowlist,
} from "./access";
import {
  allowMessageReviewRequest,
  resetMessageReviewRateLimitForTests,
} from "./rateLimit";
import {
  extractExplicitMessageReviewProofs,
  extractMessageReviewChannelDraft,
} from "./contextExtractor";

const STUDY_ID = "9b2dc9b8-4d19-4b6a-8c28-6ffb2c1f59ab";

describe("message review prototype contracts", () => {
  it("enforces a normalized server-side participant allowlist", () => {
    expect(
      parseMessageReviewAllowlist(" Test@Example.com, test@example.com "),
    ).toEqual(["test@example.com"]);
    expect(
      isMessageReviewLabAllowed(
        "test@example.com",
        "TEST@example.com",
        "production",
      ),
    ).toBe(true);
    expect(isMessageReviewLabAllowed("other@example.com", "*", "production")).toBe(
      false,
    );
    expect(isMessageReviewLabAllowed("other@example.com", "*", "development")).toBe(
      true,
    );
    expect(isMessageReviewLabAllowed("local@example.com", "", "development")).toBe(
      true,
    );
    expect(isMessageReviewLabAllowed("local@example.com", "", "production")).toBe(
      false,
    );
  });

  it("enforces extraction size, disclosure, and strict-field limits", () => {
    const valid = {
      brief: "b".repeat(200),
      artifactText: "a".repeat(50),
      studyParticipantId: STUDY_ID,
      disclosureVersion: MESSAGE_REVIEW_DISCLOSURE_VERSION,
      processingDisclosureAccepted: true,
    };

    expect(MessageReviewExtractRequestSchema.safeParse(valid).success).toBe(true);
    expect(
      MessageReviewExtractRequestSchema.safeParse({
        ...valid,
        brief: "b".repeat(199),
      }).success,
    ).toBe(false);
    expect(
      MessageReviewExtractRequestSchema.safeParse({
        ...valid,
        briefText: "must not be accepted as an extra field",
      }).success,
    ).toBe(false);
  });

  it("preserves explicitly labeled evidence and hypotheses from the source", () => {
    expect(
      extractExplicitMessageReviewProofs(`Approved proof 1: Pilot time fell by 50%.
Hypothesis: Teams may launch faster with approved inputs nearby.
Unlabeled observation: This must not become evidence.`),
    ).toEqual([
      {
        text: "Pilot time fell by 50%.",
        status: "approved_fact",
      },
      {
        text: "Teams may launch faster with approved inputs nearby.",
        status: "hypothesis",
      },
    ]);
  });

  it("separates a labeled channel draft from its supporting matrix", () => {
    expect(
      extractMessageReviewChannelDraft(`ROW 1
Value claim: Supported claim.

CHANNEL DRAFT
Ship the supported claim.`),
    ).toBe("Ship the supported claim.");
    expect(extractMessageReviewChannelDraft("A standalone draft.")).toBe(
      "A standalone draft.",
    );
  });

  it("rejects branch-B output and unresolved proof references", () => {
    const fixture = MESSAGE_REVIEW_FIXTURES[0]!;
    const valid = {
      context: fixture.context,
      artifact: fixture.artifact,
      studyParticipantId: STUDY_ID,
      experimentVersion: MESSAGE_REVIEW_EXPERIMENT_VERSION,
      disclosureVersion: MESSAGE_REVIEW_DISCLOSURE_VERSION,
      processingDisclosureAccepted: true,
      humanResearchConsent: false,
    };

    expect(MessageReviewReviewRequestSchema.safeParse(valid).success).toBe(true);
    expect(
      MessageReviewReviewRequestSchema.safeParse({
        ...valid,
        baselineOutput: "Branch C must never receive this.",
      }).success,
    ).toBe(false);
    expect(
      MessageReviewReviewRequestSchema.safeParse({
        ...valid,
        artifact: {
          ...fixture.artifact,
          rows: fixture.artifact.rows.map((row, index) =>
            index === 0 ? { ...row, proofRefs: ["proof-999"] } : row,
          ),
        },
      }).success,
    ).toBe(false);
  });

  it("rejects content and unknown keys from analytics events", () => {
    const valid = {
      event: "pressure_test_completed",
      experimentVersion: MESSAGE_REVIEW_EXPERIMENT_VERSION,
      studyParticipantId: STUDY_ID,
      durationBucket: "2_to_5m",
      issueCounts: { blocking: 1, material: 2, minor: 0 },
      operatorRescue: false,
    };

    expect(MessageReviewEventRequestSchema.safeParse(valid).success).toBe(true);
    expect(
      MessageReviewEventRequestSchema.safeParse({
        ...valid,
        artifactText: "forbidden content",
      }).success,
    ).toBe(false);
  });

  it("caps paid review calls per user and operation", () => {
    resetMessageReviewRateLimitForTests();
    for (let attempt = 0; attempt < 12; attempt += 1) {
      expect(
        allowMessageReviewRequest("user-1", "review", 1_000 + attempt),
      ).toBe(true);
    }
    expect(allowMessageReviewRequest("user-1", "review", 2_000)).toBe(false);
    expect(allowMessageReviewRequest("user-2", "review", 2_000)).toBe(true);
    resetMessageReviewRateLimitForTests();
  });

  it("creates usable text, channel, CSV, and report exports", () => {
    const fixture = MESSAGE_REVIEW_FIXTURES[1]!;
    const artifact = {
      ...fixture.artifact,
      rows: fixture.artifact.rows.map((row, index) =>
        index === 0 ? { ...row, messageAngle: "=DANGEROUS()" } : row,
      ),
    };
    const result = {
      status: "blocking_issues" as const,
      issues: [],
      claimMappings: [],
      revisedArtifact: artifact,
    };

    expect(formatMessageMatrix(artifact)).toContain("ANGLE 1");
    expect(formatChannelAsset(artifact)).toBe(artifact.channelDraft);
    expect(createMessageMatrixCsv(artifact)).toContain("\"'=DANGEROUS()\"");
    expect(formatReviewReport(fixture.context, result)).toContain(
      "Factual accuracy",
    );
  });

  it("produces inspectable additions and removals", () => {
    expect(diffMessageText("Ship faster", "Ship with proof faster")).toEqual([
      { type: "unchanged", value: "Ship " },
      { type: "added", value: "with proof " },
      { type: "unchanged", value: "faster" },
    ]);
  });
});
