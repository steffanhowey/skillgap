import type { RolePathSeed } from "./types.ts";

function skeleton(
  title: string,
  level: "exploring" | "practicing",
): RolePathSeed["missions"][number] {
  return {
    title,
    why: "TODO",
    level,
    minutes: 0,
    practices: "TODO",
    skill_tags: ["TODO"],
    tested_on: "TODO",
    watch: {
      content_id: "TODO",
      what_to_look_for: "TODO",
    },
    do: {
      tool: "TODO",
      deliverable: "TODO",
      steps: ["TODO", "TODO", "TODO"],
      done_when: "TODO",
    },
    check: {
      questions: [
        { prompt: "TODO", choices: ["TODO", "TODO"], correct: "TODO", why: "TODO" },
        { prompt: "TODO", choices: ["TODO", "TODO"], correct: "TODO", why: "TODO" },
      ],
    },
    reflect: { prompt: "TODO" },
  };
}

/** AI-native marketer on a small team. Copy is unfinished on purpose. */
export const generalistRolePath: RolePathSeed = {
  slug: "generalist",
  title: "AI-native marketer, small team",
  role_function: "generalist",
  missions: [
    skeleton("Mission 1", "exploring"),
    skeleton("Mission 2", "exploring"),
    skeleton("Mission 3", "practicing"),
    skeleton("Mission 4", "practicing"),
  ],
};
