import type { CurriculumModule, PathItem } from "@/lib/types/learning";
import {
  FOCUS_OPTIONS,
  FUNCTION_OPTIONS,
  type FocusArea,
  type ProfessionalFunction,
} from "@/lib/onboarding/types";

export interface FirstMissionSummary {
  pathId: string;
  pathTitle: string;
  missionTitle: string;
  estimatedMinutes: number;
}

export interface FirstPathAssignment {
  state: "role" | "preparing" | "generated";
  path: FirstMissionSummary | null;
  interim: FirstMissionSummary | null;
}

interface PathShape {
  id: string;
  title: string;
  items?: PathItem[] | null;
  modules?: CurriculumModule[] | null;
  estimated_duration_seconds?: number | null;
}

/**
 * Title and minutes for the first module of a path.
 */
export function firstMissionSummary(path: PathShape): FirstMissionSummary {
  const modules = path.modules ?? [];
  const items = path.items ?? [];
  const firstModule = modules[0];
  const moduleItems = items.filter((item) => (item.module_index ?? 0) === 0);
  const fromItems = moduleItems.reduce(
    (sum, item) => sum + (item.duration_seconds ?? 0),
    0,
  );
  const seconds =
    firstModule?.duration_seconds ??
    (fromItems > 0 ? fromItems : path.estimated_duration_seconds ?? 0);

  return {
    pathId: path.id,
    pathTitle: path.title,
    missionTitle: firstModule?.title || moduleItems[0]?.title || path.title,
    estimatedMinutes: Math.max(1, Math.round(seconds / 60)),
  };
}

/**
 * Keep module 0 so a free plan gets one mission, not the rest of the curriculum.
 */
export function keepFirstModule(
  items: PathItem[],
  modules: CurriculumModule[],
): { items: PathItem[]; modules: CurriculumModule[]; seconds: number } {
  const keptItems = items.filter((item) => (item.module_index ?? 0) === 0);
  const keptModules = modules.slice(0, 1);
  const seconds =
    keptModules[0]?.duration_seconds ??
    keptItems.reduce((sum, item) => sum + (item.duration_seconds ?? 0), 0);
  return { items: keptItems, modules: keptModules, seconds };
}

/**
 * Curriculum query from the three onboarding answers. No model call.
 */
export function onboardingCurriculumQuery(
  userFunction: ProfessionalFunction | null,
  focusAreas: FocusArea[],
): string {
  const role =
    FUNCTION_OPTIONS.find((option) => option.value === userFunction)?.label ??
    "professional";
  const focus = focusAreas
    .map((area) => FOCUS_OPTIONS.find((option) => option.value === area)?.label)
    .filter((label): label is string => Boolean(label));
  const focusText = focus.length > 0 ? focus.join(", ") : "day-to-day work";
  return `Using AI at work as a ${role}, focused on ${focusText}`;
}
