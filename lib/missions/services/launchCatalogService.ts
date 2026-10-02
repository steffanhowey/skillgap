import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { mapPathRow } from "@/lib/learn/pathGenerator";
import { APPROVED_LAUNCH_ORDER } from "@/lib/launchFrontDoor";
import {
  APPROVED_LAUNCH_MISSION_LANE_KEYS,
  getLaunchMissionLaneKey,
  type LaunchMissionLaneKey,
} from "@/lib/launchMissionContent";
import { loadSkillTagsForPaths } from "@/lib/skills/pathSkillTags";
import type { LearningPath } from "@/lib/types";

/** Load the currently published launch catalog from canonical mission projections. */
export async function listPublishedLaunchCatalogPaths(): Promise<LearningPath[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fp_learning_paths")
    .select("*")
    .eq("generation_engine", "mission_projection")
    .eq("is_cached", true)
    .in("mission_lane_key", APPROVED_LAUNCH_MISSION_LANE_KEYS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `[missions/launchCatalogService] catalog lookup failed: ${error.message}`,
    );
  }

  const latestByLane = new Map<LaunchMissionLaneKey, LearningPath>();

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const path = mapPathRow(row);
    const laneKey = getLaunchMissionLaneKey(path);
    if (!laneKey || latestByLane.has(laneKey)) continue;
    latestByLane.set(laneKey, path);
  }

  const catalog = APPROVED_LAUNCH_ORDER.map((laneKey) =>
    latestByLane.get(laneKey),
  ).filter((path): path is LearningPath => Boolean(path));

  const tagMap = await loadSkillTagsForPaths(catalog.map((path) => path.id));
  for (const path of catalog) {
    path.skill_tags = tagMap.get(path.id) ?? [];
  }

  return catalog;
}
