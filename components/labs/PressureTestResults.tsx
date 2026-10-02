"use client";

import {
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  CircleAlert,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { REVIEW_DISCLAIMER } from "@/lib/labs/messageReview/export";
import type {
  MessageReviewIssue,
  MessageReviewResult,
  ReviewRuleId,
} from "@/lib/labs/messageReview/types";

interface PressureTestResultsProps {
  result: MessageReviewResult;
  embedded?: boolean;
}

const STATUS_CONFIG: Record<
  MessageReviewResult["status"],
  {
    label: string;
    detail: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  blocking_issues: {
    label: "Must-fix issues found",
    detail: "Fix the unsupported or unsafe claims before sharing this message.",
    className:
      "border-[var(--sg-coral-300)] bg-[var(--sg-coral-100)] text-[var(--sg-coral-700)]",
    icon: CircleAlert,
  },
  material_revisions: {
    label: "Important improvements found",
    detail: "The message is grounded, but it can be clearer and more defensible.",
    className:
      "border-[var(--sg-gold-300)] bg-[var(--sg-gold-100)] text-[var(--sg-gold-900)]",
    icon: AlertTriangle,
  },
  checklist_cleared: {
    label: "Clear against your source",
    detail: "No major issue remains against the context and evidence you supplied.",
    className:
      "border-[var(--sg-forest-200)] bg-[var(--sg-forest-50)] text-[var(--sg-forest-700)]",
    icon: CheckCircle2,
  },
  unavailable: {
    label: "Review unavailable",
    detail: "Your original draft is unchanged. Try the review again.",
    className:
      "border-[var(--sg-shell-300)] bg-[var(--sg-shell-100)] text-[var(--sg-shell-700)]",
    icon: Info,
  },
};

const RULE_LABELS: Record<ReviewRuleId, string> = {
  claim_to_proof: "Unsupported claim",
  audience_action_fit: "Audience or action drift",
  differentiation: "Weak differentiation",
  objection_quality: "Weak objection response",
  channel_fit: "Wrong for the channel",
  constraint_compliance: "Breaks a stated boundary",
  prompt_injection: "Embedded instruction",
};

const FIELD_LABELS: Partial<Record<MessageReviewIssue["field"], string>> = {
  audienceJob: "Audience",
  desiredAction: "Desired action",
  currentAlternative: "Current alternative",
  messageAngle: "Message angle",
  valueClaim: "Value claim",
  objection: "Objection",
  response: "Response",
  channelExpression: "Channel expression",
  channelDraft: "Final draft",
};

function issueLocation(issue: MessageReviewIssue): string {
  const rowNumber = issue.rowId?.match(/\d+/)?.[0];
  const area = rowNumber ? `Angle ${rowNumber}` : "Final draft";
  return `${area} · ${FIELD_LABELS[issue.field] ?? issue.field}`;
}

function severityLabel(severity: MessageReviewIssue["severity"]): string {
  if (severity === "blocking") return "Must fix";
  if (severity === "material") return "Worth fixing";
  return "Polish";
}

/**
 * Annotated issue list and claim-to-proof map for a completed pressure test.
 */
export function PressureTestResults({
  result,
  embedded = false,
}: PressureTestResultsProps) {
  const status = STATUS_CONFIG[result.status];
  const StatusIcon = status.icon;
  const issueCount = result.issues.length;

  return (
    <section
      aria-labelledby={embedded ? undefined : "results-title"}
      className="space-y-5"
    >
      {embedded ? null : (
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sg-forest-600)]">
          Review complete
        </p>
        <h2
          id="results-title"
          className="mt-2 text-3xl font-semibold tracking-tight text-[var(--sg-shell-900)] sm:text-4xl"
        >
          {result.status === "blocking_issues"
            ? "Do not send this yet."
            : result.status === "material_revisions"
              ? "This is worth revising."
              : result.status === "checklist_cleared"
                ? "No major issue found."
                : "We could not finish the review."}
        </h2>
        {result.status !== "unavailable" ? (
          <p className="mt-3 text-base leading-7 text-[var(--sg-shell-600)]">
            {issueCount === 0
              ? "The draft cleared the review against the source you supplied."
              : `SkillGap found ${issueCount} ${issueCount === 1 ? "issue" : "issues"} against the source you supplied.`}
          </p>
        ) : null}
      </div>
      )}

      <Card className={`p-5 sm:p-6 ${status.className}`}>
        <div className="flex items-start gap-3">
          <StatusIcon className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
          <div>
            <h3 className="font-semibold">{status.label}</h3>
            <p className="mt-1 text-base leading-6 opacity-90">{status.detail}</p>
          </div>
        </div>
      </Card>

      {result.issues.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-[var(--sg-shell-900)]">
              What needs attention
            </h3>
          </div>
          <div className="divide-y divide-[var(--sg-shell-border)] border-t border-[var(--sg-shell-border)]">
            {result.issues.map((issue, index) => (
              <article key={issue.issueId} className="px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      issue.severity === "blocking"
                        ? "bg-[var(--sg-coral-100)] text-[var(--sg-coral-700)]"
                        : issue.severity === "material"
                          ? "bg-[var(--sg-gold-100)] text-[var(--sg-gold-900)]"
                          : "bg-[var(--sg-shell-100)] text-[var(--sg-shell-700)]"
                    }`}
                  >
                    {severityLabel(issue.severity)}
                  </span>
                  <span className="font-semibold text-[var(--sg-shell-900)]">
                    {index + 1}. {RULE_LABELS[issue.ruleId]}
                  </span>
                  <span className="text-xs text-[var(--sg-shell-500)]">
                    {issueLocation(issue)}
                  </span>
                </div>

                <blockquote className="mt-4 rounded-[var(--sg-radius-sm)] bg-[var(--sg-shell-50)] px-4 py-3 text-base italic leading-6 text-[var(--sg-shell-700)]">
                  “{issue.evidenceQuote}”
                </blockquote>
                <p className="mt-4 text-base leading-6 text-[var(--sg-shell-700)]">
                  {issue.explanation}
                </p>
                <p className="mt-3 text-base font-semibold leading-6 text-[var(--sg-shell-900)]">
                  What to change: {issue.suggestedChange}
                </p>
                {issue.proofRefs.length > 0 ? (
                  <p className="mt-3 text-xs text-[var(--sg-shell-500)]">
                    Claim cites: {issue.proofRefs.join(", ")}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </Card>
      ) : null}

      {result.claimMappings.length > 0 ? (
        <Card className="overflow-hidden">
          <details className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-[var(--sg-shell-800)] sm:px-6 [&::-webkit-details-marker]:hidden">
              See the evidence check
              <ChevronDown
                className="shrink-0 text-[var(--sg-shell-500)] transition-transform duration-200 group-open:rotate-180"
                size={18}
                aria-hidden="true"
              />
            </summary>
            <div className="divide-y divide-[var(--sg-shell-border)] border-t border-[var(--sg-shell-border)]">
              {result.claimMappings.map((mapping, index) => (
                <div
                  key={`${mapping.rowId ?? "channelDraft"}-${mapping.field}-${index}`}
                  className="px-5 py-4 text-base sm:px-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--sg-shell-800)]">
                      {mapping.rowId?.replace("row-", "Angle ") ??
                        "Final draft"}
                    </span>
                    <span className="rounded-full bg-[var(--sg-shell-100)] px-2 py-0.5 text-xs font-semibold text-[var(--sg-shell-600)]">
                      {mapping.status}
                    </span>
                    <span className="text-xs text-[var(--sg-shell-500)]">
                      {mapping.proofRefs.join(", ") || "No evidence"}
                    </span>
                  </div>
                  <p className="mt-1 leading-6 text-[var(--sg-shell-700)]">
                    “{mapping.claim}”
                  </p>
                </div>
              ))}
            </div>
          </details>
        </Card>
      ) : null}

      <p className="flex items-start gap-2 text-xs leading-5 text-[var(--sg-shell-500)]">
        <Info className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
        {REVIEW_DISCLAIMER}
      </p>
    </section>
  );
}
