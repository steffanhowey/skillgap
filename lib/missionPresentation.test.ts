import { describe, expect, it } from "vitest";

import {
  getMissionNextAction,
  getMissionPlayerTitle,
  getMissionRoomCtaMode,
  getMissionStepCoaching,
} from "@/lib/missionPresentation";
import type {
  LearningPath,
  LearningProgress,
  MissionBriefing,
  PathItem,
} from "@/lib/types";

function createItem(overrides: Partial<PathItem> = {}): PathItem {
  return {
    item_id: "item-1",
    task_type: "watch",
    position: 0,
    module_index: 0,
    title: "Watch the clip",
    connective_text: "See the idea first.",
    duration_seconds: 60,
    content_id: "content-1",
    content_type: "video",
    creator_name: "Creator",
    source_url: "https://www.youtube.com/watch?v=example",
    thumbnail_url: null,
    quality_score: null,
    clip_start_seconds: null,
    clip_end_seconds: null,
    mission: null,
    check: null,
    reflection: null,
    ...overrides,
  };
}

function createMission(): MissionBriefing {
  return {
    objective: "Build a generic memo",
    context: "This is extra briefing context.",
    tool: {
      name: "ChatGPT",
      slug: "chatgpt",
      url: "https://chatgpt.com",
      description: "Writing tool",
      icon: "sparkles",
      category: "writing",
      submission_type: "text",
      paste_instruction: "Paste the output",
      supports_deep_link: false,
      deep_link_template: null,
    },
    tool_prompt: "Write the brief.",
    steps: ["Open the tool", "Paste the prompt"],
    success_criteria: ["Names one workflow"],
    starter_code: null,
    guidance_level: "guided",
    submission_type: "text",
  };
}

function createPath(overrides: Partial<LearningPath> = {}): LearningPath {
  return {
    id: "path-1",
    title: "Mission title",
    description: "Mission description",
    goal: "Mission goal",
    query: "mission query",
    topics: [],
    difficulty_level: "beginner",
    estimated_duration_seconds: 900,
    items: [],
    view_count: 0,
    start_count: 0,
    completion_count: 0,
    created_at: "2026-03-20T00:00:00.000Z",
    ...overrides,
  };
}

function createProgress(
  overrides: Partial<LearningProgress> = {},
): LearningProgress {
  return {
    id: "progress-1",
    user_id: "user-1",
    path_id: "path-1",
    started_at: "2026-03-20T00:00:00.000Z",
    last_activity_at: "2026-03-20T00:00:00.000Z",
    completed_at: null,
    current_item_index: 0,
    items_completed: 0,
    items_total: 4,
    time_invested_seconds: 0,
    item_states: {},
    status: "in_progress",
    ...overrides,
  };
}

const heroItems: PathItem[] = [
  createItem({ item_id: "watch-1", task_type: "watch", title: "Watch" }),
  createItem({
    item_id: "do-1",
    task_type: "do",
    position: 1,
    title: "Make the brief",
    content_id: null,
    content_type: null,
    creator_name: null,
    source_url: null,
    mission: createMission(),
  }),
  createItem({
    item_id: "check-1",
    task_type: "check",
    position: 2,
    title: "Check the brief",
    content_id: null,
    content_type: null,
    creator_name: null,
    source_url: null,
  }),
  createItem({
    item_id: "reflect-1",
    task_type: "reflect",
    position: 3,
    title: "Capture the takeaway",
    content_id: null,
    content_type: null,
    creator_name: null,
    source_url: null,
  }),
];

function createHeroPath(): LearningPath {
  return createPath({
    id: "9bdd2a2e-6c49-4495-99a5-057c8736e5b0",
    title: "Crafting a Prompt Engineering Research Brief for Marketers",
    topics: ["prompt-engineering"],
    mission_lane_key: "prompt-engineering:research-insight",
    items: heroItems,
  });
}

describe("missionPresentation coaching", () => {
  it("uses launch coaching for the content-brief hero mission", () => {
    const path = createHeroPath();

    expect(getMissionPlayerTitle(path)).toBe("Write a better brief for ChatGPT");
    expect(getMissionStepCoaching(path, path.items[0])).toBe(
      "Watch why a vague ask comes back generic.",
    );
    expect(getMissionStepCoaching(path, path.items[1])).toBe(
      "See a weak brief, name your job, pick a better ask.",
    );
    expect(getMissionStepCoaching(path, path.items[2])).toBe(
      "Look at the method you just made. Would you use it next time?",
    );
    expect(getMissionStepCoaching(path, path.items[3])).toBe(
      "Name the next brief you will use this on.",
    );
  });

  it("keeps launch coaching on the next-action helper", () => {
    const path = createHeroPath();

    expect(getMissionNextAction(path)).toBe(
      "Watch why a vague ask comes back generic.",
    );
    expect(
      getMissionNextAction(path, createProgress({ current_item_index: 1 })),
    ).toBe("See a weak brief, name your job, pick a better ask.");
    expect(
      getMissionNextAction(path, createProgress({ status: "completed" })),
    ).toBe("Review your outcome and decide what to work on next.");
  });

  it("falls back to generic coaching when the path is not a launch lane", () => {
    const path = createPath({
      items: [
        createItem(),
        createItem({
          item_id: "do-1",
          task_type: "do",
          position: 1,
          mission: createMission(),
        }),
      ],
    });

    expect(getMissionStepCoaching(path, path.items[0])).toBe(
      "Watch for the one idea you will use in the next step.",
    );
    expect(getMissionStepCoaching(path, path.items[1])).toBe(
      "Build a generic memo",
    );
  });
});

describe("missionPresentation room CTA", () => {
  it("hides the room CTA until the first saved step", () => {
    expect(getMissionRoomCtaMode("ready")).toBe("hidden");
    expect(getMissionRoomCtaMode("saved")).toBe("hidden");
    expect(getMissionRoomCtaMode("completed")).toBe("hidden");
    expect(getMissionRoomCtaMode("active")).toBe("hidden");
    expect(getMissionRoomCtaMode("active", 1)).toBe("footnote");
  });
});
