import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MESSAGE_REVIEW_DISCLOSURE_VERSION,
  MESSAGE_REVIEW_EXPERIMENT_VERSION,
} from "./config";
import { MESSAGE_REVIEW_FIXTURES } from "./fixtures";
import { createUnavailableReviewResult } from "./schemas";

const {
  accessMock,
  extractMock,
  reviewMock,
  eventInsertMock,
  createAdminClientMock,
} = vi.hoisted(() => ({
  accessMock: vi.fn(),
  extractMock: vi.fn(),
  reviewMock: vi.fn(),
  eventInsertMock: vi.fn(),
  createAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/labs/messageReview/access", () => ({
  getMessageReviewLabAccess: accessMock,
}));

vi.mock("@/lib/labs/messageReview/contextExtractor", () => ({
  extractMessageReviewContext: extractMock,
}));

vi.mock("@/lib/labs/messageReview/reviewer", () => ({
  reviewMessageArtifact: reviewMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createClient: createAdminClientMock,
}));

import { POST as extractPost } from "@/app/api/labs/message-review/extract/route";
import { POST as reviewPost } from "@/app/api/labs/message-review/review/route";
import { POST as eventPost } from "@/app/api/labs/message-review/events/route";

const STUDY_ID = "9b2dc9b8-4d19-4b6a-8c28-6ffb2c1f59ab";

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validExtractBody(): Record<string, unknown> {
  return {
    brief: "b".repeat(200),
    artifactText: "a".repeat(50),
    studyParticipantId: STUDY_ID,
    disclosureVersion: MESSAGE_REVIEW_DISCLOSURE_VERSION,
    processingDisclosureAccepted: true,
  };
}

function validReviewBody(): Record<string, unknown> {
  const fixture = MESSAGE_REVIEW_FIXTURES[0]!;
  return {
    context: fixture.context,
    artifact: fixture.artifact,
    studyParticipantId: STUDY_ID,
    experimentVersion: MESSAGE_REVIEW_EXPERIMENT_VERSION,
    disclosureVersion: MESSAGE_REVIEW_DISCLOSURE_VERSION,
    processingDisclosureAccepted: true,
    humanResearchConsent: false,
  };
}

describe("message review lab routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accessMock.mockResolvedValue({
      status: "allowed",
      user: { id: "user-1", email: "tester@example.com" },
    });
    eventInsertMock.mockResolvedValue({ error: null });
    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({ insert: eventInsertMock }),
    });
  });

  it("conceals the lab from authenticated users outside the allowlist", async () => {
    accessMock.mockResolvedValue({ status: "forbidden", user: null });

    const response = await extractPost(
      jsonRequest(
        "http://localhost/api/labs/message-review/extract",
        validExtractBody(),
      ),
    );

    expect(response.status).toBe(404);
    expect(extractMock).not.toHaveBeenCalled();
  });

  it("extracts only after strict validation and returns no-store", async () => {
    const fixture = MESSAGE_REVIEW_FIXTURES[0]!;
    extractMock.mockResolvedValue({
      context: fixture.context,
      artifact: fixture.artifact,
    });

    const response = await extractPost(
      jsonRequest(
        "http://localhost/api/labs/message-review/extract",
        validExtractBody(),
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(extractMock).toHaveBeenCalledWith({
      brief: "b".repeat(200),
      artifactText: "a".repeat(50),
    });
  });

  it("rejects any attempt to send baseline output to the review branch", async () => {
    const response = await reviewPost(
      jsonRequest("http://localhost/api/labs/message-review/review", {
        ...validReviewBody(),
        baselineOutput: "must not enter Branch C",
      }),
    );

    expect(response.status).toBe(400);
    expect(reviewMock).not.toHaveBeenCalled();
  });

  it("returns the fail-closed unavailable state with a 503", async () => {
    const fixture = MESSAGE_REVIEW_FIXTURES[0]!;
    reviewMock.mockResolvedValue(
      createUnavailableReviewResult(fixture.artifact),
    );

    const response = await reviewPost(
      jsonRequest(
        "http://localhost/api/labs/message-review/review",
        validReviewBody(),
      ),
    );
    const body = (await response.json()) as { status: string };

    expect(response.status).toBe(503);
    expect(body.status).toBe("unavailable");
  });

  it("rejects content-bearing analytics and stores only allowed properties", async () => {
    const baseEvent = {
      event: "pressure_test_completed",
      experimentVersion: MESSAGE_REVIEW_EXPERIMENT_VERSION,
      studyParticipantId: STUDY_ID,
      durationBucket: "2_to_5m",
      issueCounts: { blocking: 1, material: 2, minor: 0 },
      operatorRescue: false,
    };

    const rejected = await eventPost(
      jsonRequest("http://localhost/api/labs/message-review/events", {
        ...baseEvent,
        brief: "forbidden",
      }),
    );
    expect(rejected.status).toBe(400);
    expect(eventInsertMock).not.toHaveBeenCalled();

    const accepted = await eventPost(
      jsonRequest(
        "http://localhost/api/labs/message-review/events",
        baseEvent,
      ),
    );
    expect(accepted.status).toBe(204);
    expect(eventInsertMock).toHaveBeenCalledWith({
      user_id: "user-1",
      event: "pressure_test_completed",
      properties: {
        experiment_version: MESSAGE_REVIEW_EXPERIMENT_VERSION,
        study_participant_id: STUDY_ID,
        duration_bucket: "2_to_5m",
        issue_counts: { blocking: 1, material: 2, minor: 0 },
        operator_rescue: false,
      },
    });
  });
});
