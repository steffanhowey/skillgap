import { describe, expect, it } from "vitest";

import { evaluateContentBrief } from "./artifact";
import {
  LESSON_STRUCTURES,
  LESSON_WORKFLOWS,
  assembleLessonBrief,
  choicesFromBrief,
  defaultRecommendedChange,
  lessonChoicesReady,
} from "./lesson";

describe("taughtHero lesson", () => {
  it("assembles a usable method from picks instead of empty fields", () => {
    const choices = {
      workflowId: "newsletter",
      customWorkflow: "",
      structureId: "audience-offer-proof",
      recommendedChange: defaultRecommendedChange({
        workflowId: "newsletter",
        customWorkflow: "",
        structureId: "audience-offer-proof",
        recommendedChange: "",
      }),
    };

    expect(lessonChoicesReady(choices)).toBe(true);
    const brief = assembleLessonBrief(choices);
    expect(brief.workflowBottleneck).toBe(LESSON_WORKFLOWS[0]?.stall);
    expect(brief.promptStructures[0]).toBe(LESSON_STRUCTURES[0]?.template);
    expect(evaluateContentBrief(brief).ok).toBe(true);
    expect(choicesFromBrief(brief).workflowId).toBe("newsletter");
    expect(choicesFromBrief(brief).structureId).toBe("audience-offer-proof");
  });
});
