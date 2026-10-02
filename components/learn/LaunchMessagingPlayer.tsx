"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clipboard, Download } from "lucide-react";
import { ContextConfirmation } from "@/components/labs/ContextConfirmation";
import { PressureTestResults } from "@/components/labs/PressureTestResults";
import { RevisionDiff } from "@/components/labs/RevisionDiff";
import { StructuredMessageMatrix } from "@/components/labs/StructuredMessageMatrix";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LAUNCH_MESSAGING_ROUTE, MISSIONS_ROUTE } from "@/lib/appRoutes";
import type {
  ExtractedMessageReviewContext,
  MessageReviewArtifact,
  MessageReviewContext,
} from "@/lib/labs/messageReview/types";
import {
  LAUNCH_MESSAGING_ALLOWED_COPY,
  LAUNCH_MESSAGING_DISCLOSURE,
  LAUNCH_MESSAGING_DISCLOSURE_VERSION,
  WEDGE_PLAYER_STEPS,
  WEDGE_STEP_COACHING,
  WEDGE_STEP_KIND,
  type WedgePlayerStep,
} from "@/lib/learn/wedge/config";
import { createEmptyMatrix, createEmptyWorkContext } from "@/lib/learn/wedge/defaults";
import {
  isWedgePlayerSnapshot,
  type WedgePlayerSnapshot,
} from "@/lib/learn/wedge/playerState";

interface LaunchMessagingPlayerProps {
  initialSnapshot?: WedgePlayerSnapshot | null;
}

function readError(raw: unknown, fallback: string): string {
  if (
    typeof raw === "object" &&
    raw !== null &&
    "error" in raw &&
    typeof raw.error === "string"
  ) {
    return raw.error;
  }
  return fallback;
}

/**
 * Founder-only launch-messaging player. One step, one coaching line, one CTA.
 */
export function LaunchMessagingPlayer({
  initialSnapshot = null,
}: LaunchMessagingPlayerProps) {
  const [snapshot, setSnapshot] = useState<WedgePlayerSnapshot | null>(
    initialSnapshot,
  );
  const [loading, setLoading] = useState(initialSnapshot == null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<MessageReviewContext>(
    initialSnapshot?.context ?? createEmptyWorkContext(),
  );
  const [matrix, setMatrix] = useState<MessageReviewArtifact>(
    initialSnapshot?.matrix ?? createEmptyMatrix(),
  );
  const [finalArtifact, setFinalArtifact] = useState<MessageReviewArtifact>(
    initialSnapshot?.evaluatedMatrix ??
      initialSnapshot?.matrix ??
      createEmptyMatrix(),
  );
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [holdingReviewResults, setHoldingReviewResults] = useState(
    Boolean(initialSnapshot?.reviewUnavailable && initialSnapshot.evaluation),
  );
  const [exportText, setExportText] = useState<string | null>(null);
  const [exportFilename, setExportFilename] = useState(
    "launch-messaging-export.md",
  );
  const [copied, setCopied] = useState(false);

  const applySnapshot = useCallback((next: WedgePlayerSnapshot): void => {
    setSnapshot(next);
    setContext(next.context ?? createEmptyWorkContext());
    setMatrix(next.matrix ?? createEmptyMatrix());
    setFinalArtifact(
      next.evaluatedMatrix ?? next.matrix ?? createEmptyMatrix(),
    );
    if (next.reviewUnavailable && next.evaluation) {
      setHoldingReviewResults(true);
    }
  }, []);

  const loadSession = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/learn/wedge/attempt", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const raw: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        window.location.href = `/login?next=${LAUNCH_MESSAGING_ROUTE}`;
        return;
      }
      if (response.status === 404) {
        setError("This path is not available.");
        return;
      }
      if (!response.ok || !isWedgePlayerSnapshot(raw)) {
        setError(readError(raw, "Could not load this work."));
        return;
      }
      applySnapshot(raw);
    } catch {
      setError("Could not load this work.");
    } finally {
      setLoading(false);
    }
  }, [applySnapshot]);

  useEffect(() => {
    if (initialSnapshot) return;
    void loadSession();
  }, [initialSnapshot, loadSession]);

  const displayStep: WedgePlayerStep =
    holdingReviewResults && snapshot?.evaluation
      ? "review"
      : (snapshot?.step ?? "context");
  const stepNumber = WEDGE_PLAYER_STEPS.indexOf(displayStep) + 1;
  const stepCount = WEDGE_PLAYER_STEPS.length;
  const progressPercent = Math.round((stepNumber / stepCount) * 100);
  const evaluation = snapshot?.evaluation ?? null;
  const originalMatrix =
    snapshot?.evaluatedMatrix ?? snapshot?.matrix ?? createEmptyMatrix();

  const postJson = useCallback(
    async (url: string, body: unknown): Promise<WedgePlayerSnapshot | null> => {
      setSaving(true);
      setError(null);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const raw: unknown = await response.json().catch(() => null);
        if (response.status === 401) {
          window.location.href = `/login?next=${LAUNCH_MESSAGING_ROUTE}`;
          return null;
        }
        if (response.status === 404) {
          setError("This path is not available.");
          return null;
        }
        if (
          (response.ok || response.status === 503) &&
          isWedgePlayerSnapshot(raw)
        ) {
          applySnapshot(raw);
          return raw;
        }
        setError(readError(raw, "Could not save this step."));
        return null;
      } catch {
        setError("Could not save this step.");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [applySnapshot],
  );

  const handleContext = useCallback(async (): Promise<void> => {
    await postJson("/api/learn/wedge/attempt/context", context);
  }, [context, postJson]);

  const handleMatrix = useCallback(async (): Promise<void> => {
    await postJson("/api/learn/wedge/attempt/matrix", matrix);
  }, [matrix, postJson]);

  const handleEvaluate = useCallback(async (): Promise<void> => {
    if (!disclosureAccepted) {
      setError("Confirm the review disclosure before continuing.");
      return;
    }
    const next = await postJson("/api/learn/wedge/attempt/evaluate", {
      artifact: matrix,
      processingDisclosureAccepted: true,
      disclosureVersion: LAUNCH_MESSAGING_DISCLOSURE_VERSION,
    });
    if (next?.evaluation) {
      setHoldingReviewResults(true);
    }
  }, [disclosureAccepted, matrix, postJson]);

  const handleRevise = useCallback(async (): Promise<void> => {
    const next = await postJson(
      "/api/learn/wedge/attempt/revise",
      finalArtifact,
    );
    if (next?.step === "export") {
      setHoldingReviewResults(false);
    }
  }, [finalArtifact, postJson]);

  const loadExport = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/learn/wedge/attempt/export", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const raw: unknown = await response.json().catch(() => null);
      if (
        response.ok &&
        typeof raw === "object" &&
        raw !== null &&
        "text" in raw &&
        typeof raw.text === "string"
      ) {
        const filename =
          "filename" in raw && typeof raw.filename === "string"
            ? raw.filename
            : "launch-messaging-export.md";
        setExportText(raw.text);
        setExportFilename(filename);
        return raw.text;
      }
      setError(readError(raw, "Nothing to export yet."));
      return null;
    } catch {
      setError("Nothing to export yet.");
      return null;
    }
  }, []);

  useEffect(() => {
    if (displayStep !== "export" || exportText) return;
    void loadExport();
  }, [displayStep, exportText, loadExport]);

  const handleCopy = useCallback(async (): Promise<void> => {
    const text = exportText ?? (await loadExport());
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setError("Could not copy the export.");
    }
  }, [exportText, loadExport]);

  const handleDownload = useCallback(async (): Promise<void> => {
    const text = exportText ?? (await loadExport());
    if (!text) return;
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFilename;
    link.click();
    URL.revokeObjectURL(url);
  }, [exportFilename, exportText, loadExport]);

  const handleContextChange = (next: ExtractedMessageReviewContext): void => {
    setContext({
      ...next,
      channel: next.channel ?? context.channel,
    });
  };

  const primaryCta =
    displayStep === "context"
      ? {
          label: "Save and continue",
          onClick: () => void handleContext(),
          disabled: saving,
        }
      : displayStep === "matrix"
        ? {
            label: "Save and review",
            onClick: () => void handleMatrix(),
            disabled: saving,
          }
        : displayStep === "review" && evaluation && !snapshot?.reviewUnavailable
          ? {
              label: "Review changes",
              onClick: () => setHoldingReviewResults(false),
              disabled: false,
            }
          : displayStep === "review"
            ? {
                label: snapshot?.reviewUnavailable
                  ? "Try pressure test again"
                  : "Run pressure test",
                onClick: () => void handleEvaluate(),
                disabled: saving || !disclosureAccepted,
              }
            : displayStep === "diff"
              ? {
                  label: "Save choices",
                  onClick: () => void handleRevise(),
                  disabled: saving,
                }
              : null;

  return (
    <div className="min-h-screen bg-[var(--sg-shell-50)]">
      <header className="border-b border-[var(--sg-shell-border)] bg-[var(--sg-white)]">
        <div className="mx-auto flex max-w-[880px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0 space-y-1">
            <Link
              href={MISSIONS_ROUTE}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sg-shell-600)] transition-colors hover:text-[var(--sg-shell-900)]"
            >
              <ArrowLeft size={14} />
              Missions
            </Link>
            <h1 className="truncate text-lg font-semibold text-[var(--sg-shell-900)]">
              Launch messaging
            </h1>
          </div>
        </div>
        {snapshot && !loading ? (
          <div
            className="h-1 w-full bg-[var(--sg-shell-100)]"
            aria-hidden="true"
          >
            <div
              className="h-full bg-[var(--sg-forest-500)] transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-[880px] px-4 py-6 sm:px-6 sm:py-8">
        {loading && !snapshot ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--sg-shell-300)] border-t-transparent" />
          </div>
        ) : error && !snapshot ? (
          <Card className="space-y-4 p-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--sg-shell-900)]">
                Couldn&apos;t load this work
              </p>
              <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
                {error}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadSession()}>
              Try again
            </Button>
          </Card>
        ) : snapshot ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
                Step {stepNumber} of {stepCount} · {WEDGE_STEP_KIND[displayStep]}
              </p>
              <p className="text-base leading-7 text-[var(--sg-shell-900)]">
                {WEDGE_STEP_COACHING[displayStep]}
              </p>
            </div>

            <div className="min-h-[420px] space-y-5">
              {displayStep === "context" ? (
                <ContextConfirmation
                  embedded
                  context={context}
                  onChange={handleContextChange}
                  error={error}
                />
              ) : null}

              {displayStep === "matrix" ? (
                <StructuredMessageMatrix
                  embedded
                  artifact={matrix}
                  context={context}
                  onChange={setMatrix}
                  error={error}
                />
              ) : null}

              {displayStep === "review" ? (
                <div className="space-y-5">
                  {evaluation ? (
                    <PressureTestResults
                      embedded
                      result={evaluation.result}
                    />
                  ) : null}
                  {!evaluation || snapshot.reviewUnavailable ? (
                    <Card className="space-y-4 p-5 sm:p-6">
                      <label className="flex cursor-pointer items-start gap-3 text-base leading-6 text-[var(--sg-shell-700)]">
                        <input
                          type="checkbox"
                          checked={disclosureAccepted}
                          onChange={(event) =>
                            setDisclosureAccepted(event.target.checked)
                          }
                          className="mt-1 h-5 w-5 shrink-0 accent-[var(--sg-forest-500)]"
                        />
                        <span>{LAUNCH_MESSAGING_DISCLOSURE}</span>
                      </label>
                    </Card>
                  ) : null}
                  {error ? (
                    <p className="text-sm leading-6 text-[var(--sg-shell-600)]">
                      {error}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {displayStep === "diff" && evaluation && snapshot.context ? (
                <RevisionDiff
                  embedded
                  original={originalMatrix}
                  proposed={evaluation.result.revisedArtifact}
                  finalArtifact={finalArtifact}
                  context={snapshot.context}
                  onChange={setFinalArtifact}
                />
              ) : null}

              {displayStep === "diff" && (!evaluation || !snapshot.context) ? (
                <Card className="p-6">
                  <p className="text-sm text-[var(--sg-shell-500)]">
                    The review is not available. Run the pressure test again.
                  </p>
                </Card>
              ) : null}

              {displayStep === "export" ? (
                <Card className="space-y-4 p-6">
                  <p className="text-sm font-semibold text-[var(--sg-shell-900)]">
                    {LAUNCH_MESSAGING_ALLOWED_COPY}
                  </p>
                  {exportText ? (
                    <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-[var(--sg-shell-600)]">
                      {exportText}
                    </pre>
                  ) : (
                    <p className="text-sm text-[var(--sg-shell-500)]">
                      Preparing the export…
                    </p>
                  )}
                  {error ? (
                    <p className="text-sm leading-6 text-[var(--sg-shell-600)]">
                      {error}
                    </p>
                  ) : null}
                </Card>
              ) : null}
            </div>

            {displayStep === "export" ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="cta"
                  size="sm"
                  leftIcon={<Clipboard size={14} />}
                  onClick={() => void handleCopy()}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download size={14} />}
                  onClick={() => void handleDownload()}
                >
                  Download
                </Button>
              </div>
            ) : primaryCta ? (
              <Button
                variant="cta"
                size="sm"
                rightIcon={<ArrowRight size={14} />}
                loading={saving}
                disabled={primaryCta.disabled}
                onClick={primaryCta.onClick}
              >
                {primaryCta.label}
              </Button>
            ) : null}
          </div>
        ) : (
          <Card className="p-6">
            <p className="text-sm text-[var(--sg-shell-500)]">
              This path does not have a next step yet.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
