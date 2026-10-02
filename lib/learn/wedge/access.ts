import { createClient } from "@/lib/supabase/server";

export interface TrackFUser {
  id: string;
  email: string;
}

export type TrackFAccess =
  | { status: "allowed"; user: TrackFUser }
  | { status: "unauthenticated"; user: null }
  | { status: "forbidden"; user: null };

/**
 * Parse the server-only Track F founder allowlist.
 * Uses TRACK_F_ALLOWLIST — not the Message Review lab list.
 */
export function parseTrackFAllowlist(rawAllowlist: string | undefined): string[] {
  return [
    ...new Set(
      (rawAllowlist ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

/**
 * Check one verified auth email against the founder-only Track F allowlist.
 */
export function isTrackFAllowed(
  email: string | null | undefined,
  rawAllowlist: string | undefined = process.env.TRACK_F_ALLOWLIST,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  if (!email) return false;

  const allowlist = parseTrackFAllowlist(rawAllowlist);
  const normalizedEmail = email.trim().toLowerCase();
  if (allowlist.includes(normalizedEmail)) return true;

  return (
    nodeEnv !== "production" &&
    (allowlist.length === 0 || allowlist.includes("*"))
  );
}

/**
 * Authenticate the current request and enforce the founder-only allowlist.
 */
export async function getTrackFAccess(): Promise<TrackFAccess> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthenticated", user: null };
  }

  if (!isTrackFAllowed(user.email)) {
    return { status: "forbidden", user: null };
  }

  return {
    status: "allowed",
    user: {
      id: user.id,
      email: user.email!,
    },
  };
}
