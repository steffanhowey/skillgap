import { describe, expect, it } from "vitest";
import {
  firstMissionSummary,
  keepFirstModule,
  onboardingCurriculumQuery,
} from "./firstMission";
import type { CurriculumModule, PathItem } from "@/lib/types/learning";

const item = (moduleIndex: number, title: string): PathItem =>
  ({
    item_id: title,
    task_type: "do",
    position: moduleIndex,
    module_index: moduleIndex,
    title,
    connective_text: "",
    duration_seconds: 600,
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
  }) as PathItem;

describe("first mission helpers", () => {
  it("summarizes the first module", () => {
    const summary = firstMissionSummary({
      id: "path-1",
      title: "Marketing path",
      modules: [
        {
          index: 0,
          title: "Write the brief",
          description: "",
          task_count: 1,
          duration_seconds: 1800,
        },
      ] as CurriculumModule[],
      items: [item(0, "Write the brief"), item(1, "Later")],
    });
    expect(summary.missionTitle).toBe("Write the brief");
    expect(summary.estimatedMinutes).toBe(30);
  });

  it("drops later modules", () => {
    const kept = keepFirstModule(
      [item(0, "First"), item(1, "Second")],
      [
        { index: 0, title: "First", description: "", task_count: 1, duration_seconds: 600 },
        { index: 1, title: "Second", description: "", task_count: 1, duration_seconds: 600 },
      ],
    );
    expect(kept.items).toHaveLength(1);
    expect(kept.modules).toHaveLength(1);
  });

  it("builds a query from role and focus", () => {
    expect(onboardingCurriculumQuery("marketing", ["content", "seo"])).toBe(
      "Using AI at work as a Marketing, focused on Content, SEO",
    );
  });
});
