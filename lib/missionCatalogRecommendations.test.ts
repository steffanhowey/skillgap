import { describe, expect, it } from "vitest";
import {
  buildMissionCatalogSkillRecommendations,
  getCompletedLaunchLaneKeys,
  selectPostCompletionMissionPaths,
} from "@/lib/missionCatalogRecommendations";
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

describe("missionCatalogRecommendations", () => {
  it("returns the next approved launch lanes in sequence", () => {
    const promptResearch = createPath({
      id: "prompt-research",
      topics: ["prompt-engineering"],
      mission_lane_key: "prompt-engineering:research-insight",
      mission_topic_slug: "prompt-engineering",
      mission_launch_domain: "research-insight",
    });
    const promptMessaging = createPath({
      id: "prompt-messaging",
      topics: ["prompt-engineering"],
      mission_lane_key: "prompt-engineering:positioning-messaging",
      mission_topic_slug: "prompt-engineering",
      mission_launch_domain: "positioning-messaging",
    });
    const claudeResearch = createPath({
      id: "claude-research",
      topics: ["claude-code"],
      mission_lane_key: "claude-code:research-insight",
      mission_topic_slug: "claude-code",
      mission_launch_domain: "research-insight",
    });

    const recommendations = buildMissionCatalogSkillRecommendations(
      [promptResearch, promptMessaging, claudeResearch],
      {
        activePathId: promptResearch.id,
        activePath: promptResearch,
      },
    );

    expect(recommendations.map((recommendation) => recommendation.paths[0]?.id)).toEqual([
      "prompt-messaging",
      "claude-research",
    ]);
    expect(recommendations.every((recommendation) => recommendation.reason === "editorial_sequence")).toBe(
      true,
    );
  });

  it("returns no recommendation when the next required launch lane is unpublished", () => {
    const promptResearch = createPath({
      id: "prompt-research",
      topics: ["prompt-engineering"],
      mission_lane_key: "prompt-engineering:research-insight",
      mission_topic_slug: "prompt-engineering",
      mission_launch_domain: "research-insight",
    });
    const claudeResearch = createPath({
      id: "claude-research",
      topics: ["claude-code"],
      mission_lane_key: "claude-code:research-insight",
      mission_topic_slug: "claude-code",
      mission_launch_domain: "research-insight",
    });

    const recommendations = buildMissionCatalogSkillRecommendations(
      [promptResearch, claudeResearch],
      {
        activePathId: promptResearch.id,
        activePath: promptResearch,
      },
    );

    expect(recommendations).toEqual([]);
  });

  it("prefers achievement lane metadata when resolving completed launch lanes", () => {
    const promptResearch = createPath({
      id: "prompt-research",
      topics: ["prompt-engineering"],
      mission_lane_key: "prompt-engineering:research-insight",
      mission_topic_slug: "prompt-engineering",
      mission_launch_domain: "research-insight",
    });

    expect(
      getCompletedLaunchLaneKeys(
        [
          {
            path_id: "legacy-path-id",
            mission_lane_key: "prompt-engineering:research-insight",
          },
        ],
        [promptResearch],
      ),
    ).toEqual(["prompt-engineering:research-insight"]);
  });

  it("builds post-completion follow-ons from the published launch catalog only", () => {
    const promptResearch = createPath({
      id: "prompt-research",
      topics: ["prompt-engineering"],
      mission_lane_key: "prompt-engineering:research-insight",
      mission_topic_slug: "prompt-engineering",
      mission_launch_domain: "research-insight",
    });
    const promptMessaging = createPath({
      id: "prompt-messaging",
      topics: ["prompt-engineering"],
      mission_lane_key: "prompt-engineering:positioning-messaging",
      mission_topic_slug: "prompt-engineering",
      mission_launch_domain: "positioning-messaging",
    });
    const claudeResearch = createPath({
      id: "claude-research",
      topics: ["claude-code"],
      mission_lane_key: "claude-code:research-insight",
      mission_topic_slug: "claude-code",
      mission_launch_domain: "research-insight",
    });

    const recommendedPaths = selectPostCompletionMissionPaths(
      [promptResearch, promptMessaging, claudeResearch],
      {
        path: promptResearch,
        currentPathId: promptResearch.id,
      },
    );

    expect(recommendedPaths.map((path) => path.id)).toEqual([
      "prompt-messaging",
      "claude-research",
    ]);
  });
});
