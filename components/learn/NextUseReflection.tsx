"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ItemState } from "@/lib/types";

interface NextUseReflectionProps {
  isCompleted: boolean;
  prompt: string;
  initialValue?: string;
  onComplete: (stateData: Partial<ItemState>) => void;
}

/**
 * Last step of the taught hero: name the next real brief. Not an essay.
 */
export function NextUseReflection({
  isCompleted,
  prompt,
  initialValue,
  onComplete,
}: NextUseReflectionProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const ready = value.trim().length >= 8;

  if (isCompleted) {
    return (
      <Card className="space-y-3 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
          Next brief
        </p>
        <p className="text-sm leading-7 text-[var(--sg-shell-900)]">
          {initialValue || value || "Saved."}
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-6">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
          Next brief
        </p>
        <h2 className="text-xl font-semibold text-[var(--sg-shell-900)]">
          {prompt}
        </h2>
        <p className="text-sm leading-6 text-[var(--sg-shell-500)]">
          One real draft. Not “content in general.”
        </p>
      </div>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="e.g. next week’s product newsletter"
        className="h-11 w-full rounded-[var(--sg-radius-md)] border border-[var(--sg-shell-border)] bg-[var(--sg-white)] px-4 text-sm text-[var(--sg-shell-900)] placeholder:text-[var(--sg-shell-500)] focus:border-[var(--sg-forest-400)] focus:outline-none"
      />
      <Button
        variant="cta"
        size="sm"
        disabled={!ready}
        onClick={() =>
          onComplete({
            submission_text: value.trim(),
          })
        }
      >
        That&apos;s the one
      </Button>
    </Card>
  );
}
