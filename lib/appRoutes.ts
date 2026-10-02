export const MISSIONS_ROUTE = "/missions";
export const HOME_ROUTE = MISSIONS_ROUTE;
export const ROOMS_ROUTE = "/rooms";
export const PROGRESS_ROUTE = "/progress";
export const SETTINGS_ROUTE = "/settings";

/** Founder-only path. Not a catalog card and not indexed. */
export const LAUNCH_MESSAGING_ROUTE = "/missions/launch-messaging";

interface RoomEntryRouteInput {
  id: string;
  status?: "waiting" | "active" | "completed" | null;
  persistent?: boolean | null;
}

export function getMissionRoute(pathId: string): string {
  return `${MISSIONS_ROUTE}/${pathId}`;
}

/**
 * Solo runner for a mission. Rooms are optional and must not own this route.
 */
export function getMissionSoloRoute(
  pathId: string,
  stepIndex?: number | null,
): string {
  const base = `${MISSIONS_ROUTE}/${pathId}/solo`;
  if (stepIndex == null || stepIndex < 0) {
    return base;
  }

  return `${base}?step=${stepIndex}`;
}

export function getRoomRoute(roomId: string): string {
  return `${ROOMS_ROUTE}/${roomId}`;
}

export function getCanonicalRoomEntryRoute(
  room: RoomEntryRouteInput,
): string {
  if (room.persistent || room.status === "active") {
    return `/environment/${room.id}`;
  }

  return getRoomRoute(room.id);
}

export function getProgressEvidenceRoute(evidenceId: string): string {
  return `${PROGRESS_ROUTE}/evidence/${evidenceId}`;
}

export function getProgressEvidenceImageRoute(evidenceId: string): string {
  return `${getProgressEvidenceRoute(evidenceId)}/opengraph-image`;
}

export function getMissionSearchRoute(query: string): string {
  return `${MISSIONS_ROUTE}?q=${encodeURIComponent(query)}`;
}
