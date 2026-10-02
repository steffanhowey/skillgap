/**
 * Launch-catalog visibility.
 *
 * The live product may only promise the published Marketing launch missions.
 * Use these helpers to keep browse, search, and recommendations honest.
 */

import {
  getLaunchMissionLaneKey,
  isApprovedLaunchMissionLaneKey,
} from "@/lib/launchMissionContent";
import type { LearningPath } from "@/lib/types";

/**
 * True when a path is explicitly an approved launch mission.
 *
 * Do not infer from topics. Old generated paths often include
 * launch-adjacent topics and would leak into browse/search.
 */
export function isLaunchCatalogPath(path: LearningPath): boolean {
  return isApprovedLaunchMissionLaneKey(path.mission_lane_key);
}

/** Keep only approved launch-catalog paths, in the incoming order. */
export function filterLaunchCatalogPaths(paths: LearningPath[]): LearningPath[] {
  const seen = new Set<string>();
  const filtered: LearningPath[] = [];

  for (const path of paths) {
    if (seen.has(path.id) || !isLaunchCatalogPath(path)) continue;
    seen.add(path.id);
    filtered.push(path);
  }

  return filtered;
}

/** Intersect an arbitrary list with the published launch catalog by id or lane. */
export function intersectWithLaunchCatalog(
  paths: LearningPath[],
  catalog: LearningPath[],
): LearningPath[] {
  const catalogIds = new Set(catalog.map((path) => path.id));
  const catalogLanes = new Set(
    catalog
      .map((path) => getLaunchMissionLaneKey(path))
      .filter((lane): lane is NonNullable<typeof lane> => Boolean(lane)),
  );

  return paths.filter((path) => {
    if (catalogIds.has(path.id)) return true;
    return (
      isApprovedLaunchMissionLaneKey(path.mission_lane_key) &&
      catalogLanes.has(path.mission_lane_key)
    );
  });
}

/** True when a launch-catalog path matches a user search query. */
export function pathMatchesLaunchCatalogQuery(
  path: LearningPath,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const haystack = [
    path.title,
    path.description,
    path.query,
    path.mission_lane_key ?? "",
    ...(path.topics ?? []),
    ...(path.skill_tags ?? []).flatMap((tag) => [
      tag.skill_slug,
      tag.skill_name,
    ]),
  ]
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}
