import { MISSION_ROLLOUT_CONFIG } from "@/lib/missions/config/rollout";
import { getEligibleMissionFamiliesForLane } from "@/lib/missions/config/familyCoverage";
import {
  promoteVisibleControlLanePaths,
  type PromoteVisibleControlLaneResult,
} from "@/lib/missions/services/controlLaneVisibilityService";
import type {
  FluencyLevel,
  MissionFamily,
  ProfessionalFunction,
} from "@/lib/missions/types/common";

export interface PublishLaunchCatalogScopeResult {
  topicSlug: string;
  professionalFunction: ProfessionalFunction;
  fluencyLevel: FluencyLevel;
  allowedFamilies: MissionFamily[];
  result: PromoteVisibleControlLaneResult;
}

export interface PublishLaunchCatalogResult {
  scopes: PublishLaunchCatalogScopeResult[];
  promotedCount: number;
  alreadyVisibleCount: number;
  hiddenCount: number;
}

export interface PublishLaunchCatalogOptions {
  topicSlugs?: string[];
}

function resolveTopicScope(topicSlugs?: string[]): string[] {
  if (!topicSlugs?.length) {
    return [...MISSION_ROLLOUT_CONFIG.allowlistedTopics];
  }

  const invalidTopics = topicSlugs.filter(
    (topicSlug) => !MISSION_ROLLOUT_CONFIG.allowlistedTopics.includes(topicSlug),
  );

  if (invalidTopics.length > 0) {
    throw new Error(
      `[missions/publishLaunchCatalog] unsupported topic scope: ${invalidTopics.join(", ")}`,
    );
  }

  return [...new Set(topicSlugs)];
}

/** Publish the approved rollout slice into the live launch catalog. */
export async function publishLaunchCatalog(
  options: PublishLaunchCatalogOptions = {},
): Promise<PublishLaunchCatalogResult> {
  const topicScope = resolveTopicScope(options.topicSlugs);
  const scopes: PublishLaunchCatalogScopeResult[] = [];

  for (const professionalFunction of MISSION_ROLLOUT_CONFIG.allowlistedFunctions) {
    for (const fluencyLevel of MISSION_ROLLOUT_CONFIG.allowlistedFluencies) {
      for (const topicSlug of topicScope) {
        const allowedFamilies = getEligibleMissionFamiliesForLane({
          topicSlug,
          professionalFunction,
          fluencyLevel,
          candidateFamilies: MISSION_ROLLOUT_CONFIG.allowlistedFamilies,
        });

        if (allowedFamilies.length === 0) {
          continue;
        }

        const result = await promoteVisibleControlLanePaths({
          topicSlug,
          professionalFunction,
          fluencyLevel,
          allowedFamilies,
        });

        scopes.push({
          topicSlug,
          professionalFunction,
          fluencyLevel,
          allowedFamilies,
          result,
        });
      }
    }
  }

  return {
    scopes,
    promotedCount: scopes.reduce(
      (sum, scope) => sum + scope.result.promotedCount,
      0,
    ),
    alreadyVisibleCount: scopes.reduce(
      (sum, scope) => sum + scope.result.alreadyVisibleCount,
      0,
    ),
    hiddenCount: scopes.reduce(
      (sum, scope) => sum + scope.result.hiddenCount,
      0,
    ),
  };
}
