import { describe, expect, it } from "vitest";
import { gettingStarted } from "./gettingStarted";

describe("gettingStarted", () => {
  it("starts with nothing done", () => {
    const rows = gettingStarted({
      onboardingCompleted: false,
      practiceCount: 0,
      triedAtWork: false,
    });
    expect(rows.map((row) => row.done)).toEqual([false, false, false]);
    expect(rows.map((row) => row.label)).toEqual([
      "Answer three questions",
      "Finish your first mission",
      "Try it at work and say how it went",
    ]);
  });

  it("marks onboarding, a finished mission, and a real-work check separately", () => {
    expect(
      gettingStarted({
        onboardingCompleted: true,
        practiceCount: 0,
        triedAtWork: false,
      }).map((row) => row.done),
    ).toEqual([true, false, false]);

    expect(
      gettingStarted({
        onboardingCompleted: true,
        practiceCount: 1,
        triedAtWork: false,
      }).map((row) => row.done),
    ).toEqual([true, true, false]);

    expect(
      gettingStarted({
        onboardingCompleted: true,
        practiceCount: 1,
        triedAtWork: true,
      }).map((row) => row.done),
    ).toEqual([true, true, true]);
  });
});
