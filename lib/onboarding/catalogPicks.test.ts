import { describe, expect, it } from "vitest";
import { overlayPathOnPick, picksFromLaunchCatalog } from "./catalogPicks";
import type { LearningPath } from "@/lib/types";
import type { OnboardingPick } from "./types";

function createPath(overrides: Partial<LearningPath> = {}): LearningPath {
  return {
    id: "path-1",
    title: "Write a research brief",
    description: "Turn raw notes into a usable brief.",
    query: "research brief",
    topics: [],
    difficulty_level: "beginner",
    estimated_duration_seconds: 1800,
    items: [{ item_id: "item-1", task_type: "do" } as LearningPath["items"][number]],
    view_count: 0,
    start_count: 0,
    completion_count: 0,
    created_at: "2026-08-27T00:00:00.000Z",
    mission_lane_key: "prompt-engineering:research-insight",
    primary_tools: ["Claude"],
    ...overrides,
  };
}

describe("catalogPicks", () => {
  it("uses the prompt-engineering research lane as the hero", () => {
    const hero = createPath();
    const other = createPath({
      id: "path-2",
      title: "Positioning",
      mission_lane_key: "prompt-engineering:positioning-messaging",
    });

    const picks = picksFromLaunchCatalog([other, hero], "practicing");

    expect(picks.hero?.path_id).toBe(hero.id);
    expect(picks.hero?.display_title).toBe("Write a better brief for ChatGPT");
    expect(picks.hero?.module_count).toBe(4);
    expect(picks.also[0]?.path_id).toBe(other.id);
  });

  it("overlays live path metadata onto an editorial pick", () => {
    const pick: OnboardingPick = {
      id: "pick-1",
      path_id: null,
      function: "marketing",
      fluency_level: "practicing",
      path_topic: "old topic",
      display_title: "Old title",
      display_description: "Old description",
      time_estimate_min: 45,
      module_count: 4,
      tool_names: ["ChatGPT"],
      sort_order: 0,
    };
    const path = createPath();

    expect(overlayPathOnPick(pick, path)).toMatchObject({
      path_id: path.id,
      display_title: "Write a better brief for ChatGPT",
      time_estimate_min: 26,
      module_count: 4,
      tool_names: ["Claude"],
    });
  });
});
