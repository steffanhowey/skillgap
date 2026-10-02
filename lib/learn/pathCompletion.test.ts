import { describe, expect, it } from "vitest";
import { canCompletePath, hasSkillEvaluation } from "./pathCompletion";

describe("pathCompletion", () => {
  it("does not complete a skipped Do item", () => {
    expect(
      canCompletePath(
        [{ item_id: "item-1", task_type: "do" }],
        {
          "item-1": {
            completed: false,
            skipped: true,
            evaluation: { quality: "good" },
          },
        },
      ),
    ).toBe(false);
  });

  it("does not complete a Do item without evaluation", () => {
    expect(
      canCompletePath(
        [{ item_id: "item-1", task_type: "do" }],
        { "item-1": { completed: true, skipped: false } },
      ),
    ).toBe(false);
  });

  it("completes a Do item with an evaluation", () => {
    expect(
      canCompletePath(
        [{ item_id: "item-1", task_type: "do" }],
        {
          "item-1": {
            completed: true,
            skipped: false,
            evaluation: { quality: "good" },
          },
        },
      ),
    ).toBe(true);
    expect(
      hasSkillEvaluation({ evaluation: { quality: "unevaluated" } }),
    ).toBe(false);
  });
});
