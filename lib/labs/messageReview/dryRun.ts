import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { buildCanonicalBaselinePrompt } from "./baselinePrompt";
import {
  inspectMessageReviewArtifact,
  reconcileSpecialistReview,
} from "./deterministicChecks";
import { buildBlindedJudgePrompt } from "./judgeRubric";
import {
  MESSAGE_REVIEW_SAFETY_CONTEXT,
  buildSpecialistReviewPrompt,
} from "./reviewPrompt";
import {
  MessageReviewJudgeDecisionSchema,
  MessageReviewResultSchema,
} from "./schemas";
import type {
  MessageReviewFixture,
  MessageReviewJudgeDecision,
  MessageReviewResult,
  ReviewIssueSeverity,
  ReviewRuleId,
} from "./types";
import { severityMeetsMinimum } from "./validation";

export interface InternalDryComparisonResult {
  fixtureId: string;
  fixtureLabel: string;
  baselineRuleIds: ReviewRuleId[];
  specialistRuleIds: ReviewRuleId[];
  specialistExpectationMet: boolean;
  winner: "baseline" | "skillgap" | "tie";
  judgeRationale: string;
}

interface RandomizedPair {
  artifactA: MessageReviewResult["revisedArtifact"];
  artifactB: MessageReviewResult["revisedArtifact"];
  artifactAOrigin: "baseline" | "skillgap";
}

function randomizePair(
  fixtureId: string,
  baseline: MessageReviewResult,
  specialist: MessageReviewResult,
): RandomizedPair {
  const baselineFirst =
    [...fixtureId].reduce((total, character) => total + character.charCodeAt(0), 0) %
      2 ===
    0;

  return baselineFirst
    ? {
        artifactA: baseline.revisedArtifact,
        artifactB: specialist.revisedArtifact,
        artifactAOrigin: "baseline",
      }
    : {
        artifactA: specialist.revisedArtifact,
        artifactB: baseline.revisedArtifact,
        artifactAOrigin: "skillgap",
      };
}

function resolveWinner(
  decision: MessageReviewJudgeDecision,
  artifactAOrigin: "baseline" | "skillgap",
): "baseline" | "skillgap" | "tie" {
  if (decision.winner === "tie") return "tie";
  const winnerIsA = decision.winner === "artifact_a";
  if (winnerIsA) return artifactAOrigin;
  return artifactAOrigin === "baseline" ? "skillgap" : "baseline";
}

function hasExpectedSeverity(
  result: MessageReviewResult,
  minimum: ReviewIssueSeverity | null,
): boolean {
  if (!minimum) return result.issues.length === 0;
  return result.issues.some((issue) =>
    severityMeetsMinimum(issue.severity, minimum),
  );
}

function specialistMeetsExpectation(
  fixture: MessageReviewFixture,
  result: MessageReviewResult,
): boolean {
  const observedRules = new Set(result.issues.map((issue) => issue.ruleId));
  const hasRules = fixture.expectation.requiredRuleIds.every((ruleId) =>
    observedRules.has(ruleId),
  );
  const statusMatches = fixture.expectation.expectedCleared
    ? result.status === "checklist_cleared"
    : result.status !== "checklist_cleared" && result.status !== "unavailable";

  return (
    hasRules &&
    statusMatches &&
    hasExpectedSeverity(result, fixture.expectation.minimumIssueSeverity)
  );
}

async function runReview(
  client: OpenAI,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  schemaName: string,
): Promise<MessageReviewResult> {
  const response = await client.chat.completions.parse(
    {
      model: "gpt-4o-mini",
      max_tokens: 4_000,
      temperature: 0.1,
      messages,
      response_format: zodResponseFormat(
        MessageReviewResultSchema,
        schemaName,
      ),
    },
    { signal: AbortSignal.timeout(20_000) },
  );

  const parsed = response.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error(`Empty structured response for ${schemaName}.`);
  }
  return parsed;
}

async function runJudge(
  client: OpenAI,
  fixture: MessageReviewFixture,
  pair: RandomizedPair,
): Promise<MessageReviewJudgeDecision> {
  const response = await client.chat.completions.parse(
    {
      model: "gpt-4o-mini",
      max_tokens: 2_500,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `Judge the pair impartially. Do not infer product identity from style. ${MESSAGE_REVIEW_SAFETY_CONTEXT}`,
        },
        {
          role: "user",
          content: buildBlindedJudgePrompt(
            fixture.context,
            pair.artifactA,
            pair.artifactB,
          ),
        },
      ],
      response_format: zodResponseFormat(
        MessageReviewJudgeDecisionSchema,
        "message_review_dry_judgment",
      ),
    },
    { signal: AbortSignal.timeout(20_000) },
  );

  const parsed = response.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error(`Empty judge response for ${fixture.id}.`);
  }
  return parsed;
}

/**
 * Run one same-model baseline versus specialist dry comparison.
 */
export async function runInternalDryComparison(
  client: OpenAI,
  fixture: MessageReviewFixture,
): Promise<InternalDryComparisonResult> {
  const specialistPrompt = buildSpecialistReviewPrompt(
    fixture.context,
    fixture.artifact,
  );
  const [baseline, specialistModelResult] = await Promise.all([
    runReview(
      client,
      [
        {
          role: "system",
          content: `Perform a strong one-shot marketing review. ${MESSAGE_REVIEW_SAFETY_CONTEXT}`,
        },
        {
          role: "user",
          content: buildCanonicalBaselinePrompt(
            fixture.context,
            fixture.artifact,
          ),
        },
      ],
      "canonical_message_review",
    ),
    runReview(
      client,
      [
        { role: "system", content: specialistPrompt.system },
        { role: "user", content: specialistPrompt.user },
      ],
      "claim_safe_pressure_test",
    ),
  ]);
  const specialist = reconcileSpecialistReview(
    fixture.artifact,
    specialistModelResult,
    inspectMessageReviewArtifact(fixture.context, fixture.artifact),
  );

  const pair = randomizePair(fixture.id, baseline, specialist);
  const decision = await runJudge(client, fixture, pair);

  return {
    fixtureId: fixture.id,
    fixtureLabel: fixture.label,
    baselineRuleIds: [
      ...new Set(baseline.issues.map((issue) => issue.ruleId)),
    ],
    specialistRuleIds: [
      ...new Set(specialist.issues.map((issue) => issue.ruleId)),
    ],
    specialistExpectationMet: specialistMeetsExpectation(fixture, specialist),
    winner: resolveWinner(decision, pair.artifactAOrigin),
    judgeRationale: decision.rationale,
  };
}
