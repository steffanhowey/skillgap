import {
  getMissionLaunchDomain,
  type LaunchDomainKey,
} from "@/lib/launchTaxonomy";
import type { LearningPath } from "@/lib/types";

export type LaunchMissionTopic =
  | "prompt-engineering"
  | "claude-code"
  | "github-copilot";

export type LaunchMissionLaneKey = `${LaunchMissionTopic}:${LaunchDomainKey}`;

export interface LaunchMissionContent {
  laneKey: LaunchMissionLaneKey;
  /** Short title for the lesson. Falls back to the path title. */
  playerTitle?: string;
  missionPromise: string;
  whyNow: string;
  artifactLabel: string;
  artifactSummary: string;
  scopeGuardrails: string;
  artifactChecklist: string[];
  strongOutputShape: string;
  completionStandard: string;
  useItNext: string;
  nextMissionBridge: string | null;
  cardSupportLine: string;
  watchCoaching: string;
  doCoaching: string;
  checkCoaching: string;
  reflectCoaching: string;
}

export const APPROVED_LAUNCH_TOPICS: LaunchMissionTopic[] = [
  "prompt-engineering",
  "claude-code",
  "github-copilot",
];

const LAUNCH_MISSION_CONTENT: Partial<Record<LaunchMissionLaneKey, LaunchMissionContent>> = {
  "prompt-engineering:research-insight": {
    laneKey: "prompt-engineering:research-insight",
    playerTitle: "Write a better brief for ChatGPT",
    missionPromise:
      "Stop pasting “write me a brief” into ChatGPT. Leave with a method for the next content brief you actually draft.",
    whyNow:
      "Most people already have ChatGPT. The problem is the ask is vague, so the brief comes back generic.",
    artifactLabel: "Next-brief method",
    artifactSummary:
      "A short method you can reuse the next time you draft a content brief with AI.",
    scopeGuardrails:
      "Stay with one real briefing job. This mission fails if it turns into general prompt advice.",
    artifactChecklist: [
      "You recognize the generic brief you usually get back.",
      "You name the content job you actually brief.",
      "You pick a better ask than “make it good.”",
      "You leave with one change for the next draft.",
    ],
    strongOutputShape:
      "A strong result is a method you would paste next time, not a lesson about prompting.",
    completionStandard:
      "Done means you would use this the next time you open ChatGPT to draft a content brief.",
    useItNext:
      "Open ChatGPT the next time you have a real brief and start with this ask instead of “make it good.”",
    nextMissionBridge:
      "You tightened the ask. Next, turn that into a sharper message asset.",
    cardSupportLine:
      "Fix how you brief AI when you draft content.",
    watchCoaching:
      "Watch why a vague ask comes back generic.",
    doCoaching:
      "See a weak brief, name your job, pick a better ask.",
    checkCoaching:
      "Look at the method you just made. Would you use it next time?",
    reflectCoaching:
      "Name the next brief you will use this on.",
  },
  "prompt-engineering:positioning-messaging": {
    laneKey: "prompt-engineering:positioning-messaging",
    missionPromise:
      "Build a message matrix that turns stronger prompt structure into sharper AI-assisted messaging.",
    whyNow:
      "Marketers do not need more AI copy. They need output that sounds specific, strategic, and usable.",
    artifactLabel: "Prompt-Ready Message Matrix",
    artifactSummary:
      "A reusable matrix for one audience and one messaging scenario with a core message, proof points, framing guidance, and example variations.",
    scopeGuardrails:
      "Stay with one audience and one messaging scenario. This mission fails if it turns into a brainstorm or generic copywriting advice.",
    artifactChecklist: [
      "Define one audience and one clear messaging scenario.",
      "Include one core message, supporting proof points, and framing or tone guidance.",
      "Add at least two message variations a marketer could adapt immediately.",
      "Make the matrix usable in the next campaign or content draft without rewriting the strategy.",
    ],
    strongOutputShape:
      "A strong matrix feels specific enough to use in real work, not like a list of slogan ideas.",
    completionStandard:
      "Done means you could open the matrix in your next draft session and use it to guide AI-assisted writing immediately.",
    useItNext:
      "Use this matrix in your next campaign or content draft to tighten how AI frames the message.",
    nextMissionBridge:
      "You improved the output. Next, see where AI changes the workflow itself.",
    cardSupportLine:
      "Make a message matrix that sharpens AI-assisted writing.",
    watchCoaching:
      "Watch for one audience, one scenario, and proof you can put in a matrix.",
    doCoaching:
      "Open the tool and make the Prompt-Ready Message Matrix for one audience.",
    checkCoaching:
      "Check that the matrix has one core message and two usable variations.",
    reflectCoaching:
      "Write how you will use this matrix in the next draft session.",
  },
  "claude-code:research-insight": {
    laneKey: "claude-code:research-insight",
    missionPromise:
      "Find one marketing workflow where Claude Code is worth testing and where it is not.",
    whyNow:
      "AI leverage is moving from one-off outputs to workflow design. The question is no longer just what AI can write, but where it can create structured leverage.",
    artifactLabel: "Claude Code Workflow Opportunity Brief",
    artifactSummary:
      "A workflow opportunity brief that defines one marketing workflow, the current friction, where Claude Code fits, where it does not, and the first experiment worth testing.",
    scopeGuardrails:
      "This is not a developer tutorial. Pick one workflow and make one adoption recommendation.",
    artifactChecklist: [
      "Name one marketing workflow and the friction inside it.",
      "Explain where Claude Code fits and one place it does not.",
      "Describe the expected value in marketer terms, not tool-tour language.",
      "End with one clear first experiment or recommendation: test, wait, or skip.",
    ],
    strongOutputShape:
      "A strong brief reads like a go / test / wait decision for one workflow, not a product overview.",
    completionStandard:
      "Done means a marketing lead could use the brief to decide whether to test Claude Code in one workflow.",
    useItNext:
      "Use the brief to decide whether to pilot the workflow now or hold off until the fit is stronger.",
    nextMissionBridge:
      "If you want to go deeper, next practice translating that workflow value into stakeholder-ready language.",
    cardSupportLine:
      "Evaluate one workflow where Claude Code could create real leverage.",
    watchCoaching:
      "Watch for one marketing workflow where Claude Code fits and one where it does not.",
    doCoaching:
      "Open the tool and write the Claude Code Workflow Opportunity Brief.",
    checkCoaching:
      "Check that the brief ends with test, wait, or skip.",
    reflectCoaching:
      "Write the first experiment you would run, or why you would wait.",
  },
  "claude-code:positioning-messaging": {
    laneKey: "claude-code:positioning-messaging",
    missionPromise:
      "Create one internal value matrix a product marketer could use to brief a marketing ops lead on whether Claude Code is worth piloting.",
    whyNow:
      "Technical AI tools are getting easier to overhype. Teams need sharper internal communication about where workflow tools are worth testing and where they are not.",
    artifactLabel: "Claude Code Internal Value Matrix",
    artifactSummary:
      "A message matrix for one internal communication scenario that covers one audience, one pain point, one value claim, one proof set, one objection, one non-fit boundary, and reusable phrasing.",
    scopeGuardrails:
      "This is not a product summary. Stay with one audience, one pain point, and one realistic pilot decision.",
    artifactChecklist: [
      "Name one audience and one workflow pain point.",
      "Include one value claim and one proof set.",
      "Include one objection and one explicit non-fit boundary.",
      "End with reusable phrasing for an internal memo or stakeholder update.",
    ],
    strongOutputShape:
      "A strong matrix helps a marketer brief one stakeholder clearly without turning Claude Code into hype or a feature dump.",
    completionStandard:
      "Done means you could paste this into an internal memo and start a realistic pilot conversation.",
    useItNext:
      "Use it in an internal note, pilot proposal, or stakeholder update where the decision is whether to test Claude Code now.",
    nextMissionBridge: null,
    cardSupportLine:
      "Turn one Claude Code workflow into a usable internal value matrix.",
    watchCoaching:
      "Watch for one pain point and one proof you can use in an internal brief.",
    doCoaching:
      "Open the tool and make the Claude Code Internal Value Matrix.",
    checkCoaching:
      "Check that the matrix names one audience, one claim, and one non-fit.",
    reflectCoaching:
      "Write the stakeholder note you would send from this matrix.",
  },
  "github-copilot:research-insight": {
    laneKey: "github-copilot:research-insight",
    missionPromise:
      "Decide whether GitHub Copilot is worth using for one code-adjacent marketing workflow.",
    whyNow:
      "AI coding assistants are mature enough to evaluate, but still easy to overapply.",
    artifactLabel: "GitHub Copilot Workflow Evaluation Brief",
    artifactSummary:
      "An evaluation brief that names one workflow, where Copilot fits, where it does not, and whether the right call is adopt, test, or skip.",
    scopeGuardrails:
      "This is not a coding tutorial. Pick one workflow and make a real recommendation.",
    artifactChecklist: [
      "Name one code-adjacent marketing workflow.",
      "Give one supported reason Copilot fits and one supported reason it does not.",
      "Recommend adopt, test, or skip.",
      "Define one realistic first experiment if the answer is test.",
    ],
    strongOutputShape:
      "A strong brief helps a workflow-minded marketer make a tool decision instead of summarizing features.",
    completionStandard:
      "Done means another marketer could understand the adoption logic immediately.",
    useItNext:
      "Use the brief to decide whether GitHub Copilot deserves a contained test in one workflow.",
    nextMissionBridge: null,
    cardSupportLine:
      "Make a real adopt / test / skip call for one workflow.",
    watchCoaching:
      "Watch for one code-adjacent workflow and a reason to adopt, test, or skip.",
    doCoaching:
      "Open the tool and write the GitHub Copilot Workflow Evaluation Brief.",
    checkCoaching:
      "Check that the brief makes a clear adopt, test, or skip call.",
    reflectCoaching:
      "Write the next experiment, or the reason you will skip.",
  },
};

const TRANSITION_LINES = new Map<string, string>([
  [
    "prompt-engineering:research-insight->prompt-engineering:positioning-messaging",
    "You tightened the thinking. Next, turn it into a sharper message asset.",
  ],
  [
    "prompt-engineering:positioning-messaging->claude-code:research-insight",
    "You improved the output. Next, see where AI changes the workflow itself.",
  ],
  [
    "claude-code:research-insight->claude-code:positioning-messaging",
    "You found the workflow opportunity. Next, turn it into language a stakeholder can act on.",
  ],
]);

const APPROVED_LAUNCH_MISSION_LANE_KEY_SET = new Set<LaunchMissionLaneKey>(
  Object.keys(LAUNCH_MISSION_CONTENT) as LaunchMissionLaneKey[],
);

export const APPROVED_LAUNCH_MISSION_LANE_KEYS = Object.freeze(
  [...APPROVED_LAUNCH_MISSION_LANE_KEY_SET],
);

function resolveLaunchMissionTopic(
  topicSlug: string | null | undefined,
): LaunchMissionTopic | null {
  if (!topicSlug) return null;

  return APPROVED_LAUNCH_TOPICS.find((topic) => topic === topicSlug) ?? null;
}

function getLaunchMissionTopic(path: LearningPath): LaunchMissionTopic | null {
  const explicitTopic = resolveLaunchMissionTopic(path.mission_topic_slug);
  if (explicitTopic) return explicitTopic;

  return (
    APPROVED_LAUNCH_TOPICS.find((topic) => path.topics.includes(topic)) ?? null
  );
}

export function isApprovedLaunchMissionLaneKey(
  laneKey: string | null | undefined,
): laneKey is LaunchMissionLaneKey {
  if (!laneKey) return false;
  return APPROVED_LAUNCH_MISSION_LANE_KEY_SET.has(
    laneKey as LaunchMissionLaneKey,
  );
}

export function buildLaunchMissionLaneKey(
  topicSlug: string | null | undefined,
  launchDomainKey: LaunchDomainKey | null | undefined,
): LaunchMissionLaneKey | null {
  const topic = resolveLaunchMissionTopic(topicSlug);
  if (!topic || !launchDomainKey) return null;

  const laneKey = `${topic}:${launchDomainKey}` as LaunchMissionLaneKey;
  return isApprovedLaunchMissionLaneKey(laneKey) ? laneKey : null;
}

export function getLaunchMissionLaneKey(
  path: LearningPath,
): LaunchMissionLaneKey | null {
  if (isApprovedLaunchMissionLaneKey(path.mission_lane_key)) {
    return path.mission_lane_key;
  }

  const topic = getLaunchMissionTopic(path);
  const domain = getMissionLaunchDomain(path);
  return buildLaunchMissionLaneKey(topic, domain.key);
}

export function getLaunchMissionContent(
  path: LearningPath,
): LaunchMissionContent | null {
  const laneKey = getLaunchMissionLaneKey(path);
  if (!laneKey) return null;
  return LAUNCH_MISSION_CONTENT[laneKey] ?? null;
}

export function getLaunchMissionTransitionLine(
  from: LearningPath | null | undefined,
  to: LearningPath | null | undefined,
): string | null {
  if (!from || !to) return null;

  const fromLane = getLaunchMissionLaneKey(from);
  const toLane = getLaunchMissionLaneKey(to);

  if (!fromLane || !toLane) return null;

  return TRANSITION_LINES.get(`${fromLane}->${toLane}`) ?? null;
}
