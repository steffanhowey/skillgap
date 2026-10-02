export type WeekMissionState =
  | "start"
  | "continue"
  | "in_review"
  | "path_done"
  | "no_path";

export type PathRowState = "done" | "this_week" | "up_next" | "paid";

export interface WeekItem {
  itemId: string;
  taskType: string;
  moduleIndex: number;
  tool: string | null;
}

export interface WeekModule {
  index: number;
  title: string;
  practices: string | null;
}

export interface WeekPath {
  id: string;
  title: string;
  reviewStatus: string | null;
  status: string | null;
  modules: WeekModule[];
  items: WeekItem[];
}

export interface WeekProgress {
  itemStates: Record<string, { completed?: boolean; skipped?: boolean }>;
  currentItemIndex: number;
}

export interface ThisWeekInput {
  path: WeekPath | null;
  progress: WeekProgress | null;
  /** Module indexes that already have a practice record on this path. */
  completedModuleIndexes: number[];
  /** ISO timestamps keyed by module index. */
  completedAtByModule: Record<number, string>;
  plan: "free" | "individual" | "founding" | "team";
}

export interface PathMissionRow {
  moduleIndex: number;
  number: number;
  title: string;
  rowState: PathRowState;
  completedAt: string | null;
}

export interface ThisWeekMission {
  state: WeekMissionState;
  doLocked: boolean;
  pathId: string | null;
  pathTitle: string | null;
  missionNumber: number | null;
  missionCount: number;
  doneCount: number;
  moduleIndex: number | null;
  missionTitle: string | null;
  practices: string | null;
  tool: string | null;
  stepsLabel: string;
  stoppedAt: string | null;
  missions: PathMissionRow[];
}

const STEP_LABEL: Record<string, string> = {
  watch: "Watch",
  do: "Do",
  check: "Check",
  reflect: "Reflect",
};

const EMPTY: ThisWeekMission = {
  state: "no_path",
  doLocked: false,
  pathId: null,
  pathTitle: null,
  missionNumber: null,
  missionCount: 0,
  doneCount: 0,
  moduleIndex: null,
  missionTitle: null,
  practices: null,
  tool: null,
  stepsLabel: "Watch, Do, Check, Reflect",
  stoppedAt: null,
  missions: [],
};

/**
 * Picks the one mission for the home card and the state of every mission on that path.
 * `doLocked` follows the same free-plan rule as `canDoMission`: the first module
 * whose Do step was reached stays open, and a later module's Do step does not.
 */
export function thisWeekMission(input: ThisWeekInput): ThisWeekMission {
  const path = input.path;
  if (!path) return EMPTY;

  const modules = [...path.modules].sort((a, b) => a.index - b.index);
  const completed = new Set(input.completedModuleIndexes);
  const progress = input.progress;

  if (path.reviewStatus === "pending" || path.status === "draft") {
    return {
      ...EMPTY,
      state: "in_review",
      pathId: path.id,
      pathTitle: path.title,
      missionCount: modules.length,
      missions: modules.map((module, index) => ({
        moduleIndex: module.index,
        number: index + 1,
        title: module.title,
        rowState: "up_next",
        completedAt: null,
      })),
    };
  }

  if (modules.length === 0) return EMPTY;

  const doneCount = modules.filter((module) => completed.has(module.index)).length;
  if (doneCount === modules.length) {
    return {
      ...EMPTY,
      state: "path_done",
      pathId: path.id,
      pathTitle: path.title,
      missionCount: modules.length,
      doneCount,
      missions: modules.map((module, index) => ({
        moduleIndex: module.index,
        number: index + 1,
        title: module.title,
        rowState: "done",
        completedAt: input.completedAtByModule[module.index] ?? null,
      })),
    };
  }

  const current = modules.find((module) => !completed.has(module.index)) ?? modules[0];
  const missionNumber = modules.findIndex((module) => module.index === current.index) + 1;
  const touched = moduleIsTouched(path.items, current.index, progress?.itemStates ?? {});
  const stoppedAt = touched
    ? firstOpenStep(path.items, current.index, progress?.itemStates ?? {})
    : null;
  const doLocked = isDoLocked(
    input.plan,
    path.items,
    progress?.itemStates ?? {},
    progress?.currentItemIndex ?? null,
    current.index,
  );

  return {
    state: touched ? "continue" : "start",
    doLocked,
    pathId: path.id,
    pathTitle: path.title,
    missionNumber,
    missionCount: modules.length,
    doneCount,
    moduleIndex: current.index,
    missionTitle: current.title,
    practices: current.practices,
    tool: toolName(path.items, current.index),
    stepsLabel: stepsLabel(path.items, current.index),
    stoppedAt,
    missions: modules.map((module, index) => ({
      moduleIndex: module.index,
      number: index + 1,
      title: module.title,
      completedAt: input.completedAtByModule[module.index] ?? null,
      rowState: rowState(
        module.index,
        current.index,
        completed.has(module.index),
        isDoLocked(
          input.plan,
          path.items,
          progress?.itemStates ?? {},
          progress?.currentItemIndex ?? null,
          module.index,
        ),
      ),
    })),
  };
}

function rowState(
  moduleIndex: number,
  currentIndex: number,
  done: boolean,
  locked: boolean,
): PathRowState {
  if (done) return "done";
  if (locked) return "paid";
  if (moduleIndex === currentIndex) return "this_week";
  return "up_next";
}

function moduleIsTouched(
  items: WeekItem[],
  moduleIndex: number,
  itemStates: WeekProgress["itemStates"],
): boolean {
  return items.some(
    (item) =>
      item.moduleIndex === moduleIndex && itemStates[item.itemId]?.completed === true,
  );
}

function firstOpenStep(
  items: WeekItem[],
  moduleIndex: number,
  itemStates: WeekProgress["itemStates"],
): string | null {
  const steps = items.filter((item) => item.moduleIndex === moduleIndex);
  const open = steps.find((item) => itemStates[item.itemId]?.completed !== true);
  const chosen = open ?? steps[steps.length - 1];
  if (!chosen) return null;
  return STEP_LABEL[chosen.taskType] ?? null;
}

function stepsLabel(items: WeekItem[], moduleIndex: number): string {
  const labels = items
    .filter((item) => item.moduleIndex === moduleIndex)
    .map((item) => STEP_LABEL[item.taskType])
    .filter((label): label is string => Boolean(label));
  const unique = [...new Set(labels)];
  if (unique.length === 0) return "Watch, Do, Check, Reflect";
  return unique.join(", ");
}

function toolName(items: WeekItem[], moduleIndex: number): string | null {
  const match = items.find(
    (item) => item.moduleIndex === moduleIndex && item.taskType === "do" && item.tool,
  );
  return match?.tool ?? null;
}

function isDoLocked(
  plan: ThisWeekInput["plan"],
  items: WeekItem[],
  itemStates: WeekProgress["itemStates"],
  currentIndex: number | null,
  moduleIndex: number,
): boolean {
  if (plan !== "free") return false;
  const claimed = claimedDoModule(items, itemStates, currentIndex);
  if (claimed == null) return false;
  return claimed !== moduleIndex;
}

function claimedDoModule(
  items: WeekItem[],
  itemStates: WeekProgress["itemStates"],
  currentIndex: number | null,
): number | null {
  const started = items.find((item) => {
    if (item.taskType !== "do" || !item.itemId) return false;
    const state = itemStates[item.itemId];
    return !!state && state.skipped !== true;
  });
  if (started) return started.moduleIndex;
  if (currentIndex != null && items[currentIndex]?.taskType === "do") {
    return items[currentIndex].moduleIndex;
  }
  return null;
}
