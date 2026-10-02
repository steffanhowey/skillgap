import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SAFETY_PROMPT } from "@/lib/breaks/contentSafety";
import { completeStructured } from "./gateway";
import { hashCanonicalJson } from "./hash";
import type { GatewayChatCompletion, LlmRunRecord } from "./types";

const ResultSchema = z
  .object({
    status: z.literal("ok"),
    note: z.string(),
  })
  .strict();

function safetySystem(extra = ""): string {
  return `${SAFETY_PROMPT}\n${extra}`;
}

describe("ai gateway", () => {
  it("returns structured output, hashes only, and never stores raw user content", async () => {
    const runs: LlmRunRecord[] = [];
    const secret = "UNRELEASED_42_PERCENT_CONVERSION_LIFT";
    const result = await completeStructured(
      {
        operation: "matrix_review",
        callSite: "lib/ai/gateway.test.ts",
        userId: "user-1",
        promptVersion: "test_prompt_v1",
        schemaVersion: "test_schema_v1",
        schemaName: "test_result",
        schema: ResultSchema,
        system: safetySystem(),
        user: `Review this claim: ${secret}`,
      },
      {
        createId: () => "trace-1",
        now: () => Date.parse("2026-08-28T12:00:00.000Z"),
        persistRun: async (run) => {
          runs.push(run);
        },
        complete: async (): Promise<GatewayChatCompletion> => ({
          id: "req-1",
          parsed: { status: "ok", note: "cleared" },
          inputTokens: 100,
          outputTokens: 20,
        }),
      },
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.data).toEqual({ status: "ok", note: "cleared" });
    expect(result.run.model).toBe("gpt-4o-mini");
    expect(result.run.inputHash).toBe(
      hashCanonicalJson({
        operation: "matrix_review",
        promptVersion: "test_prompt_v1",
        schemaVersion: "test_schema_v1",
        system: safetySystem(),
        user: `Review this claim: ${secret}`,
      }),
    );
    expect(result.run.outputHash).toBe(
      hashCanonicalJson({ status: "ok", note: "cleared" }),
    );
    expect(JSON.stringify(result.run)).not.toContain(secret);
    expect(JSON.stringify(runs)).not.toContain(secret);
    expect(result.run.estimatedCostUsd).toBeCloseTo(
      (100 / 1_000_000) * 0.15 + (20 / 1_000_000) * 0.6,
    );
  });

  it("fails closed when SAFETY_PROMPT is missing and does not call the model", async () => {
    let called = false;
    const result = await completeStructured(
      {
        operation: "matrix_review",
        callSite: "lib/ai/gateway.test.ts",
        promptVersion: "test_prompt_v1",
        schemaVersion: "test_schema_v1",
        schemaName: "test_result",
        schema: ResultSchema,
        system: "You are a helpful reviewer.",
        user: "anything",
      },
      {
        complete: async () => {
          called = true;
          return { parsed: { status: "ok", note: "nope" } };
        },
      },
    );

    expect(called).toBe(false);
    expect(result.status).toBe("review_unavailable");
    if (result.status !== "review_unavailable") return;
    expect(result.reason).toBe("missing_safety_prompt");
    expect(result.run.failureReason).toBe("missing_safety_prompt");
  });

  it("does not accept a safety heading without the full SAFETY_PROMPT", async () => {
    let called = false;
    const result = await completeStructured(
      {
        operation: "matrix_review",
        callSite: "lib/ai/gateway.test.ts",
        promptVersion: "test_prompt_v1",
        schemaVersion: "test_schema_v1",
        schemaName: "test_result",
        schema: ResultSchema,
        system: "CONTENT SAFETY — MANDATORY RULES",
        user: "anything",
      },
      {
        complete: async () => {
          called = true;
          return { parsed: { status: "ok", note: "nope" } };
        },
      },
    );

    expect(called).toBe(false);
    expect(result.status).toBe("review_unavailable");
  });

  it("fails closed on malformed output and on timeout without retrying timeouts", async () => {
    const malformed = await completeStructured(
      {
        operation: "matrix_review",
        callSite: "lib/ai/gateway.test.ts",
        promptVersion: "test_prompt_v1",
        schemaVersion: "test_schema_v1",
        schemaName: "test_result",
        schema: ResultSchema,
        system: safetySystem(),
        user: "payload",
      },
      {
        complete: async () => ({ parsed: { status: "nope" } }),
      },
    );
    expect(malformed.status).toBe("review_unavailable");
    if (malformed.status === "review_unavailable") {
      expect(malformed.reason).toBe("malformed");
    }

    let timeoutCalls = 0;
    const timeout = await completeStructured(
      {
        operation: "matrix_review",
        callSite: "lib/ai/gateway.test.ts",
        promptVersion: "test_prompt_v1",
        schemaVersion: "test_schema_v1",
        schemaName: "test_result",
        schema: ResultSchema,
        system: safetySystem(),
        user: "payload",
        maxRetry: 1,
      },
      {
        complete: async () => {
          timeoutCalls += 1;
          const error = new Error("The operation was aborted due to timeout");
          error.name = "TimeoutError";
          throw error;
        },
      },
    );
    expect(timeoutCalls).toBe(1);
    expect(timeout.status).toBe("review_unavailable");
    if (timeout.status === "review_unavailable") {
      expect(timeout.reason).toBe("timeout");
    }
  });

  it("retries a 5xx once, then succeeds", async () => {
    let calls = 0;
    const result = await completeStructured(
      {
        operation: "matrix_review",
        callSite: "lib/ai/gateway.test.ts",
        promptVersion: "test_prompt_v1",
        schemaVersion: "test_schema_v1",
        schemaName: "test_result",
        schema: ResultSchema,
        system: safetySystem(),
        user: "payload",
        maxRetry: 1,
      },
      {
        complete: async () => {
          calls += 1;
          if (calls === 1) {
            throw new TypeError("fetch failed");
          }
          return { parsed: { status: "ok", note: "recovered" } };
        },
      },
    );

    expect(calls).toBe(2);
    expect(result.status).toBe("ok");
  });
});
