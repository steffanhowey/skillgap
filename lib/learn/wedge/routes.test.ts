import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_REVIEW_FIXTURES } from "@/lib/labs/messageReview/fixtures";
import { LAUNCH_MESSAGING_DISCLOSURE_VERSION } from "./config";
import { resetWedgeRateLimitForTests } from "./rateLimit";
import type { WedgePlayerSnapshot } from "./playerState";

const {
  accessMock,
  createRepoMock,
  loadSessionMock,
  evaluateMock,
} = vi.hoisted(() => ({
  accessMock: vi.fn(),
  createRepoMock: vi.fn(),
  loadSessionMock: vi.fn(),
  evaluateMock: vi.fn(),
}));

vi.mock("@/lib/learn/wedge/access", () => ({
  getTrackFAccess: accessMock,
}));

vi.mock("@/lib/learn/wedge/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/learn/wedge/session")>();
  return {
    ...actual,
    createWedgeRepository: createRepoMock,
    loadWedgeSession: loadSessionMock,
    evaluateWedgeMatrix: evaluateMock,
  };
});

import { GET as getAttempt } from "@/app/api/learn/wedge/attempt/route";
import { POST as evaluatePost } from "@/app/api/learn/wedge/attempt/evaluate/route";

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function snapshot(overrides: Partial<WedgePlayerSnapshot> = {}): WedgePlayerSnapshot {
  return {
    attemptId: "attempt-1",
    step: "review",
    context: MESSAGE_REVIEW_FIXTURES[0]!.context,
    matrix: MESSAGE_REVIEW_FIXTURES[0]!.artifact,
    evaluatedMatrix: null,
    evaluation: null,
    reviewUnavailable: false,
    hasSavedArtifact: true,
    ...overrides,
  };
}

describe("wedge routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetWedgeRateLimitForTests();
    createRepoMock.mockReturnValue({});
  });

  it("returns 401 when the caller is not signed in", async () => {
    accessMock.mockResolvedValue({ status: "unauthenticated", user: null });

    const response = await getAttempt();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(loadSessionMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the caller is outside the founder allowlist", async () => {
    accessMock.mockResolvedValue({ status: "forbidden", user: null });

    const response = await getAttempt();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
    expect(loadSessionMock).not.toHaveBeenCalled();
  });

  it("requires disclosure before evaluating", async () => {
    accessMock.mockResolvedValue({
      status: "allowed",
      user: { id: "user-1", email: "founder@skillgap.ai" },
    });
    const artifact = MESSAGE_REVIEW_FIXTURES[0]!.artifact;

    const missing = await evaluatePost(
      jsonRequest("http://localhost/api/learn/wedge/attempt/evaluate", {
        artifact,
      }),
    );
    const wrongVersion = await evaluatePost(
      jsonRequest("http://localhost/api/learn/wedge/attempt/evaluate", {
        artifact,
        processingDisclosureAccepted: true,
        disclosureVersion: "old-disclosure",
      }),
    );

    expect(missing.status).toBe(400);
    expect(wrongVersion.status).toBe(400);
    await expect(missing.json()).resolves.toEqual({
      error: "Confirm the review disclosure before continuing.",
    });
    expect(evaluateMock).not.toHaveBeenCalled();
  });

  it("ignores client-supplied evaluation JSON", async () => {
    accessMock.mockResolvedValue({
      status: "allowed",
      user: { id: "user-1", email: "founder@skillgap.ai" },
    });
    const artifact = MESSAGE_REVIEW_FIXTURES[0]!.artifact;
    evaluateMock.mockResolvedValue(snapshot({ step: "diff" }));

    const response = await evaluatePost(
      jsonRequest("http://localhost/api/learn/wedge/attempt/evaluate", {
        artifact,
        processingDisclosureAccepted: true,
        disclosureVersion: LAUNCH_MESSAGING_DISCLOSURE_VERSION,
        result: { status: "checklist_cleared" },
      }),
    );

    expect(response.status).toBe(200);
    expect(evaluateMock).toHaveBeenCalledWith({}, "user-1", artifact);
  });

  it("returns 429 after the per-user evaluate budget is exhausted", async () => {
    accessMock.mockResolvedValue({
      status: "allowed",
      user: { id: "user-1", email: "founder@skillgap.ai" },
    });
    const artifact = MESSAGE_REVIEW_FIXTURES[0]!.artifact;
    evaluateMock.mockResolvedValue(snapshot({ step: "diff" }));
    const body = {
      artifact,
      processingDisclosureAccepted: true,
      disclosureVersion: LAUNCH_MESSAGING_DISCLOSURE_VERSION,
    };

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const allowed = await evaluatePost(
        jsonRequest("http://localhost/api/learn/wedge/attempt/evaluate", body),
      );
      expect(allowed.status).toBe(200);
    }

    const limited = await evaluatePost(
      jsonRequest("http://localhost/api/learn/wedge/attempt/evaluate", body),
    );
    expect(limited.status).toBe(429);
    await expect(limited.json()).resolves.toEqual({
      error: "Rate limit exceeded",
    });
    expect(evaluateMock).toHaveBeenCalledTimes(12);
  });
});
