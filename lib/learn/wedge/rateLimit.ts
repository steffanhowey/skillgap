export type WedgeOperation = "evaluate";

export const WEDGE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1_000;
export const WEDGE_RATE_LIMITS: Record<WedgeOperation, number> = {
  evaluate: 12,
};

const attempts = new Map<string, number[]>();

/**
 * Best-effort per-instance limit before a paid Track F model call.
 * `evaluate` is the only paid operation this horizon. Serverless isolates
 * do not share this map — that is accepted for the founder-only cut.
 * Do not add Redis.
 */
export function allowWedgeRequest(
  userId: string,
  operation: WedgeOperation,
  now = Date.now(),
): boolean {
  const key = `${operation}:${userId}`;
  const recent = (attempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WEDGE_RATE_LIMIT_WINDOW_MS,
  );
  if (recent.length >= WEDGE_RATE_LIMITS[operation]) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

/**
 * Clear limiter state for tests.
 */
export function resetWedgeRateLimitForTests(): void {
  attempts.clear();
}
