"use client";

import { useRef, useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type {
  ExtractedMessageReviewContext,
  MessageReviewChannel,
} from "@/lib/labs/messageReview/types";

interface ContextConfirmationProps {
  context: ExtractedMessageReviewContext;
  onChange: (context: ExtractedMessageReviewContext) => void;
  error: string | null;
  embedded?: boolean;
}

const CHANNEL_OPTIONS: Array<{
  value: MessageReviewChannel;
  label: string;
}> = [
  { value: "landing_page", label: "Landing page" },
  { value: "email", label: "Marketing email" },
  { value: "paid_social", label: "Paid social" },
  { value: "organic_social", label: "Organic social" },
  { value: "sales_enablement", label: "Sales enablement" },
  { value: "stakeholder_review", label: "Stakeholder review" },
];

const TEXTAREA_CLASS =
  "min-h-24 w-full resize-y rounded-[var(--sg-radius-md)] border border-[var(--sg-shell-border)] bg-[var(--sg-shell-50)] px-4 py-3 text-base leading-6 text-[var(--sg-shell-900)] outline-none transition-colors placeholder:text-[var(--sg-shell-500)] focus:border-[var(--sg-forest-400)] focus:shadow-[var(--sg-shadow-focus)]";

function nextProofId(
  proofs: ExtractedMessageReviewContext["proofs"],
): string {
  const highest = proofs.reduce((maximum, proof) => {
    const parsed = Number.parseInt(proof.id.replace("proof-", ""), 10);
    return Number.isFinite(parsed) ? Math.max(maximum, parsed) : maximum;
  }, 0);
  return `proof-${highest + 1}`;
}

/**
 * Editable confirmation form for the seven extracted context fields.
 */
export function ContextConfirmation({
  context,
  onChange,
  error,
  embedded = false,
}: ContextConfirmationProps) {
  const [editing, setEditing] = useState(embedded);
  const contextRef = useRef(context);
  contextRef.current = context;

  const update = <Key extends keyof ExtractedMessageReviewContext>(
    key: Key,
    value: ExtractedMessageReviewContext[Key],
  ): void => {
    const next = { ...contextRef.current, [key]: value };
    contextRef.current = next;
    onChange(next);
  };

  const channelLabel =
    CHANNEL_OPTIONS.find((option) => option.value === context.channel)?.label ??
    "Not found";

  return (
    <section
      aria-labelledby={embedded ? undefined : "confirm-frame-title"}
      className="space-y-5"
    >
      {embedded ? null : (
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sg-forest-600)]">
          Source check
        </p>
        <h2
          id="confirm-frame-title"
          className="mt-2 text-3xl font-semibold tracking-tight text-[var(--sg-shell-900)] sm:text-4xl"
        >
          Check what SkillGap understood.
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--sg-shell-600)]">
          This is the source of truth for the review. If something is wrong,
          edit it before continuing.
        </p>
      </div>
      )}

      {!editing ? (
        <Card className="overflow-hidden">
          <dl className="divide-y divide-[var(--sg-shell-border)]">
            {[
              ["What you are selling", context.offer],
              ["Who needs it and why", context.audienceProblem],
              ["What you want them to do", context.desiredAction],
              ["What they use today", context.currentAlternative],
              ["Where this message will appear", channelLabel],
              [
                "Voice and claim boundaries",
                context.voiceConstraints || "None supplied",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 px-5 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6 sm:px-6"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--sg-shell-500)]">
                  {label}
                </dt>
                <dd className="text-base leading-6 text-[var(--sg-shell-800)]">
                  {value || "Not found"}
                </dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-[var(--sg-shell-border)] bg-[var(--sg-shell-50)] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[var(--sg-shell-900)]">
                  Evidence SkillGap can use
                </h3>
                <p className="mt-1 text-sm text-[var(--sg-shell-600)]">
                  {context.proofs.length}{" "}
                  {context.proofs.length === 1 ? "entry" : "entries"} found
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Pencil size={15} aria-hidden="true" />}
                onClick={() => setEditing(true)}
              >
                Edit source
              </Button>
            </div>
            <ul className="mt-4 space-y-3">
              {context.proofs.map((proof) => (
                <li
                  key={proof.id}
                  className="flex items-start gap-3 text-base leading-6 text-[var(--sg-shell-700)]"
                >
                  <span className="mt-0.5 shrink-0 rounded-full bg-[var(--sg-shell-200)] px-2 py-0.5 text-xs font-semibold text-[var(--sg-shell-700)]">
                    {proof.status === "approved_fact" ? "Approved" : "Hypothesis"}
                  </span>
                  <span>{proof.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ) : (
        <Card className="p-5 sm:p-6">
          {embedded ? null : (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sg-shell-border)] pb-5">
            <div>
              <h3 className="text-lg font-semibold text-[var(--sg-shell-900)]">
                Edit the source
              </h3>
              <p className="mt-1 text-sm text-[var(--sg-shell-600)]">
                Blank means SkillGap could not find the answer.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Check size={15} aria-hidden="true" />}
              onClick={() => setEditing(false)}
            >
              Done editing
            </Button>
          </div>
          )}

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--sg-shell-800)]">
                Offer or product
              </span>
              <textarea
                value={context.offer}
                onChange={(event) => update("offer", event.target.value)}
                className={TEXTAREA_CLASS}
                maxLength={1_500}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--sg-shell-800)]">
                Audience and urgent problem
              </span>
              <textarea
                value={context.audienceProblem}
                onChange={(event) =>
                  update("audienceProblem", event.target.value)
                }
                className={TEXTAREA_CLASS}
                maxLength={1_500}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--sg-shell-800)]">
                Desired audience action
              </span>
              <textarea
                value={context.desiredAction}
                onChange={(event) => update("desiredAction", event.target.value)}
                className={TEXTAREA_CLASS}
                maxLength={500}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--sg-shell-800)]">
                Current alternative
              </span>
              <textarea
                value={context.currentAlternative}
                onChange={(event) =>
                  update("currentAlternative", event.target.value)
                }
                className={TEXTAREA_CLASS}
                maxLength={1_000}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--sg-shell-800)]">
                Destination channel
              </span>
              <select
                value={context.channel ?? ""}
                onChange={(event) =>
                  update(
                    "channel",
                    (event.target.value || null) as MessageReviewChannel | null,
                  )
                }
                className="h-11 w-full rounded-[var(--sg-radius-md)] border border-[var(--sg-shell-border)] bg-[var(--sg-shell-50)] px-4 text-base text-[var(--sg-shell-900)] outline-none focus:border-[var(--sg-forest-400)] focus:shadow-[var(--sg-shadow-focus)]"
              >
                <option value="">Choose a destination</option>
                {CHANNEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--sg-shell-800)]">
                Voice and prohibited claims
              </span>
              <textarea
                value={context.voiceConstraints}
                onChange={(event) =>
                  update("voiceConstraints", event.target.value)
                }
                className={TEXTAREA_CLASS}
                maxLength={1_500}
                placeholder="Voice guidance, words to avoid, legal boundaries…"
              />
            </label>
          </div>

          <div className="mt-6 border-t border-[var(--sg-shell-border)] pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--sg-shell-900)]">
                  Evidence SkillGap can use
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--sg-shell-600)]">
                  Mark assumptions as hypotheses so they are not presented as
                  established results.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus size={16} aria-hidden="true" />}
                onClick={() =>
                  update("proofs", [
                    ...contextRef.current.proofs,
                    {
                      id: nextProofId(contextRef.current.proofs),
                      text: "",
                      status: "approved_fact",
                    },
                  ])
                }
              >
                Add evidence
              </Button>
            </div>

            <div className="mt-4 divide-y divide-[var(--sg-shell-border)] border-y border-[var(--sg-shell-border)]">
              {context.proofs.length === 0 ? (
                <p className="py-4 text-sm text-[var(--sg-coral-700)]">
                  Add at least one approved fact or hypothesis.
                </p>
              ) : null}

              {context.proofs.map((proof, index) => (
                <div key={proof.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[var(--sg-shell-200)] px-2.5 py-1 text-xs font-semibold text-[var(--sg-shell-700)]">
                      {proof.id}
                    </span>
                    <label className="flex-1">
                      <span className="sr-only">Evidence status</span>
                      <select
                        value={proof.status}
                        onChange={(event) => {
                          const nextProofs = [...context.proofs];
                          nextProofs[index] = {
                            ...proof,
                            status: event.target.value as
                              | "approved_fact"
                              | "hypothesis",
                          };
                          update("proofs", nextProofs);
                        }}
                        className="h-11 rounded-[var(--sg-radius-btn)] border border-[var(--sg-shell-border)] bg-[var(--sg-shell-white)] px-3 text-sm font-semibold text-[var(--sg-shell-800)] outline-none focus:border-[var(--sg-forest-400)]"
                      >
                        <option value="approved_fact">Approved fact</option>
                        <option value="hypothesis">Hypothesis</option>
                      </select>
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 size={14} aria-hidden="true" />}
                      onClick={() =>
                        update(
                          "proofs",
                          context.proofs.filter(
                            (candidate) => candidate.id !== proof.id,
                          ),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    value={proof.text}
                    onChange={(event) => {
                      const nextProofs = [...context.proofs];
                      nextProofs[index] = {
                        ...proof,
                        text: event.target.value,
                      };
                      update("proofs", nextProofs);
                    }}
                    className="mt-3 w-full text-base"
                    maxLength={500}
                    placeholder="Exact approved evidence or clearly labeled hypothesis"
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {error ? (
        <p role="alert" className="text-sm text-[var(--sg-coral-700)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
