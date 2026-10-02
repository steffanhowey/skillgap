import { describe, expect, it } from "vitest";

import type { LearningPath, LearningProgress } from "@/lib/types";
import {
  applyTaughtHeroUnit,
  isTaughtHeroPath,
  reconcileTaughtHeroProgress,
} from "./unit";
import { TAUGHT_HERO_ITEM_IDS } from "./types";

function createPath(overrides: Partial<LearningPath> = {}): LearningPath {
  return {
    id: "9bdd2a2e-6c49-4495-99a5-057c8736e5b0",
    title: "Crafting a Prompt Engineering Research Brief for Marketers",
    description: "Mission description",
    goal: "Mission goal",
    query: "prompt engineering research brief",
    topics: ["prompt-engineering"],
    difficulty_level: "beginner",
    estimated_duration_seconds: 900,
    items: [
      {
        item_id: "old-do",
        task_type: "do",
        position: 0,
        module_index: 0,
        title: "Prompt Engineering Research Brief",
        connective_text: "Copy the prompt.",
        duration_seconds: 900,
        content_id: null,
        content_type: null,
        creator_name: null,
        source_url: null,
        thumbnail_url: null,
        quality_score: null,
        clip_start_seconds: null,
        clip_end_seconds: null,
        mission: {
          objective: "Create the brief",
          context: "Context",
          tool: {
            name: "ChatGPT",
            slug: "chatgpt",
            url: "https://chatgpt.com",
            description: "Writing tool",
            icon: "sparkles",
            category: "writing",
            submission_type: "text",
            paste_instruction: "Paste",
            supports_deep_link: false,
            deep_link_template: null,
          },
          tool_prompt: "Help me complete this SkillGap mission about Prompt Engineering.",
          steps: ["Copy the prompt"],
          success_criteria: ["Done"],
          starter_code: null,
          guidance_level: "guided",
          submission_type: "text",
        },
        check: null,
        reflection: null,
      },
    ],
    view_count: 0,
    start_count: 0,
    completion_count: 0,
    created_at: "2026-03-20T00:00:00.000Z",
    mission_lane_key: "prompt-engineering:research-insight",
    ...overrides,
  };
}

describe("taughtHero unit", () => {
  it("overlays a watch-do-check-reflect unit on the hero lane", () => {
    const path = applyTaughtHeroUnit(createPath());

    expect(isTaughtHeroPath(path)).toBe(true);
    expect(path.items.map((item) => item.task_type)).toEqual([
      "watch",
      "do",
      "check",
      "reflect",
    ]);
    expect(path.title).toBe("Write a better brief for ChatGPT");
    expect(path.items[0]?.title).toBe("Watch why a vague ask comes back generic");
    expect(path.items[1]?.workshop?.kind).toBe("content_brief_prompt_upgrade");
    expect(path.items[3]?.workshop?.kind).toBe("next_brief_use");
    expect(path.items[1]?.mission).toBeNull();
    expect(JSON.stringify(path.items)).not.toContain(
      "Help me complete this SkillGap mission",
    );
    expect(path.items[0]?.source_url).toContain("youtube.com");
  });

  it("leaves other launch lanes untouched", () => {
    const path = applyTaughtHeroUnit(
      createPath({
        mission_lane_key: "claude-code:research-insight",
        topics: ["claude-code"],
      }),
    );

    expect(path.items).toHaveLength(1);
    expect(path.items[0]?.item_id).toBe("old-do");
  });

  it("reopens stale one-step completion", () => {
    const path = applyTaughtHeroUnit(createPath());
    const progress: LearningProgress = {
      id: "progress-1",
      user_id: "user-1",
      path_id: path.id,
      started_at: "2026-03-20T00:00:00.000Z",
      last_activity_at: "2026-03-20T00:00:00.000Z",
      completed_at: "2026-03-20T00:00:00.000Z",
      current_item_index: 0,
      items_completed: 1,
      items_total: 1,
      time_invested_seconds: 60,
      item_states: {
        "old-do": { completed: true, skipped: false },
      },
      status: "completed",
    };

    const reconciled = reconcileTaughtHeroProgress(path, progress);
    expect(reconciled?.status).toBe("in_progress");
    expect(reconciled?.completed_at).toBeNull();
    expect(reconciled?.items_total).toBe(4);
    expect(reconciled?.items_completed).toBe(0);
    expect(reconciled?.current_item_index).toBe(0);
    expect(path.items.some((item) => item.item_id === TAUGHT_HERO_ITEM_IDS.do)).toBe(
      true,
    );
  });
});
