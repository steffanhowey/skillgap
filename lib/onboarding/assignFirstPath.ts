import { createClient } from "@/lib/supabase/admin";
import { generateAndCacheCurriculum } from "@/lib/learn/curriculumGenerator";
import type { PlanName } from "@/lib/billing/plan";
import type { CurriculumModule, PathItem } from "@/lib/types/learning";
import type { FocusArea, FluencyLevel, ProfessionalFunction } from "@/lib/onboarding/types";
import {
  firstMissionSummary,
  keepFirstModule,
  onboardingCurriculumQuery,
  type FirstPathAssignment,
} from "@/lib/onboarding/firstMission";

export type { FirstPathAssignment };

interface AssignInput {
  userId: string;
  userFunction: ProfessionalFunction | null;
  fluency: FluencyLevel | null;
  focusAreas: FocusArea[];
  plan: PlanName;
}

interface RolePathRow {
  id: string;
  title: string;
  items: PathItem[] | null;
  modules: CurriculumModule[] | null;
  estimated_duration_seconds: number | null;
}

/**
 * Role path when one is published for this function. Otherwise generate.
 * Paid generation lands in draft for review. Free generation keeps the first
 * mission and is auto-approved so it shows in admin without waiting.
 */
export async function assignFirstPath(
  input: AssignInput,
  hooks?: { defer?: (work: () => Promise<void>) => void },
): Promise<FirstPathAssignment> {
  const admin = createClient();

  if (input.userFunction) {
    const { data } = await admin
      .from("fp_learning_paths")
      .select("id, title, items, modules, estimated_duration_seconds")
      .eq("is_role_path", true)
      .eq("role_function", input.userFunction)
      .eq("review_status", "approved")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      return {
        state: "role",
        path: firstMissionSummary(data as RolePathRow),
        interim: null,
      };
    }
  }

  const query = onboardingCurriculumQuery(input.userFunction, input.focusAreas);

  if (input.plan !== "free") {
    const work = () => generateForReview(input, query);
    if (hooks?.defer) {
      hooks.defer(work);
    } else {
      await work();
    }
    return { state: "preparing", path: null, interim: null };
  }

  try {
    const generated = await generateAndCacheCurriculum(query, {
      userFunction: input.userFunction ?? undefined,
      userFluency: input.fluency ?? undefined,
    });
    const trimmed = keepFirstModule(generated.items, generated.modules ?? []);
    const { error } = await admin
      .from("fp_learning_paths")
      .update({
        items: trimmed.items,
        modules: trimmed.modules,
        estimated_duration_seconds: trimmed.seconds,
        status: "approved",
        review_status: "approved",
        generation_source: "onboarding_free",
        review_notes: `Auto-approved first mission. requested_by=${input.userId}`,
        is_discoverable: false,
        is_cached: false,
      })
      .eq("id", generated.id);

    if (error) {
      console.error("[onboarding] free path update failed");
      return { state: "preparing", path: null, interim: null };
    }

    return {
      state: "generated",
      path: firstMissionSummary({
        id: generated.id,
        title: generated.title,
        items: trimmed.items,
        modules: trimmed.modules,
        estimated_duration_seconds: trimmed.seconds,
      }),
      interim: null,
    };
  } catch (err) {
    console.error("[onboarding] free path generation failed", err);
    return { state: "preparing", path: null, interim: null };
  }
}

async function generateForReview(input: AssignInput, query: string): Promise<void> {
  try {
    const generated = await generateAndCacheCurriculum(query, {
      userFunction: input.userFunction ?? undefined,
      userFluency: input.fluency ?? undefined,
    });
    const admin = createClient();
    const { error } = await admin
      .from("fp_learning_paths")
      .update({
        status: "draft",
        review_status: "pending",
        generation_source: "onboarding_paid",
        review_notes: `requested_by=${input.userId}`,
        is_discoverable: false,
        is_cached: false,
      })
      .eq("id", generated.id);
    if (error) console.error("[onboarding] paid path update failed");
  } catch (err) {
    console.error("[onboarding] paid path generation failed", err);
  }
}
