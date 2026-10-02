import { TAUGHT_HERO_VERSION } from "./types";
import type {
  ContentBriefPromptUpgrade,
  TaughtBriefCheckResult,
  TaughtBriefEvaluation,
} from "./types";

const MIN_FIELD_CHARS = 12;

/**
 * Empty in-product brief for the hero workshop.
 */
export function createEmptyContentBrief(): ContentBriefPromptUpgrade {
  return {
    version: TAUGHT_HERO_VERSION,
    workflowBottleneck: "",
    promptStructures: ["", ""],
    failureModes: ["", ""],
    recommendedChange: "",
  };
}

function isFilled(value: string): boolean {
  return value.trim().length >= MIN_FIELD_CHARS;
}

/**
 * Parse a saved workshop submission. Returns null when the payload is not a brief.
 */
export function parseContentBrief(value: unknown): ContentBriefPromptUpgrade | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.version !== TAUGHT_HERO_VERSION) return null;
  if (typeof record.workflowBottleneck !== "string") return null;
  if (typeof record.recommendedChange !== "string") return null;
  if (!Array.isArray(record.promptStructures) || record.promptStructures.length < 2) {
    return null;
  }
  if (!Array.isArray(record.failureModes) || record.failureModes.length < 2) {
    return null;
  }
  if (
    typeof record.promptStructures[0] !== "string" ||
    typeof record.promptStructures[1] !== "string"
  ) {
    return null;
  }
  if (
    typeof record.failureModes[0] !== "string" ||
    typeof record.failureModes[1] !== "string"
  ) {
    return null;
  }

  return {
    version: TAUGHT_HERO_VERSION,
    workflowBottleneck: record.workflowBottleneck,
    promptStructures: [record.promptStructures[0], record.promptStructures[1]],
    failureModes: [record.failureModes[0], record.failureModes[1]],
    recommendedChange: record.recommendedChange,
  };
}

/**
 * Deterministic check that the brief has the four required parts.
 */
export function evaluateContentBrief(
  brief: ContentBriefPromptUpgrade,
): TaughtBriefEvaluation {
  const results: TaughtBriefCheckResult[] = [
    {
      key: "workflowBottleneck",
      label: "Names one workflow and the bottleneck it creates",
      passed: isFilled(brief.workflowBottleneck),
    },
    {
      key: "promptStructures",
      label: "Includes two reusable prompt structures",
      passed:
        isFilled(brief.promptStructures[0]) && isFilled(brief.promptStructures[1]),
    },
    {
      key: "failureModes",
      label: "Calls out two concrete failure modes",
      passed: isFilled(brief.failureModes[0]) && isFilled(brief.failureModes[1]),
    },
    {
      key: "recommendedChange",
      label: "Ends with one recommended workflow change",
      passed: isFilled(brief.recommendedChange),
    },
  ];

  const ok = results.every((result) => result.passed);
  return {
    ok,
    results,
    feedback: ok
      ? "The brief has the four parts another marketer would need to use it."
      : "Finish every part before this brief can leave with you.",
  };
}

/**
 * Scoped helper prompt for one field. Never asks ChatGPT to complete the mission.
 */
export function buildFieldHelperPrompt(
  field: TaughtBriefCheckResult["key"],
  currentValue: string,
): string {
  const starters: Record<TaughtBriefCheckResult["key"], string> = {
    workflowBottleneck:
      "I draft content briefs with AI. Help me name one recurring workflow and the specific bottleneck it creates. Two sentences. Do not write a full brief.",
    promptStructures:
      "I need one reusable prompt structure for AI-assisted content-brief drafting. Give a named pattern and a 4-line template I can paste. Do not write the finished brief.",
    failureModes:
      "When marketers use AI to draft content briefs, what is one concrete failure mode that weakens reliability or specificity? Two sentences. Do not write a full brief.",
    recommendedChange:
      "Given a content-brief drafting workflow, suggest one workflow change I should make the next time I draft with AI. Two sentences. Do not write a full brief.",
  };

  const starter = starters[field];
  const trimmed = currentValue.trim();
  if (!trimmed) return starter;
  return `${starter}\n\nHere is what I have so far:\n${trimmed}`;
}
