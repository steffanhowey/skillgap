"use client";

import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import type {
  AchievementSummary,
  LearningPath,
  LearningProgress,
  ItemState,
  SkillReceipt,
} from "./types";
import { canCompletePath } from "@/lib/learn/pathCompletion";
import {
  trackMissionCompleted,
  trackReceiptIssued,
} from "@/lib/onboarding/tracking";
import { invalidateActiveMissionsCache } from "@/lib/useActiveMissions";
import { invalidateEvidenceArchiveCache } from "@/lib/useProfilePageData";

// ─── Types ──────────────────────────────────────────────────

interface UseLearnProgressReturn {
  path: LearningPath | null;
  progress: LearningProgress | null;
  achievement: AchievementSummary | null;
  currentItemIndex: number;
  isLoading: boolean;
  error: string | null;
  completeItem: (contentId: string, stateData?: Partial<ItemState>) => Promise<boolean>;
  advanceToItem: (index: number) => Promise<void>;
  isCompleted: boolean;
  percentComplete: number;
  skillReceipt: SkillReceipt | null;
  skillReceiptReady: boolean;
  canDo: boolean;
}

function resetProgressState(setters: {
  setPath: Dispatch<SetStateAction<LearningPath | null>>;
  setProgress: Dispatch<SetStateAction<LearningProgress | null>>;
  setAchievement: Dispatch<SetStateAction<AchievementSummary | null>>;
  setCurrentItemIndex: Dispatch<SetStateAction<number>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSkillReceipt: Dispatch<SetStateAction<SkillReceipt | null>>;
  setSkillReceiptReady: Dispatch<SetStateAction<boolean>>;
  setCanDo: Dispatch<SetStateAction<boolean>>;
}): void {
  setters.setPath(null);
  setters.setProgress(null);
  setters.setAchievement(null);
  setters.setCurrentItemIndex(0);
  setters.setError(null);
  setters.setSkillReceipt(null);
  setters.setSkillReceiptReady(false);
  setters.setCanDo(true);
}

// ─── Hook ───────────────────────────────────────────────────

/**
 * Manages learning path progress state.
 * Fetches path + progress on mount, provides mutation functions.
 */
export function useLearnProgress(
  pathId: string | null,
  enabled = true,
): UseLearnProgressReturn {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [achievement, setAchievement] = useState<AchievementSummary | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillReceipt, setSkillReceipt] = useState<SkillReceipt | null>(null);
  const [skillReceiptReady, setSkillReceiptReady] = useState(false);
  const [canDo, setCanDo] = useState(true);
  const timeAccum = useRef(0);
  const timeInterval = useRef<ReturnType<typeof setInterval>>(undefined);
  const previousPathIdRef = useRef<string | null>(null);
  const blockedStartRef = useRef(false);

  // Fetch path and progress on mount
  useEffect(() => {
    let isActive = true;

    if (!pathId) {
      previousPathIdRef.current = null;
      blockedStartRef.current = false;
      timeAccum.current = 0;
      resetProgressState({
        setPath,
        setProgress,
        setAchievement,
        setCurrentItemIndex,
        setError,
        setSkillReceipt,
        setSkillReceiptReady,
        setCanDo,
      });
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    if (!enabled) {
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    const pathChanged = previousPathIdRef.current !== pathId;
    previousPathIdRef.current = pathId;
    if (pathChanged) blockedStartRef.current = false;

    async function loadPath(): Promise<void> {
      setIsLoading(true);
      setError(null);
      if (pathChanged) {
        resetProgressState({
          setPath,
          setProgress,
          setAchievement,
          setCurrentItemIndex,
          setError,
          setSkillReceipt,
          setSkillReceiptReady,
          setCanDo,
        });
      }

      try {
        const res = await fetch(`/api/learn/paths/${pathId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!isActive) return;

        setPath(data.path);
        setAchievement(data.achievement ?? null);
        setCanDo(data.can_do !== false);

        if (data.progress) {
          setProgress(data.progress);
          setCurrentItemIndex(data.progress.current_item_index);

          // Fetch skill receipt for completed paths (for page refreshes)
          if (data.progress.status === "completed") {
            fetch(`/api/learn/skill-receipt/${pathId}`)
              .then((r) => r.json())
              .then((d) => {
                if (!isActive) return;
                if (d.skill_receipt) setSkillReceipt(d.skill_receipt);
                setSkillReceiptReady(true);
              })
              .catch(() => {
                if (isActive) setSkillReceiptReady(true);
              });
          } else {
            setSkillReceiptReady(true);
          }
        } else {
          setSkillReceiptReady(true);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadPath();

    return () => {
      isActive = false;
    };
  }, [pathId, enabled]);

  // Time tracking: accumulate every second, flush every 30s (only when authenticated with progress)
  const progressRef = useRef<LearningProgress | null>(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!pathId || !enabled) return;

    timeInterval.current = setInterval(() => {
      timeAccum.current += 1;
      if (timeAccum.current >= 30 && progressRef.current) {
        const delta = timeAccum.current;
        timeAccum.current = 0;
        fetch(`/api/learn/paths/${pathId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ time_delta_seconds: delta }),
        }).catch(() => {});
      }
    }, 1000);

    return () => {
      if (timeInterval.current) clearInterval(timeInterval.current);
      // Flush remaining time on unmount
      if (timeAccum.current > 0 && progressRef.current) {
        const delta = timeAccum.current;
        timeAccum.current = 0;
        fetch(`/api/learn/paths/${pathId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ time_delta_seconds: delta }),
        }).catch(() => {});
      }
    };
  }, [pathId, enabled]);

  // Initialize progress if authenticated user has none
  useEffect(() => {
    if (!pathId || !enabled || !path || progress || isLoading || blockedStartRef.current) return;
    // Create initial progress record
    fetch(`/api/learn/paths/${pathId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_index: 0 }),
    })
      .then(async (res) => {
        if (res.status === 402) {
          blockedStartRef.current = true;
          setCanDo(false);
          return;
        }
        const data = await res.json();
        if (data.progress) setProgress(data.progress);
      })
      .catch(() => {});
  }, [path, progress, isLoading, pathId, enabled]);

  const completeItem = useCallback(
    async (contentId: string, stateData?: Partial<ItemState>) => {
      if (!pathId) return false;

      const isSkipped = stateData?.skipped === true;

      // Optimistic update so transition card works even without auth
      setProgress((prev) => {
        const itemStates = { ...(prev?.item_states ?? {}) };
        const existing = itemStates[contentId] ?? {};
        itemStates[contentId] = {
          ...existing,
          ...stateData,
          completed: !isSkipped,
          skipped: isSkipped,
          completed_at: isSkipped
            ? existing.completed_at
            : new Date().toISOString(),
        };
        const itemsCompleted = Object.values(itemStates).filter(
          (s) => s.completed && !s.skipped
        ).length;
        const itemsTotal = path?.items.length ?? prev?.items_total ?? 0;
        const pathCompleted = path
          ? canCompletePath(path.items, itemStates)
          : false;
        if (pathCompleted) {
          invalidateActiveMissionsCache();
          invalidateEvidenceArchiveCache();
        }
        return {
          id: prev?.id ?? "local",
          user_id: prev?.user_id ?? "anonymous",
          path_id: pathId,
          started_at: prev?.started_at ?? new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          completed_at: pathCompleted
            ? new Date().toISOString()
            : prev?.completed_at ?? null,
          current_item_index: prev?.current_item_index ?? currentItemIndex,
          items_completed: itemsCompleted,
          items_total: itemsTotal,
          time_invested_seconds: prev?.time_invested_seconds ?? 0,
          item_states: itemStates,
          status: pathCompleted ? "completed" : "in_progress",
        };
      });

      // Persist to server
      try {
        const res = await fetch(`/api/learn/paths/${pathId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_completed: contentId, item_state: stateData }),
        });
        if (res.status === 402) {
          setCanDo(false);
          setProgress((prev) => {
            if (!prev) return prev;
            const itemStates = { ...(prev.item_states ?? {}) };
            delete itemStates[contentId];
            const itemsCompleted = Object.values(itemStates).filter(
              (s) => s.completed && !s.skipped,
            ).length;
            return {
              ...prev,
              item_states: itemStates,
              items_completed: itemsCompleted,
              status: "in_progress",
              completed_at: null,
            };
          });
          return false;
        }
        const data = await res.json();
        if (data.progress) setProgress(data.progress);
        if (data.achievement) setAchievement(data.achievement);
        if (data.skill_receipt) setSkillReceipt(data.skill_receipt);
        if (data.progress?.status === "completed") {
          invalidateActiveMissionsCache();
          invalidateEvidenceArchiveCache();
          setSkillReceiptReady(true);
          if (pathId) trackMissionCompleted(pathId);
        }
        if (data.skill_receipt && pathId) {
          trackReceiptIssued(pathId);
        }
      } catch {
        // Optimistic update already applied
      }
      return true;
    },
    [pathId, path, currentItemIndex]
  );

  const advanceToItem = useCallback(
    async (index: number) => {
      if (!pathId) return;

      setCurrentItemIndex(index);
      try {
        const res = await fetch(`/api/learn/paths/${pathId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_index: index }),
        });
        if (res.status === 402) {
          setCanDo(false);
          return;
        }
        const data = await res.json();
        if (data.progress) setProgress(data.progress);
      } catch (err) {
        console.error("[useLearnProgress] advanceToItem failed:", err);
      }
    },
    [pathId]
  );

  const itemsTotal = path?.items.length ?? 0;
  const itemsCompleted = progress?.items_completed ?? 0;

  return {
    path,
    progress,
    achievement,
    currentItemIndex,
    isLoading,
    error,
    completeItem,
    advanceToItem,
    isCompleted: progress?.status === "completed",
    percentComplete:
      itemsTotal > 0 ? Math.round((itemsCompleted / itemsTotal) * 100) : 0,
    skillReceipt,
    skillReceiptReady,
    canDo,
  };
}
