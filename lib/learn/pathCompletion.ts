/**
 * Rules for whether a learning path can be marked complete.
 * A skipped Do never completes a path. Do items also need an evaluation.
 */

interface PathItemLike {
  item_id?: string;
  task_type?: string;
}

interface ItemStateLike {
  completed?: boolean;
  skipped?: boolean;
  evaluation?: {
    quality?: string;
    score?: number;
  };
}

/**
 * True when the item has a real evaluation (not skip, not fail-open).
 */
export function hasSkillEvaluation(state: unknown): boolean {
  if (!state || typeof state !== "object") return false;
  const evaluation = (state as ItemStateLike).evaluation;
  if (!evaluation) return false;
  if (typeof evaluation.score === "number" && evaluation.score > 0) return true;
  return Boolean(
    evaluation.quality &&
      evaluation.quality !== "unevaluated" &&
      evaluation.quality !== "",
  );
}

/**
 * True when the item was finished, not skipped.
 */
export function isItemSatisfied(state: unknown): boolean {
  if (!state || typeof state !== "object") return false;
  const itemState = state as ItemStateLike;
  return itemState.completed === true && itemState.skipped !== true;
}

/**
 * Path completion requires every item to be satisfied. Do items also need
 * an evaluation. Paths with no items cannot complete.
 */
export function canCompletePath(
  pathItems: PathItemLike[],
  itemStates: Record<string, unknown>,
): boolean {
  if (pathItems.length === 0) return false;

  return pathItems.every((item) => {
    const itemId = item.item_id;
    if (!itemId) return false;
    const state = itemStates[itemId];
    if (!isItemSatisfied(state)) return false;
    if (item.task_type === "do") return hasSkillEvaluation(state);
    return true;
  });
}
