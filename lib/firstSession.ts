/**
 * True when the learner has not started or finished a mission yet.
 */
export function isFirstSessionHome({
  achievementCount,
  inProgressCount,
}: {
  achievementCount: number;
  inProgressCount: number;
}): boolean {
  return achievementCount === 0 && inProgressCount === 0;
}
