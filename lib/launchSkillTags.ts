/**
 * Canonical skill tags for the five published launch missions.
 *
 * Receipts and the capability snapshot require fp_skill_tags.
 * These mappings are the source of truth for seeding and for
 * self-healing receipt calculation when a launch path has no tags yet.
 */

import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { getSkills } from "@/lib/skills/taxonomy";
import {
  APPROVED_LAUNCH_MISSION_LANE_KEYS,
  isApprovedLaunchMissionLaneKey,
  type LaunchMissionLaneKey,
} from "@/lib/launchMissionContent";

export interface LaunchSkillTagSpec {
  slug: string;
  relevance: "primary" | "secondary";
}

export const LAUNCH_LANE_SKILL_TAGS: Partial<
  Record<LaunchMissionLaneKey, LaunchSkillTagSpec[]>
> = {
  "prompt-engineering:research-insight": [
    { slug: "prompt-engineering", relevance: "primary" },
    { slug: "research-synthesis", relevance: "secondary" },
  ],
  "prompt-engineering:positioning-messaging": [
    { slug: "prompt-engineering", relevance: "primary" },
    { slug: "messaging-optimization", relevance: "secondary" },
    { slug: "ai-assisted-writing", relevance: "secondary" },
  ],
  "claude-code:research-insight": [
    { slug: "vendor-evaluation", relevance: "primary" },
    { slug: "research-synthesis", relevance: "secondary" },
  ],
  "claude-code:positioning-messaging": [
    { slug: "messaging-optimization", relevance: "primary" },
    { slug: "ai-sales-messaging", relevance: "secondary" },
  ],
  "github-copilot:research-insight": [
    { slug: "vendor-evaluation", relevance: "primary" },
    { slug: "research-synthesis", relevance: "secondary" },
  ],
};

/**
 * Skill tags for an approved launch lane, or an empty list.
 */
export function getLaunchLaneSkillTags(
  laneKey: string | null | undefined,
): LaunchSkillTagSpec[] {
  if (!isApprovedLaunchMissionLaneKey(laneKey)) return [];
  return LAUNCH_LANE_SKILL_TAGS[laneKey] ?? [];
}

/**
 * Insert launch-lane skill tags for a path when it has a known lane and no tags.
 * Returns the number of rows upserted. Safe to call repeatedly.
 */
export async function seedLaunchSkillTagsForPath(
  pathId: string,
): Promise<number> {
  const admin = createAdminClient();
  const { data: path, error: pathErr } = await admin
    .from("fp_learning_paths")
    .select("mission_lane_key")
    .eq("id", pathId)
    .single();

  if (pathErr || !path) return 0;

  const specs = getLaunchLaneSkillTags(path.mission_lane_key);
  if (specs.length === 0) return 0;

  const skills = await getSkills();
  const skillIdBySlug = new Map(skills.map((skill) => [skill.slug, skill.id]));
  const rows = specs
    .map((spec) => {
      const skillId = skillIdBySlug.get(spec.slug);
      if (!skillId) return null;
      return {
        path_id: pathId,
        skill_id: skillId,
        relevance: spec.relevance,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length === 0) return 0;

  const { error } = await admin.from("fp_skill_tags").upsert(rows, {
    onConflict: "path_id,skill_id",
  });

  if (error) {
    console.error("[launch-skill-tags] upsert failed:", error);
    return 0;
  }

  return rows.length;
}

/**
 * Every approved launch lane has at least one primary skill tag.
 */
export function launchLaneSkillTagCoverage(): LaunchMissionLaneKey[] {
  return [...APPROVED_LAUNCH_MISSION_LANE_KEYS].filter(
    (laneKey) =>
      !LAUNCH_LANE_SKILL_TAGS[laneKey]?.some((tag) => tag.relevance === "primary"),
  );
}
