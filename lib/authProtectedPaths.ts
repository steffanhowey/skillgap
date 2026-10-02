import {
  PUBLIC_EXACT_ROUTES,
  PUBLIC_ROUTE_PREFIXES,
} from "@/lib/appRoutes";

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
export const AUTH_PUBLIC_PREFIXES = PUBLIC_ROUTE_PREFIXES;

/**
 * True when middleware should require a session for this path.
 * Public without a prefix exemption: `/`, `/pulse`, `/index`, `/login`,
 * `/signup`, `/terms`, `/privacy`, `/refund`.
 */
export function isAuthProtectedPath(pathname: string): boolean {
  if ((PUBLIC_EXACT_ROUTES as readonly string[]).includes(pathname)) {
    return false;
  }

  if (AUTH_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }

  return AUTH_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
