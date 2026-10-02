import { createHash } from "crypto";

/**
 * Stable SHA-256 of a value after sorting object keys.
 * Used for LLM run ledgers so we never persist raw user content.
 */
export function hashCanonicalJson(value: unknown): string {
  return createHash("sha256").update(canonicalizeJson(value)).digest("hex");
}

function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalizeJson(entry)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalizeJson(record[key])}`)
    .join(",")}}`;
}
