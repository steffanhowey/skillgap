import { describe, expect, it } from "vitest";
import type { LearningPath } from "@/lib/types";
import {
  filterLaunchCatalogPaths,
  intersectWithLaunchCatalog,
  isLaunchCatalogPath,
  pathMatchesLaunchCatalogQuery,
} from "./launchCatalogVisibility";

function createPath(overrides: Partial<LearningPath> = {}): LearningPath {
  return {
    id: "path-1",
    title: "Mission",
    description: "Description",
    query: "query",
    topics: [],
    difficulty_level: "beginner",
    estimated_duration_seconds: 1800,
    items: [],
    view_count: 0,
    start_count: 0,
    completion_count: 0,
    created_at: "2026-08-27T00:00:00.000Z",
    ...overrides,
  };
}

describe("launchCatalogVisibility", () => {
  it("accepts approved launch lanes and rejects old generated paths", () => {
    const launch = createPath({
      id: "launch-1",
      mission_lane_key: "claude-code:research-insight",
    });
    const leftover = createPath({
      id: "old-1",
      title: "Mastering Midjourney for Marketing",
      topics: ["midjourney", "prompt-engineering"],
    });

    expect(isLaunchCatalogPath(launch)).toBe(true);
    expect(isLaunchCatalogPath(leftover)).toBe(false);
    expect(filterLaunchCatalogPaths([leftover, launch, launch])).toEqual([
      launch,
    ]);
  });

  it("intersects search results with the published catalog", () => {
    const catalog = [
      createPath({
        id: "catalog-1",
        mission_lane_key: "prompt-engineering:research-insight",
      }),
    ];
    const searchHits = [
      catalog[0]!,
      createPath({
        id: "old-2",
        title: "Mastering Prompt Engineering",
        topics: ["prompt-engineering"],
      }),
    ];

    expect(intersectWithLaunchCatalog(searchHits, catalog)).toEqual([
      catalog[0],
    ]);
  });

  it("matches launch catalog titles locally and rejects leftover tools", () => {
    const path = createPath({
      id: "catalog-1",
      title: "Synthesize Claude Code Insights for Marketers",
      mission_lane_key: "claude-code:research-insight",
    });

    expect(pathMatchesLaunchCatalogQuery(path, "claude")).toBe(true);
    expect(pathMatchesLaunchCatalogQuery(path, "midjourney")).toBe(false);
  });
});
