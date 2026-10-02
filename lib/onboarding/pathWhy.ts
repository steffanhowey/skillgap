import {
  FOCUS_OPTIONS,
  FUNCTION_OPTIONS,
  type FocusArea,
  type FluencyLevel,
  type ProfessionalFunction,
} from "@/lib/onboarding/types";

const FLUENCY_LINE: Record<FluencyLevel, string> = {
  exploring: "from a few tries with ChatGPT",
  practicing: "from the drafts you already use it for",
  proficient: "from the days you already use it",
  advanced: "from the workflows you already run",
};

/**
 * One sentence on why this path fits. Template only, no model call.
 */
export function pathWhy(input: {
  role: ProfessionalFunction | null;
  fluency: FluencyLevel | null;
  focusAreas: FocusArea[];
}): string {
  const role =
    FUNCTION_OPTIONS.find((option) => option.value === input.role)?.label ??
    "your work";
  const fluency = input.fluency
    ? FLUENCY_LINE[input.fluency]
    : "from where you are today";
  const focus = input.focusAreas
    .map((area) => FOCUS_OPTIONS.find((option) => option.value === area)?.label)
    .filter((label): label is string => Boolean(label));
  const focusText = focus.length > 0 ? focus.join(", ") : "the work that fills your week";
  return `This path is for ${role}, ${fluency}, focused on ${focusText}.`;
}
