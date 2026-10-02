import {
  getLaunchMissionContent,
  getLaunchMissionLaneKey,
} from "@/lib/launchMissionContent";
import { isItemSatisfied } from "@/lib/learn/pathCompletion";
import type {
  CurriculumModule,
  LearningPath,
  LearningProgress,
  PathItem,
} from "@/lib/types";
import { TAUGHT_HERO_WATCH } from "./watch";
import {
  TAUGHT_HERO_ITEM_IDS,
  TAUGHT_HERO_LANE_KEY,
  TAUGHT_HERO_VERSION,
} from "./types";

function blankMediaFields(): Pick<
  PathItem,
  | "content_id"
  | "content_type"
  | "creator_name"
  | "source_url"
  | "thumbnail_url"
  | "quality_score"
  | "clip_start_seconds"
  | "clip_end_seconds"
  | "mission"
  | "check"
  | "reflection"
> {
  return {
    content_id: null,
    content_type: null,
    creator_name: null,
    source_url: null,
    thumbnail_url: null,
    quality_score: null,
    clip_start_seconds: null,
    clip_end_seconds: null,
    mission: null,
    check: null,
    reflection: null,
  };
}

/**
 * True when this path is the public hero unit we teach in-product.
 */
export function isTaughtHeroPath(path: LearningPath): boolean {
  return getLaunchMissionLaneKey(path) === TAUGHT_HERO_LANE_KEY;
}

/**
 * Builds the Watch → Do → Check → Reflect items for the hero unit.
 */
export function buildTaughtHeroItems(): PathItem[] {
  const watch: PathItem = {
    ...blankMediaFields(),
    item_id: TAUGHT_HERO_ITEM_IDS.watch,
    task_type: "watch",
    position: 0,
    module_index: 0,
    title: "Watch why a vague ask comes back generic",
    connective_text: "",
    duration_seconds: TAUGHT_HERO_WATCH.durationSeconds,
    content_id: TAUGHT_HERO_WATCH.contentId,
    content_type: "video",
    creator_name: TAUGHT_HERO_WATCH.creatorName,
    source_url: TAUGHT_HERO_WATCH.sourceUrl,
    quality_score: TAUGHT_HERO_WATCH.qualityScore,
  };

  const workshop: PathItem = {
    ...blankMediaFields(),
    item_id: TAUGHT_HERO_ITEM_IDS.do,
    task_type: "do",
    position: 1,
    module_index: 0,
    title: "See a weak brief, then pick a better ask",
    connective_text: "",
    duration_seconds: 900,
    workshop: {
      kind: "content_brief_prompt_upgrade",
      version: TAUGHT_HERO_VERSION,
    },
  };

  const review: PathItem = {
    ...blankMediaFields(),
    item_id: TAUGHT_HERO_ITEM_IDS.check,
    task_type: "check",
    position: 2,
    module_index: 0,
    title: "Would you use this next time?",
    connective_text: "",
    duration_seconds: 180,
    workshop: {
      kind: "content_brief_prompt_upgrade_review",
      version: TAUGHT_HERO_VERSION,
    },
    check: {
      question: "Does this brief have a workflow, two structures, two failure modes, and one change?",
      options: null,
      correct_answer: "The four required parts are present.",
      hint: "Go back and fill any empty part.",
    },
  };

  const reflect: PathItem = {
    ...blankMediaFields(),
    item_id: TAUGHT_HERO_ITEM_IDS.reflect,
    task_type: "reflect",
    position: 3,
    module_index: 0,
    title: "Name the next brief you'll use this on",
    connective_text: "",
    duration_seconds: 180,
    workshop: {
      kind: "next_brief_use",
      version: TAUGHT_HERO_VERSION,
    },
    reflection: {
      prompt: "Which real brief will you use this method on next?",
      min_length: 8,
    },
  };

  return [watch, workshop, review, reflect];
}

function buildTaughtHeroModules(items: PathItem[]): CurriculumModule[] {
  return [
    {
      index: 0,
      title: "Write a better brief for ChatGPT",
      description:
        "See a weak ask, pick a better one, and leave with a method for the next brief you draft.",
      task_count: items.length,
      duration_seconds: items.reduce((sum, item) => sum + item.duration_seconds, 0),
    },
  ];
}

/**
 * Replaces the projected one-step copy-prompt path with the taught unit.
 */
export function applyTaughtHeroUnit(path: LearningPath): LearningPath {
  if (!isTaughtHeroPath(path)) return path;

  const items = buildTaughtHeroItems();
  const launchContent = getLaunchMissionContent(path);

  return {
    ...path,
    title: launchContent?.playerTitle ?? path.title,
    description: launchContent?.missionPromise ?? path.description,
    items,
    modules: buildTaughtHeroModules(items),
    estimated_duration_seconds: items.reduce(
      (sum, item) => sum + item.duration_seconds,
      0,
    ),
    goal: launchContent?.missionPromise ?? path.goal,
    primary_tools: path.primary_tools ?? ["claude", "chatgpt"],
  };
}

/**
 * True when stored completion is from the old one-step projection.
 */
export function isStaleTaughtHeroProgress(
  path: LearningPath,
  progress: LearningProgress | null,
): boolean {
  if (!progress || !isTaughtHeroPath(path)) return false;

  const taughtSatisfied = path.items.filter((item) =>
    isItemSatisfied(progress.item_states[item.item_id]),
  ).length;

  if (progress.status === "completed" && taughtSatisfied < path.items.length) {
    return true;
  }

  return false;
}

/**
 * Presents stale hero completion as an open unit so the founder can do the work.
 */
export function reconcileTaughtHeroProgress(
  path: LearningPath,
  progress: LearningProgress | null,
): LearningProgress | null {
  if (!progress || !isTaughtHeroPath(path)) return progress;

  const taughtIds = path.items.map((item) => item.item_id);
  const itemsCompleted = taughtIds.filter((id) =>
    isItemSatisfied(progress.item_states[id]),
  ).length;
  const firstOpen = path.items.findIndex(
    (item) => !isItemSatisfied(progress.item_states[item.item_id]),
  );
  const stale = isStaleTaughtHeroProgress(path, progress);

  return {
    ...progress,
    items_total: path.items.length,
    items_completed: itemsCompleted,
    current_item_index: stale
      ? Math.max(firstOpen, 0)
      : Math.min(progress.current_item_index, path.items.length - 1),
    status: stale ? "in_progress" : progress.status,
    completed_at: stale ? null : progress.completed_at,
  };
}
