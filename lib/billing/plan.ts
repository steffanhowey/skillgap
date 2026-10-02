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
