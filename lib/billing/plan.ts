import { createClient } from "@/lib/supabase/admin";

export type PlanName = "free" | "individual" | "founding" | "team";

export interface PlanState {
  plan: PlanName;
  status: string | null;
  isFounding: boolean;
  periodEnd: string | null;
}

const FREE_PLAN: PlanState = {
  plan: "free",
  status: null,
  isFounding: false,
  periodEnd: null,
};

const FOUNDING_CAP = 100;

function asPlan(value: unknown): PlanName {
  if (
    value === "free" ||
    value === "individual" ||
    value === "founding" ||
    value === "team"
  ) {
    return value;
  }
  return "free";
}

/**
 * Current plan for a user. Missing rows and lookup errors return free.
 */
export async function getPlan(userId: string): Promise<PlanState> {
  try {
    const admin = createClient();
    const { data, error } = await admin
      .from("fp_profiles")
      .select("plan, plan_status, is_founding, plan_period_end")
      .eq("id", userId)
      .single();

    if (error || !data) return FREE_PLAN;

    return {
      plan: asPlan(data.plan),
      status: typeof data.plan_status === "string" ? data.plan_status : null,
      isFounding: data.is_founding === true,
      periodEnd:
        typeof data.plan_period_end === "string" ? data.plan_period_end : null,
    };
  } catch (err) {
    console.error("[billing] getPlan failed", err);
    return FREE_PLAN;
  }
}

/**
 * Founding annual seats still open. Lookup failures return 0 so checkout
 * refuses a new founding purchase instead of overselling the cap.
 */
export async function foundingSeatsRemaining(): Promise<number> {
  try {
    const admin = createClient();
    const { count, error } = await admin
      .from("fp_profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_founding", true);

    if (error || count == null) return 0;
    return Math.max(0, FOUNDING_CAP - count);
  } catch (err) {
    console.error("[billing] foundingSeatsRemaining failed", err);
    return 0;
  }
}

interface MissionAccessTarget {
  moduleIndex: number;
  items: Array<{ item_id?: string; task_type?: string; module_index?: number }>;
}

/**
 * Whether this user may do this module.
 * A paid plan can do any module. On free, the first module whose Do step
 * they reach on a path is the free one. A Do step in another module of that
 * path is blocked. Lookup errors allow the action so a blip does not paywall everyone.
 */
export async function canDoMission(
  userId: string,
  pathId: string,
  target?: MissionAccessTarget,
): Promise<boolean> {
  const plan = await getPlan(userId);
  if (plan.plan !== "free") return true;

  try {
    const admin = createClient();
    const { data, error } = await admin
      .from("fp_learning_progress")
      .select("item_states, current_item_index")
      .eq("user_id", userId)
      .eq("path_id", pathId)
      .single();

    if (error) {
      console.error("[billing] mission access lookup failed");
      return true;
    }

    const row = data as {
      item_states?: Record<string, { completed?: boolean; skipped?: boolean }>;
      current_item_index?: number;
    } | null;
    const claimed = claimedDoModule(
      target?.items ?? [],
      row?.item_states ?? {},
      row?.current_item_index ?? null,
    );
    if (claimed == null) return true;
    return claimed === (target?.moduleIndex ?? 0);
  } catch (err) {
    console.error("[billing] canDoMission failed", err);
    return true;
  }
}

function claimedDoModule(
  items: Array<{ item_id?: string; task_type?: string; module_index?: number }>,
  itemStates: Record<string, { completed?: boolean; skipped?: boolean }>,
  currentIndex: number | null,
): number | null {
  const started = items.find((item) => {
    if (item.task_type !== "do" || !item.item_id) return false;
    const state = itemStates[item.item_id];
    return !!state && state.skipped !== true;
  });
  if (started) return started.module_index ?? 0;
  if (currentIndex != null && items[currentIndex]?.task_type === "do") {
    return items[currentIndex].module_index ?? 0;
  }
  return null;
}
