"use client";

import { useMemo } from "react";

import {
  buildMissionRecommendations,
  type SkillRecommendationLike,
  type MissionRecommendationViewModel,
} from "@/lib/missionRecommendations";
import {
  buildMissionCatalogSkillRecommendations,
  type LaunchAchievementLike,
} from "@/lib/missionCatalogRecommendations";
import { useLaunchCatalog } from "@/lib/useLaunchCatalog";
import type { LearningPath } from "@/lib/types";

interface UseMissionRecommendationsOptions {
  surface: "home" | "missions" | "progress";
  activePathId?: string | null;
  activePath?: LearningPath | null;
  completedAchievements?: LaunchAchievementLike[];
  limit?: number;
}

interface UseMissionRecommendationsReturn {
  recommendations: MissionRecommendationViewModel[];
  isLoading: boolean;
}

export function useMissionRecommendations({
  surface,
  activePathId = null,
  activePath = null,
  completedAchievements = [],
  limit = 6,
}: UseMissionRecommendationsOptions): UseMissionRecommendationsReturn {
  const { paths: catalogPaths, isLoading } = useLaunchCatalog();

  const skillRecommendations = useMemo<SkillRecommendationLike[]>(
    () =>
      buildMissionCatalogSkillRecommendations(catalogPaths, {
        activePathId,
        activePath,
        completedAchievements,
        limit,
      }),
    [activePath, activePathId, catalogPaths, completedAchievements, limit],
  );

  const recommendations = useMemo(
    () =>
      buildMissionRecommendations(skillRecommendations, {
        surface,
        activePathId,
        activePath,
      }),
    [activePath, activePathId, skillRecommendations, surface],
  );

  return { recommendations, isLoading };
}
