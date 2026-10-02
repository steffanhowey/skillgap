"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LaunchpadHero } from "@/components/home/LaunchpadHero";
import { PathCardSkeleton } from "@/components/learn/PathCardSkeleton";
import { useLearnSearch } from "@/lib/useLearnSearch";
import { useLaunchCatalog } from "@/lib/useLaunchCatalog";
import { useSkillProfile } from "@/lib/useSkillProfile";
import {
  getMissionRoute,
  MISSIONS_ROUTE,
} from "@/lib/appRoutes";
import { useProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/Button";
import { MissionCard } from "@/components/missions/MissionCard";
import { MissionBriefModal } from "@/components/missions/MissionBriefModal";
import { buildHomePrimaryAction } from "@/lib/homeLaunchpad";
import {
  buildLaunchFrontDoorBuckets,
  CORE_LAUNCH_FRONT_DOOR_STEPS,
} from "@/lib/launchFrontDoor";
import { getCompletedLaunchLaneKeys } from "@/lib/missionCatalogRecommendations";
import { buildMissionRecommendations } from "@/lib/missionRecommendations";
import {
  getMissionLaunchDomain,
  LAUNCH_DOMAIN_OPTIONS,
} from "@/lib/launchTaxonomy";
import { useMissionRecommendations } from "@/lib/useMissionRecommendations";
import type { LearningPath, LearningProgress } from "@/lib/types";
import {
  getLaunchMissionLaneKey,
  isApprovedLaunchMissionLaneKey,
} from "@/lib/launchMissionContent";
import {
  filterLaunchCatalogPaths,
  intersectWithLaunchCatalog,
  pathMatchesLaunchCatalogQuery,
} from "@/lib/launchCatalogVisibility";
import { isFirstSessionHome } from "@/lib/firstSession";

interface CategoryDef {
  value: string;
  label: string;
}

interface MissionBriefSelection {
  path: LearningPath;
  progress: LearningProgress | null;
}

const CATEGORIES: CategoryDef[] = [
  { value: "all", label: "All" },
  { value: "in-progress", label: "In Progress" },
  ...LAUNCH_DOMAIN_OPTIONS.map((domain) => ({
    value: domain.key,
    label: domain.label,
  })),
];

function pathMatchesCategory(
  path: LearningPath,
  categoryValue: string,
): boolean {
  if (categoryValue === "all") return true;
  return getMissionLaunchDomain(path).key === categoryValue;
}

const DISCOVERY_SELECT_CLASS_NAME =
  "cursor-pointer appearance-none rounded-full border border-shell-border bg-shell-50 px-4 py-2 pr-8 text-sm text-shell-600 transition-colors hover:border-forest-400 focus:border-forest-400 focus:outline-none";

export function MissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    query,
    setQuery,
    inProgressPaths,
    searchResults,
    error,
    isLoading: progressLoading,
  } = useLearnSearch();
  const { achievements, isLoading: profileLoading } = useSkillProfile();
  const { profile } = useProfile();
  const { paths: launchCatalogPaths, isLoading: launchCatalogLoading } =
    useLaunchCatalog();
  const activeMission = inProgressPaths[0] ?? null;
  const { recommendations, isLoading: recommendationsLoading } =
    useMissionRecommendations({
      surface: "home",
      activePathId: activeMission?.path.id ?? null,
      activePath: activeMission?.path ?? null,
      completedAchievements: achievements,
    });

  const [category, setCategory] = useState("all");
  const [selectedMissionBrief, setSelectedMissionBrief] =
    useState<MissionBriefSelection | null>(null);

  useEffect(() => {
    const initialQuery = searchParams.get("q")?.trim() ?? "";
    if (initialQuery === query) return;

    const timeoutId = window.setTimeout(() => {
      setQuery(initialQuery);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [query, searchParams, setQuery]);

  const progressMap = useMemo(() => {
    const map = new Map<string, LearningProgress>();
    for (const { path, progress } of inProgressPaths) {
      map.set(path.id, progress);
    }
    return map;
  }, [inProgressPaths]);

  const completedPathIds = useMemo(
    () => new Set(achievements.map((achievement) => achievement.path_id)),
    [achievements],
  );
  const completedLaunchLaneKeys = useMemo(
    () => new Set(getCompletedLaunchLaneKeys(achievements, launchCatalogPaths)),
    [achievements, launchCatalogPaths],
  );
  const activePathIds = useMemo(
    () => new Set(inProgressPaths.map((entry) => entry.path.id)),
    [inProgressPaths],
  );
  const launchCatalogPool = useMemo(
    () => [
      ...inProgressPaths
        .map(({ path }) => path)
        .filter((path) => isApprovedLaunchMissionLaneKey(path.mission_lane_key)),
      ...launchCatalogPaths,
    ],
    [inProgressPaths, launchCatalogPaths],
  );

  const allPaths = useMemo(
    () =>
      filterLaunchCatalogPaths([
        ...inProgressPaths.map(({ path }) => path),
        ...launchCatalogPaths,
      ]),
    [inProgressPaths, launchCatalogPaths],
  );

  const fallbackMissionRecommendations = useMemo(() => {
    const availableFallbackPaths = launchCatalogPaths.filter((path) => {
      if (activePathIds.has(path.id)) return false;
      if (completedPathIds.has(path.id)) return false;
      const laneKey = getLaunchMissionLaneKey(path);
      if (laneKey && completedLaunchLaneKeys.has(laneKey)) return false;
      if (
        recommendations.some(
          (recommendation) => recommendation.path.id === path.id,
        )
      ) {
        return false;
      }
      return true;
    });

    return buildMissionRecommendations(
      availableFallbackPaths.map((path) => ({
        reason: "domain_expansion" as const,
        priority: 0,
        paths: [path],
        action: null,
      })),
      {
        surface: "home",
        activePathId: activeMission?.path.id ?? null,
        activePath: activeMission?.path ?? null,
      },
    );
  }, [
    activeMission?.path,
    activePathIds,
    completedLaunchLaneKeys,
    completedPathIds,
    launchCatalogPaths,
    recommendations,
  ]);

  const primaryAction = useMemo(
    () =>
      buildHomePrimaryAction({
        activeMission,
        recommendations,
        fallbackRecommendations: fallbackMissionRecommendations,
        recommendedFirstPathId: profile?.recommended_first_path_id ?? null,
        completedPathIds,
        knownPaths: launchCatalogPaths,
      }),
    [
      activeMission,
      completedPathIds,
      fallbackMissionRecommendations,
      launchCatalogPaths,
      profile?.recommended_first_path_id,
      recommendations,
    ],
  );
  const isInitialMissionLoad =
    !query.trim() &&
    launchCatalogLoading &&
    launchCatalogPaths.length === 0;
  const heroIsLoading =
    isInitialMissionLoad ||
    (!activeMission &&
      (launchCatalogLoading || recommendationsLoading) &&
      recommendations.length === 0 &&
      fallbackMissionRecommendations.length === 0);
  const sessionKnown = !progressLoading && !profileLoading;
  const firstSession =
    sessionKnown &&
    isFirstSessionHome({
      achievementCount: achievements.length,
      inProgressCount: inProgressPaths.length,
    });

  const searchMode = query.trim().length > 0;
  const showCampus = sessionKnown ? !firstSession || searchMode : false;
  const filteredSearchResults = useMemo(() => {
    const isAvailable = (path: LearningPath): boolean => {
      const progress = progressMap.get(path.id);
      return progress?.status !== "completed" && !completedPathIds.has(path.id);
    };

    const catalogMatches = launchCatalogPaths.filter(
      (path) =>
        isAvailable(path) && pathMatchesLaunchCatalogQuery(path, query),
    );
    const catalogIds = new Set(catalogMatches.map((path) => path.id));
    const apiMatches = intersectWithLaunchCatalog(
      searchResults,
      launchCatalogPaths,
    ).filter((path) => isAvailable(path) && !catalogIds.has(path.id));

    return [...catalogMatches, ...apiMatches];
  }, [
    completedPathIds,
    launchCatalogPaths,
    progressMap,
    query,
    searchResults,
  ]);
  const visibleSearchResults = filteredSearchResults.slice(0, 4);
  const hiddenSearchResultCount = Math.max(
    filteredSearchResults.length - visibleSearchResults.length,
    0,
  );
  const visibleCategories = useMemo(
    () =>
      CATEGORIES.filter(
        (option) =>
          option.value !== "in-progress" || inProgressPaths.length > 0,
      ),
    [inProgressPaths.length],
  );
  const filteredDiscoveryPaths = useMemo(() => {
    let paths = allPaths.filter((path) => !completedPathIds.has(path.id));

    if (category === "in-progress") {
      paths = paths.filter((path) => progressMap.has(path.id));
    } else if (category !== "all") {
      paths = paths.filter((path) => pathMatchesCategory(path, category));
    }

    if (inProgressPaths.length > 0 && category !== "in-progress") {
      const inProgressIds = new Set(inProgressPaths.map(({ path }) => path.id));
      paths = paths.filter((path) => !inProgressIds.has(path.id));
    }

    return paths;
  }, [allPaths, category, completedPathIds, inProgressPaths, progressMap]);
  const launchFrontDoor = useMemo(
    () =>
      buildLaunchFrontDoorBuckets(
        launchCatalogPool.filter((path) => {
          const laneKey = getLaunchMissionLaneKey(path);
          if (!laneKey) return false;
          if (completedPathIds.has(path.id)) return false;
          return !completedLaunchLaneKeys.has(laneKey);
        }),
      ),
    [completedLaunchLaneKeys, completedPathIds, launchCatalogPool],
  );
  const visibleDiscoveryPaths = useMemo(() => {
    const curatedIds = new Set(
      !query.trim() && category === "all"
        ? [
            ...launchFrontDoor.corePaths.map((path) => path.id),
            ...launchFrontDoor.extendedPaths.map((path) => path.id),
          ]
        : [],
    );

    return filteredDiscoveryPaths.filter((path) => !curatedIds.has(path.id));
  }, [
    category,
    filteredDiscoveryPaths,
    launchFrontDoor.corePaths,
    launchFrontDoor.extendedPaths,
    query,
  ]);
  const showBrowseSection =
    searchMode ||
    isInitialMissionLoad ||
    category !== "all" ||
    visibleDiscoveryPaths.length > 0;
  const openMissionBrief = useCallback(
    (path: LearningPath, progress: LearningProgress | null = null) => {
      setSelectedMissionBrief({ path, progress });
    },
    [],
  );
  const handleOpenPrimaryAction = useCallback(() => {
    const heroMission = primaryAction.mission;

    if (heroMission && primaryAction.isFirstMission) {
      router.push(getMissionRoute(heroMission.id));
      return;
    }

    if (heroMission) {
      openMissionBrief(heroMission, primaryAction.progress ?? null);
      return;
    }

    router.push(MISSIONS_ROUTE);
  }, [
    openMissionBrief,
    primaryAction.isFirstMission,
    primaryAction.mission,
    primaryAction.progress,
    router,
  ]);

  const clearSearch = useCallback(() => {
    setQuery("");
    router.replace(MISSIONS_ROUTE);
  }, [router, setQuery]);

  const handleCatalogSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
      const trimmed = value.trim();
      router.replace(
        trimmed
          ? `${MISSIONS_ROUTE}?q=${encodeURIComponent(trimmed)}`
          : MISSIONS_ROUTE,
      );
    },
    [router, setQuery],
  );

  return (
    <div className="space-y-6">
      <LaunchpadHero
        primaryAction={primaryAction}
        isLoading={heroIsLoading}
        onPrimaryAction={handleOpenPrimaryAction}
        previewDetailsVisible={false}
      />

      {error && <p className="text-sm text-sg-coral-500">{error}</p>}

      {showCampus ? (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          value={query}
          onChange={(event) => handleCatalogSearchChange(event.target.value)}
          placeholder="Search missions"
          aria-label="Search missions"
          className="w-full sm:max-w-sm"
        />
        {!searchMode ? (
          <CategoryFilter
            value={category}
            options={visibleCategories}
            onChange={setCategory}
          />
        ) : null}
      </div>
      ) : null}

      {showCampus ? (
      <div className="space-y-6">
        {!searchMode &&
        category === "all" &&
        launchFrontDoor.corePaths.length > 0 ? (
          <LaunchFrontDoorSection
            corePaths={launchFrontDoor.corePaths}
            extendedPaths={launchFrontDoor.extendedPaths}
            progressByPathId={progressMap}
            onOpenMission={openMissionBrief}
          />
        ) : null}

        {inProgressPaths.length > 0 && (
          <section>
            <SectionHeader title="My Missions" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {inProgressPaths.map(({ path, progress }) => (
                <MissionCard
                  key={path.id}
                  path={path}
                  progress={progress}
                  onOpenMission={openMissionBrief}
                  compact
                  cleanFrame
                />
              ))}
            </div>
          </section>
        )}

        {showBrowseSection && (
        <section>
          {isInitialMissionLoad ? (
            <>
              <SectionHeaderSkeleton />
              <MissionCardSkeletonGrid count={3} />
            </>
          ) : (
            <>
              <SectionHeader
                title={searchMode ? "Mission Matches" : "Browse Missions"}
                description={
                  searchMode
                    ? "Missions that match what you typed."
                    : "More missions when you want a different brief."
                }
              />

              {searchMode ? (
            launchCatalogLoading && visibleSearchResults.length === 0 ? (
              <MissionCardSkeletonGrid count={2} />
            ) : visibleSearchResults.length > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleSearchResults.map((path) => (
                    <MissionCard
                      key={path.id}
                      path={path}
                      progress={progressMap.get(path.id) ?? null}
                      onOpenMission={openMissionBrief}
                      compact
                      cleanFrame
                    />
                  ))}
                </div>
                {hiddenSearchResultCount > 0 && (
                  <p className="text-xs text-shell-500">
                    Showing the first 4 mission matches. Refine the search to
                    narrow further.
                  </p>
                )}
              </>
            ) : (
            <EmptySectionState
              title="No matching missions yet"
              description="Clear the search to see missions again."
              action={
                <Button variant="secondary" size="sm" onClick={clearSearch}>
                  Clear search
                </Button>
              }
            />
          )
          ) : launchCatalogLoading ? (
            <MissionCardSkeletonGrid count={activeMission ? 2 : 3} />
          ) : visibleDiscoveryPaths.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleDiscoveryPaths.map((path) => (
                <MissionCard
                  key={path.id}
                  path={path}
                  progress={progressMap.get(path.id) ?? null}
                  onOpenMission={openMissionBrief}
                  compact
                  cleanFrame
                />
              ))}
            </div>
          ) : category === "in-progress" ? (
            <EmptySectionState
              title="No missions in progress yet"
              description="Start a mission to track visible progress."
            />
          ) : category !== "all" ? (
            <EmptySectionState
              title="No missions found in this category yet"
              description="Try another category to find a better next mission."
            />
          ) : (
            <EmptySectionState
              title="Those missions are already above"
              description="Start one of the missions above, or filter by category."
            />
          )}
            </>
          )}
        </section>
        )}
      </div>
      ) : null}

      {selectedMissionBrief ? (
        <MissionBriefModal
          key={selectedMissionBrief.path.id}
          isOpen
          onClose={() => setSelectedMissionBrief(null)}
          path={selectedMissionBrief.path}
          progress={selectedMissionBrief.progress}
        />
      ) : null}
    </div>
  );
}

function LaunchFrontDoorSection({
  corePaths,
  extendedPaths,
  progressByPathId,
  onOpenMission,
}: {
  corePaths: LearningPath[];
  extendedPaths: LearningPath[];
  progressByPathId: Map<string, LearningProgress>;
  onOpenMission: (path: LearningPath, progress: LearningProgress | null) => void;
}) {
  const visibleCoreSteps = CORE_LAUNCH_FRONT_DOOR_STEPS.filter((step) =>
    corePaths.some((path) => getLaunchMissionLaneKey(path) === step.laneKey),
  );
  const hasFullCorePath =
    visibleCoreSteps.length === CORE_LAUNCH_FRONT_DOOR_STEPS.length;
  const launchPathDescription = hasFullCorePath
    ? "Start with these three missions in order. Each one is built to finish in one session and end in a real artifact you can use next."
    : "Start with the published core missions in order. Missing steps stay hidden until that lane is available.";

  return (
    <section className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-shell-500">
              Start here
            </p>
            <h2 className="text-2xl font-semibold leading-tight text-shell-900">
              Go from better AI thinking to better marketing output to better workflow design.
            </h2>
            <p className="max-w-[50rem] text-sm leading-7 text-shell-500">
              {launchPathDescription}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {visibleCoreSteps.map((step) => (
              <div
                key={step.laneKey}
                className="rounded-[var(--sg-radius-lg)] border border-[var(--sg-shell-border)] px-4 py-4"
                style={{
                  background:
                    "color-mix(in srgb, var(--sg-white) 80%, var(--sg-shell-50) 20%)",
                }}
              >
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-shell-500">
                    {step.stepLabel}
                  </p>
                  <p className="text-base font-semibold text-shell-900">{step.title}</p>
                  <p className="text-sm leading-6 text-shell-500">{step.supportLine}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader
          title="The first three missions"
          description="Start here. These three missions are sequenced to sharpen how marketers think, write, and design workflows with AI."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {corePaths.map((path) => {
            const laneKey = getLaunchMissionLaneKey(path);
            const step = CORE_LAUNCH_FRONT_DOOR_STEPS.find(
              (candidate) => candidate.laneKey === laneKey,
            );

            return (
              <div key={path.id} className="space-y-2">
                {step ? (
                  <div className="space-y-0.5 px-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-shell-500">
                      {step.stepLabel}
                    </p>
                    <p className="text-sm text-shell-500">{step.title}</p>
                  </div>
                ) : null}

                <MissionCard
                  path={path}
                  progress={progressByPathId.get(path.id) ?? null}
                  onOpenMission={onOpenMission}
                  compact
                  cleanFrame
                />
              </div>
            );
          })}
        </div>
      </section>

      {extendedPaths.length > 0 ? (
        <section>
          <SectionHeader
            title="Optional depth"
            description="Go deeper when you want a narrower or more technical mission. These strengthen the story, but they are not the first three."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {extendedPaths.map((path) => (
              <MissionCard
                key={path.id}
                path={path}
                progress={progressByPathId.get(path.id) ?? null}
                onOpenMission={onOpenMission}
                compact
                cleanFrame
              />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function CategoryFilter({
  value,
  options,
  onChange,
}: {
  value: string;
  options: CategoryDef[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Filter missions"
        className={DISCOVERY_SELECT_CLASS_NAME}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.5}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-shell-500"
      />
    </div>
  );
}

function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  if (!description) {
    return (
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-shell-900">{title}</h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div
        className={`flex justify-between gap-4 ${description ? "items-start" : "items-center"}`}
      >
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-shell-900">{title}</h2>
          {description ? (
            <p className="text-sm text-shell-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}

function EmptySectionState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="space-y-3">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-shell-900">{title}</h3>
          <p className="text-sm leading-6 text-shell-500">{description}</p>
        </div>
        {action}
      </div>
    </Card>
  );
}

function SectionHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-3">
      <div
        className="h-8 w-56 animate-pulse rounded-full"
        style={{ background: "var(--sg-shell-200)" }}
      />
      <div
        className="h-4 w-[22rem] max-w-full animate-pulse rounded-full"
        style={{ background: "var(--sg-shell-100)" }}
      />
    </div>
  );
}

function MissionCardSkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <PathCardSkeleton key={index} />
      ))}
    </div>
  );
}
