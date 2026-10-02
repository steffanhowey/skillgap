import { describe, expect, it } from "vitest";
import { generateHandleFromName } from "./handles";
import { USERNAME_REGEX } from "@/lib/username";

describe("generateHandleFromName", () => {
  it("builds a valid handle from a first name", () => {
    const handle = generateHandleFromName("Steffan");
    expect(handle).toMatch(USERNAME_REGEX);
    expect(handle.startsWith("steffan_")).toBe(true);
  });

  it("falls back when the name has no letters", () => {
    const handle = generateHandleFromName("123");
    expect(handle).toMatch(USERNAME_REGEX);
    expect(handle.startsWith("learner_")).toBe(true);
  });
});
