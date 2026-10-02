import { afterEach, describe, expect, it } from "vitest";
import {
  allowWedgeRequest,
  resetWedgeRateLimitForTests,
  WEDGE_RATE_LIMIT_WINDOW_MS,
  WEDGE_RATE_LIMITS,
} from "./rateLimit";

describe("wedge rate limit", () => {
  afterEach(() => {
    resetWedgeRateLimitForTests();
  });

  it("caps evaluate per user and does not share budget across users", () => {
    const limit = WEDGE_RATE_LIMITS.evaluate;
    for (let attempt = 0; attempt < limit; attempt += 1) {
      expect(allowWedgeRequest("user-1", "evaluate", 1_000 + attempt)).toBe(
        true,
      );
    }
    expect(allowWedgeRequest("user-1", "evaluate", 2_000)).toBe(false);
    expect(allowWedgeRequest("user-2", "evaluate", 2_000)).toBe(true);
  });

  it("releases the window after one hour", () => {
    const started = 1_000;
    for (let attempt = 0; attempt < WEDGE_RATE_LIMITS.evaluate; attempt += 1) {
      expect(allowWedgeRequest("user-1", "evaluate", started + attempt)).toBe(
        true,
      );
    }
    expect(
      allowWedgeRequest("user-1", "evaluate", started + WEDGE_RATE_LIMIT_WINDOW_MS - 1),
    ).toBe(false);
    expect(
      allowWedgeRequest("user-1", "evaluate", started + WEDGE_RATE_LIMIT_WINDOW_MS),
    ).toBe(true);
  });
});
