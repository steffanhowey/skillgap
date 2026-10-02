import type { SupabaseClient } from "@supabase/supabase-js";
import type { ItemState, LearningPath } from "@/lib/types";

interface PracticeLogInput {
  userId: string;
  pathId: string;
  path: LearningPath;
  moduleIndex: number;
  itemStates: Record<string, ItemState>;
}

/**
 * Upserts the learner's record for one finished mission.
 * Reflection, the artifact link, the check score, and the self-check stay on this row.
 */
export async function recordPracticeLog(
  admin: SupabaseClient,
  input: PracticeLogInput,
): Promise<boolean> {
  const module = input.path.modules?.find((entry) => entry.index === input.moduleIndex);
  const steps = input.path.items.filter(
    (item) => (item.module_index ?? 0) === input.moduleIndex,
  );
  const stateFor = (taskType: string): ItemState => {
    const item = steps.find((entry) => entry.task_type === taskType);
    if (!item?.item_id) return { completed: false };
    return input.itemStates[item.item_id] ?? {};
  };

  const doState = stateFor("do");
  const checkState = stateFor("check");
  const reflectState = stateFor("reflect");
  const selfCheck = asSelfCheck(checkState.self_check);
  const artifact = asUrl(doState.artifact_url);
  const seconds = steps.reduce((total, item) => {
    if (!item.item_id) return total;
    return total + (input.itemStates[item.item_id]?.time_spent_seconds ?? 0);
  }, 0);

  const { error } = await admin.from("fp_practice_log").upsert(
    {
      user_id: input.userId,
      path_id: input.pathId,
      module_index: input.moduleIndex,
      mission_title: module?.title ?? steps[0]?.title ?? "Mission",
      practices: module?.practices ?? module?.description ?? "",
      skill_tags: module?.skill_tags ?? [],
      tool: doState.tool_used ?? null,
      artifact_url: artifact,
      self_check: selfCheck,
      check_score: typeof checkState.check_score === "number" ? checkState.check_score : null,
      reflection: reflectState.submission_text ?? null,
      seconds_spent: seconds,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,path_id,module_index" },
  );

  if (error) {
    console.error("[practice-log] upsert failed");
    return false;
  }
  return true;
}

function asSelfCheck(value: unknown): "yes" | "partly" | "not_yet" | null {
  if (value === "yes" || value === "partly" || value === "not_yet") return value;
  return null;
}

function asUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) return trimmed;
  return null;
}
