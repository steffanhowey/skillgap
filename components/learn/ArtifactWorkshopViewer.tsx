"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MethodCard } from "@/components/learn/MethodCard";
import {
  evaluateContentBrief,
  parseContentBrief,
} from "@/lib/learn/taughtHero/artifact";
import {
  LESSON_FAILURE_MODES,
  LESSON_STRUCTURES,
  LESSON_WORKFLOWS,
  WEAK_ASK,
  WEAK_OUTPUT,
  assembleLessonBrief,
  createEmptyLessonChoices,
  choicesFromBrief,
  defaultRecommendedChange,
  lessonChoicesReady,
  type LessonChoices,
  type LessonPhase,
} from "@/lib/learn/taughtHero/lesson";
import type { ItemState } from "@/lib/types";

interface ArtifactWorkshopViewerProps {
  isCompleted: boolean;
  initialSubmission?: string;
  onComplete: (stateData: Partial<ItemState>) => void;
}

function startingPhase(choices: LessonChoices): LessonPhase {
  if (!choices.workflowId && !choices.customWorkflow.trim()) return "see";
  if (!choices.structureId) return "name";
  if (!choices.recommendedChange.trim()) return "structure";
  return "change";
}

function ChoiceChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        selected
          ? "border-[var(--sg-forest-500)] bg-[var(--sg-sage-100)] text-[var(--sg-forest-500)]"
          : "border-[var(--sg-shell-border)] text-[var(--sg-shell-700)] hover:border-[var(--sg-shell-400)]"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Taught do-step: see a weak brief, name your job, pick a better ask, lock one change.
 */
export function ArtifactWorkshopViewer({
  isCompleted,
  initialSubmission,
  onComplete,
}: ArtifactWorkshopViewerProps) {
  const restored = useMemo(() => {
    if (!initialSubmission) return createEmptyLessonChoices();
    try {
      const parsed = parseContentBrief(JSON.parse(initialSubmission));
      return parsed ? choicesFromBrief(parsed) : createEmptyLessonChoices();
    } catch {
      return createEmptyLessonChoices();
    }
  }, [initialSubmission]);

  const [choices, setChoices] = useState<LessonChoices>(restored);
  const [phase, setPhase] = useState<LessonPhase>(startingPhase(restored));
  const [copied, setCopied] = useState(false);
  const brief = assembleLessonBrief(choices);
  const evaluation = evaluateContentBrief(brief);
  const ready = lessonChoicesReady(choices) && evaluation.ok;
  const pickedStructure =
    LESSON_STRUCTURES.find((option) => option.id === choices.structureId) ??
    null;

  const handleSave = () => {
    if (!ready) return;
    onComplete({
      submission_text: JSON.stringify(brief),
      evaluation: {
        quality: "good",
        feedback: evaluation.feedback,
        criteria_results: evaluation.results.map((result) => ({
          criterion: result.label,
          passed: result.passed,
        })),
      },
    });
  };

  if (isCompleted) {
    return (
      <div className="space-y-3">
        <MethodCard brief={brief} />
        <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
          Saved. Next you’ll check whether you’d actually use this.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {phase === "see" ? (
        <Card className="space-y-5 p-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
              The usual ask
            </p>
            <h2 className="text-xl font-semibold text-[var(--sg-shell-900)]">
              This is what most people paste
            </h2>
            <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
              If this looks familiar, the rest of the lesson is how you stop getting that draft back.
            </p>
          </div>
          <div className="space-y-3 rounded-[var(--sg-radius-md)] border border-[var(--sg-shell-border)] bg-[var(--sg-shell-50)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sg-shell-500)]">
              The paste
            </p>
            <p className="text-sm leading-7 text-[var(--sg-shell-900)]">{WEAK_ASK}</p>
          </div>
          <div className="space-y-3 rounded-[var(--sg-radius-md)] border border-[var(--sg-shell-border)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sg-shell-500)]">
              What comes back
            </p>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[var(--sg-shell-700)]">
              {WEAK_OUTPUT}
            </pre>
            <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
              Two things go wrong: {LESSON_FAILURE_MODES[0]} {LESSON_FAILURE_MODES[1]}
            </p>
          </div>
          <Button variant="cta" size="sm" onClick={() => setPhase("name")}>
            That&apos;s the usual draft
          </Button>
        </Card>
      ) : null}

      {phase === "name" ? (
        <Card className="space-y-5 p-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
              Your job
            </p>
            <h2 className="text-xl font-semibold text-[var(--sg-shell-900)]">
              What do you actually brief?
            </h2>
            <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
              Pick the content job you repeat. We will write the stall for you.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {LESSON_WORKFLOWS.map((option) => (
              <ChoiceChip
                key={option.id}
                label={option.label}
                selected={choices.workflowId === option.id}
                onClick={() =>
                  setChoices((current) => ({
                    ...current,
                    workflowId: option.id,
                    customWorkflow: "",
                  }))
                }
              />
            ))}
            <ChoiceChip
              label="Something else"
              selected={choices.workflowId === "other"}
              onClick={() =>
                setChoices((current) => ({ ...current, workflowId: "other" }))
              }
            />
          </div>
          {choices.workflowId === "other" ? (
            <input
              value={choices.customWorkflow}
              onChange={(event) =>
                setChoices((current) => ({
                  ...current,
                  customWorkflow: event.target.value,
                }))
              }
              placeholder="e.g. sales one-pager"
              className="h-11 w-full rounded-[var(--sg-radius-md)] border border-[var(--sg-shell-border)] bg-[var(--sg-shell-50)] px-4 text-sm text-[var(--sg-shell-900)] placeholder:text-[var(--sg-shell-500)] focus:border-[var(--sg-forest-400)] focus:outline-none"
            />
          ) : null}
          {resolvePreview(choices) ? (
            <p className="text-sm leading-6 text-[var(--sg-shell-600)]">
              {resolvePreview(choices)}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="cta"
              size="sm"
              disabled={!resolvePreview(choices)}
              onClick={() => setPhase("structure")}
            >
              That&apos;s the job
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPhase("see")}>
              Back
            </Button>
          </div>
        </Card>
      ) : null}

      {phase === "structure" ? (
        <Card className="space-y-5 p-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
              A better ask
            </p>
            <h2 className="text-xl font-semibold text-[var(--sg-shell-900)]">
              Pick the ask you will reuse
            </h2>
            <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
              You are not inventing a prompt framework. Choose one of these two.
            </p>
          </div>
          <div className="space-y-3">
            {LESSON_STRUCTURES.map((option) => {
              const selected = choices.structureId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    setChoices((current) => ({
                      ...current,
                      structureId: option.id,
                      recommendedChange: defaultRecommendedChange({
                        ...current,
                        structureId: option.id,
                      }),
                    }))
                  }
                  className={`w-full rounded-[var(--sg-radius-md)] border p-4 text-left transition-colors ${
                    selected
                      ? "border-[var(--sg-forest-500)] bg-[var(--sg-sage-100)]"
                      : "border-[var(--sg-shell-border)] hover:border-[var(--sg-shell-400)]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--sg-shell-900)]">
                    {option.name}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--sg-shell-600)]">
                    {option.why}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--sg-shell-700)]">
                    {option.template}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="cta"
              size="sm"
              disabled={!choices.structureId}
              onClick={() => setPhase("change")}
            >
              Use this ask
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPhase("name")}>
              Back
            </Button>
          </div>
        </Card>
      ) : null}

      {phase === "change" ? (
        <div className="space-y-4">
          <Card className="space-y-5 p-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
                The change
              </p>
              <h2 className="text-xl font-semibold text-[var(--sg-shell-900)]">
                One line for next time
              </h2>
              <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
                Edit this if you want. This is the thing you leave with.
              </p>
            </div>
            <textarea
              value={choices.recommendedChange}
              onChange={(event) =>
                setChoices((current) => ({
                  ...current,
                  recommendedChange: event.target.value,
                }))
              }
              rows={4}
              className="w-full resize-y rounded-[var(--sg-radius-md)] border border-[var(--sg-shell-border)] bg-[var(--sg-white)] px-3 py-2.5 text-sm leading-6 text-[var(--sg-shell-900)] focus:border-[var(--sg-forest-400)] focus:outline-none"
            />
            {pickedStructure ? (
              <div className="space-y-2 rounded-[var(--sg-radius-md)] border border-[var(--sg-shell-border)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sg-shell-500)]">
                  Optional: try this ask
                </p>
                <p className="text-sm leading-7 text-[var(--sg-shell-700)]">
                  {pickedStructure.template}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(pickedStructure.template);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1600);
                  }}
                >
                  {copied ? "Copied" : "Copy to try in ChatGPT"}
                </Button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button variant="cta" size="sm" disabled={!ready} onClick={handleSave}>
                Save this method
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPhase("structure")}>
                Back
              </Button>
            </div>
          </Card>
          {ready ? <MethodCard brief={brief} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function resolvePreview(choices: LessonChoices): string {
  if (choices.workflowId === "other") {
    const custom = choices.customWorkflow.trim();
    if (custom.length < 3) return "";
    return `${custom} briefs stall when the ask is vague, so the draft comes back generic.`;
  }
  return (
    LESSON_WORKFLOWS.find((option) => option.id === choices.workflowId)?.stall ?? ""
  );
}
