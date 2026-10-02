/** Routes that require an authenticated session. */
export const AUTH_PROTECTED_PREFIXES = [
  "/home",
  "/missions",
  "/rooms",
  "/progress",
  "/settings",
  "/learn",
  "/practice",
  "/skills",
  "/stats",
  "/goals",
  "/dashboard",
  "/profile",
  "/session",
  "/onboard",
  "/admin",
  "/environment",
  "/labs",
] as const;

/** Shareable surfaces that live under an otherwise protected prefix. */
export const AUTH_PUBLIC_PREFIXES = ["/progress/evidence"] as const;

/**
 * True when middleware should require a session for this path.
 */
export function isAuthProtectedPath(pathname: string): boolean {
  if (
    AUTH_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return false;
  }

  return AUTH_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
