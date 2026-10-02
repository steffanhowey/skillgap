export const TAUGHT_HERO_VERSION = "taught-hero-v1";
export const TAUGHT_HERO_LANE_KEY = "prompt-engineering:research-insight";

export const TAUGHT_HERO_ITEM_IDS = {
  watch: `${TAUGHT_HERO_VERSION}-watch`,
  do: `${TAUGHT_HERO_VERSION}-do`,
  check: `${TAUGHT_HERO_VERSION}-check`,
  reflect: `${TAUGHT_HERO_VERSION}-reflect`,
} as const;

export interface ContentBriefPromptUpgrade {
  version: typeof TAUGHT_HERO_VERSION;
  workflowBottleneck: string;
  promptStructures: [string, string];
  failureModes: [string, string];
  recommendedChange: string;
}

export interface TaughtBriefCheckResult {
  key: keyof Pick<
    ContentBriefPromptUpgrade,
    | "workflowBottleneck"
    | "promptStructures"
    | "failureModes"
    | "recommendedChange"
  >;
  label: string;
  passed: boolean;
}

export interface TaughtBriefEvaluation {
  ok: boolean;
  results: TaughtBriefCheckResult[];
  feedback: string;
}
