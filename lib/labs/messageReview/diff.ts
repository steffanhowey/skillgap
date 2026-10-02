export interface TextDiffSegment {
  type: "unchanged" | "added" | "removed";
  value: string;
}

function tokenize(value: string): string[] {
  return value.match(/\s+|[^\s]+/g) ?? [];
}

/**
 * Produce a stable word-level diff without adding a client dependency.
 */
export function diffMessageText(
  original: string,
  proposed: string,
): TextDiffSegment[] {
  if (original === proposed) {
    return original ? [{ type: "unchanged", value: original }] : [];
  }

  const left = tokenize(original);
  const right = tokenize(proposed);
  if (left.length * right.length > 250_000) {
    return [
      { type: "removed", value: original },
      { type: "added", value: proposed },
    ];
  }
  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  );

  for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (
      let rightIndex = right.length - 1;
      rightIndex >= 0;
      rightIndex -= 1
    ) {
      matrix[leftIndex]![rightIndex] =
        left[leftIndex] === right[rightIndex]
          ? matrix[leftIndex + 1]![rightIndex + 1]! + 1
          : Math.max(
              matrix[leftIndex + 1]![rightIndex]!,
              matrix[leftIndex]![rightIndex + 1]!,
            );
    }
  }

  const pieces: TextDiffSegment[] = [];
  const append = (type: TextDiffSegment["type"], value: string): void => {
    const previous = pieces.at(-1);
    if (previous?.type === type) {
      previous.value += value;
    } else {
      pieces.push({ type, value });
    }
  };

  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      append("unchanged", left[leftIndex]!);
      leftIndex += 1;
      rightIndex += 1;
    } else if (
      matrix[leftIndex + 1]![rightIndex]! >=
      matrix[leftIndex]![rightIndex + 1]!
    ) {
      append("removed", left[leftIndex]!);
      leftIndex += 1;
    } else {
      append("added", right[rightIndex]!);
      rightIndex += 1;
    }
  }

  while (leftIndex < left.length) {
    append("removed", left[leftIndex]!);
    leftIndex += 1;
  }
  while (rightIndex < right.length) {
    append("added", right[rightIndex]!);
    rightIndex += 1;
  }

  return pieces;
}
