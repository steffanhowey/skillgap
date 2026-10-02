export { LAUNCH_MESSAGING_ROUTE } from "@/lib/appRoutes";

export const LAUNCH_MESSAGING_DISCLOSURE_VERSION =
  "launch_messaging_disclosure_2026_08_28_v1";

export const LAUNCH_MESSAGING_DISCLOSURE =
  "SkillGap sends your supplied text to OpenAI for review. SkillGap checks claims against the proof and context you confirm — not independent fact verification, stakeholder approval, or market performance.";

export const LAUNCH_MESSAGING_ALLOWED_COPY =
  "AI-reviewed against the proof you supplied.";

export const WEDGE_ATTEMPT_IDEMPOTENCY_KEY =
  "pmm-b2b-saas-evidence-backed-launch-v1";

export type WedgePlayerStep =
  | "context"
  | "matrix"
  | "review"
  | "diff"
  | "export";

export const WEDGE_PLAYER_STEPS: readonly WedgePlayerStep[] = [
  "context",
  "matrix",
  "review",
  "diff",
  "export",
] as const;

export const WEDGE_STEP_KIND: Record<WedgePlayerStep, string> = {
  context: "Confirm",
  matrix: "Build",
  review: "Review",
  diff: "Revise",
  export: "Export",
};

export const WEDGE_STEP_COACHING: Record<WedgePlayerStep, string> = {
  context:
    "Confirm the launch context and label every proof as an approved fact or a hypothesis.",
  matrix: "Write three distinct message rows and the channel draft you will send.",
  review:
    "Run a server-owned pressure test. The model cannot override a blocking proof failure.",
  diff: "Accept or reject each suggested change. Nothing changes unless you choose it.",
  export: "Export the context, matrix, and claim ledger for your review.",
};
