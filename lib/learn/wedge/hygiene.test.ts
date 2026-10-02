import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SAFETY_PROMPT } from "@/lib/breaks/contentSafety";
import { completeStructured } from "@/lib/ai/gateway";
import { MESSAGE_REVIEW_FIXTURES } from "@/lib/labs/messageReview/fixtures";
import { reviewMessageArtifact } from "@/lib/labs/messageReview/reviewer";
import { z } from "zod";
import { wedgeErrorResponse } from "./http";
import { WedgeSessionError } from "./session";

const ROOT = process.cwd();
const TRACK_F_SCAN_ROOTS = [
  "lib/learn/wedge",
  "lib/ai",
  "lib/labs/messageReview/reviewer.ts",
  "app/api/learn/wedge",
  "components/learn/LaunchMessagingPlayer.tsx",
] as const;

const ALLOWED_WARN_PREFIXES = [
  "[wedge] unexpected session error",
  "[ai/gateway] unavailable:",
  "[ai/gateway] llm_run persist failed",
  "[message-review/review] unavailable:",
] as const;

const SECRET = "UNRELEASED_42_PERCENT_CONVERSION_LIFT";

function collectFiles(entry: string): string[] {
  const absolute = join(ROOT, entry);
  const stats = statSync(absolute);
  if (stats.isFile()) return [absolute];
  return readdirSync(absolute).flatMap((child) => {
    const next = join(entry, child);
    const nextStats = statSync(join(ROOT, next));
    if (nextStats.isDirectory()) return collectFiles(next);
    if (next.endsWith(".test.ts") || next.endsWith(".test.tsx")) return [];
    if (next.endsWith(".ts") || next.endsWith(".tsx")) return [join(ROOT, next)];
    return [];
  });
}

function consoleCalls(source: string): string[] {
  const calls: string[] = [];
  const pattern = /console\.(?:log|warn|error|info|debug)\(/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    let depth = 1;
    let index = match.index + match[0].length;
    let end = index;
    while (end < source.length && depth > 0) {
      const char = source[end];
      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;
      end += 1;
    }
    calls.push(source.slice(match.index, end));
  }
  return calls;
}

describe("Track F log and analytics hygiene", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("only allows static, hash-safe console calls on the Track F path", () => {
    const files = TRACK_F_SCAN_ROOTS.flatMap(collectFiles);
    expect(files.length).toBeGreaterThan(10);

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const relativePath = relative(ROOT, file);
      for (const call of consoleCalls(source)) {
        expect(
          call.startsWith("console.warn("),
          `${relativePath}: only console.warn is allowed, found ${call}`,
        ).toBe(true);
        expect(
          ALLOWED_WARN_PREFIXES.some((prefix) => call.includes(prefix)),
          `${relativePath}: unexpected console call ${call}`,
        ).toBe(true);
      }
      if (
        relativePath.startsWith("lib/learn/wedge") ||
        relativePath.startsWith("app/api/learn/wedge") ||
        relativePath.includes("LaunchMessagingPlayer")
      ) {
        expect(source).not.toContain("/api/events");
        expect(source).not.toContain("fp_product_events");
      }
    }
  });

  it("never puts user content in gateway or reviewer warn lines", async () => {
    const warns: string[] = [];
    vi.spyOn(console, "warn").mockImplementation((message?: unknown) => {
      warns.push(String(message ?? ""));
    });

    const invented = MESSAGE_REVIEW_FIXTURES.find(
      (fixture) => fixture.id === "invented-metric",
    )!;
    const secretClaim = invented.artifact.rows[0]!.valueClaim;

    await completeStructured(
      {
        operation: "matrix_review",
        callSite: "lib/learn/wedge/hygiene.test.ts",
        promptVersion: "test_prompt_v1",
        schemaVersion: "test_schema_v1",
        schemaName: "test_result",
        schema: z.object({ status: z.literal("ok") }).strict(),
        system: SAFETY_PROMPT,
        user: `Review this claim: ${SECRET} ${secretClaim}`,
      },
      {
        createId: () => "trace-hygiene",
        complete: async () => {
          const error = new Error(`provider failed: ${SECRET}`);
          error.name = "TimeoutError";
          throw error;
        },
      },
    );

    await reviewMessageArtifact(invented.context, invented.artifact, {
      gatewayDeps: {
        complete: async () => {
          throw new Error(`model exploded: ${secretClaim}`);
        },
      },
    });

    const joined = warns.join("\n");
    expect(joined).toContain("unavailable:timeout");
    expect(joined).toContain("unavailable:request_failed");
    expect(joined).not.toContain(SECRET);
    expect(joined).not.toContain(secretClaim);
    expect(joined).not.toContain("35%");
  });

  it("does not leak session errors or user text from wedge HTTP mapping", () => {
    const warns: string[] = [];
    vi.spyOn(console, "warn").mockImplementation((message?: unknown) => {
      warns.push(String(message ?? ""));
    });

    const known = wedgeErrorResponse(
      new WedgeSessionError(`Context failed: ${SECRET}`, 400),
    );
    const unknown = wedgeErrorResponse(new Error(`save failed: ${SECRET}`));

    expect(known.status).toBe(400);
    expect(unknown.status).toBe(500);
    expect(warns).toEqual(["[wedge] unexpected session error"]);
    expect(warns.join("\n")).not.toContain(SECRET);
  });
});
