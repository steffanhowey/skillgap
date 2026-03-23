import { describe, expect, it } from "vitest";

import {
  getLaunchMissionContent,
  getLaunchMissionLaneKey,
  getLaunchMissionTransitionLine,
} from "@/lib/launchMissionContent";
import type { LearningPath } from "@/lib/types";

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

describe("launchMissionContent", () => {
  it("uses persisted lane metadata before inference", () => {
    const path = createPath({
      mission_lane_key: "claude-code:positioning-messaging",
      mission_topic_slug: "claude-code",
      mission_launch_domain: "positioning-messaging",
      topics: ["claude-code"],
    });

    expect(getLaunchMissionLaneKey(path)).toBe(
      "claude-code:positioning-messaging",
    );
    expect(getLaunchMissionContent(path)?.artifactLabel).toBe(
      "Claude Code Internal Value Matrix",
    );
  });

  it("returns launch content for approved launch lanes only", () => {
    const promptResearch = createPath({
      topics: ["prompt-engineering"],
      skill_tags: [
        {
          skill_slug: "research-synthesis",
          skill_name: "Research Synthesis",
          domain_name: "Strategy & Planning",
          relevance: "primary",
        },
      ],
    });
    const unsupportedCopilotMessaging = createPath({
      topics: ["github-copilot"],
      skill_tags: [
        {
          skill_slug: "tone-calibration",
          skill_name: "Tone Calibration",
          domain_name: "Writing & Communication",
          relevance: "primary",
        },
      ],
    });

    expect(getLaunchMissionLaneKey(promptResearch)).toBe(
      "prompt-engineering:research-insight",
    );
    expect(getLaunchMissionContent(promptResearch)?.artifactLabel).toBe(
      "Content-Brief Prompt Upgrade Brief",
    );
    expect(getLaunchMissionLaneKey(unsupportedCopilotMessaging)).toBeNull();
    expect(getLaunchMissionContent(unsupportedCopilotMessaging)).toBeNull();
  });

  it("returns explicit transition copy for the core launch path", () => {
    const promptResearch = createPath({
      topics: ["prompt-engineering"],
      skill_tags: [
        {
          skill_slug: "research-synthesis",
          skill_name: "Research Synthesis",
          domain_name: "Strategy & Planning",
          relevance: "primary",
        },
      ],
    });
    const promptMessaging = createPath({
      topics: ["prompt-engineering"],
      skill_tags: [
        {
          skill_slug: "tone-calibration",
          skill_name: "Tone Calibration",
          domain_name: "Writing & Communication",
          relevance: "primary",
        },
      ],
    });

    expect(
      getLaunchMissionTransitionLine(promptResearch, promptMessaging),
    ).toBe("You tightened the thinking. Next, turn it into a sharper message asset.");
  });
});
