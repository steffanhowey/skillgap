import { createClient } from "@/lib/supabase/admin";
import { USERNAME_MAX_LENGTH, USERNAME_REGEX } from "@/lib/username";
import { generateHandleFromName } from "@/lib/onboarding/handles";

/**
 * Handle for a profile that does not have one yet.
 * Skips fp_reserved_usernames and handles already on fp_profiles.
 * Returns the existing username when one is already stored.
 */
export async function allocateHandle(
  userId: string,
  displayName: string,
): Promise<string> {
  const admin = createClient();
  const { data: profile } = await admin
    .from("fp_profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (typeof profile?.username === "string" && profile.username.length > 0) {
    return profile.username;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateHandleFromName(displayName || "learner");
    if (!USERNAME_REGEX.test(candidate)) continue;

    const { data: reserved } = await admin
      .from("fp_reserved_usernames")
      .select("username")
      .eq("username", candidate)
      .maybeSingle();
    if (reserved) continue;

    const { data: taken } = await admin
      .from("fp_profiles")
      .select("id")
      .ilike("username", candidate)
      .maybeSingle();
    if (taken) continue;

    return candidate;
  }

  return `learner_${userId.replace(/-/g, "").slice(0, 8)}`.slice(0, USERNAME_MAX_LENGTH);
}
