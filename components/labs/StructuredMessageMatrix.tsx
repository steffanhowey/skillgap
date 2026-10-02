"use client";

import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type {
  MessageMatrixRow,
  MessageReviewArtifact,
  MessageReviewContext,
} from "@/lib/labs/messageReview/types";

interface StructuredMessageMatrixProps {
  artifact: MessageReviewArtifact;
  context: MessageReviewContext;
  onChange: (artifact: MessageReviewArtifact) => void;
  error: string | null;
  embedded?: boolean;
}

interface RowFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  tall?: boolean;
}

const TEXTAREA_CLASS =
  "w-full resize-y rounded-[var(--sg-radius-md)] border border-[var(--sg-shell-border)] bg-[var(--sg-shell-50)] px-3.5 py-3 text-base leading-6 text-[var(--sg-shell-900)] outline-none transition-colors placeholder:text-[var(--sg-shell-500)] focus:border-[var(--sg-forest-400)] focus:shadow-[var(--sg-shadow-focus)]";

function RowField({
  label,
  value,
  onChange,
  maxLength = 1_500,
  tall = false,
}: RowFieldProps) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-[var(--sg-shell-700)]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        className={`${TEXTAREA_CLASS} ${tall ? "min-h-28" : "min-h-20"}`}
      />
    </label>
  );
}

/**
 * Structured editor for the original three-angle message matrix.
 */
export function StructuredMessageMatrix({
  artifact,
  context,
  onChange,
  error,
  embedded = false,
}: StructuredMessageMatrixProps) {
  const updateRow = (
    rowId: string,
    patch: Partial<MessageMatrixRow>,
  ): void => {
    onChange({
      ...artifact,
      rows: artifact.rows.map((row) =>
        row.rowId === rowId ? { ...row, ...patch } : row,
      ),
    });
  };

  return (
    <section
      aria-labelledby={embedded ? undefined : "matrix-title"}
      className="space-y-5"
    >
      {embedded ? null : (
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sg-forest-600)]">
          Draft check
        </p>
        <h2
          id="matrix-title"
          className="mt-2 text-3xl font-semibold tracking-tight text-[var(--sg-shell-900)] sm:text-4xl"
        >
          Check the message SkillGap found.
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--sg-shell-600)]">
          Review the final draft first. Expand a message angle only if the
          extraction looks wrong.
        </p>
      </div>
      )}

      <Card className="p-5 sm:p-6">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--sg-shell-800)]">
            Message that will be reviewed
          </span>
          <textarea
            value={artifact.channelDraft}
            onChange={(event) =>
              onChange({ ...artifact, channelDraft: event.target.value })
            }
            maxLength={10_000}
            className={`${TEXTAREA_CLASS} min-h-36`}
          />
        </label>
      </Card>

      <div>
        <h3 className="text-lg font-semibold text-[var(--sg-shell-900)]">
          Supporting message angles
        </h3>
        <p className="mt-1 text-sm leading-6 text-[var(--sg-shell-600)]">
          SkillGap uses these to check audience fit, evidence, objections, and
          differentiation.
        </p>
      </div>

      <div className="space-y-3">
        {artifact.rows.map((row, index) => (
          <Card key={row.rowId} className="overflow-hidden">
            <details className="group">
              <summary className="flex min-h-24 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sg-shell-500)]">
                      Angle {index + 1}
                    </span>
                    {row.proofRefs.map((proofRef) => (
                      <span
                        key={proofRef}
                        className="rounded-full bg-[var(--sg-forest-50)] px-2 py-0.5 text-xs font-semibold text-[var(--sg-forest-700)]"
                      >
                        {proofRef}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 font-semibold text-[var(--sg-shell-900)]">
                    {row.messageAngle || "Untitled message angle"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-base leading-6 text-[var(--sg-shell-600)]">
                    {row.valueClaim}
                  </p>
                </div>
                <ChevronDown
                  className="shrink-0 text-[var(--sg-shell-500)] transition-transform duration-200 group-open:rotate-180"
                  size={20}
                  aria-hidden="true"
                />
              </summary>

              <div className="border-t border-[var(--sg-shell-border)] bg-[var(--sg-shell-50)] p-5 sm:p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <RowField
                    label="Message angle"
                    value={row.messageAngle}
                    onChange={(value) =>
                      updateRow(row.rowId, { messageAngle: value })
                    }
                  />
                  <RowField
                    label="Value claim"
                    value={row.valueClaim}
                    onChange={(value) =>
                      updateRow(row.rowId, { valueClaim: value })
                    }
                    tall
                  />

                  <div className="sm:col-span-2">
                    <p className="text-sm font-semibold text-[var(--sg-shell-700)]">
                      Evidence used by this claim
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {context.proofs.map((proof) => {
                        const selected = row.proofRefs.includes(proof.id);
                        return (
                          <label
                            key={proof.id}
                            className={`flex min-h-11 cursor-pointer items-center rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                              selected
                                ? "border-[var(--sg-forest-500)] bg-[var(--sg-forest-50)] text-[var(--sg-forest-700)]"
                                : "border-[var(--sg-shell-border)] bg-[var(--sg-shell-white)] text-[var(--sg-shell-600)] hover:border-[var(--sg-shell-400)]"
                            }`}
                            title={proof.text}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={selected}
                              onChange={() =>
                                updateRow(row.rowId, {
                                  proofRefs: selected
                                    ? row.proofRefs.filter(
                                        (proofRef) => proofRef !== proof.id,
                                      )
                                    : [...row.proofRefs, proof.id],
                                })
                              }
                            />
                            {proof.id} ·{" "}
                            {proof.status === "approved_fact"
                              ? "approved"
                              : "hypothesis"}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <RowField
                    label="Plausible objection"
                    value={row.objection}
                    onChange={(value) =>
                      updateRow(row.rowId, { objection: value })
                    }
                    tall
                  />
                  <RowField
                    label="Response"
                    value={row.response}
                    onChange={(value) =>
                      updateRow(row.rowId, { response: value })
                    }
                    tall
                  />
                  <div className="sm:col-span-2">
                    <RowField
                      label="Channel expression"
                      value={row.channelExpression}
                      onChange={(value) =>
                        updateRow(row.rowId, { channelExpression: value })
                      }
                      tall
                    />
                  </div>
                </div>

                <details className="group/advanced mt-5 border-t border-[var(--sg-shell-border)] pt-5">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-[var(--sg-shell-700)] [&::-webkit-details-marker]:hidden">
                    Check audience and alternative details
                    <ChevronDown
                      className="transition-transform duration-200 group-open/advanced:rotate-180"
                      size={17}
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <RowField
                      label="Audience and urgent job"
                      value={row.audienceJob}
                      onChange={(value) =>
                        updateRow(row.rowId, { audienceJob: value })
                      }
                    />
                    <RowField
                      label="Desired action"
                      value={row.desiredAction}
                      onChange={(value) =>
                        updateRow(row.rowId, { desiredAction: value })
                      }
                      maxLength={500}
                    />
                    <div className="sm:col-span-2">
                      <RowField
                        label="Current alternative"
                        value={row.currentAlternative}
                        onChange={(value) =>
                          updateRow(row.rowId, { currentAlternative: value })
                        }
                        maxLength={1_000}
                      />
                    </div>
                  </div>
                </details>
              </div>
            </details>
          </Card>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[var(--sg-coral-700)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
