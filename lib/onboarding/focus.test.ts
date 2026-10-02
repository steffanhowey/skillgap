import { describe, expect, it } from "vitest";
import { normalizeFocusAreas } from "./types";

describe("normalizeFocusAreas", () => {
  it("keeps three known areas and drops the rest", () => {
    expect(
      normalizeFocusAreas(["content", "seo", "paid", "social", "nope"]),
    ).toEqual(["content", "seo", "paid"]);
  });
});
