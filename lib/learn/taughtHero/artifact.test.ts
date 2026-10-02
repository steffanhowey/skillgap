import { describe, expect, it } from "vitest";

import {
  buildFieldHelperPrompt,
  createEmptyContentBrief,
  evaluateContentBrief,
  parseContentBrief,
} from "./artifact";

describe("taughtHero artifact", () => {
  it("rejects an empty brief", () => {
    const result = evaluateContentBrief(createEmptyContentBrief());
    expect(result.ok).toBe(false);
    expect(result.results.every((entry) => !entry.passed)).toBe(true);
  });

  it("clears only when all four parts are present", () => {
    const brief = createEmptyContentBrief();
    brief.workflowBottleneck =
      "Weekly content-brief drafting stalls when the ask is vague.";
    brief.promptStructures = [
      "Role + audience + offer + proof. Ask for a one-page brief.",
      "Constraint list: no slogans, name the buyer, cite one proof.",
    ];
    brief.failureModes = [
      "The model invents proof the team cannot defend.",
      "The brief stays generic and could fit any product.",
    ];
    brief.recommendedChange =
      "Start every brief with one audience, one offer, and one proof before drafting.";

    expect(evaluateContentBrief(brief).ok).toBe(true);
    expect(parseContentBrief(brief)?.recommendedChange).toContain("audience");
  });

  it("never asks ChatGPT to complete a SkillGap mission", () => {
    const prompt = buildFieldHelperPrompt("workflowBottleneck", "");
    expect(prompt.toLowerCase()).not.toContain("complete this skillgap");
    expect(prompt.toLowerCase()).not.toContain("help me complete");
  });
});
