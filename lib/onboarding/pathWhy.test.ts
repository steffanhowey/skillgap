import { describe, expect, it } from "vitest";
import { pathWhy } from "./pathWhy";

describe("pathWhy", () => {
  it("builds one sentence from role, fluency, and focus", () => {
    expect(
      pathWhy({
        role: "marketing",
        fluency: "exploring",
        focusAreas: ["content"],
      }),
    ).toBe(
      "This path is for Marketing, from a few tries with ChatGPT, focused on Content.",
    );
  });
});