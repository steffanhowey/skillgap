import { getLaunchMissionContent, getLaunchMissionLaneKey } from "@/lib/launchMissionContent";
import { applyTaughtHeroUnit } from "@/lib/learn/taughtHero/unit";
import { APPROVED_LAUNCH_ORDER } from "@/lib/launchFrontDoor";
import { getMissionPlayerTitle } from "@/lib/missionPresentation";
import type { LearningPath } from "@/lib/types";
import type { FluencyLevel, OnboardingPick } from "./types";

const HERO_LANE = "prompt-engineering:research-insight";

/**
 * Build onboarding picks from published launch catalog paths.
 * Hero is always a real path UUID. Copy comes from the path, not seed fiction.
 */
export function picksFromLaunchCatalog(
  paths: LearningPath[],
  fluencyLevel: FluencyLevel,
): { hero: OnboardingPick | null; also: OnboardingPick[] } {
  const byLane = new Map<string, LearningPath>();
  for (const path of paths) {
    const lane = getLaunchMissionLaneKey(path);
    if (lane && !byLane.has(lane)) byLane.set(lane, path);
  }

  const ordered = APPROVED_LAUNCH_ORDER.map((lane) => byLane.get(lane)).filter(
    (path): path is LearningPath => Boolean(path),
  );
  const heroPath =
    byLane.get(HERO_LANE) ?? ordered[0] ?? paths[0] ?? null;
  if (!heroPath) {
    return { hero: null, also: [] };
  }

  const alsoPaths = ordered
    .filter((path) => path.id !== heroPath.id)
    .slice(0, 2);

  return {
    hero: pathToOnboardingPick(heroPath, fluencyLevel, 0),
    also: alsoPaths.map((path, index) =>
      pathToOnboardingPick(path, fluencyLevel, index + 1),
    ),
  };
}

/**
 * Overlay live path metadata onto an editorial pick.
 */
export function overlayPathOnPick(
  pick: OnboardingPick,
  path: LearningPath,
): OnboardingPick {
  const taught = applyTaughtHeroUnit(path);
  const launch = getLaunchMissionContent(taught);
  return {
    ...pick,
    path_id: taught.id,
    display_title: getMissionPlayerTitle(taught),
    display_description:
      launch?.missionPromise || taught.description || pick.display_description,
    time_estimate_min: Math.max(
      1,
      Math.round(taught.estimated_duration_seconds / 60),
    ),
    module_count: taught.items.length || 1,
    tool_names:
      taught.primary_tools && taught.primary_tools.length > 0
        ? taught.primary_tools
        : pick.tool_names,
  };
}

function pathToOnboardingPick(
  path: LearningPath,
  fluencyLevel: FluencyLevel,
  sortOrder: number,
): OnboardingPick {
  const taught = applyTaughtHeroUnit(path);
  const launch = getLaunchMissionContent(taught);
  return {
    id: `catalog:${taught.id}`,
    path_id: taught.id,
    function: "marketing",
    fluency_level: fluencyLevel,
    path_topic: path.query || path.title,
    display_title: getMissionPlayerTitle(taught),
    display_description: launch?.missionPromise || taught.description,
    time_estimate_min: Math.max(
      1,
      Math.round(taught.estimated_duration_seconds / 60),
    ),
    module_count: taught.items.length || 1,
    tool_names: taught.primary_tools ?? [],
    sort_order: sortOrder,
  };
}
