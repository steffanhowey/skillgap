"use client";

import { useEffect, useState } from "react";
import type { LearningPath, LearningProgress } from "@/lib/types";

export interface ActiveMissionEntry {
  path: LearningPath;
  progress: LearningProgress;
}

interface UseActiveMissionsReturn {
  missions: ActiveMissionEntry[];
  isLoading: boolean;
}

let cachedActiveMissions: ActiveMissionEntry[] | null = null;
let activeMissionsRequest: Promise<ActiveMissionEntry[]> | null = null;

/**
 * Keep only missions the API still reports as in progress.
 */
export function selectActiveMissions(
  missions: ActiveMissionEntry[],
): ActiveMissionEntry[] {
  return missions.filter((mission) => mission.progress.status === "in_progress");
}

/**
 * Drop the module cache so the next load hits the network.
 */
export function invalidateActiveMissionsCache(): void {
  cachedActiveMissions = null;
  activeMissionsRequest = null;
}

async function loadActiveMissions(force = false): Promise<ActiveMissionEntry[]> {
  if (!force && cachedActiveMissions) {
    return cachedActiveMissions;
  }

  if (!activeMissionsRequest) {
    activeMissionsRequest = fetch("/api/learn/search")
      .then((response) => (response.ok ? response.json() : { in_progress: [] }))
      .then((data) => {
        const missions = selectActiveMissions(
          (data.in_progress ?? []) as ActiveMissionEntry[],
        );
        cachedActiveMissions = missions;
        return missions;
      })
      .catch(() => {
        cachedActiveMissions = cachedActiveMissions ?? [];
        return cachedActiveMissions;
      })
      .finally(() => {
        activeMissionsRequest = null;
      });
  }

  return activeMissionsRequest;
}

/**
 * Lightweight mission source for room-entry and profile focus.
 * Reuses the learn search endpoint and revalidates on every mount.
 */
export function useActiveMissions(enabled = true): UseActiveMissionsReturn {
  const [missions, setMissions] = useState<ActiveMissionEntry[]>(
    () => cachedActiveMissions ?? [],
  );
  const [hasLoaded, setHasLoaded] = useState(() => cachedActiveMissions !== null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    loadActiveMissions(true)
      .then((loadedMissions) => {
        if (cancelled) return;
        setMissions(loadedMissions);
        setHasLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setMissions([]);
        setHasLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    missions: enabled ? missions : [],
    isLoading: enabled ? !hasLoaded : false,
  };
}
