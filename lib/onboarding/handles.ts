import { USERNAME_MAX_LENGTH } from "@/lib/username";

/**
 * Collision-safe handle from a display name. Always starts with a letter.
 */
export function generateHandleFromName(displayName: string): string {
  const letters = displayName
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 12);
  const stem = letters.length >= 1 ? letters : "learner";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${stem}_${suffix}`.slice(0, USERNAME_MAX_LENGTH);
}
