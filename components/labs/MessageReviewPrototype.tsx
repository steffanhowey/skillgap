"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Clipboard,
  Download,
  FlaskConical,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { ContextConfirmation } from "./ContextConfirmation";
import { PressureTestResults } from "./PressureTestResults";
import { RevisionDiff } from "./RevisionDiff";
import { StructuredMessageMatrix } from "./StructuredMessageMatrix";
import { Logo } from "@/components/shell/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  MESSAGE_REVIEW_DISCLOSURE_VERSION,
  MESSAGE_REVIEW_EXPERIMENT_VERSION,
} from "@/lib/labs/messageReview/config";
import {
  createMessageMatrixCsv,
  formatChannelAsset,
  formatMessageMatrix,
  formatReviewReport,
} from "@/lib/labs/messageReview/export";
import {
  ConfirmedMessageReviewContextSchema,
  MessageReviewExtractionResponseSchema,
  MessageReviewResultSchema,
  MessageReviewReviewRequestSchema,
} from "@/lib/labs/messageReview/schemas";
import type {
  ExtractedMessageReviewContext,
  MessageReviewArtifact,
  MessageReviewContext,
  MessageReviewExportType,
  MessageReviewResult,
  MessageReviewStudyEvent,
} from "@/lib/labs/messageReview/types";

type PrototypePhase = "bring" | "confirm" | "artifact" | "results";
type ResultView = "findings" | "revision" | "export";

const STEPS = [
  "Add your work",
  "Check the source",
  "Check the draft",
  "See what needs attention",
  "Choose changes",
  "Use your draft",
] as const;

const TEXTAREA_CLASS =
  "w-full resize-y rounded-[var(--sg-radius-md)] border border-[var(--sg-shell-border)] bg-[var(--sg-shell-50)] px-4 py-3 text-base leading-7 text-[var(--sg-shell-900)] outline-none transition-colors placeholder:text-[var(--sg-shell-500)] focus:border-[var(--sg-forest-400)] focus:shadow-[var(--sg-shadow-focus)]";

function phaseStep(phase: PrototypePhase, resultView: ResultView): number {
  if (phase === "bring") return 0;
  if (phase === "confirm") return 1;
  if (phase === "artifact") return 2;
  if (resultView === "findings") return 3;
  if (resultView === "revision") return 4;
  return 5;
}

function durationBucket(
  startedAt: number,
): "under_2m" | "2_to_5m" | "5_to_10m" | "over_10m" {
  const minutes = (Date.now() - startedAt) / 60_000;
  if (minutes < 2) return "under_2m";
  if (minutes < 5) return "2_to_5m";
  if (minutes < 10) return "5_to_10m";
  return "over_10m";
}

function firstValidationError(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): string {
  const issue = error.issues[0];
  if (!issue) return "Check the required fields and try again.";
  const field = issue.path.filter((part) => typeof part !== "number").at(-1);
  return `${typeof field === "string" ? field : "Field"}: ${issue.message}`;
}

/**
 * Invitation-only, browser-session message-review validation workflow.
 */
export function MessageReviewPrototype() {
  const [studyParticipantId, setStudyParticipantId] = useState("");
  const [phase, setPhase] = useState<PrototypePhase>("bring");
  const [brief, setBrief] = useState("");
  const [artifactText, setArtifactText] = useState("");
  const [authorizedContent, setAuthorizedContent] = useState(false);
  const [processingAccepted, setProcessingAccepted] = useState(false);
  const [humanResearchConsent, setHumanResearchConsent] = useState(false);
  const [context, setContext] =
    useState<ExtractedMessageReviewContext | null>(null);
  const [artifact, setArtifact] = useState<MessageReviewArtifact | null>(null);
  const [originalArtifact, setOriginalArtifact] =
    useState<MessageReviewArtifact | null>(null);
  const [finalArtifact, setFinalArtifact] =
    useState<MessageReviewArtifact | null>(null);
  const [result, setResult] = useState<MessageReviewResult | null>(null);
  const [resultView, setResultView] = useState<ResultView>("findings");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    setStudyParticipantId(crypto.randomUUID());
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase, resultView]);

  const sendEvent = (
    event: MessageReviewStudyEvent,
    properties: Record<string, unknown> = {},
  ): void => {
    if (!studyParticipantId) return;
    void fetch("/api/labs/message-review/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        experimentVersion: MESSAGE_REVIEW_EXPERIMENT_VERSION,
        studyParticipantId,
        ...properties,
      }),
    }).catch(() => undefined);
  };

  const handleExtraction = async (): Promise<void> => {
    setError(null);
    if (!authorizedContent || !processingAccepted) {
      setError("Confirm authorization and OpenAI processing before continuing.");
      return;
    }
    if (!studyParticipantId) {
      setError("The lab session is still initializing. Try again.");
      return;
    }

    setBusy(true);
    sendEvent("message_review_started", { operatorRescue: false });
    try {
      const response = await fetch("/api/labs/message-review/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          artifactText,
          studyParticipantId,
          disclosureVersion: MESSAGE_REVIEW_DISCLOSURE_VERSION,
          processingDisclosureAccepted: true,
        }),
      });
      const raw: unknown = await response.json();
      const parsed = MessageReviewExtractionResponseSchema.safeParse(raw);
      if (!response.ok || !parsed.success) {
        setError(
          response.status === 503
            ? "Context extraction is unavailable. Your text was not saved."
            : "Check the brief and artifact length, then try again.",
        );
        return;
      }

      setContext(parsed.data.context);
      setArtifact(parsed.data.artifact);
      setOriginalArtifact(parsed.data.artifact);
      setPhase("confirm");
    } catch {
      setError("Context extraction is unavailable. Your text was not saved.");
    } finally {
      setBusy(false);
    }
  };

  const handleContextChange = (
    nextContext: ExtractedMessageReviewContext,
  ): void => {
    const knownProofIds = new Set(nextContext.proofs.map((proof) => proof.id));
    setContext(nextContext);
    setArtifact((current) =>
      current
        ? {
            ...current,
            rows: current.rows.map((row) => ({
              ...row,
              proofRefs: row.proofRefs.filter((proofRef) =>
                knownProofIds.has(proofRef),
              ),
            })),
          }
        : current,
    );
  };

  const handleContextConfirmation = (): void => {
    if (!context) return;
    setError(null);
    const parsed = ConfirmedMessageReviewContextSchema.safeParse(context);
    if (!parsed.success) {
      setError(firstValidationError(parsed.error));
      return;
    }

    setContext(parsed.data);
    sendEvent("context_confirmed", {
      durationBucket: durationBucket(startedAt),
      operatorRescue: false,
    });
    setPhase("artifact");
  };

  const handleReview = async (): Promise<void> => {
    if (!context || !artifact || !studyParticipantId) return;
    setError(null);

    const requestPayload = {
      context,
      artifact,
      studyParticipantId,
      experimentVersion: MESSAGE_REVIEW_EXPERIMENT_VERSION,
      disclosureVersion: MESSAGE_REVIEW_DISCLOSURE_VERSION,
      processingDisclosureAccepted: processingAccepted,
      humanResearchConsent,
    };
    const validated = MessageReviewReviewRequestSchema.safeParse(requestPayload);
    if (!validated.success) {
      setError(firstValidationError(validated.error));
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/labs/message-review/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });
      const raw: unknown = await response.json();
      const parsed = MessageReviewResultSchema.safeParse(raw);
      if (!parsed.success) {
        setError("Review unavailable. Your original artifact is unchanged.");
        return;
      }

      setResult(parsed.data);
      setOriginalArtifact(artifact);
      setFinalArtifact(artifact);
      setResultView("findings");
      setPhase("results");
      const issueCounts = parsed.data.issues.reduce(
        (counts, issue) => ({
          ...counts,
          [issue.severity]: counts[issue.severity] + 1,
        }),
        { blocking: 0, material: 0, minor: 0 },
      );
      sendEvent("pressure_test_completed", {
        durationBucket: durationBucket(startedAt),
        issueCounts,
        operatorRescue: false,
      });
    } catch {
      setError("Review unavailable. Your original artifact is unchanged.");
    } finally {
      setBusy(false);
    }
  };

  const recordExport = (exportType: MessageReviewExportType): void => {
    sendEvent("revision_exported", {
      durationBucket: durationBucket(startedAt),
      exportType,
      operatorRescue: false,
    });
  };

  const copyExport = async (
    value: string,
    exportType: MessageReviewExportType,
    label: string,
  ): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setExportNotice(`${label} copied.`);
      recordExport(exportType);
    } catch {
      setExportNotice("Clipboard access failed. Select and copy manually.");
    }
  };

  const downloadCsv = (): void => {
    if (!finalArtifact) return;
    const blob = new Blob([createMessageMatrixCsv(finalArtifact)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "message-matrix.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setExportNotice("Matrix CSV downloaded.");
    recordExport("matrix_csv");
  };

  const handleSecondReview = (): void => {
    if (!finalArtifact) return;
    sendEvent("second_review_started", {
      durationBucket: durationBucket(startedAt),
      operatorRescue: false,
    });
    setArtifact(finalArtifact);
    setOriginalArtifact(finalArtifact);
    setResult(null);
    setResultView("findings");
    setFinalArtifact(null);
    setExportNotice(null);
    setError(null);
    setPhase("artifact");
  };

  const currentStep = phaseStep(phase, resultView);
  const confirmedContext =
    context && context.channel
      ? ({ ...context, channel: context.channel } as MessageReviewContext)
      : null;

  return (
    <div className="min-h-screen bg-[var(--sg-shell-50)] text-[var(--sg-shell-900)]">
      <header className="border-b border-[var(--sg-shell-border)] bg-[var(--sg-shell-white)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo href="/missions" height={30} />
            <span className="border-l border-[var(--sg-shell-border)] pl-4 text-sm font-semibold text-[var(--sg-shell-700)]">
              Message review
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--sg-shell-100)] px-3 py-1.5 text-xs font-semibold text-[var(--sg-shell-600)]">
            <FlaskConical size={14} aria-hidden="true" />
            Private preview
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div aria-label="Review progress" className="mb-9">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold text-[var(--sg-shell-900)]">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-right text-[var(--sg-shell-600)]">
              {STEPS[currentStep]}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-[var(--sg-shell-200)]"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={currentStep + 1}
          >
            <div
              className="h-full rounded-full bg-[var(--sg-forest-500)] transition-[width] duration-200"
              style={{
                width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {phase === "bring" ? (
          <section aria-labelledby="bring-title" className="space-y-7">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sg-forest-600)]">
                Claim-safe message review
              </p>
              <h1
                id="bring-title"
                className="mt-3 text-4xl font-semibold tracking-tight text-[var(--sg-shell-900)] sm:text-5xl"
              >
                Check every claim before your message ships.
              </h1>
              <p className="mt-4 text-lg leading-8 text-[var(--sg-shell-600)]">
                Paste your source of truth and draft. SkillGap finds unsupported
                claims, audience drift, and weak differentiation, then suggests
                a grounded revision for you to approve.
              </p>
            </div>

            <Card className="p-5 sm:p-7">
              <div className="space-y-7">
                <label className="block space-y-2">
                  <span className="flex items-center gap-3 text-base font-semibold text-[var(--sg-shell-900)]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--sg-shell-900)] text-xs text-[var(--sg-shell-white)]">
                      1
                    </span>
                    Source of truth
                  </span>
                  <span className="block pl-10 text-sm leading-6 text-[var(--sg-shell-600)]">
                    Paste the brief, approved evidence, audience, action, and
                    claim boundaries.
                  </span>
                  <div className="pt-1">
                    <textarea
                      value={brief}
                      onChange={(event) => setBrief(event.target.value)}
                      minLength={200}
                      maxLength={20_000}
                      className={`${TEXTAREA_CLASS} min-h-52`}
                      placeholder="Paste the approved brief or source packet…"
                    />
                  </div>
                  <span className="block text-right text-xs text-[var(--sg-shell-500)]">
                    {brief.length.toLocaleString()} / 20,000
                  </span>
                </label>

                <div className="h-px bg-[var(--sg-shell-border)]" />

                <label className="block space-y-2">
                  <span className="flex items-center gap-3 text-base font-semibold text-[var(--sg-shell-900)]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--sg-shell-900)] text-xs text-[var(--sg-shell-white)]">
                      2
                    </span>
                    Message to review
                  </span>
                  <span className="block pl-10 text-sm leading-6 text-[var(--sg-shell-600)]">
                    Paste the exact matrix, campaign copy, or launch message you
                    want checked.
                  </span>
                  <div className="pt-1">
                    <textarea
                      value={artifactText}
                      onChange={(event) => setArtifactText(event.target.value)}
                      minLength={50}
                      maxLength={20_000}
                      className={`${TEXTAREA_CLASS} min-h-52`}
                      placeholder="Paste the draft you plan to use…"
                    />
                  </div>
                  <span className="block text-right text-xs text-[var(--sg-shell-500)]">
                    {artifactText.length.toLocaleString()} / 20,000
                  </span>
                </label>
              </div>

              <div className="mt-7 border-t border-[var(--sg-shell-border)] pt-6">
                <label className="flex cursor-pointer items-start gap-3 text-base leading-6 text-[var(--sg-shell-700)]">
                  <input
                    type="checkbox"
                    checked={authorizedContent && processingAccepted}
                    onChange={(event) => {
                      setAuthorizedContent(event.target.checked);
                      setProcessingAccepted(event.target.checked);
                    }}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--sg-forest-500)]"
                  />
                  <span>
                    I am authorized to submit this text and understand it is
                    processed by OpenAI.
                  </span>
                </label>

                <details className="group mt-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[var(--sg-shell-600)] [&::-webkit-details-marker]:hidden">
                    How your text is handled
                    <ChevronDown
                      className="transition-transform duration-200 group-open:rotate-180"
                      size={17}
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="pb-2 text-sm leading-6 text-[var(--sg-shell-600)]">
                    <ul className="space-y-2">
                      <li>
                        Your brief and draft are sent to OpenAI for extraction
                        and review.
                      </li>
                      <li>
                        Do not submit information your organization prohibits.
                      </li>
                      <li>
                        Your content stays in this browser session and is not
                        written to SkillGap product storage, logs, or analytics.
                      </li>
                      <li>
                        Human judges see content only with separate consent.
                        Consented bundles are de-identified, access-restricted,
                        and deleted within 30 days of adjudication.
                      </li>
                    </ul>
                    <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-[var(--sg-shell-border)] pt-4">
                      <input
                        type="checkbox"
                        checked={humanResearchConsent}
                        onChange={(event) =>
                          setHumanResearchConsent(event.target.checked)
                        }
                        className="mt-1 h-5 w-5 shrink-0 accent-[var(--sg-forest-500)]"
                      />
                      <span>
                        Optional: let authorized research judges review a
                        de-identified study bundle.
                      </span>
                    </label>
                  </div>
                </details>

                {error ? (
                  <p
                    role="alert"
                    className="mt-4 text-sm text-[var(--sg-coral-700)]"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <p
                    aria-live="polite"
                    className="text-sm text-[var(--sg-shell-600)]"
                  >
                    {busy
                      ? "Reading your source and mapping the draft. This usually takes 5–15 seconds."
                      : "You will check the extracted source before the review runs."}
                  </p>
                  <Button
                    variant="primary"
                    loading={busy}
                    disabled={
                      brief.trim().length < 200 ||
                      artifactText.trim().length < 50 ||
                      !authorizedContent ||
                      !processingAccepted
                    }
                    rightIcon={<ArrowRight size={16} aria-hidden="true" />}
                    onClick={() => void handleExtraction()}
                  >
                    {busy
                      ? "Reading your work…"
                      : "Check what SkillGap understood"}
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        ) : null}

        {phase === "confirm" && context ? (
          <>
            <ContextConfirmation
              context={context}
              onChange={handleContextChange}
              error={error}
            />
            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <Button
                variant="ghost"
                leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
                onClick={() => {
                  setError(null);
                  setPhase("bring");
                }}
              >
                Edit pasted work
              </Button>
              <Button
                variant="primary"
                rightIcon={<ArrowRight size={16} aria-hidden="true" />}
                onClick={handleContextConfirmation}
              >
                Yes, use this source
              </Button>
            </div>
          </>
        ) : null}

        {phase === "artifact" && artifact && confirmedContext ? (
          <>
            <StructuredMessageMatrix
              artifact={artifact}
              context={confirmedContext}
              onChange={setArtifact}
              error={error}
            />
            <details className="group mt-5 border-t border-[var(--sg-shell-border)] pt-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[var(--sg-shell-600)] [&::-webkit-details-marker]:hidden">
                About this review
                <ChevronDown
                  className="transition-transform duration-200 group-open:rotate-180"
                  size={17}
                  aria-hidden="true"
                />
              </summary>
              <p className="pb-2 text-sm leading-6 text-[var(--sg-shell-600)]">
                SkillGap reviews only the source and draft you confirmed. This
                private preview does not update your progress, skills, or public
                profile.
              </p>
            </details>
            {busy ? (
              <p
                aria-live="polite"
                className="mt-6 text-sm font-medium text-[var(--sg-shell-600)]"
              >
                Checking each claim against your evidence. This usually takes
                5–15 seconds.
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <Button
                variant="ghost"
                leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
                onClick={() => {
                  setError(null);
                  setPhase("confirm");
                }}
              >
                Back to source
              </Button>
              <Button
                variant="primary"
                loading={busy}
                rightIcon={<ArrowRight size={16} aria-hidden="true" />}
                onClick={() => void handleReview()}
              >
                {busy ? "Reviewing your draft…" : "Find risks and improve it"}
              </Button>
            </div>
          </>
        ) : null}

        {phase === "results" &&
        result &&
        originalArtifact &&
        finalArtifact &&
        confirmedContext ? (
          <>
            {resultView === "findings" ? (
              <div>
                <PressureTestResults result={result} />
                <div className="mt-8 flex flex-wrap justify-between gap-3">
                  <Button
                    variant="ghost"
                    leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
                    onClick={() => setPhase("artifact")}
                  >
                    Edit original draft
                  </Button>
                  {result.status !== "unavailable" ? (
                    <Button
                      variant="primary"
                      rightIcon={<ArrowRight size={16} aria-hidden="true" />}
                      onClick={() => setResultView("revision")}
                    >
                      Review suggested changes
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      leftIcon={<RefreshCw size={16} aria-hidden="true" />}
                      onClick={() => setPhase("artifact")}
                    >
                      Try review again
                    </Button>
                  )}
                </div>
              </div>
            ) : null}

            {resultView === "revision" &&
            result.status !== "unavailable" ? (
              <div>
              <RevisionDiff
                original={originalArtifact}
                proposed={result.revisedArtifact}
                finalArtifact={finalArtifact}
                context={confirmedContext}
                onChange={setFinalArtifact}
              />
                <div className="mt-8 flex flex-wrap justify-between gap-3">
                  <Button
                    variant="ghost"
                    leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
                    onClick={() => setResultView("findings")}
                  >
                    Back to findings
                  </Button>
                  <Button
                    variant="primary"
                    rightIcon={<ArrowRight size={16} aria-hidden="true" />}
                    onClick={() => setResultView("export")}
                  >
                    Finish review
                  </Button>
                </div>
              </div>
            ) : null}

            {resultView === "export" && result.status !== "unavailable" ? (
              <section aria-labelledby="export-title" className="space-y-6">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sg-forest-600)]">
                    Ready to use
                  </p>
                  <h2
                    id="export-title"
                    className="mt-2 text-3xl font-semibold tracking-tight text-[var(--sg-shell-900)] sm:text-4xl"
                  >
                    Your reviewed draft is ready.
                  </h2>
                  <p className="mt-3 text-base leading-7 text-[var(--sg-shell-600)]">
                    This is the final wording you approved.
                  </p>
                </div>

                <Card className="overflow-hidden">
                  <div className="bg-[var(--sg-shell-50)] px-5 py-5 sm:px-6">
                    <p className="whitespace-pre-wrap text-base leading-7 text-[var(--sg-shell-800)]">
                      {finalArtifact.channelDraft}
                    </p>
                  </div>
                  <div className="border-t border-[var(--sg-shell-border)] px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="primary"
                        leftIcon={<Clipboard size={15} aria-hidden="true" />}
                        onClick={() =>
                          void copyExport(
                            formatChannelAsset(finalArtifact),
                            "channel_asset",
                            "Reviewed draft",
                          )
                        }
                      >
                        Copy reviewed draft
                      </Button>
                      <Button
                        variant="outline"
                        leftIcon={<Clipboard size={15} aria-hidden="true" />}
                        onClick={() =>
                          void copyExport(
                            formatMessageMatrix(finalArtifact),
                            "formatted_text",
                            "Full message matrix",
                          )
                        }
                      >
                        Copy full matrix
                      </Button>
                    </div>

                    {exportNotice ? (
                      <p
                        aria-live="polite"
                        className="mt-4 text-sm font-semibold text-[var(--sg-forest-600)]"
                      >
                        {exportNotice}
                      </p>
                    ) : null}
                  </div>
                </Card>

                <details className="group border-y border-[var(--sg-shell-border)]">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-[var(--sg-shell-700)] [&::-webkit-details-marker]:hidden">
                    More export options
                    <ChevronDown
                      className="transition-transform duration-200 group-open:rotate-180"
                      size={18}
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="flex flex-wrap gap-3 pb-5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      leftIcon={<Download size={15} aria-hidden="true" />}
                      onClick={downloadCsv}
                    >
                      Download matrix CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      leftIcon={<Clipboard size={15} aria-hidden="true" />}
                      onClick={() =>
                        void copyExport(
                          formatReviewReport(confirmedContext, {
                            ...result,
                            revisedArtifact: finalArtifact,
                          }),
                          "review_report",
                          "Review report",
                        )
                      }
                    >
                      Copy evidence report
                    </Button>
                  </div>
                </details>

                <p className="flex items-start gap-2 text-xs leading-5 text-[var(--sg-shell-500)]">
                  <ShieldCheck
                    className="mt-0.5 shrink-0"
                    size={14}
                    aria-hidden="true"
                  />
                  Checked only against the source you supplied. Final factual
                  accuracy and stakeholder approval remain yours.
                </p>

                <div className="flex flex-wrap justify-between gap-3">
                  <Button
                    variant="ghost"
                    leftIcon={<ArrowLeft size={16} aria-hidden="true" />}
                    onClick={() => setResultView("revision")}
                  >
                    Back to changes
                  </Button>
                  <Button
                    variant="ghost"
                    leftIcon={<RefreshCw size={16} aria-hidden="true" />}
                    onClick={handleSecondReview}
                  >
                    Review another draft
                  </Button>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
