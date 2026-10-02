import { describe, expect, it } from "vitest";

import { isFirstSessionHome } from "@/lib/firstSession";

describe("isFirstSessionHome", () => {
  it("keeps the first visit in a single-mission tunnel", () => {
    expect(
      isFirstSessionHome({ achievementCount: 0, inProgressCount: 0 }),
    ).toBe(true);
  });

  it("opens the fuller home once work has started", () => {
    expect(
      isFirstSessionHome({ achievementCount: 0, inProgressCount: 1 }),
    ).toBe(false);
    expect(
      isFirstSessionHome({ achievementCount: 1, inProgressCount: 0 }),
    ).toBe(false);
  });
});
