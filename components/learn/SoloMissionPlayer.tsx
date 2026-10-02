"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ContentViewer } from "@/components/learn/ContentViewer";
import { MethodCard } from "@/components/learn/MethodCard";
import { ProjectExperienceShell } from "@/components/learn/ProjectExperienceShell";
import { MissionCard } from "@/components/missions/MissionCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  MISSIONS_ROUTE,
  PROGRESS_ROUTE,
  getMissionRoute,
  getProgressEvidenceRoute,
} from "@/lib/appRoutes";
import {
  getMissionArtifactLabel,
  getMissionCompletionStandard,
  getMissionExpectedOutput,
  getMissionNextAction,
  getMissionPlayerTitle,
  getMissionRoomCtaMode,
  getMissionStepKindLabel,
  getMissionUiState,
  getMissionUseItNext,
} from "@/lib/missionPresentation";
import { parseContentBrief } from "@/lib/learn/taughtHero/artifact";
import { TAUGHT_HERO_ITEM_IDS } from "@/lib/learn/taughtHero/types";
import { isTaughtHeroPath } from "@/lib/learn/taughtHero/unit";
import { useLearnProgress } from "@/lib/useLearnProgress";
import { usePostCompletionRecommendations } from "@/lib/usePostCompletionRecommendations";
import type { ItemState, PathItem } from "@/lib/types";

interface SoloMissionPlayerProps {
  pathId: string;
  initialStepIndex?: number | null;
}

function getItemKey(item: PathItem, index: number): string {
  return item.item_id ?? item.content_id ?? `idx-${index}`;
}

/**
 * Canonical solo runner for a mission. One step, one coaching line, one action.
 */
export function SoloMissionPlayer({
  pathId,
  initialStepIndex = null,
}: SoloMissionPlayerProps) {
  const router = useRouter();
  const {
    path,
    progress,
    achievement,
    currentItemIndex,
    isLoading,
    error,
    completeItem,
    advanceToItem,
    isCompleted,
  } = useLearnProgress(pathId);
  const { paths: recommendedPaths, isLoading: recommendationsLoading } =
    usePostCompletionRecommendations({
      path,
      currentPathId: pathId,
      enabled: isCompleted,
    });
  const syncedStepRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialStepIndex == null || !path || isLoading) {
      return;
    }

    const syncKey = `${path.id}:${initialStepIndex}`;
    if (syncedStepRef.current === syncKey) {
      return;
    }

    if (initialStepIndex < 0 || initialStepIndex >= path.items.length) {
      syncedStepRef.current = syncKey;
      return;
    }

    syncedStepRef.current = syncKey;
    if (currentItemIndex !== initialStepIndex) {
      void advanceToItem(initialStepIndex);
    }
  }, [advanceToItem, currentItemIndex, initialStepIndex, isLoading, path]);

  const currentItem = path?.items[currentItemIndex] ?? null;
  const currentItemKey = currentItem
    ? getItemKey(currentItem, currentItemIndex)
    : null;
  const isItemCompleted = currentItemKey
    ? progress?.item_states?.[currentItemKey]?.completed ?? false
    : false;
  const briefingHref = getMissionRoute(pathId);
  const evidenceHref = achievement?.share_slug
    ? getProgressEvidenceRoute(achievement.share_slug)
    : null;
  const artifactExpectation = path
    ? getMissionExpectedOutput(path, progress)
    : "Finished work you can carry into your next mission.";
  const artifactLabel = path ? getMissionArtifactLabel(path) : null;
  const completionStandard = path ? getMissionCompletionStandard(path) : null;
  const useItNext = path ? getMissionUseItNext(path) : null;
  const coachingLine = path
    ? getMissionNextAction(path, progress)
    : "Start the first step.";
  const taughtHero = path ? isTaughtHeroPath(path) : false;
  const playerTitle = path ? getMissionPlayerTitle(path) : "Mission";
  const stepKind =
    taughtHero && currentItem?.task_type === "do"
      ? "Do"
      : getMissionStepKindLabel(currentItem);
  const stepCount = path?.items.length ?? 0;
  const stepNumber = stepCount === 0 ? 0 : Math.min(currentItemIndex + 1, stepCount);
  const progressPercent =
    stepCount === 0 ? 0 : Math.round((stepNumber / stepCount) * 100);
  const completedStepCount = path
    ? path.items.reduce((count, item, index) => {
        const key = getItemKey(item, index);
        return progress?.item_states?.[key]?.completed ? count + 1 : count;
      }, 0)
    : 0;
  const showRoomLink =
    getMissionRoomCtaMode(
      getMissionUiState(progress),
      completedStepCount,
    ) === "footnote";

  const advanceAfterStep = useCallback(async () => {
    if (!path || currentItemIndex + 1 >= path.items.length) return;
    if (!isTaughtHeroPath(path)) return;
    await advanceToItem(currentItemIndex + 1);
  }, [advanceToItem, currentItemIndex, path]);

  const handleComplete = useCallback(async () => {
    if (!currentItemKey) return;
    await completeItem(currentItemKey);
    await advanceAfterStep();
  }, [advanceAfterStep, completeItem, currentItemKey]);

  const handleCompleteWithState = useCallback(
    async (stateData: Partial<ItemState>) => {
      if (!currentItemKey) return;
      await completeItem(currentItemKey, stateData);
      await advanceAfterStep();
    },
    [advanceAfterStep, completeItem, currentItemKey],
  );

  const workshopSubmission =
    progress?.item_states?.[TAUGHT_HERO_ITEM_IDS.do]?.submission_text;
  const currentItemSubmission = currentItemKey
    ? progress?.item_states?.[currentItemKey]?.submission_text
    : undefined;
  const savedMethod = (() => {
    if (!workshopSubmission) return null;
    try {
      return parseContentBrief(JSON.parse(workshopSubmission));
    } catch {
      return null;
    }
  })();
  const doItemIndex = path?.items.findIndex(
    (item) => item.item_id === TAUGHT_HERO_ITEM_IDS.do,
  ) ?? -1;

  if (taughtHero && path && currentItem && !isCompleted && !isLoading) {
    return (
      <ProjectExperienceShell
        title={playerTitle}
        artifactLabel={artifactLabel}
        stepNumber={stepNumber}
        stepCount={stepCount}
        stepKind={stepKind}
        coachingLine={coachingLine}
        progressPercent={progressPercent}
        headerRight={
          <Link
            href={briefingHref}
            className="shrink-0 text-sm text-[var(--sg-shell-500)] transition-colors hover:text-[var(--sg-shell-900)]"
          >
            Brief
          </Link>
        }
        footer={
          showRoomLink ? (
            <p className="text-center text-sm text-[var(--sg-shell-500)]">
              <Link
                href={briefingHref}
                className="transition-colors hover:text-[var(--sg-shell-900)]"
              >
                Prefer company? Do this in a room
              </Link>
            </p>
          ) : null
        }
      >
        <ContentViewer
          item={currentItem}
          isCompleted={isItemCompleted}
          onComplete={() => {
            void handleComplete();
          }}
          onCompleteWithState={(stateData) => {
            void handleCompleteWithState(stateData);
          }}
          onLeave={() => {
            router.push(briefingHref);
          }}
          variant="missionPage"
          workshopSubmission={workshopSubmission}
          itemSubmission={currentItemSubmission}
          onReviseWorkshop={() => {
            if (doItemIndex >= 0) {
              void advanceToItem(doItemIndex);
            }
          }}
        />
      </ProjectExperienceShell>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--sg-shell-50)]">
      <header className="border-b border-[var(--sg-shell-border)] bg-[var(--sg-white)]">
        <div className="mx-auto flex max-w-[880px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0 space-y-1">
            <Link
              href={MISSIONS_ROUTE}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sg-shell-600)] transition-colors hover:text-[var(--sg-shell-900)]"
            >
              <ArrowLeft size={14} />
              Missions
            </Link>
            <h1 className="truncate text-lg font-semibold text-[var(--sg-shell-900)]">
              {playerTitle}
            </h1>
          </div>
          {path && !isCompleted ? (
            <Link
              href={briefingHref}
              className="shrink-0 text-sm text-[var(--sg-shell-500)] transition-colors hover:text-[var(--sg-shell-900)]"
            >
              Brief
            </Link>
          ) : null}
        </div>
        {path && !isCompleted ? (
          <div
            className="h-1 w-full bg-[var(--sg-shell-100)]"
            aria-hidden="true"
          >
            <div
              className="h-full bg-[var(--sg-forest-500)] transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-[880px] px-4 py-6 sm:px-6 sm:py-8">
        {isLoading && !path ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--sg-shell-300)] border-t-transparent" />
          </div>
        ) : error || !path ? (
          <Card className="space-y-4 p-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--sg-shell-900)]">
                Couldn&apos;t load this mission
              </p>
              <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
                {error ?? "Try opening it again from Missions."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(MISSIONS_ROUTE)}
            >
              Back to Missions
            </Button>
          </Card>
        ) : isCompleted ? (
          <div className="space-y-6">
            <Card className="space-y-3 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-shell-500)]">
                Mission complete
              </p>
              {artifactLabel ? (
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sg-forest-500)]">
                  {artifactLabel}
                </p>
              ) : null}
              <h2 className="text-2xl font-semibold text-[var(--sg-shell-900)]">
                {playerTitle}
              </h2>
              <p className="text-sm leading-6 text-[var(--sg-shell-600)]">
                {completionStandard ?? artifactExpectation}
              </p>
              {useItNext ? (
                <p className="text-sm leading-6 text-[var(--sg-shell-600)]">
                  {useItNext}
                </p>
              ) : null}
              <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
                This is practiced work, not independently verified proficiency.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                {evidenceHref ? (
                  <Button
                    variant="cta"
                    size="sm"
                    rightIcon={<ArrowRight size={14} />}
                    onClick={() => router.push(evidenceHref)}
                  >
                    View work
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(PROGRESS_ROUTE)}
                >
                  Open Profile
                </Button>
              </div>
            </Card>

            {savedMethod ? <MethodCard brief={savedMethod} /> : null}

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-[var(--sg-shell-900)]">
                Next mission
              </h3>
              {recommendationsLoading ? (
                <p className="text-sm text-[var(--sg-shell-500)]">
                  Finding the next focused brief.
                </p>
              ) : recommendedPaths[0] ? (
                <MissionCard path={recommendedPaths[0]} featured />
              ) : (
                <p className="text-sm text-[var(--sg-shell-500)]">
                  More missions are ready when you want another focused round.
                </p>
              )}
            </section>
          </div>
        ) : currentItem ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
                Step {stepNumber} of {stepCount} · {stepKind}
              </p>
              <p className="text-base leading-7 text-[var(--sg-shell-900)]">
                {coachingLine}
              </p>
            </div>

            <div className="min-h-[420px]">
              <ContentViewer
                item={currentItem}
                isCompleted={isItemCompleted}
                onComplete={() => {
                  void handleComplete();
                }}
                onCompleteWithState={(stateData) => {
                  void handleCompleteWithState(stateData);
                }}
                onLeave={() => {
                  router.push(briefingHref);
                }}
                variant="missionPage"
              />
            </div>

            {showRoomLink ? (
              <p className="text-center text-sm text-[var(--sg-shell-500)]">
                <Link
                  href={briefingHref}
                  className="transition-colors hover:text-[var(--sg-shell-900)]"
                >
                  Prefer company? Do this in a room
                </Link>
              </p>
            ) : null}
          </div>
        ) : (
          <Card className="p-6">
            <p className="text-sm text-[var(--sg-shell-500)]">
              This mission does not have a next step yet.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
