import { describe, expect, it } from "vitest";
import { isAuthProtectedPath } from "./authProtectedPaths";

describe("isAuthProtectedPath", () => {
  it("keeps the logged-in hub protected", () => {
    expect(isAuthProtectedPath("/progress")).toBe(true);
    expect(isAuthProtectedPath("/missions")).toBe(true);
    expect(isAuthProtectedPath("/environment/room-1")).toBe(true);
    expect(isAuthProtectedPath("/labs/message-review")).toBe(true);
    expect(isAuthProtectedPath("/missions/launch-messaging")).toBe(true);
  });

  it("leaves shared evidence pages public", () => {
    expect(
      isAuthProtectedPath("/progress/evidence/steffanhowey-prompt-engineering-cqwz"),
    ).toBe(false);
    expect(
      isAuthProtectedPath(
        "/progress/evidence/steffanhowey-prompt-engineering-cqwz/opengraph-image",
      ),
    ).toBe(false);
  });

  it("keeps the stranger-facing routes public", () => {
    expect(isAuthProtectedPath("/")).toBe(false);
    expect(isAuthProtectedPath("/pulse")).toBe(false);
    expect(isAuthProtectedPath("/skills/content-marketer")).toBe(false);
    expect(isAuthProtectedPath("/index")).toBe(false);
    expect(isAuthProtectedPath("/index/2026-09")).toBe(false);
    expect(isAuthProtectedPath("/learn/achievements/path-1")).toBe(false);
    expect(isAuthProtectedPath("/login")).toBe(false);
    expect(isAuthProtectedPath("/signup")).toBe(false);
    expect(isAuthProtectedPath("/terms")).toBe(false);
    expect(isAuthProtectedPath("/privacy")).toBe(false);
    expect(isAuthProtectedPath("/refund")).toBe(false);
  });

  it("keeps the hub skill and path pages protected", () => {
    expect(isAuthProtectedPath("/skills")).toBe(true);
    expect(isAuthProtectedPath("/learn/paths/path-1")).toBe(true);
  });
});
