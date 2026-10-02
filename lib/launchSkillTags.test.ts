import { describe, expect, it } from "vitest";
import { APPROVED_LAUNCH_MISSION_LANE_KEYS } from "@/lib/launchMissionContent";
import {
  LAUNCH_LANE_SKILL_TAGS,
  getLaunchLaneSkillTags,
  launchLaneSkillTagCoverage,
} from "./launchSkillTags";

describe("launchSkillTags", () => {
  it("covers every approved launch lane with a primary skill", () => {
    expect(launchLaneSkillTagCoverage()).toEqual([]);
    expect(Object.keys(LAUNCH_LANE_SKILL_TAGS).sort()).toEqual(
      [...APPROVED_LAUNCH_MISSION_LANE_KEYS].sort(),
    );
  });

  it("returns nothing for unknown lanes", () => {
    expect(getLaunchLaneSkillTags(null)).toEqual([]);
    expect(getLaunchLaneSkillTags("engineering:research-insight")).toEqual([]);
  });

  it("keeps prompt-engineering research as the thinking lane", () => {
    expect(getLaunchLaneSkillTags("prompt-engineering:research-insight")).toEqual([
      { slug: "prompt-engineering", relevance: "primary" },
      { slug: "research-synthesis", relevance: "secondary" },
    ]);
  });
});
