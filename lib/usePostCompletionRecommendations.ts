"use client";

import { useMemo } from "react";
import { selectPostCompletionMissionPaths } from "@/lib/missionCatalogRecommendations";
import { useLaunchCatalog } from "@/lib/useLaunchCatalog";
import type { LearningPath } from "@/lib/types";

interface UsePostCompletionRecommendationsOptions {
  path: LearningPath | null;
  currentPathId: string | null;
  enabled?: boolean;
}

interface UsePostCompletionRecommendationsReturn {
  paths: LearningPath[];
  isLoading: boolean;
}

export function usePostCompletionRecommendations({
  path,
  currentPathId,
  enabled = true,
}: UsePostCompletionRecommendationsOptions): UsePostCompletionRecommendationsReturn {
  const { paths: catalogPaths, isLoading } = useLaunchCatalog({ enabled });
  const paths = useMemo(
    () =>
      selectPostCompletionMissionPaths(catalogPaths, {
        path,
        currentPathId,
      }),
    [catalogPaths, currentPathId, path],
  );

  return {
    paths,
    isLoading: enabled && isLoading,
  };
}
