"use client";

/**
 * Shared nav config for Hub sidebar and session menu drawer.
 * Home → Profile. Missions stays at /missions and is not in the nav.
 *
 * Hidden from navigation (routes and code stay): goals, tasks, commitments,
 * notes, projects, labels, stats, labs, integrations/GitHub, and rooms.
 * Rooms stay reachable from inside a mission.
 */

import {
  House,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

const NAV_ICON_SIZE = 20;

export const NAV_ITEMS: Array<{
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "home", href: "/home", label: "Home", icon: House },
  { id: "progress", href: "/progress", label: "Profile", icon: TrendingUp },
];

/** Set of hrefs that support client-side tab switching (no server round-trip). */
export const CLIENT_NAV_HREFS = new Set([
  ...NAV_ITEMS.map((item) => item.href),
  "/settings",
]);

/** Render a nav icon with consistent size (for sidebar/drawer). */
export function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon size={NAV_ICON_SIZE} strokeWidth={1.8} className="shrink-0" />;
}
