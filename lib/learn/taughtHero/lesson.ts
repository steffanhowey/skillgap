import { createEmptyContentBrief } from "./artifact";
import type { ContentBriefPromptUpgrade } from "./types";

export type LessonPhase = "see" | "name" | "structure" | "change";

export interface LessonWorkflowOption {
  id: string;
  label: string;
  stall: string;
}

export interface LessonStructureOption {
  id: string;
  name: string;
  why: string;
  template: string;
}

export const WEAK_ASK =
  "Write me a content brief for our product. Make it good. Target marketers.";

export const WEAK_OUTPUT = `Content Brief

Audience: Marketers
Goal: Drive awareness
Key message: Our product helps teams work smarter.
Tone: Professional but friendly
CTA: Learn more

This could be any product. There is no buyer, no offer, and no proof.`;

export const LESSON_FAILURE_MODES: [string, string] = [
  "ChatGPT invents proof you cannot defend in a real review.",
  "The brief could fit any product, so nobody can use it as-is.",
];

export const LESSON_WORKFLOWS: LessonWorkflowOption[] = [
  {
    id: "newsletter",
    label: "Weekly newsletter",
    stall: "Weekly newsletter briefs stall when the ask is “make it good,” so the draft reads like every other issue.",
  },
  {
    id: "launch-post",
    label: "Launch blog post",
    stall: "Launch-post briefs stall when the product dump replaces a buyer and a proof point.",
  },
  {
    id: "customer-story",
    label: "Customer story",
    stall: "Customer-story briefs stall when the prompt never names the outcome the customer actually got.",
  },
  {
    id: "webinar",
    label: "Webinar recap",
    stall: "Webinar-recap briefs stall when the ask is “summarize the session,” so the draft has no point of view.",
  },
];

export const LESSON_STRUCTURES: LessonStructureOption[] = [
  {
    id: "audience-offer-proof",
    name: "Audience · Offer · Proof",
    why: "Forces a buyer, a thing they get, and one fact you can stand behind.",
    template:
      "Draft a content brief for [audience] who are stuck on [problem]. The offer is [offer]. Use only this proof: [proof]. Do not invent customers, metrics, or logos.",
  },
  {
    id: "constraints-first",
    name: "Constraints first",
    why: "Tells the model what it may not do, so it stops filling gaps with fiction.",
    template:
      "Draft a content brief for [this piece]. Audience: [who]. Must include: [one proof]. Must not: slogans, invented metrics, or a generic “work smarter” line. End with one next action.",
  },
];

export interface LessonChoices {
  workflowId: string | null;
  customWorkflow: string;
  structureId: string | null;
  recommendedChange: string;
}

/**
 * Empty lesson choices.
 */
export function createEmptyLessonChoices(): LessonChoices {
  return {
    workflowId: null,
    customWorkflow: "",
    structureId: null,
    recommendedChange: "",
  };
}

/**
 * Resolves the workflow line from a pick or a custom label.
 */
export function resolveWorkflowLine(choices: LessonChoices): string {
  if (choices.workflowId === "other") {
    const custom = choices.customWorkflow.trim();
    if (!custom) return "";
    return `${custom} briefs stall when the ask is vague, so the draft comes back generic.`;
  }

  const picked = LESSON_WORKFLOWS.find((option) => option.id === choices.workflowId);
  return picked?.stall ?? "";
}

/**
 * Builds the saved method from lesson choices. The user never invents the four parts.
 */
export function assembleLessonBrief(choices: LessonChoices): ContentBriefPromptUpgrade {
  const workflowLine = resolveWorkflowLine(choices);
  const picked =
    LESSON_STRUCTURES.find((option) => option.id === choices.structureId) ??
    LESSON_STRUCTURES[0];
  const other =
    LESSON_STRUCTURES.find((option) => option.id !== picked.id) ??
    LESSON_STRUCTURES[1];
  const change = choices.recommendedChange.trim();

  return {
    ...createEmptyContentBrief(),
    workflowBottleneck: workflowLine,
    promptStructures: [picked.template, other.template],
    failureModes: LESSON_FAILURE_MODES,
    recommendedChange: change,
  };
}

/**
 * One-block method a marketer can take into the next draft.
 */
export function formatNextBriefMethod(brief: ContentBriefPromptUpgrade): string {
  return [
    brief.workflowBottleneck,
    "",
    "Better ask:",
    brief.promptStructures[0],
    "",
    "Watch for:",
    `- ${brief.failureModes[0]}`,
    `- ${brief.failureModes[1]}`,
    "",
    brief.recommendedChange,
  ].join("\n");
}

/**
 * Default “next time” line once the job and structure are known.
 */
export function defaultRecommendedChange(choices: LessonChoices): string {
  const workflow =
    choices.workflowId === "other"
      ? choices.customWorkflow.trim() || "this brief"
      : LESSON_WORKFLOWS.find((option) => option.id === choices.workflowId)?.label ??
        "this brief";
  const structure =
    LESSON_STRUCTURES.find((option) => option.id === choices.structureId)?.name ??
    "the better ask";
  return `Next time I draft a ${workflow.toLowerCase()}, I will start with ${structure} instead of “make it good.”`;
}

/**
 * True when the lesson has a usable method.
 */
export function lessonChoicesReady(choices: LessonChoices): boolean {
  const hasWorkflow =
    choices.workflowId === "other"
      ? choices.customWorkflow.trim().length >= 3
      : Boolean(choices.workflowId);
  return (
    hasWorkflow &&
    Boolean(choices.structureId) &&
    choices.recommendedChange.trim().length >= 8
  );
}

/**
 * Recovers lesson picks from a saved brief when possible.
 */
export function choicesFromBrief(brief: ContentBriefPromptUpgrade): LessonChoices {
  const workflow = LESSON_WORKFLOWS.find(
    (option) => option.stall === brief.workflowBottleneck,
  );
  const structure = LESSON_STRUCTURES.find(
    (option) => option.template === brief.promptStructures[0],
  );

  return {
    workflowId: workflow?.id ?? (brief.workflowBottleneck ? "other" : null),
    customWorkflow: workflow ? "" : brief.workflowBottleneck,
    structureId: structure?.id ?? null,
    recommendedChange: brief.recommendedChange,
  };
}
