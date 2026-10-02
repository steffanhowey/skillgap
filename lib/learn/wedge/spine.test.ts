import { describe, expect, it } from "vitest";
import { SAFETY_PROMPT } from "@/lib/breaks/contentSafety";
import { MESSAGE_REVIEW_FIXTURES } from "@/lib/labs/messageReview/fixtures";
import { reviewMessageArtifact } from "@/lib/labs/messageReview/reviewer";
import {
  getSeededCapabilityApplication,
  WEDGE_APPLICATION_STABLE_KEY,
} from "./application";
import { isTrackFAllowed, parseTrackFAllowlist } from "./access";
import {
  persistFixtureSpine,
  persistGatewayEvaluation,
} from "./evaluate";
import { MemoryWedgeRepository } from "./memoryRepository";
import { loadEditorialSourcePacket } from "./packet";

const USER_ID = "11111111-2222-4333-8444-555555555555";

function fixtureById(id: string) {
  const fixture = MESSAGE_REVIEW_FIXTURES.find((row) => row.id === id);
  if (!fixture) throw new Error(`Missing fixture ${id}`);
  return fixture;
}

describe("Track F spine", () => {
  it("seeds the locked capability application and a dated editorial packet", () => {
    const application = getSeededCapabilityApplication();
    const packet = loadEditorialSourcePacket(
      new Date("2026-08-28T18:00:00.000Z"),
    );

    expect(application.stableKey).toBe(WEDGE_APPLICATION_STABLE_KEY);
    expect(application.status).toBe("allowlisted");
    expect(packet.dated).toBe("2026-08-28");
    expect(packet.why_now_label).toBe("editorial_next_step");
    expect(packet.why_now).toMatch(/editorial next step/i);
    expect(packet.why_now.toLowerCase()).not.toContain("market demand");
    expect(packet.packet_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("uses a new founder allowlist, not the lab list", () => {
    expect(parseTrackFAllowlist(" Founder@Skillgap.ai,founder@skillgap.ai ")).toEqual(
      ["founder@skillgap.ai"],
    );
    expect(
      isTrackFAllowed("founder@skillgap.ai", "FOUNDER@skillgap.ai", "production"),
    ).toBe(true);
    expect(isTrackFAllowed("other@example.com", "*", "production")).toBe(false);
    expect(isTrackFAllowed("local@example.com", "", "development")).toBe(true);
    expect(isTrackFAllowed("local@example.com", "", "production")).toBe(false);
  });

  it("persists attempt → artifacts → evaluation for invented-metric and supported-control", async () => {
    const repo = new MemoryWedgeRepository();
    const invented = fixtureById("invented-metric");
    const control = fixtureById("supported-control");

    const inventedBundle = await persistFixtureSpine(repo, {
      userId: USER_ID,
      fixture: invented,
      now: new Date("2026-08-28T18:00:00.000Z"),
    });
    const controlBundle = await persistFixtureSpine(repo, {
      userId: USER_ID,
      fixture: control,
      now: new Date("2026-08-28T18:00:00.000Z"),
    });

    expect(inventedBundle.attempt.applicationId).toBe(
      getSeededCapabilityApplication().id,
    );
    expect(inventedBundle.attempt.sourcePacketId).toBeNull();
    expect(inventedBundle.artifacts.map((row) => row.artifactType).sort()).toEqual(
      ["message_matrix", "work_context"],
    );
    expect(inventedBundle.evaluations).toHaveLength(1);

    const inventedEval = inventedBundle.evaluations[0]!;
    expect(inventedEval.status).toBe("blocking_issues");
    expect(
      inventedEval.criteria.find((row) => row.criterionKey === "claim_to_proof")
        ?.outcome,
    ).toBe("fail");
    expect(inventedEval.result.revisedArtifact).toEqual(invented.artifact);

    const controlEval = controlBundle.evaluations[0]!;
    expect(controlEval.status).toBe("checklist_cleared");
    expect(controlEval.criteria.every((row) => row.outcome === "pass")).toBe(true);
  });

  it("resumes the same attempt across reload and keeps artifacts", async () => {
    const repo = new MemoryWedgeRepository();
    const fixture = fixtureById("invented-metric");
    const first = await persistFixtureSpine(repo, {
      userId: USER_ID,
      fixture,
      idempotencyKey: "resume-1",
      now: new Date("2026-08-28T18:00:00.000Z"),
    });
    const second = await persistFixtureSpine(repo, {
      userId: USER_ID,
      fixture,
      idempotencyKey: "resume-1",
      now: new Date("2026-08-28T18:00:00.000Z"),
    });

    expect(second.attempt.id).toBe(first.attempt.id);
    expect(second.versions.map((row) => row.id)).toEqual(
      first.versions.map((row) => row.id),
    );
    expect(second.evaluations.map((row) => row.id)).toEqual(
      first.evaluations.map((row) => row.id),
    );
  });

  it("does not leak one user's attempt to another user", async () => {
    const repo = new MemoryWedgeRepository();
    const bundle = await persistFixtureSpine(repo, {
      userId: USER_ID,
      fixture: fixtureById("invented-metric"),
      now: new Date("2026-08-28T18:00:00.000Z"),
    });

    expect(
      await repo.getAttempt("00000000-0000-4000-8000-000000000099", bundle.attempt.id),
    ).toBeNull();
    expect(
      await repo.getAttemptBundle(
        "00000000-0000-4000-8000-000000000099",
        bundle.attempt.id,
      ),
    ).toBeNull();
  });

  it("replaces a duplicate evaluation for the same version and rubric", async () => {
    const repo = new MemoryWedgeRepository();
    const first = await persistFixtureSpine(repo, {
      userId: USER_ID,
      fixture: fixtureById("invented-metric"),
      now: new Date("2026-08-28T18:00:00.000Z"),
    });
    const evaluation = first.evaluations[0]!;
    await repo.saveEvaluation({
      evaluation: {
        ...evaluation,
        id: "99999999-0000-4000-8000-000000000001",
        status: "material_revisions",
      },
      criteria: evaluation.criteria,
    });

    const reloaded = await repo.getAttemptBundle(USER_ID, first.attempt.id);
    expect(reloaded?.evaluations).toHaveLength(1);
    expect(reloaded?.evaluations[0]?.id).toBe(evaluation.id);
    expect(reloaded?.evaluations[0]?.status).toBe("material_revisions");
  });

  it("fails closed through the gateway, preserves the artifact, and writes hashes only", async () => {
    const repo = new MemoryWedgeRepository();
    const fixture = fixtureById("invented-metric");
    const bundle = await persistFixtureSpine(repo, {
      userId: USER_ID,
      fixture,
      now: new Date("2026-08-28T18:00:00.000Z"),
    });
    const matrix = bundle.versions.find((row) =>
      bundle.artifacts.some(
        (artifact) =>
          artifact.id === row.artifactId &&
          artifact.artifactType === "message_matrix",
      ),
    );
    if (!matrix) throw new Error("Missing matrix version");

    const secret = fixture.artifact.rows[0]!.valueClaim;
    const evaluation = await persistGatewayEvaluation(repo, {
      userId: USER_ID,
      attemptId: bundle.attempt.id,
      artifactVersionId: matrix.id,
      contentHash: matrix.contentHash,
      context: fixture.context,
      artifact: fixture.artifact,
      gatewayDeps: {
        complete: async () => {
          const error = new Error("The operation was aborted due to timeout");
          error.name = "TimeoutError";
          throw error;
        },
      },
    });

    expect(evaluation.status).toBe("review_unavailable");
    expect(evaluation.result.revisedArtifact).toEqual(fixture.artifact);
    expect(
      evaluation.criteria.every((row) => row.outcome === "not_evaluated"),
    ).toBe(true);

    const reloaded = await repo.getAttemptBundle(USER_ID, bundle.attempt.id);
    expect(reloaded?.llmRuns).toHaveLength(1);
    const run = reloaded!.llmRuns[0]!;
    expect(run.status).toBe("review_unavailable");
    expect(run.failureReason).toBe("timeout");
    expect(JSON.stringify(run)).not.toContain(secret);
    expect(run.inputHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("routes the lab reviewer through the gateway without forking the rubric", async () => {
    const fixture = fixtureById("invented-metric");
    const result = await reviewMessageArtifact(
      fixture.context,
      fixture.artifact,
      {
        gatewayDeps: {
          complete: async (request) => {
            expect(request.system).toContain("CONTENT SAFETY — MANDATORY RULES");
            expect(request.system).toContain(SAFETY_PROMPT.slice(0, 20));
            expect(request.operation).toBe("matrix_review");
            return {
              parsed: {
                status: "checklist_cleared",
                issues: [],
                claimMappings: [],
                revisedArtifact: fixture.artifact,
              },
            };
          },
        },
      },
    );

    expect(result.status).toBe("blocking_issues");
    expect(result.issues.some((issue) => issue.ruleId === "claim_to_proof")).toBe(
      true,
    );
  });
});
