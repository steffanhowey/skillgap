import { describe, expect, it } from "vitest";
import { thisWeekMission, type ThisWeekInput, type WeekPath } from "./thisWeekMission";

function path(overrides: Partial<WeekPath> = {}): WeekPath {
  return {
    id: "path-1",
    title: "Research like an analyst",
    reviewStatus: "approved",
    status: "approved",
    modules: [
      { index: 0, title: "Read a source", practices: "Checked one claim against the source." },
      { index: 1, title: "Use it on a brief", practices: "Turned a source into a brief." },
    ],
    items: [
      { itemId: "m0-watch", taskType: "watch", moduleIndex: 0, tool: null },
      { itemId: "m0-do", taskType: "do", moduleIndex: 0, tool: "Claude" },
      { itemId: "m0-check", taskType: "check", moduleIndex: 0, tool: null },
      { itemId: "m0-reflect", taskType: "reflect", moduleIndex: 0, tool: null },
      { itemId: "m1-watch", taskType: "watch", moduleIndex: 1, tool: null },
      { itemId: "m1-do", taskType: "do", moduleIndex: 1, tool: "Claude" },
      { itemId: "m1-check", taskType: "check", moduleIndex: 1, tool: null },
      { itemId: "m1-reflect", taskType: "reflect", moduleIndex: 1, tool: null },
    ],
    ...overrides,
  };
}

function input(overrides: Partial<ThisWeekInput> = {}): ThisWeekInput {
  return {
    path: path(),
    progress: { itemStates: {}, currentItemIndex: 0 },
    completedModuleIndexes: [],
    completedAtByModule: {},
    plan: "free",
    ...overrides,
  };
}

describe("thisWeekMission", () => {
  it("starts a fresh path on mission 1", () => {
    const result = thisWeekMission(input());
    expect(result.state).toBe("start");
    expect(result.doLocked).toBe(false);
    expect(result.missionNumber).toBe(1);
    expect(result.missionCount).toBe(2);
    expect(result.missionTitle).toBe("Read a source");
    expect(result.practices).toBe("Checked one claim against the source.");
    expect(result.tool).toBe("Claude");
    expect(result.stepsLabel).toBe("Watch, Do, Check, Reflect");
    expect(result.stoppedAt).toBeNull();
    expect(result.missions[0]?.rowState).toBe("this_week");
    expect(result.missions[1]?.rowState).toBe("up_next");
  });

  it("continues a mission that is half done", () => {
    const result = thisWeekMission(
      input({
        progress: {
          currentItemIndex: 2,
          itemStates: {
            "m0-watch": { completed: true },
            "m0-do": { completed: true },
          },
        },
      }),
    );
    expect(result.state).toBe("continue");
    expect(result.stoppedAt).toBe("Check");
    expect(result.doLocked).toBe(false);
    expect(result.moduleIndex).toBe(0);
  });

  it("locks the second mission on a free plan", () => {
    const result = thisWeekMission(
      input({
        completedModuleIndexes: [0],
        completedAtByModule: { 0: "2026-10-02T15:00:00.000Z" },
        progress: {
          currentItemIndex: 4,
          itemStates: { "m0-do": { completed: true } },
        },
      }),
    );
    expect(result.state).toBe("start");
    expect(result.missionNumber).toBe(2);
    expect(result.doLocked).toBe(true);
    expect(result.missions[0]?.rowState).toBe("done");
    expect(result.missions[1]?.rowState).toBe("paid");
  });

  it("reports a path still in review", () => {
    const result = thisWeekMission(
      input({ path: path({ reviewStatus: "pending", status: "draft" }) }),
    );
    expect(result.state).toBe("in_review");
    expect(result.doLocked).toBe(false);
    expect(result.pathTitle).toBe("Research like an analyst");
  });

  it("reports a finished path", () => {
    const result = thisWeekMission(
      input({
        completedModuleIndexes: [0, 1],
        completedAtByModule: {
          0: "2026-10-01T15:00:00.000Z",
          1: "2026-10-02T15:00:00.000Z",
        },
      }),
    );
    expect(result.state).toBe("path_done");
    expect(result.doneCount).toBe(2);
    expect(result.missions.every((mission) => mission.rowState === "done")).toBe(true);
  });

  it("reports no path", () => {
    expect(thisWeekMission(input({ path: null })).state).toBe("no_path");
  });
});
