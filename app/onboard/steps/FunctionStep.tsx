"use client";

import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  FUNCTION_OPTIONS,
  LIVE_ONBOARDING_FUNCTION,
  type ProfessionalFunction,
} from "@/lib/onboarding/types";

interface FunctionStepProps {
  onSelect: (
    primary: ProfessionalFunction,
    secondaries: ProfessionalFunction[],
  ) => void;
}

const COMING_SOON_ROLES = FUNCTION_OPTIONS.filter(
  (opt) => opt.value !== LIVE_ONBOARDING_FUNCTION,
).map((opt) => opt.label);

/**
 * Format upcoming role names as a single quiet sentence.
 */
function formatComingSoonRoles(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export default function FunctionStep({ onSelect }: FunctionStepProps) {
  function handleContinue(): void {
    onSelect(LIVE_ONBOARDING_FUNCTION, []);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-[var(--sg-shell-900)]">
        Start with marketing work
      </h1>
      <p className="mt-2 text-[var(--sg-shell-600)]">
        Product marketing, messaging, and GTM live here today. You will do a
        real brief and leave with work you can use.
      </p>

      <Card className="mt-8 border-[var(--sg-forest-500)] p-6">
        <div className="flex items-start gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--sg-shell-100)]"
            aria-hidden="true"
          >
            <Megaphone
              size={22}
              strokeWidth={1.6}
              className="text-[var(--sg-forest-500)]"
            />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--sg-forest-500)]">
              Live now
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--sg-shell-900)]">
              Marketing
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--sg-shell-600)]">
              Practice a real brief, then leave with proof — not a course
              outline.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          className="mt-6"
          onClick={handleContinue}
        >
          Continue
        </Button>
      </Card>

      <p className="mt-5 text-center text-xs leading-5 text-[var(--sg-shell-500)]">
        {formatComingSoonRoles(COMING_SOON_ROLES)} are next.
      </p>
    </>
  );
}
