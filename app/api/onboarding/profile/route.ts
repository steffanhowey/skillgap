import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { allocateHandle } from "@/lib/onboarding/allocateHandle";
import {
  FUNCTION_OPTIONS,
  FLUENCY_OPTIONS,
  normalizeFocusAreas,
  type FluencyLevel,
  type ProfessionalFunction,
} from "@/lib/onboarding/types";

function asFunction(value: unknown): ProfessionalFunction | null {
  if (typeof value !== "string") return null;
  return FUNCTION_OPTIONS.some((option) => option.value === value)
    ? (value as ProfessionalFunction)
    : null;
}

function asFluency(value: unknown): FluencyLevel | null {
  if (typeof value !== "string") return null;
  return FLUENCY_OPTIONS.some((option) => option.value === value)
    ? (value as FluencyLevel)
    : null;
}

/**
 * POST /api/onboarding/profile
 * Writes the three answers, generates a handle, and marks onboarding complete.
 * `{ handleOnly: true }` only fills a missing username.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("fp_profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    (typeof profile?.display_name === "string" && profile.display_name) ||
    user.email?.split("@")[0] ||
    "learner";
  const username = await allocateHandle(user.id, displayName);

  if (record.handleOnly === true) {
    const { error } = await admin
      .from("fp_profiles")
      .update({ username })
      .eq("id", user.id);
    if (error) {
      console.error("[onboarding] handle save failed");
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }
    return NextResponse.json({ username });
  }

  const primaryFunction = asFunction(record.primaryFunction);
  const fluencyLevel = asFluency(record.fluencyLevel);
  const focusAreas = normalizeFocusAreas(
    Array.isArray(record.focusAreas) ? record.focusAreas.map(String) : [],
  );

  const { error } = await admin
    .from("fp_profiles")
    .update({
      username,
      onboarding_completed: true,
      primary_function: primaryFunction,
      fluency_level: fluencyLevel,
      focus_areas: focusAreas,
      secondary_functions: [],
    })
    .eq("id", user.id);

  if (error) {
    console.error("[onboarding] profile save failed");
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({
    username,
    primaryFunction,
    fluencyLevel,
    focusAreas,
  });
}
