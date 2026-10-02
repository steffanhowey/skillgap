const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 30;

const requestLog = new Map<string, number[]>();

/**
 * In-memory evaluate rate limit (30/hour/user).
 * Serverless instances do not share this map; prefer DB count when
 * fp_product_events is available.
 */
export function allowEvaluateRequest(userId: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= MAX_REQUESTS) {
    requestLog.set(userId, recent);
    return false;
  }
  recent.push(now);
  requestLog.set(userId, recent);
  return true;
}
