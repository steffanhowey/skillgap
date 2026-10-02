"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import { LearnVideoPlayer } from "./LearnVideoPlayer";
import { ArticleViewer } from "./ArticleViewer";
import { ArtifactReviewViewer } from "./ArtifactReviewViewer";
import { ArtifactWorkshopViewer } from "./ArtifactWorkshopViewer";
import { NextUseReflection } from "./NextUseReflection";
import { MissionViewer } from "./MissionViewer";
import { QuickCheckViewer } from "./QuickCheckViewer";
import { ReflectionViewer } from "./ReflectionViewer";
import { Button } from "@/components/ui/Button";
import { RoomStageFooter } from "./RoomStageScaffold";
import type { PathItem, ItemState } from "@/lib/types";

interface ContentViewerProps {
  item: PathItem;
  isCompleted: boolean;
  onComplete: () => void;
  onCompleteWithState: (stateData: Partial<ItemState>) => void;
  onLeave?: () => void;
  variant?: "default" | "roomOverlay" | "missionPage";
  onPlayStateChange?: (playing: boolean) => void;
  togglePlayRef?: React.MutableRefObject<(() => void) | null>;
  workshopSubmission?: string;
  itemSubmission?: string;
  onReviseWorkshop?: () => void;
}

/**
 * Content viewer wrapper that renders the appropriate viewer
 * based on the current item's task_type.
 */

function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

export function ContentViewer({
  item,
  isCompleted,
  onComplete,
  onCompleteWithState,
  onLeave,
  variant = "default",
  onPlayStateChange,
  togglePlayRef,
  workshopSubmission,
  itemSubmission,
  onReviseWorkshop,
}: ContentViewerProps) {
  const taskType = item.task_type ?? "watch";
  const isImmersiveStage = variant === "roomOverlay" || variant === "missionPage";

  if (item.workshop?.kind === "content_brief_prompt_upgrade") {
    return (
      <ArtifactWorkshopViewer
        isCompleted={isCompleted}
        initialSubmission={workshopSubmission}
        onComplete={onCompleteWithState}
      />
    );
  }

  if (item.workshop?.kind === "content_brief_prompt_upgrade_review") {
    return (
      <ArtifactReviewViewer
        isCompleted={isCompleted}
        submissionText={workshopSubmission}
        onComplete={onCompleteWithState}
        onRevise={() => {
          onReviseWorkshop?.();
        }}
      />
    );
  }

  if (item.workshop?.kind === "next_brief_use") {
    return (
      <NextUseReflection
        isCompleted={isCompleted}
        prompt={item.reflection?.prompt ?? "Which real brief will you use this method on next?"}
        initialValue={itemSubmission}
        onComplete={onCompleteWithState}
      />
    );
  }

  // ── Do tasks → MissionViewer ──
  if (taskType === "do" && item.mission) {
    return (
      <MissionViewer
        item={item}
        isCompleted={isCompleted}
        onComplete={onCompleteWithState}
        onLeave={onLeave}
        variant={variant}
      />
    );
  }

  // ── Check tasks → QuickCheckViewer ──
  if (taskType === "check" && item.check) {
    return (
      <QuickCheckViewer
        item={item}
        isCompleted={isCompleted}
        onComplete={onCompleteWithState}
        variant={variant}
      />
    );
  }

  // ── Reflect tasks → ReflectionViewer ──
  if (taskType === "reflect" && item.reflection) {
    return (
      <ReflectionViewer
        item={item}
        isCompleted={isCompleted}
        onComplete={onCompleteWithState}
        variant={variant}
      />
    );
  }

  // ── Watch tasks (default) — route by content_type ──
  if (item.content_type === "video" && item.source_url) {
    const footerMeta = [
      "Watch",
      item.creator_name ?? "Video",
      formatDuration(item.duration_seconds),
    ]
      .filter(Boolean)
      .join(" · ");

    if (variant === "missionPage") {
      return (
        <div className="space-y-4">
          {item.connective_text ? (
            <p className="text-sm leading-6 text-[var(--sg-shell-600)]">
              {item.connective_text}
            </p>
          ) : null}
          <div className="overflow-hidden rounded-[var(--sg-radius-lg)] border border-[var(--sg-shell-border)] bg-[var(--sg-white)]">
            <LearnVideoPlayer
              sourceUrl={item.source_url}
              title={item.title}
              onComplete={onComplete}
              isCompleted={isCompleted}
              immersive
              immersiveLayout="aspect"
              onPlayStateChange={onPlayStateChange}
              togglePlayRef={togglePlayRef}
              clipStartSeconds={item.clip_start_seconds}
              clipEndSeconds={item.clip_end_seconds}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs leading-5 text-[var(--sg-shell-500)]">
              {footerMeta}
            </p>
            <Button
              variant="cta"
              size="sm"
              onClick={onComplete}
              disabled={isCompleted}
            >
              {isCompleted ? "Completed" : "I got the idea"}
            </Button>
          </div>
        </div>
      );
    }

    if (variant === "roomOverlay") {
      return (
        <div className="h-full w-full">
          <LearnVideoPlayer
            sourceUrl={item.source_url}
            title={item.title}
            onComplete={onComplete}
            isCompleted={isCompleted}
            immersive
            immersiveLayout="fill"
            footer={
              <RoomStageFooter
                meta={footerMeta}
                primaryAction={
                  <Button
                    variant="cta"
                    size="sm"
                    leftIcon={<CheckCircle size={14} />}
                    onClick={onComplete}
                    disabled={isCompleted}
                  >
                    {isCompleted ? "Completed" : "Mark Complete"}
                  </Button>
                }
              />
            }
            onPlayStateChange={onPlayStateChange}
            togglePlayRef={togglePlayRef}
            clipStartSeconds={item.clip_start_seconds}
            clipEndSeconds={item.clip_end_seconds}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full p-4">
        <LearnVideoPlayer
          sourceUrl={item.source_url}
          title={item.title}
          onComplete={onComplete}
          isCompleted={isCompleted}
          onPlayStateChange={onPlayStateChange}
          togglePlayRef={togglePlayRef}
          clipStartSeconds={item.clip_start_seconds}
          clipEndSeconds={item.clip_end_seconds}
        />
      </div>
    );
  }

  // Article fallback
  return (
    <ArticleViewer
      title={item.title}
      creatorName={item.creator_name ?? "Unknown"}
      description={null}
      sourceUrl={item.source_url ?? ""}
      wordCount={item.duration_seconds ? Math.round(item.duration_seconds / 60 * 200) : null}
      publishedAt={null}
      onComplete={onComplete}
      isCompleted={isCompleted}
      variant={isImmersiveStage ? variant : "default"}
      contextText={item.connective_text}
    />
  );
}
