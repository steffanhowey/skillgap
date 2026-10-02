type MessageReviewOperation = "extract" | "review";

const WINDOW_MS = 60 * 60 * 1_000;
const LIMITS: Record<MessageReviewOperation, number> = {
  extract: 20,
  review: 12,
};

const attempts = new Map<string, number[]>();

/**
 * Apply a best-effort per-instance lab rate limit before paid model calls.
 */
export function allowMessageReviewRequest(
  userId: string,
  operation: MessageReviewOperation,
  now = Date.now(),
): boolean {
  const key = `${operation}:${userId}`;
  const recent = (attempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= LIMITS[operation]) {
    attempts.set(key, recent);
    return false;
  }

  recent.push(now);
  attempts.set(key, recent);
  return true;
}

/**
 * Clear in-memory limiter state for deterministic tests.
 */
export function resetMessageReviewRateLimitForTests(): void {
  attempts.clear();
}
