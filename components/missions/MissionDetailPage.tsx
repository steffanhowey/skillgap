"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { MissionRoomPickerModal } from "@/components/missions/MissionRoomPickerModal";
import { Button } from "@/components/ui/Button";
import {
  MISSIONS_ROUTE,
  PROGRESS_ROUTE,
  ROOMS_ROUTE,
  getMissionSoloRoute,
  getProgressEvidenceRoute,
} from "@/lib/appRoutes";
import { prepareMissionRoomEntry } from "@/lib/missionRoomEntry";
import {
  formatMissionDuration,
  getMissionArtifactLabel,
  getMissionCurrentItem,
  getMissionExpectedOutput,
  getMissionFraming,
  getMissionPlayerTitle,
  getMissionProgressSummary,
  getMissionRoomCtaMode,
  getMissionStepCoaching,
  getMissionSuccessPreview,
} from "@/lib/missionPresentation";
import { useMissionLandingPageData } from "@/lib/useMissionLandingPageData";
import { trackFirstMissionOpened } from "@/lib/onboarding/tracking";
import { useProfile } from "@/lib/useProfile";
import type { LearningPath, LearningProgress } from "@/lib/types";

type MissionLandingState = "ready" | "active" | "completed";

function getMissionLandingState(
  progress: LearningProgress | null,
): MissionLandingState {
  if (progress?.status === "completed") return "completed";
  if (progress?.status === "in_progress" || (progress?.items_completed ?? 0) > 0) {
    return "active";
  }

  return "ready";
}

function formatMissionMetaLine(
  path: LearningPath,
  progress: LearningProgress | null,
): string {
  const effort = formatMissionDuration(path.estimated_duration_seconds);
  const progressSummary = getMissionProgressSummary(progress);
  const stepCount = path.items.length;
  const stepLabel = `${stepCount} ${stepCount === 1 ? "step" : "steps"}`;
  const state = getMissionLandingState(progress);

  if (state === "completed") {
    return `Completed · ${progressSummary} · ${effort}`;
  }

  if (state === "active") {
    return `In progress · ${progressSummary} · ${effort}`;
  }

  return `${effort} · ${stepLabel}`;
}

function MissionSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[var(--sg-shell-border)] pt-6 first:border-t-0 first:pt-0">
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--sg-shell-900)]">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function MissionLandingSkeleton() {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_20rem]">
      <aside
        className="order-1 border-b border-[var(--sg-shell-border)] px-5 py-5 sm:px-6 xl:order-2 xl:border-b-0 xl:border-l"
        style={{
          background: "color-mix(in srgb, var(--sg-shell-50) 72%, var(--sg-white) 28%)",
        }}
      >
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--sg-shell-100)]" />
          <div className="h-8 w-3/4 animate-pulse rounded-full bg-[var(--sg-shell-100)]" />
          <div className="space-y-2">
            <div className="h-10 w-full animate-pulse rounded-[var(--sg-radius-btn)] bg-[var(--sg-shell-100)]" />
            <div className="h-9 w-full animate-pulse rounded-[var(--sg-radius-btn)] bg-[var(--sg-shell-100)]" />
          </div>
        </div>
      </aside>

      <div className="order-2 px-5 py-6 sm:px-8 sm:py-7 xl:order-1">
        <div className="mx-auto max-w-[760px] space-y-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="h-5 w-36 animate-pulse rounded-full bg-[var(--sg-shell-100)]" />
              <div className="h-5 w-full animate-pulse rounded-full bg-[var(--sg-shell-100)]" />
              <div className="h-5 w-4/5 animate-pulse rounded-full bg-[var(--sg-shell-100)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MissionEmptyState({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <div className="px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-[640px] space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[var(--sg-shell-900)]">{title}</h2>
          <p className="text-sm leading-7 text-[var(--sg-shell-500)]">{description}</p>
        </div>

        <Button variant="cta" size="sm" onClick={onBack}>
          Back to Missions
        </Button>
      </div>
    </div>
  );
}

function LaunchRail({
  state,
  itemsCompleted,
  primaryLabel,
  onPrimaryAction,
  onRoomAction,
  isRoomLoading,
  isCompleted,
  workHref,
}: {
  state: MissionLandingState;
  itemsCompleted: number;
  primaryLabel: string;
  onPrimaryAction: () => void;
  onRoomAction: () => void;
  isRoomLoading: boolean;
  isCompleted: boolean;
  workHref: string | null;
}) {
  const roomCta = getMissionRoomCtaMode(state, itemsCompleted);
  const stateLabel =
    state === "completed"
      ? "Completed"
      : state === "active"
        ? "In progress"
        : "Ready";

  return (
    <aside
      className="order-1 border-b border-[var(--sg-shell-border)] px-5 py-5 sm:px-6 xl:order-2 xl:border-b-0 xl:border-l"
      style={{
        background: "color-mix(in srgb, var(--sg-shell-50) 74%, var(--sg-white) 26%)",
      }}
    >
      <div className="space-y-6 xl:sticky xl:top-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-shell-500)]">
            {stateLabel}
          </p>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--sg-shell-900)]">
              {state === "completed"
                ? "Review the work"
                : state === "active"
                  ? "Continue the work"
                  : "Start the work"}
            </h2>
            <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
              {state === "completed"
                ? "Open what you made, or start the next mission."
                : "One mission. One tool. Leave with work you can use."}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="cta"
            size="sm"
            fullWidth
            rightIcon={<ArrowRight size={14} />}
            onClick={onPrimaryAction}
          >
            {primaryLabel}
          </Button>

          {roomCta === "footnote" ? (
            <div className="flex justify-center">
              <Button
                variant="link"
                size="sm"
                onClick={onRoomAction}
                disabled={isRoomLoading}
              >
                {isRoomLoading
                  ? "Finding a room…"
                  : "Prefer company? Do this in a room"}
              </Button>
            </div>
          ) : null}
        </div>

        {isCompleted ? (
          <div className="space-y-2 border-t border-[var(--sg-shell-border)] pt-5">
            {workHref ? (
              <Link
                href={workHref}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sg-forest-500)] transition-colors hover:text-[var(--sg-shell-900)]"
              >
                View work
                <ArrowRight size={14} />
              </Link>
            ) : null}

            <Link
              href={PROGRESS_ROUTE}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sg-shell-600)] transition-colors hover:text-[var(--sg-shell-900)]"
            >
              Open Profile
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function MissionDetailPage({ pathId }: { pathId: string }) {
  const router = useRouter();
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [isLaunchingRoom, setIsLaunchingRoom] = useState(false);
  const {
    path,
    progress,
    achievement,
    isLoading,
    error,
    availableRooms,
    roomsLoading,
    roomsError,
    recommendedRoom,
    missionDomainLabel,
  } = useMissionLandingPageData(pathId);
  const { profile } = useProfile();
  const trackedOpenRef = useRef(false);

  useEffect(() => {
    if (!path || trackedOpenRef.current) return;
    if (profile?.recommended_first_path_id !== path.id) return;
    trackedOpenRef.current = true;
    trackFirstMissionOpened(path.id);
  }, [path, profile?.recommended_first_path_id]);

  const landingState = useMemo(
    () => getMissionLandingState(progress),
    [progress],
  );
  const framing = useMemo(
    () => (path ? getMissionFraming(path, progress) : null),
    [path, progress],
  );
  const outputTitle =
    landingState === "completed" ? "What you made" : "What you'll make";
  const artifactLabel = useMemo(
    () => (path ? getMissionArtifactLabel(path) : null),
    [path],
  );
  const outputLine = useMemo(
    () => (path ? getMissionExpectedOutput(path, progress) : null),
    [path, progress],
  );
  const successCriteria = useMemo(
    () => (path ? getMissionSuccessPreview(path, progress) : []),
    [path, progress],
  );
  const headerMeta = useMemo(
    () => (path ? formatMissionMetaLine(path, progress) : null),
    [path, progress],
  );
  const primaryLabel =
    landingState === "completed"
      ? "Review your work"
      : landingState === "active"
        ? "Continue"
        : "Start";
  const workHref =
    achievement?.share_slug ? getProgressEvidenceRoute(achievement.share_slug) : null;
  const currentStep = path ? getMissionCurrentItem(path, progress) : null;

  const handlePrimaryAction = () => {
    if (!path) return;
    router.push(getMissionSoloRoute(path.id));
  };

  const handleRoomAction = () => {
    if (!path) return;

    if (recommendedRoom) {
      setIsLaunchingRoom(true);
      const href = prepareMissionRoomEntry({
        party: recommendedRoom,
        path,
        missionDomainLabel,
      });
      router.push(href);
      return;
    }

    if (!roomsLoading && !roomsError && availableRooms.length > 0) {
      setShowRoomPicker(true);
      return;
    }

    router.push(ROOMS_ROUTE);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--sg-shell-50)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[280px]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--sg-sage-100) 52%, var(--sg-white) 48%) 0%, color-mix(in srgb, var(--sg-shell-50) 82%, var(--sg-white) 18%) 72%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">
        <div
          className="overflow-hidden rounded-[var(--sg-radius-xl)] border border-[var(--sg-shell-border)]"
          style={{
            background:
              "color-mix(in srgb, var(--sg-white) 94%, var(--sg-cream-50) 6%)",
            boxShadow: "var(--shadow-float)",
          }}
        >
          <header className="border-b border-[var(--sg-shell-border)] px-5 py-5 sm:px-8 sm:py-7">
            <div className="space-y-6">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<ArrowLeft size={14} />}
                  onClick={() => router.push(MISSIONS_ROUTE)}
                >
                  Missions
                </Button>
              </div>

              <div className="max-w-[760px] space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
                  Mission
                </p>

                <h1
                  className="text-[2rem] leading-[1.04] text-[var(--sg-shell-900)] sm:text-[2.6rem]"
                  style={{
                    fontFamily: "var(--font-display), 'Fraunces', Georgia, serif",
                  }}
                >
                  {path ? getMissionPlayerTitle(path) : "Mission"}
                </h1>

                {headerMeta ? (
                  <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
                    {headerMeta}
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          {isLoading ? (
            <MissionLandingSkeleton />
          ) : error || !path ? (
            <MissionEmptyState
              title="Couldn’t load this mission"
              description={error ?? "Try opening it again from Missions."}
              onBack={() => router.push(MISSIONS_ROUTE)}
            />
          ) : (
            <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_20rem]">
              <LaunchRail
                state={landingState}
                itemsCompleted={progress?.items_completed ?? 0}
                primaryLabel={primaryLabel}
                onPrimaryAction={handlePrimaryAction}
                onRoomAction={handleRoomAction}
                isRoomLoading={roomsLoading || isLaunchingRoom}
                isCompleted={landingState === "completed"}
                workHref={workHref}
              />

              <div className="order-2 px-5 py-6 sm:px-8 sm:py-7 xl:order-1">
                <div className="mx-auto max-w-[760px] space-y-6">
                  <MissionSection title="The job">
                    {framing ? (
                      <p className="text-lg leading-8 text-[var(--sg-shell-900)]">
                        {framing}
                      </p>
                    ) : null}
                  </MissionSection>

                  <MissionSection title={outputTitle}>
                    <div className="space-y-3">
                      {artifactLabel ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sg-shell-500)]">
                          {artifactLabel}
                        </p>
                      ) : null}

                      <p className="text-lg leading-8 text-[var(--sg-shell-900)]">
                        {outputLine}
                      </p>
                    </div>
                  </MissionSection>

                  {successCriteria.length > 0 ? (
                    <MissionSection title="Done looks like">
                      <ul className="space-y-3">
                        {successCriteria.map((criterion) => (
                          <li
                            key={criterion}
                            className="flex items-start gap-3 text-sm leading-6 text-[var(--sg-shell-700)]"
                          >
                            <CheckCircle2
                              size={16}
                              className="mt-1 shrink-0 text-[var(--sg-forest-500)]"
                            />
                            <span>{criterion}</span>
                          </li>
                        ))}
                      </ul>
                      {landingState === "active" && currentStep ? (
                        <p className="pt-2 text-sm leading-6 text-[var(--sg-shell-500)]">
                          Next: {getMissionStepCoaching(path, currentStep)}
                        </p>
                      ) : null}
                    </MissionSection>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {path && showRoomPicker ? (
        <MissionRoomPickerModal
          isOpen={showRoomPicker}
          onClose={() => setShowRoomPicker(false)}
          path={path}
        />
      ) : null}
    </div>
  );
}
