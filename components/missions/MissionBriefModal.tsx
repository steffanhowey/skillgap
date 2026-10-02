"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { MissionRoomPickerModal } from "@/components/missions/MissionRoomPickerModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  ROOMS_ROUTE,
  getMissionSoloRoute,
  getProgressEvidenceRoute,
} from "@/lib/appRoutes";
import {
  prepareMissionRoomEntry,
  prepareMissionRoomHandoff,
} from "@/lib/missionRoomEntry";
import {
  getMissionArtifactLabel,
  getMissionExpectedOutput,
  getMissionFraming,
  getMissionPlayerTitle,
  getMissionRoomCtaMode,
  getMissionSuccessPreview,
} from "@/lib/missionPresentation";
import { useMissionLandingPageData } from "@/lib/useMissionLandingPageData";
import type { LearningPath, LearningProgress } from "@/lib/types";

type MissionBriefState = "ready" | "active" | "completed";

interface MissionBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  path: LearningPath;
  progress?: LearningProgress | null;
}

function getMissionBriefState(
  progress: LearningProgress | null,
): MissionBriefState {
  if (progress?.status === "completed") return "completed";
  if (progress?.status === "in_progress" || (progress?.items_completed ?? 0) > 0) {
    return "active";
  }

  return "ready";
}

function BriefSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2 border-t border-[var(--sg-shell-border)] px-6 py-4 first:border-t-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-shell-500)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function MissionBriefSkeleton() {
  return (
    <div className="space-y-4 px-6 py-6">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--sg-shell-100)]" />
        <div className="h-8 w-3/4 animate-pulse rounded-full bg-[var(--sg-shell-100)]" />
        <div className="h-4 w-full animate-pulse rounded-full bg-[var(--sg-shell-100)]" />
      </div>
      <div className="h-20 animate-pulse rounded-[var(--sg-radius-lg)] bg-[var(--sg-shell-50)]" />
      <div className="h-20 animate-pulse rounded-[var(--sg-radius-lg)] bg-[var(--sg-shell-50)]" />
    </div>
  );
}

export function MissionBriefModal({
  isOpen,
  onClose,
  path: initialPath,
  progress: initialProgress = null,
}: MissionBriefModalProps) {
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
  } = useMissionLandingPageData(initialPath.id);

  const effectivePath = path ?? initialPath;
  const effectiveProgress = progress ?? initialProgress;
  const state = useMemo(
    () => getMissionBriefState(effectiveProgress),
    [effectiveProgress],
  );
  const framing = useMemo(
    () => getMissionFraming(effectivePath, effectiveProgress),
    [effectivePath, effectiveProgress],
  );
  const artifactLabel = useMemo(
    () => getMissionArtifactLabel(effectivePath),
    [effectivePath],
  );
  const expectedOutput = useMemo(
    () => getMissionExpectedOutput(effectivePath, effectiveProgress),
    [effectivePath, effectiveProgress],
  );
  const successPreview = useMemo(
    () => getMissionSuccessPreview(effectivePath, effectiveProgress),
    [effectivePath, effectiveProgress],
  );
  const workHref =
    achievement?.share_slug ? getProgressEvidenceRoute(achievement.share_slug) : null;
  const primaryLabel = state === "active" ? "Continue" : "Start";
  const showStatus = state !== "ready";
  const roomCta = getMissionRoomCtaMode(
    state,
    effectiveProgress?.items_completed ?? 0,
  );

  const handleCloseBrief = () => {
    setShowRoomPicker(false);
    setIsLaunchingRoom(false);
    onClose();
  };

  const handlePrimaryAction = () => {
    router.push(getMissionSoloRoute(effectivePath.id));
  };

  const handleRoomAction = () => {
    if (recommendedRoom) {
      setIsLaunchingRoom(true);
      const href = prepareMissionRoomEntry({
        party: recommendedRoom,
        path: effectivePath,
        missionDomainLabel,
      });
      router.push(href);
      return;
    }

    if (!roomsLoading && !roomsError && availableRooms.length > 0) {
      setShowRoomPicker(true);
      return;
    }

    prepareMissionRoomHandoff({
      path: effectivePath,
      missionDomainLabel,
    });
    router.push(ROOMS_ROUTE);
  };

  if (!isOpen) return null;

  if (showRoomPicker) {
    return (
      <MissionRoomPickerModal
        isOpen={isOpen}
        onClose={handleCloseBrief}
        onBack={() => setShowRoomPicker(false)}
        backLabel="Back to mission"
        title="Choose a room"
        path={effectivePath}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseBrief}
      ariaLabel={`Mission brief for ${effectivePath.title}`}
      panelClassName="max-w-[720px] !p-0"
    >
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-36"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--sg-sage-100) 48%, var(--sg-white) 52%) 0%, transparent 100%)",
          }}
        />

        {isLoading && !path ? (
          <MissionBriefSkeleton />
        ) : error && !path ? (
          <div className="space-y-4 px-6 py-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--sg-shell-900)]">
                Couldn&apos;t load this mission
              </p>
              <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
                {error}
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="cta" size="sm" onClick={handleCloseBrief}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative space-y-3 px-6 pb-6 pt-7 sm:pr-16">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
                  Mission
                </p>
                {showStatus ? (
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-2xs font-semibold"
                    style={{
                      background:
                        state === "completed"
                          ? "color-mix(in srgb, var(--sg-gold-100) 72%, var(--sg-white) 28%)"
                          : "color-mix(in srgb, var(--sg-sage-100) 72%, var(--sg-white) 28%)",
                      color:
                        state === "completed"
                          ? "var(--sg-gold-700)"
                          : "var(--sg-forest-500)",
                    }}
                  >
                    {state === "completed" ? "Completed" : "In progress"}
                  </span>
                ) : null}
              </div>

              <div className="space-y-2">
                <h2 className="text-[1.55rem] font-semibold leading-[1.1] text-[var(--sg-shell-900)]">
                  {getMissionPlayerTitle(effectivePath)}
                </h2>
                <p className="text-sm leading-7 text-[var(--sg-shell-700)]">{framing}</p>
              </div>
            </div>

            <BriefSection title="What you'll make">
              <div className="space-y-3">
                {artifactLabel ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sg-shell-500)]">
                    {artifactLabel}
                  </p>
                ) : null}

                <p className="text-sm leading-7 text-[var(--sg-shell-700)]">
                  {expectedOutput}
                </p>
              </div>
            </BriefSection>

            {successPreview.length > 0 ? (
              <BriefSection title="Done looks like">
                <ul className="space-y-2">
                  {successPreview.map((criterion) => (
                    <li
                      key={criterion}
                      className="flex items-start gap-2 text-sm leading-6 text-[var(--sg-shell-600)]"
                    >
                      <CheckCircle2
                        size={14}
                        className="mt-1 shrink-0 text-[var(--sg-forest-500)]"
                      />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </BriefSection>
            ) : null}

            <div className="px-6 py-4">
              <div className="flex flex-col gap-3">
                <Button
                  variant="cta"
                  size="sm"
                  fullWidth
                  rightIcon={<ArrowRight size={14} />}
                  onClick={handlePrimaryAction}
                >
                  {primaryLabel}
                </Button>
                {state === "completed" && workHref ? (
                  <Link
                    href={workHref}
                    className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--sg-forest-500)] transition-colors hover:text-[var(--sg-shell-900)]"
                  >
                    View work
                    <ArrowRight size={14} />
                  </Link>
                ) : roomCta === "footnote" ? (
                  <div className="flex justify-center">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleRoomAction}
                      disabled={roomsLoading || isLaunchingRoom}
                    >
                      {isLaunchingRoom || roomsLoading
                        ? "Finding a room…"
                        : "Prefer company? Do this in a room"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
