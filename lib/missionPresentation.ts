import type {
  ItemState,
  LearningPath,
  LearningProgress,
  MissionBriefing,
  PathItem,
} from "@/lib/types";
import { getLaunchMissionContent } from "@/lib/launchMissionContent";
import { getMissionLaunchDomain } from "@/lib/launchTaxonomy";

export type MissionUiState = "ready" | "saved" | "active" | "completed";

function getItemKey(item: PathItem, index: number): string {
  return item.item_id ?? item.content_id ?? `idx-${index}`;
}

function formatTopicLabel(topic: string): string {
  return topic
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Returns the user's current item in a mission, falling back to the first item.
 */
export function getMissionCurrentItem(
  path: LearningPath,
  progress?: LearningProgress | null,
): PathItem | null {
  if (path.items.length === 0) return null;
  const currentIndex = progress?.current_item_index ?? 0;
  return path.items[currentIndex] ?? path.items[0] ?? null;
}

/**
 * Returns the primary work item for a mission, preferring the next incomplete
 * do step and falling back to the first available mission item.
 */
export function getMissionWorkItem(
  path: LearningPath,
  itemStates?: Record<string, ItemState> | null,
): PathItem | null {
  const nextOpenMission = path.items.find((item, index) => {
    if (item.task_type !== "do" || !item.mission) return false;
    return !(itemStates?.[getItemKey(item, index)]?.completed ?? false);
  });

  const firstMission =
    path.items.find((item) => item.task_type === "do" && item.mission) ?? null;

  return nextOpenMission ?? firstMission ?? path.items[0] ?? null;
}

/**
 * Returns the most relevant mission briefing for a path.
 */
export function getMissionBriefing(
  path: LearningPath,
  progress?: LearningProgress | null,
): MissionBriefing | null {
  const workItem = getMissionWorkItem(path, progress?.item_states);
  return workItem?.mission ?? null;
}

/**
 * Returns the most relevant skill or topic labels to show on mission surfaces.
 */
export function getMissionPrimaryArea(
  path: LearningPath,
): { label: string; detail: string | null } {
  const launchDomain = getMissionLaunchDomain(path);
  const primarySkill =
    path.skill_tags?.find((tag) => tag.relevance === "primary") ??
    path.skill_tags?.[0] ??
    null;

  if (primarySkill) {
    return {
      label: primarySkill.skill_name,
      detail: launchDomain.label,
    };
  }

  return {
    label: path.topics[0] ? formatTopicLabel(path.topics[0]) : "AI Mission",
    detail: launchDomain.label,
  };
}

/**
 * Formats a duration into a compact effort label for mission surfaces.
 */
export function formatMissionDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `~${Math.max(minutes, 1)}m`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `~${hours}h ${remainder}m` : `~${hours}h`;
}

/**
 * Returns a compact summary of effort and rep count for a mission.
 */
export function getMissionRepSummary(path: LearningPath): string {
  const repCount = path.items.filter((item) => item.task_type === "do").length;
  const effort = formatMissionDuration(path.estimated_duration_seconds);

  if (repCount === 0) return effort;
  if (repCount === 1) return `${effort} · 1 step`;
  return `${effort} · ${repCount} steps`;
}

/**
 * Returns the mission state for UI surfaces based on progress and saved state.
 */
export function getMissionUiState(
  progress?: LearningProgress | null,
  isSaved = false,
): MissionUiState {
  if (progress?.status === "completed") return "completed";
  if (progress?.status === "in_progress" || (progress?.items_completed ?? 0) > 0) {
    return "active";
  }
  if (isSaved) return "saved";
  return "ready";
}

/**
 * Returns a short state label for mission badges.
 */
export function getMissionStateLabel(
  progress?: LearningProgress | null,
  isSaved = false,
): string {
  const state = getMissionUiState(progress, isSaved);

  switch (state) {
    case "completed":
      return "Completed";
    case "active":
      return "Active";
    case "saved":
      return "Saved";
    case "ready":
    default:
      return "Ready";
  }
}

/**
 * Returns a compact progress summary for active missions.
 */
export function getMissionProgressSummary(
  progress?: LearningProgress | null,
): string {
  if (!progress) return "Ready to start";

  if (progress.status === "completed") {
    return `${progress.items_total}/${progress.items_total} complete`;
  }

  return `${progress.items_completed}/${progress.items_total} complete`;
}

/**
 * Returns a work-oriented framing line for the mission.
 */
export function getMissionFraming(
  path: LearningPath,
  progress?: LearningProgress | null,
): string {
  const launchContent = getLaunchMissionContent(path);
  const mission = getMissionBriefing(path, progress);
  const currentItem = getMissionCurrentItem(path, progress);

  return (
    launchContent?.missionPromise ??
    mission?.objective ??
    path.goal ??
    currentItem?.title ??
    path.description ??
    "A structured mission built around practical work."
  );
}

/**
 * Returns a launch-style why-now line for approved launch missions, falling
 * back to the best available mission context.
 */
export function getMissionWhyNow(
  path: LearningPath,
  progress?: LearningProgress | null,
): string {
  const launchContent = getLaunchMissionContent(path);
  if (launchContent?.whyNow) return launchContent.whyNow;

  const framing = getMissionFraming(path, progress).trim().toLowerCase();
  const mission = getMissionBriefing(path, progress);
  const candidates = [mission?.context, path.description, path.goal];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate.trim().toLowerCase() === framing) continue;
    return candidate;
  }

  return "A focused mission designed to turn AI understanding into finished work.";
}

/**
 * Returns launch-specific scope guardrails when available.
 */
export function getMissionScopeGuardrails(path: LearningPath): string | null {
  return getLaunchMissionContent(path)?.scopeGuardrails ?? null;
}

/**
 * Returns the scenario or context line for the mission.
 */
export function getMissionContext(
  path: LearningPath,
  progress?: LearningProgress | null,
): string {
  const mission = getMissionBriefing(path, progress);

  return (
    mission?.context ??
    path.description ??
    path.goal ??
    "A focused mission designed to turn AI understanding into output."
  );
}

/**
 * Returns the expected output summary for the mission.
 */
export function getMissionExpectedOutput(
  path: LearningPath,
  progress?: LearningProgress | null,
): string {
  const launchContent = getLaunchMissionContent(path);
  const mission = getMissionBriefing(path, progress);

  if (launchContent?.artifactSummary) return launchContent.artifactSummary;
  if (!mission) return "A finished step you can carry into your next mission.";
  if (mission.success_criteria[0]) return mission.success_criteria[0];

  if (mission.submission_type === "screenshot") {
    return "A tangible result you can capture or describe.";
  }

  if (mission.submission_type === "either") {
    return "A clear output you can paste back or capture.";
  }

  return "A written output that shows what you made.";
}

/**
 * Returns the artifact label when launch content is available.
 */
export function getMissionArtifactLabel(path: LearningPath): string | null {
  return getLaunchMissionContent(path)?.artifactLabel ?? null;
}

/**
 * Returns the lesson title when launch content has one.
 */
export function getMissionPlayerTitle(path: LearningPath): string {
  return getLaunchMissionContent(path)?.playerTitle ?? path.title;
}

/**
 * Returns one coaching line for the current solo step.
 */
export function getMissionStepCoaching(
  path: LearningPath,
  item: PathItem | null,
): string {
  if (!item) return "Start the first step.";

  const launchContent = getLaunchMissionContent(path);
  if (launchContent) {
    if (item.task_type === "watch") return launchContent.watchCoaching;
    if (item.task_type === "do") return launchContent.doCoaching;
    if (item.task_type === "check") return launchContent.checkCoaching;
    if (item.task_type === "reflect") return launchContent.reflectCoaching;
  }

  if (item.task_type === "do" && item.mission) {
    return item.mission.objective;
  }
  if (item.task_type === "watch") {
    return "Watch for the one idea you will use in the next step.";
  }
  if (item.task_type === "check") {
    return "Check the work against what done looks like.";
  }
  if (item.task_type === "reflect") {
    return "Capture the takeaway you will use next time.";
  }

  return item.title;
}

/**
 * Returns the next step in clear mission language.
 */
export function getMissionNextAction(
  path: LearningPath,
  progress?: LearningProgress | null,
): string {
  if (progress?.status === "completed") {
    return "Review your outcome and decide what to work on next.";
  }

  return getMissionStepCoaching(path, getMissionCurrentItem(path, progress));
}

/**
 * Room is a footnote after the first saved step, never a peer start CTA.
 */
export function getMissionRoomCtaMode(
  state: MissionUiState,
  itemsCompleted = 0,
): "hidden" | "footnote" {
  return state === "active" && itemsCompleted > 0 ? "footnote" : "hidden";
}

/**
 * Returns a short step-kind label for the solo player chrome.
 */
export function getMissionStepKindLabel(item: PathItem | null): string {
  if (!item) return "Step";
  if (item.task_type === "do") return "Build";
  if (item.task_type === "check") return "Check";
  if (item.task_type === "reflect") return "Reflect";
  return item.content_type === "video" ? "Watch" : "Read";
}

/**
 * Returns a short list of checkpoints for the current mission.
 */
export function getMissionCheckpoints(
  path: LearningPath,
  progress?: LearningProgress | null,
): string[] {
  const mission = getMissionBriefing(path, progress);

  if (mission?.steps.length) return mission.steps;

  if (path.modules?.length) {
    return path.modules.map((module) => module.title);
  }

  return path.items.slice(0, 4).map((item) => item.title);
}

/**
 * Returns a short preview of what good completion looks like.
 */
export function getMissionSuccessPreview(
  path: LearningPath,
  progress?: LearningProgress | null,
): string[] {
  const launchContent = getLaunchMissionContent(path);
  const mission = getMissionBriefing(path, progress);

  if (launchContent?.artifactChecklist.length) {
    return launchContent.artifactChecklist;
  }

  if (mission?.success_criteria.length) {
    return mission.success_criteria;
  }

  return [getMissionExpectedOutput(path, progress)];
}

/**
 * Returns launch-specific completion language when available.
 */
export function getMissionCompletionStandard(path: LearningPath): string | null {
  return getLaunchMissionContent(path)?.completionStandard ?? null;
}

/**
 * Returns launch-specific post-mission reuse guidance when available.
 */
export function getMissionUseItNext(path: LearningPath): string | null {
  return getLaunchMissionContent(path)?.useItNext ?? null;
}

/**
 * Returns launch-specific transition copy when available.
 */
export function getMissionNextBridge(path: LearningPath): string | null {
  return getLaunchMissionContent(path)?.nextMissionBridge ?? null;
}

/**
 * Returns a concise launch-aware support line for cards.
 */
export function getMissionCardSupportLine(
  path: LearningPath,
  progress?: LearningProgress | null,
): string {
  const launchContent = getLaunchMissionContent(path);
  if (launchContent?.cardSupportLine) return launchContent.cardSupportLine;
  return getMissionFraming(path, progress);
}

/**
 * Returns a mission-to-room hint without assuming a specific room.
 */
export function getMissionRoomHint(
  progress?: LearningProgress | null,
): string {
  if (progress && progress.status === "in_progress") {
    return "Bring this into a room for a live sprint when you want shared momentum.";
  }

  return "Works well in a room when you want structure plus other people in motion.";
}

/**
 * Returns a compact mission structure summary for detail and card surfaces.
 */
export function getMissionStructureSummary(path: LearningPath): string {
  const partCount = path.modules?.length ?? path.items.filter((item) => item.task_type === "do").length;
  const partLabel = partCount > 0 ? `${partCount} parts` : null;
  const stepLabel = `${path.items.length} steps`;

  return [partLabel, stepLabel].filter(Boolean).join(" · ");
}
