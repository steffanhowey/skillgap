"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MethodCard } from "@/components/learn/MethodCard";
import { evaluateContentBrief, parseContentBrief } from "@/lib/learn/taughtHero/artifact";
import type { ContentBriefPromptUpgrade } from "@/lib/learn/taughtHero/types";
import type { ItemState } from "@/lib/types";

interface ArtifactReviewViewerProps {
  isCompleted: boolean;
  submissionText?: string;
  onComplete: (stateData: Partial<ItemState>) => void;
  onRevise: () => void;
}

function readBrief(submissionText?: string): ContentBriefPromptUpgrade | null {
  if (!submissionText) return null;
  try {
    return parseContentBrief(JSON.parse(submissionText));
  } catch {
    return null;
  }
}

/**
 * Shows the method as the takeaway, not a criteria dump.
 */
export function ArtifactReviewViewer({
  isCompleted,
  submissionText,
  onComplete,
  onRevise,
}: ArtifactReviewViewerProps) {
  const brief = readBrief(submissionText);
  const evaluation = brief ? evaluateContentBrief(brief) : null;

  if (!brief || !evaluation) {
    return (
      <Card className="space-y-4 p-6">
        <p className="text-sm font-semibold text-[var(--sg-shell-900)]">
          You do not have a method yet
        </p>
        <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
          Go back and finish the three moves first.
        </p>
        <Button variant="cta" size="sm" onClick={onRevise}>
          Back to the lesson
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
          Check
        </p>
        <h2 className="text-xl font-semibold text-[var(--sg-shell-900)]">
          Would you use this on the next brief?
        </h2>
        <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
          If not, change it. If yes, take it with you.
        </p>
      </Card>

      <MethodCard brief={brief} />

      {isCompleted ? (
        <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
          Saved. One last line about when you will use it.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button
            variant="cta"
            size="sm"
            disabled={!evaluation.ok}
            onClick={() =>
              onComplete({
                submission_text: JSON.stringify(brief),
                evaluation: {
                  quality: evaluation.ok ? "good" : "needs_iteration",
                  feedback: evaluation.feedback,
                  criteria_results: evaluation.results.map((result) => ({
                    criterion: result.label,
                    passed: result.passed,
                  })),
                },
              })
            }
          >
            I would use this
          </Button>
          <Button variant="outline" size="sm" onClick={onRevise}>
            Change it
          </Button>
        </div>
      )}
    </div>
  );
}
