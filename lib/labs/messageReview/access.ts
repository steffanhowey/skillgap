import { createClient } from "@/lib/supabase/server";

export interface MessageReviewLabUser {
  id: string;
  email: string;
}

export type MessageReviewLabAccess =
  | { status: "allowed"; user: MessageReviewLabUser }
  | { status: "unauthenticated"; user: null }
  | { status: "forbidden"; user: null };

/**
 * Parse the server-only comma-separated participant allowlist.
 */
export function parseMessageReviewAllowlist(
  rawAllowlist: string | undefined,
): string[] {
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
 * Check one verified auth email against the server-only lab allowlist.
 */
export function isMessageReviewLabAllowed(
  email: string | null | undefined,
  rawAllowlist: string | undefined = process.env.MESSAGE_REVIEW_LAB_ALLOWLIST,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  if (!email) return false;

  const allowlist = parseMessageReviewAllowlist(rawAllowlist);
  const normalizedEmail = email.trim().toLowerCase();
  if (allowlist.includes(normalizedEmail)) return true;

  return (
    nodeEnv !== "production" &&
    (allowlist.length === 0 || allowlist.includes("*"))
  );
}

/**
 * Authenticate the current request and enforce the invitation-only allowlist.
 */
export async function getMessageReviewLabAccess(): Promise<MessageReviewLabAccess> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthenticated", user: null };
  }

  if (!isMessageReviewLabAllowed(user.email)) {
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
