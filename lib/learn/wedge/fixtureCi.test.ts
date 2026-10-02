import { describe, expect, it } from "vitest";
import { MESSAGE_REVIEW_FIXTURES } from "@/lib/labs/messageReview/fixtures";
import { SPECIALIST_REVIEW_VERSION } from "@/lib/labs/messageReview/reviewPrompt";
import { reviewMessageArtifact } from "@/lib/labs/messageReview/reviewer";
import {
  persistFixtureSpine,
  persistGatewayEvaluation,
} from "./evaluate";
import { MemoryWedgeRepository } from "./memoryRepository";
import type { AttemptBundle } from "./types";

const USER_ID = "11111111-2222-4333-8444-555555555555";

function blockingFixtures() {
  return MESSAGE_REVIEW_FIXTURES.filter(
    (fixture) =>
      fixture.expectation.expectedCleared === false &&
      fixture.expectation.minimumIssueSeverity === "blocking",
  );
}

function falseClearModel(artifact: (typeof MESSAGE_REVIEW_FIXTURES)[number]["artifact"]) {
  return {
    complete: async () => ({
      parsed: {
        status: "checklist_cleared",
        issues: [],
        claimMappings: [],
        revisedArtifact: artifact,
      },
    }),
  };
}

function matrixVersion(bundle: AttemptBundle) {
  const version = bundle.versions.find((row) =>
    bundle.artifacts.some(
      (artifact) =>
        artifact.id === row.artifactId &&
        artifact.artifactType === "message_matrix",
    ),
  );
  if (!version) throw new Error("Missing matrix version");
  return version;
}

describe("Track F fixture CI", () => {
  it("still pins the specialist prompt and the twelve-fixture set", () => {
    expect(SPECIALIST_REVIEW_VERSION).toBe("claim_safe_pressure_test_v1");
    expect(MESSAGE_REVIEW_FIXTURES).toHaveLength(12);
    expect(blockingFixtures().map((fixture) => fixture.id)).toEqual([
      "invented-metric",
      "invented-customer-claim",
      "unlabeled-hypothesis",
      "evasive-objection",
      "constraint-violation",
      "prompt-injection",
    ]);
  });

  it("persists every fixture without a critical false clear", async () => {
    const repo = new MemoryWedgeRepository();

    for (const fixture of MESSAGE_REVIEW_FIXTURES) {
      const bundle = await persistFixtureSpine(repo, {
        userId: USER_ID,
        fixture,
        now: new Date("2026-08-28T18:00:00.000Z"),
      });
      const evaluation = bundle.evaluations[0];
      if (!evaluation) throw new Error(`Missing evaluation for ${fixture.id}`);

      if (fixture.expectation.expectedCleared) {
        expect(evaluation.status, fixture.id).toBe("checklist_cleared");
        continue;
      }

      expect(evaluation.status, fixture.id).not.toBe("checklist_cleared");
      if (fixture.expectation.minimumIssueSeverity === "blocking") {
        expect(evaluation.status, fixture.id).toBe("blocking_issues");
        for (const ruleId of fixture.expectation.requiredRuleIds) {
          expect(
            evaluation.criteria.find((row) => row.criterionKey === ruleId)
              ?.outcome,
            `${fixture.id}:${ruleId}`,
          ).toBe("fail");
        }
      }
    }
  });

  it("does not let a clearing model false-clear a blocking fixture", async () => {
    for (const fixture of blockingFixtures()) {
      const result = await reviewMessageArtifact(
        fixture.context,
        fixture.artifact,
        { gatewayDeps: falseClearModel(fixture.artifact) },
      );

      expect(result.status, fixture.id).not.toBe("checklist_cleared");
      expect(
        result.status === "blocking_issues" || result.status === "unavailable",
        `${fixture.id} must fail closed or stay blocking`,
      ).toBe(true);
      if (result.status === "blocking_issues") {
        const observed = new Set(result.issues.map((issue) => issue.ruleId));
        for (const ruleId of fixture.expectation.requiredRuleIds) {
          expect(observed.has(ruleId), `${fixture.id}:${ruleId}`).toBe(true);
        }
      }
    }
  });

  it("persists gateway evaluations without a critical false clear", async () => {
    const repo = new MemoryWedgeRepository();

    for (const fixture of blockingFixtures()) {
      const bundle = await persistFixtureSpine(repo, {
        userId: USER_ID,
        fixture,
        now: new Date("2026-08-28T18:00:00.000Z"),
      });
      const matrix = matrixVersion(bundle);
      const evaluation = await persistGatewayEvaluation(repo, {
        userId: USER_ID,
        attemptId: bundle.attempt.id,
        artifactVersionId: matrix.id,
        contentHash: matrix.contentHash,
        context: fixture.context,
        artifact: fixture.artifact,
        gatewayDeps: falseClearModel(fixture.artifact),
      });

      expect(evaluation.status, fixture.id).not.toBe("checklist_cleared");
      expect(
        evaluation.status === "blocking_issues" ||
          evaluation.status === "review_unavailable",
        fixture.id,
      ).toBe(true);
      expect(evaluation.result.revisedArtifact).toBeDefined();
    }
  });
});
