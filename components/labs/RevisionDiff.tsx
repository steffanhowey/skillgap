"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type {
  MessageMatrixRow,
  MessageReviewArtifact,
  MessageReviewContext,
} from "@/lib/labs/messageReview/types";

interface RevisionDiffProps {
  original: MessageReviewArtifact;
  proposed: MessageReviewArtifact;
  finalArtifact: MessageReviewArtifact;
  context: MessageReviewContext;
  onChange: (artifact: MessageReviewArtifact) => void;
  embedded?: boolean;
}

type EditableRowField = Exclude<keyof MessageMatrixRow, "rowId">;

interface RevisionChange {
  id: string;
  rowId: string | null;
  field: EditableRowField | "channelDraft";
  label: string;
  original: string | string[];
  proposed: string | string[];
}

const ROW_FIELDS: Array<{ key: EditableRowField; label: string }> = [
  { key: "audienceJob", label: "Audience and urgent job" },
  { key: "desiredAction", label: "Desired action" },
  { key: "currentAlternative", label: "Current alternative" },
  { key: "messageAngle", label: "Message angle" },
  { key: "valueClaim", label: "Value claim" },
  { key: "proofRefs", label: "Proof references" },
  { key: "objection", label: "Objection" },
  { key: "response", label: "Response" },
  { key: "channelExpression", label: "Channel expression" },
];

function comparable(value: string | string[]): string {
  return Array.isArray(value) ? value.join("\u0000") : value;
}

function buildChanges(
  original: MessageReviewArtifact,
  proposed: MessageReviewArtifact,
): RevisionChange[] {
  const changes: RevisionChange[] = [];

  for (const originalRow of original.rows) {
    const proposedRow = proposed.rows.find(
      (row) => row.rowId === originalRow.rowId,
    );
    if (!proposedRow) continue;

    for (const field of ROW_FIELDS) {
      if (
        comparable(originalRow[field.key]) ===
        comparable(proposedRow[field.key])
      ) {
        continue;
      }
      changes.push({
        id: `${originalRow.rowId}-${field.key}`,
        rowId: originalRow.rowId,
        field: field.key,
        label: field.label,
        original: originalRow[field.key],
        proposed: proposedRow[field.key],
      });
    }
  }

  if (original.channelDraft !== proposed.channelDraft) {
    changes.push({
      id: "channelDraft",
      rowId: null,
      field: "channelDraft",
      label: "Channel draft",
      original: original.channelDraft,
      proposed: proposed.channelDraft,
    });
  }

  return changes;
}

function getFinalValue(
  artifact: MessageReviewArtifact,
  change: RevisionChange,
): string | string[] {
  if (change.field === "channelDraft") return artifact.channelDraft;
  const row = artifact.rows.find((candidate) => candidate.rowId === change.rowId);
  return row ? row[change.field] : "";
}

function setFinalValue(
  artifact: MessageReviewArtifact,
  change: RevisionChange,
  value: string | string[],
): MessageReviewArtifact {
  if (change.field === "channelDraft" && typeof value === "string") {
    return { ...artifact, channelDraft: value };
  }

  return {
    ...artifact,
    rows: artifact.rows.map((row) => {
      if (row.rowId !== change.rowId || change.field === "channelDraft") {
        return row;
      }
      return { ...row, [change.field]: value } as MessageMatrixRow;
    }),
  };
}

/**
 * Inspect, accept, reject, or edit every proposed artifact change.
 */
export function RevisionDiff({
  original,
  proposed,
  finalArtifact,
  context,
  onChange,
  embedded = false,
}: RevisionDiffProps) {
  const changes = buildChanges(original, proposed);
  const [activeChangeIndex, setActiveChangeIndex] = useState(0);
  const safeActiveIndex = Math.min(
    activeChangeIndex,
    Math.max(changes.length - 1, 0),
  );

  const applyAll = (source: "original" | "proposed"): void => {
    let next = finalArtifact;
    for (const change of changes) {
      next = setFinalValue(next, change, change[source]);
    }
    onChange(next);
  };

  const chooseActive = (source: "original" | "proposed"): void => {
    const change = changes[safeActiveIndex];
    if (!change) return;
    onChange(setFinalValue(finalArtifact, change, change[source]));
    if (safeActiveIndex < changes.length - 1) {
      setActiveChangeIndex(safeActiveIndex + 1);
    }
  };

  const acceptedCount = changes.filter(
    (change) =>
      comparable(getFinalValue(finalArtifact, change)) ===
      comparable(change.proposed),
  ).length;
  const activeChange = changes[safeActiveIndex];

  return (
    <section
      aria-labelledby={embedded ? undefined : "revision-title"}
      className="space-y-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        {embedded ? null : (
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sg-forest-600)]">
            Suggested changes
          </p>
          <h2
            id="revision-title"
            className="mt-2 text-3xl font-semibold tracking-tight text-[var(--sg-shell-900)] sm:text-4xl"
          >
            Choose what changes.
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--sg-shell-600)]">
            Review one suggestion at a time. Nothing changes unless you approve
            it.
          </p>
        </div>
        )}
        {changes.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            leftIcon={<Check size={15} aria-hidden="true" />}
            onClick={() => applyAll("proposed")}
          >
            Use all suggestions
          </Button>
        ) : null}
      </div>

      {changes.length === 0 ? (
        <Card variant="session" className="p-5 text-base text-[var(--sg-shell-600)]">
          No copy changes were suggested. Your draft stays as written.
        </Card>
      ) : activeChange ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--sg-shell-600)]">
            <span>
              Change {safeActiveIndex + 1} of {changes.length}
            </span>
            <span>
              {acceptedCount} of {changes.length} suggestions used
            </span>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sg-shell-border)] px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sg-shell-500)]">
                  {activeChange.rowId
                    ? `Angle ${activeChange.rowId.match(/\d+/)?.[0] ?? ""}`
                    : "Final draft"}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--sg-shell-900)]">
                  {activeChange.label}
                </h3>
              </div>
              <span className="rounded-full bg-[var(--sg-shell-100)] px-2.5 py-1 text-xs font-semibold text-[var(--sg-shell-600)]">
                {comparable(getFinalValue(finalArtifact, activeChange)) ===
                comparable(activeChange.proposed)
                  ? "Using suggestion"
                  : comparable(getFinalValue(finalArtifact, activeChange)) ===
                      comparable(activeChange.original)
                    ? "Keeping yours"
                    : "Edited"}
              </span>
            </div>

            <div className="grid gap-px bg-[var(--sg-shell-border)] sm:grid-cols-2">
              <div className="bg-[var(--sg-shell-white)] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--sg-shell-500)]">
                  Your wording
                </p>
                <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[var(--sg-shell-700)]">
                  {Array.isArray(activeChange.original)
                    ? activeChange.original.join(", ") || "No evidence selected"
                    : activeChange.original}
                </p>
              </div>
              <div className="bg-[var(--sg-forest-50)] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--sg-forest-700)]">
                  SkillGap suggestion
                </p>
                <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[var(--sg-shell-800)]">
                  {Array.isArray(activeChange.proposed)
                    ? activeChange.proposed.join(", ") ||
                      "No evidence selected"
                    : activeChange.proposed}
                </p>
              </div>
            </div>

            <div className="border-t border-[var(--sg-shell-border)] px-5 py-5 sm:px-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="min-h-11"
                  leftIcon={<RotateCcw size={15} aria-hidden="true" />}
                  onClick={() => chooseActive("original")}
                >
                  Keep my wording
                </Button>
                <Button
                  variant="primary"
                  className="min-h-11"
                  leftIcon={<Check size={15} aria-hidden="true" />}
                  onClick={() => chooseActive("proposed")}
                >
                  Use this change
                </Button>
              </div>

              <div className="mt-5 border-t border-[var(--sg-shell-border)] pt-5">
                <p className="mb-2 text-sm font-semibold text-[var(--sg-shell-700)]">
                  Final wording
                </p>
                {activeChange.field === "proofRefs" ? (
                  <div className="flex flex-wrap gap-2">
                    {context.proofs.map((proof) => {
                      const finalValue = getFinalValue(
                        finalArtifact,
                        activeChange,
                      ) as string[];
                      const selected = finalValue.includes(proof.id);
                      return (
                        <label
                          key={proof.id}
                          className={`flex min-h-11 cursor-pointer items-center rounded-full border px-3 py-2 text-sm font-semibold ${
                            selected
                              ? "border-[var(--sg-forest-500)] bg-[var(--sg-forest-50)] text-[var(--sg-forest-700)]"
                              : "border-[var(--sg-shell-border)] text-[var(--sg-shell-600)]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={selected}
                            onChange={() =>
                              onChange(
                                setFinalValue(
                                  finalArtifact,
                                  activeChange,
                                  selected
                                    ? finalValue.filter(
                                        (proofRef) => proofRef !== proof.id,
                                      )
                                    : [...finalValue, proof.id],
                                ),
                              )
                            }
                          />
                          {proof.id}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={
                      getFinalValue(finalArtifact, activeChange) as string
                    }
                    onChange={(event) =>
                      onChange(
                        setFinalValue(
                          finalArtifact,
                          activeChange,
                          event.target.value,
                        ),
                      )
                    }
                    maxLength={
                      activeChange.field === "channelDraft" ? 10_000 : 1_500
                    }
                    className="min-h-28 w-full resize-y rounded-[var(--sg-radius-md)] border border-[var(--sg-shell-border)] bg-[var(--sg-shell-50)] px-4 py-3 text-base leading-7 text-[var(--sg-shell-900)] outline-none focus:border-[var(--sg-forest-400)] focus:shadow-[var(--sg-shadow-focus)]"
                  />
                )}
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11"
              disabled={safeActiveIndex === 0}
              leftIcon={<ArrowLeft size={15} aria-hidden="true" />}
              onClick={() => setActiveChangeIndex(safeActiveIndex - 1)}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11"
              disabled={safeActiveIndex === changes.length - 1}
              rightIcon={<ArrowRight size={15} aria-hidden="true" />}
              onClick={() => setActiveChangeIndex(safeActiveIndex + 1)}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}
    </section>
  );
}
