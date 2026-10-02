import { describe, expect, it } from "vitest";
import { selectActiveMissions, type ActiveMissionEntry } from "./useActiveMissions";
import type { LearningPath, LearningProgress } from "@/lib/types";

function createEntry(
  status: LearningProgress["status"],
): ActiveMissionEntry {
  return {
    path: { id: status, title: status } as LearningPath,
    progress: { status } as LearningProgress,
  };
}

describe("selectActiveMissions", () => {
  it("drops completed missions from the cached active list", () => {
    const selected = selectActiveMissions([
      createEntry("in_progress"),
      createEntry("completed"),
    ]);

    expect(selected).toHaveLength(1);
    expect(selected[0]?.progress.status).toBe("in_progress");
  });
});
