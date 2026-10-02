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
});
