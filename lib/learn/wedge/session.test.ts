import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_REVIEW_FIXTURES } from "@/lib/labs/messageReview/fixtures";
import { createUnavailableReviewResult } from "@/lib/labs/messageReview/schemas";
import type { MessageReviewArtifact, MessageReviewResult } from "@/lib/labs/messageReview/types";
import { persistFixtureSpine } from "./evaluate";
import { MemoryWedgeRepository } from "./memoryRepository";
import { deriveWedgePlayerStep } from "./playerState";
import {
  evaluateWedgeMatrix,
  exportWedgeWork,
  loadWedgeSession,
  reviseWedgeMatrix,
  saveWedgeContext,
  saveWedgeMatrix,
} from "./session";

const { reviewMock } = vi.hoisted(() => ({
  reviewMock: vi.fn(),
}));

vi.mock("@/lib/labs/messageReview/reviewer", () => ({
  reviewMessageArtifact: reviewMock,
}));

const USER_ID = "11111111-2222-4333-8444-555555555555";

function fixtureById(id: string) {
  const fixture = MESSAGE_REVIEW_FIXTURES.find((row) => row.id === id);
  if (!fixture) throw new Error(`Missing fixture ${id}`);
  return fixture;
}

function clearedResult(artifact: MessageReviewArtifact): MessageReviewResult {
  return {
    status: "checklist_cleared",
    issues: [],
    claimMappings: [],
    revisedArtifact: artifact,
  };
}

describe("wedge session", () => {
  const fixture = fixtureById("invented-metric");

  beforeEach(() => {
    reviewMock.mockReset();
    reviewMock.mockImplementation(
      async (
        _context: unknown,
        artifact: MessageReviewArtifact,
      ): Promise<MessageReviewResult> => clearedResult(artifact),
    );
  });

  it("starts, saves, evaluates, and resumes the same attempt", async () => {
    const repo = new MemoryWedgeRepository();
    const started = await loadWedgeSession(repo, USER_ID);

    expect(started.step).toBe("context");
    expect(started.context).toBeNull();
    expect(started.matrix).toBeNull();

    const afterContext = await saveWedgeContext(repo, USER_ID, fixture.context);
    expect(afterContext.attemptId).toBe(started.attemptId);
    expect(afterContext.step).toBe("matrix");
    expect(afterContext.context).toEqual(fixture.context);

    const afterMatrix = await saveWedgeMatrix(repo, USER_ID, fixture.artifact);
    expect(afterMatrix.attemptId).toBe(started.attemptId);
    expect(afterMatrix.step).toBe("review");
    expect(afterMatrix.matrix).toEqual(fixture.artifact);

    const afterEval = await evaluateWedgeMatrix(repo, USER_ID, fixture.artifact);
    expect(afterEval.attemptId).toBe(started.attemptId);
    expect(afterEval.step).toBe("diff");
    expect(afterEval.evaluation?.status).toBe("checklist_cleared");
    expect(afterEval.reviewUnavailable).toBe(false);

    const again = await evaluateWedgeMatrix(repo, USER_ID, fixture.artifact);
    const bundle = await repo.getAttemptBundle(USER_ID, started.attemptId);
    const matrixArtifact = bundle?.artifacts.find(
      (row) => row.artifactType === "message_matrix",
    );
    const matrixVersions = bundle?.versions.filter(
      (row) => row.artifactId === matrixArtifact?.id,
    );

    expect(again.attemptId).toBe(started.attemptId);
    expect(matrixVersions).toHaveLength(1);
    expect(bundle?.evaluations).toHaveLength(1);

    const resumed = await loadWedgeSession(repo, USER_ID);
    expect(resumed.attemptId).toBe(started.attemptId);
    expect(resumed.context).toEqual(fixture.context);
    expect(resumed.matrix).toEqual(fixture.artifact);
    expect(resumed.step).toBe("diff");
  });

  it("keeps the original matrix when review is unavailable", async () => {
    const repo = new MemoryWedgeRepository();
    reviewMock.mockImplementation(
      async (
        _context: unknown,
        artifact: MessageReviewArtifact,
      ): Promise<MessageReviewResult> => createUnavailableReviewResult(artifact),
    );

    await saveWedgeContext(repo, USER_ID, fixture.context);
    await saveWedgeMatrix(repo, USER_ID, fixture.artifact);
    const snapshot = await evaluateWedgeMatrix(repo, USER_ID, fixture.artifact);

    expect(snapshot.step).toBe("review");
    expect(snapshot.reviewUnavailable).toBe(true);
    expect(snapshot.evaluation?.result.revisedArtifact).toEqual(fixture.artifact);
  });

  it("exports context, matrix, and the allowed review line after revise", async () => {
    const repo = new MemoryWedgeRepository();
    await saveWedgeContext(repo, USER_ID, fixture.context);
    await saveWedgeMatrix(repo, USER_ID, fixture.artifact);
    await evaluateWedgeMatrix(repo, USER_ID, fixture.artifact);
    const revised = await reviseWedgeMatrix(repo, USER_ID, fixture.artifact);
    const exported = await exportWedgeWork(repo, USER_ID);

    expect(revised.step).toBe("export");
    expect(exported.filename).toBe("launch-messaging-export.md");
    expect(exported.text).toContain("AI-reviewed against the proof you supplied.");
    expect(exported.text).toContain(fixture.context.offer);
    expect(exported.text).toContain(fixture.artifact.channelDraft);
    expect(
      exported.text.split(
        "Checked against the context and proof you supplied.",
      ),
    ).toHaveLength(2);
  });

  it("derives export when the attempt activity is export", async () => {
    const repo = new MemoryWedgeRepository();
    const bundle = await persistFixtureSpine(repo, {
      userId: USER_ID,
      fixture,
      now: new Date("2026-08-28T18:00:00.000Z"),
    });

    expect(deriveWedgePlayerStep(bundle)).toBe("diff");

    bundle.attempt.currentActivityId = "export";
    expect(deriveWedgePlayerStep(bundle)).toBe("export");
  });
});
