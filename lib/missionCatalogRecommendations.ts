import { getMissionRoute } from "@/lib/appRoutes";
import {
  APPROVED_LAUNCH_ORDER,
  CORE_LAUNCH_PATH_ORDER,
  EXTENDED_LAUNCH_ORDER,
} from "@/lib/launchFrontDoor";
import {
  getLaunchMissionLaneKey,
  isApprovedLaunchMissionLaneKey,
  type LaunchMissionLaneKey,
} from "@/lib/launchMissionContent";
import type { SkillRecommendationLike } from "@/lib/missionRecommendations";
import type { LearningPath } from "@/lib/types";

export interface LaunchAchievementLike {
  path_id: string;
  mission_lane_key?: string | null;
}

interface MissionCatalogSelectionOptions {
  activePathId?: string | null;
  activePath?: LearningPath | null;
  completedAchievements?: LaunchAchievementLike[];
  limit?: number;
}

interface PostCompletionSelectionOptions {
  path: LearningPath | null;
  currentPathId: string | null;
  completedAchievements?: LaunchAchievementLike[];
  limit?: number;
}

function buildPublishedLaneMap(
  catalogPaths: LearningPath[],
): Map<LaunchMissionLaneKey, LearningPath> {
  const map = new Map<LaunchMissionLaneKey, LearningPath>();

  for (const path of catalogPaths) {
    const laneKey = getLaunchMissionLaneKey(path);
    if (!laneKey || map.has(laneKey)) continue;
    map.set(laneKey, path);
  }

  return map;
}

function buildPublishedPathLaneMap(
  publishedByLane: Map<LaunchMissionLaneKey, LearningPath>,
): Map<string, LaunchMissionLaneKey> {
  const pathLaneMap = new Map<string, LaunchMissionLaneKey>();

  for (const [laneKey, path] of publishedByLane.entries()) {
    pathLaneMap.set(path.id, laneKey);
  }

  return pathLaneMap;
}

function resolveCompletedLaneSet(
  achievements: LaunchAchievementLike[] | undefined,
  catalogPaths: LearningPath[],
): Set<LaunchMissionLaneKey> {
  return new Set(getCompletedLaunchLaneKeys(achievements ?? [], catalogPaths));
}

function getStartSequence(
  activeLaneKey: LaunchMissionLaneKey | null,
  completedLaneKeys: Set<LaunchMissionLaneKey>,
): LaunchMissionLaneKey[] {
  if (!activeLaneKey) {
    const firstMissingCore = CORE_LAUNCH_PATH_ORDER.find(
      (laneKey) => !completedLaneKeys.has(laneKey),
    );
    if (firstMissingCore) {
      return APPROVED_LAUNCH_ORDER.slice(
        APPROVED_LAUNCH_ORDER.indexOf(firstMissingCore),
      );
    }

    const firstMissingExtended = EXTENDED_LAUNCH_ORDER.find(
      (laneKey) => !completedLaneKeys.has(laneKey),
    );
    if (!firstMissingExtended) return [];

    return EXTENDED_LAUNCH_ORDER.slice(
      EXTENDED_LAUNCH_ORDER.indexOf(firstMissingExtended),
    );
  }

  const activeCoreIndex = CORE_LAUNCH_PATH_ORDER.indexOf(activeLaneKey);
  if (activeCoreIndex >= 0) {
    const earlierMissingCore = CORE_LAUNCH_PATH_ORDER.slice(0, activeCoreIndex).find(
      (laneKey) => !completedLaneKeys.has(laneKey),
    );
    if (earlierMissingCore) {
      return APPROVED_LAUNCH_ORDER.slice(
        APPROVED_LAUNCH_ORDER.indexOf(earlierMissingCore),
      );
    }

    return APPROVED_LAUNCH_ORDER.slice(
      APPROVED_LAUNCH_ORDER.indexOf(activeLaneKey) + 1,
    );
  }

  const firstMissingCore = CORE_LAUNCH_PATH_ORDER.find(
    (laneKey) => !completedLaneKeys.has(laneKey),
  );
  if (firstMissingCore) {
    return APPROVED_LAUNCH_ORDER.slice(
      APPROVED_LAUNCH_ORDER.indexOf(firstMissingCore),
    );
  }

  const activeExtendedIndex = EXTENDED_LAUNCH_ORDER.indexOf(activeLaneKey);
  if (activeExtendedIndex < 0) {
    return [];
  }

  const earlierMissingExtended = EXTENDED_LAUNCH_ORDER.slice(
    0,
    activeExtendedIndex,
  ).find((laneKey) => !completedLaneKeys.has(laneKey));
  if (earlierMissingExtended) {
    return EXTENDED_LAUNCH_ORDER.slice(
      EXTENDED_LAUNCH_ORDER.indexOf(earlierMissingExtended),
    );
  }

  return EXTENDED_LAUNCH_ORDER.slice(activeExtendedIndex + 1);
}

function collectUpcomingPaths(
  publishedByLane: Map<LaunchMissionLaneKey, LearningPath>,
  completedLaneKeys: Set<LaunchMissionLaneKey>,
  laneSequence: LaunchMissionLaneKey[],
  excludedPathIds: Set<string>,
  limit: number,
): LearningPath[] {
  const paths: LearningPath[] = [];

  for (const laneKey of laneSequence) {
    if (completedLaneKeys.has(laneKey)) continue;

    const path = publishedByLane.get(laneKey);
    if (!path) {
      break;
    }

    if (excludedPathIds.has(path.id)) continue;

    paths.push(path);
    if (paths.length >= limit) break;
  }

  return paths;
}

export function getCompletedLaunchLaneKeys(
  achievements: LaunchAchievementLike[],
  catalogPaths: LearningPath[],
): LaunchMissionLaneKey[] {
  const pathLaneMap = new Map<string, LaunchMissionLaneKey>();
  for (const path of catalogPaths) {
    const laneKey = getLaunchMissionLaneKey(path);
    if (!laneKey) continue;
    pathLaneMap.set(path.id, laneKey);
  }

  const completed = new Set<LaunchMissionLaneKey>();

  for (const achievement of achievements) {
    if (isApprovedLaunchMissionLaneKey(achievement.mission_lane_key)) {
      completed.add(achievement.mission_lane_key);
      continue;
    }

    const resolvedLaneKey = pathLaneMap.get(achievement.path_id);
    if (resolvedLaneKey) {
      completed.add(resolvedLaneKey);
    }
  }

  return APPROVED_LAUNCH_ORDER.filter((laneKey) => completed.has(laneKey));
}

export function buildMissionCatalogSkillRecommendations(
  catalogPaths: LearningPath[],
  {
    activePathId = null,
    activePath = null,
    completedAchievements = [],
    limit = 6,
  }: MissionCatalogSelectionOptions,
): SkillRecommendationLike[] {
  const publishedByLane = buildPublishedLaneMap(catalogPaths);
  const publishedPathLaneMap = buildPublishedPathLaneMap(publishedByLane);
  const completedLaneKeys = resolveCompletedLaneSet(
    completedAchievements,
    catalogPaths,
  );
  const activeLaneKey = activePath
    ? isApprovedLaunchMissionLaneKey(activePath.mission_lane_key)
      ? activePath.mission_lane_key
      : (publishedPathLaneMap.get(activePath.id) ?? null)
    : null;

  if (activeLaneKey) {
    completedLaneKeys.delete(activeLaneKey);
  }

  const laneSequence = getStartSequence(activeLaneKey, completedLaneKeys);
  const recommendedPaths = collectUpcomingPaths(
    publishedByLane,
    completedLaneKeys,
    laneSequence,
    new Set(activePathId ? [activePathId] : []),
    limit,
  );

  return recommendedPaths.map((path, index) => ({
    reason: "editorial_sequence",
    priority: Math.max(100 - index * 10, 10),
    paths: [path],
    action: {
      type: "start_path",
      label: index === 0 ? "Start next mission" : "Start mission",
      href: getMissionRoute(path.id),
    },
  }));
}

export function selectPostCompletionMissionPaths(
  catalogPaths: LearningPath[],
  {
    path,
    currentPathId,
    completedAchievements = [],
    limit = 3,
  }: PostCompletionSelectionOptions,
): LearningPath[] {
  if (!path || !currentPathId) {
    return [];
  }

  const publishedByLane = buildPublishedLaneMap(catalogPaths);
  const publishedPathLaneMap = buildPublishedPathLaneMap(publishedByLane);
  const completedLaneKeys = resolveCompletedLaneSet(
    completedAchievements,
    catalogPaths,
  );
  const currentLaneKey = isApprovedLaunchMissionLaneKey(path.mission_lane_key)
    ? path.mission_lane_key
    : (publishedPathLaneMap.get(path.id) ?? null);

  if (currentLaneKey) {
    completedLaneKeys.add(currentLaneKey);
  }

  const laneSequence = getStartSequence(null, completedLaneKeys);
  return collectUpcomingPaths(
    publishedByLane,
    completedLaneKeys,
    laneSequence,
    new Set([currentPathId]),
    limit,
  );
}
