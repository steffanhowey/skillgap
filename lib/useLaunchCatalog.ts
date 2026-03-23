"use client";

import { useEffect, useState } from "react";
import type { LearningPath } from "@/lib/types";

let cachedLaunchCatalog: LearningPath[] | null = null;
let launchCatalogRequest: Promise<LearningPath[]> | null = null;

export async function loadLaunchCatalog(): Promise<LearningPath[]> {
  if (cachedLaunchCatalog) {
    return cachedLaunchCatalog;
  }

  if (!launchCatalogRequest) {
    launchCatalogRequest = fetch("/api/missions/catalog")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        const catalog = (data.catalog ?? []) as LearningPath[];
        cachedLaunchCatalog = catalog;
        return catalog;
      })
      .finally(() => {
        launchCatalogRequest = null;
      });
  }

  return launchCatalogRequest;
}

export interface UseLaunchCatalogOptions {
  enabled?: boolean;
}

export function useLaunchCatalog({
  enabled = true,
}: UseLaunchCatalogOptions = {}) {
  const [paths, setPaths] = useState<LearningPath[]>(
    () => cachedLaunchCatalog ?? [],
  );
  const [isLoading, setIsLoading] = useState(
    () => enabled && cachedLaunchCatalog === null,
  );

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(cachedLaunchCatalog === null);

    loadLaunchCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setPaths(catalog);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPaths([]);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    paths,
    isLoading,
  };
}
