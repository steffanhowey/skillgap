import { z } from "zod";
import type { AiTool, CurriculumModule, PathItem } from "../../lib/types/learning";

const checkQuestionSchema = z.object({
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2),
  correct: z.string().min(1),
  why: z.string().min(1),
});

const missionSchema = z.object({
  title: z.string().min(1),
  why: z.string().min(1),
  level: z.enum(["exploring", "practicing"]),
  minutes: z.number().int().nonnegative(),
  practices: z.string().min(1),
  skill_tags: z.array(z.string()),
  tested_on: z.string().min(1),
  watch: z.object({
    content_id: z.string().min(1).optional(),
    youtube_url: z.string().min(1).optional(),
    start_seconds: z.number().int().nonnegative().optional(),
    end_seconds: z.number().int().nonnegative().optional(),
    what_to_look_for: z.string().min(1),
  }),
  do: z.object({
    tool: z.string().min(1),
    deliverable: z.string().min(1),
    steps: z.array(z.string().min(1)).min(3).max(5),
    done_when: z.string().min(1),
  }),
  check: z.object({
    questions: z.array(checkQuestionSchema).min(2).max(3),
  }),
  reflect: z.object({
    prompt: z.string().min(1),
  }),
});

export const rolePathSeedSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  role_function: z.enum([
    "generalist",
    "content",
    "product_marketing",
    "demand_gen",
    "brand",
    "social",
    "agency",
  ]),
  missions: z.array(missionSchema).min(1),
});

export type RolePathSeed = z.infer<typeof rolePathSeedSchema>;

export interface CompiledRolePath {
  slug: string;
  title: string;
  role_function: RolePathSeed["role_function"];
  description: string;
  topics: string[];
  items: PathItem[];
  modules: CurriculumModule[];
  estimated_duration_seconds: number;
}

const TOOL_URLS: Record<string, string> = {
  claude: "https://claude.ai/new",
  chatgpt: "https://chatgpt.com",
  gemini: "https://gemini.google.com",
  copilot: "https://copilot.microsoft.com",
  perplexity: "https://www.perplexity.ai",
};

/**
 * Turns an authored role path into the path row the player already reads.
 */
export function compileRolePath(seed: RolePathSeed): CompiledRolePath {
  const items: PathItem[] = [];
  const modules: CurriculumModule[] = seed.missions.map((mission, index) => {
    const seconds = mission.minutes * 60;
    const base = `${seed.slug}-m${index}`;
    const watchUrl = mission.watch.youtube_url ?? null;
    const watchId = mission.watch.content_id ?? null;

    items.push(
      blankItem({
        item_id: `${base}-watch`,
        task_type: "watch",
        position: items.length,
        module_index: index,
        title: mission.title,
        connective_text: mission.watch.what_to_look_for,
        duration_seconds: Math.round(seconds * 0.35),
        content_id: watchId,
        content_type: watchUrl || watchId ? "video" : null,
        source_url: watchUrl,
        clip_start_seconds: mission.watch.start_seconds ?? null,
        clip_end_seconds: mission.watch.end_seconds ?? null,
      }),
      blankItem({
        item_id: `${base}-do`,
        task_type: "do",
        position: items.length + 1,
        module_index: index,
        title: mission.do.deliverable,
        connective_text: mission.why,
        duration_seconds: Math.round(seconds * 0.4),
        mission: {
          objective: mission.do.deliverable,
          context: mission.why,
          tool: toolFor(mission.do.tool),
          tool_prompt: "",
          steps: mission.do.steps,
          success_criteria: [mission.do.done_when],
          starter_code: null,
          guidance_level: mission.level === "exploring" ? "guided" : "scaffolded",
          submission_type: "text",
        },
      }),
      blankItem({
        item_id: `${base}-check`,
        task_type: "check",
        position: items.length + 2,
        module_index: index,
        title: "Check",
        connective_text: mission.why,
        duration_seconds: Math.round(seconds * 0.15),
        check: {
          question: mission.check.questions[0]?.prompt ?? "",
          options: mission.check.questions[0]?.choices ?? [],
          correct_answer: mission.check.questions[0]?.correct ?? "",
          hint: mission.check.questions[0]?.why ?? "",
          questions: mission.check.questions.map((question) => ({
            question: question.prompt,
            options: question.choices,
            correct_answer: question.correct,
            why: question.why,
          })),
        },
      }),
      blankItem({
        item_id: `${base}-reflect`,
        task_type: "reflect",
        position: items.length + 3,
        module_index: index,
        title: "Reflect",
        connective_text: mission.why,
        duration_seconds: Math.round(seconds * 0.1),
        reflection: {
          prompt: mission.reflect.prompt,
          min_length: 0,
        },
      }),
    );

    return {
      index,
      title: mission.title,
      description: mission.why,
      task_count: 4,
      duration_seconds: seconds,
      practices: mission.practices,
      skill_tags: mission.skill_tags,
      level: mission.level,
      tested_on: mission.tested_on,
    };
  });

  const topics = [...new Set(seed.missions.flatMap((mission) => mission.skill_tags))];

  return {
    slug: seed.slug,
    title: seed.title,
    role_function: seed.role_function,
    description: seed.title,
    topics,
    items,
    modules,
    estimated_duration_seconds: modules.reduce(
      (total, module) => total + module.duration_seconds,
      0,
    ),
  };
}

/**
 * True when authored copy still contains a TODO marker.
 */
export function rolePathHasTodo(value: unknown): boolean {
  return JSON.stringify(value).includes("TODO");
}

function toolFor(name: string): AiTool {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const url = TOOL_URLS[key] ?? "";
  return {
    name,
    slug: url ? key : "other",
    url,
    description: name,
    icon: "sparkles",
    category: "writing",
    submission_type: "text",
    paste_instruction: "",
    supports_deep_link: false,
    deep_link_template: null,
  };
}

function blankItem(overrides: Partial<PathItem> & Pick<PathItem, "item_id" | "task_type" | "position" | "module_index" | "title">): PathItem {
  return {
    connective_text: "",
    duration_seconds: 0,
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
    ...overrides,
  };
}
