"use client";

import { useEffect, useState } from "react";
import { Clock, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchOnboardingPicks } from "@/lib/onboarding/picks";
import type {
  OnboardingPick,
  ProfessionalFunction,
  FluencyLevel,
} from "@/lib/onboarding/types";

interface PathRecommendationStepProps {
  primaryFunction: ProfessionalFunction;
  fluencyLevel: FluencyLevel;
  secondaryFunctions: ProfessionalFunction[];
  saving?: boolean;
  onStartPath: (pick: OnboardingPick) => void;
  onBrowse: () => void;
}

export default function PathRecommendationStep({
  primaryFunction,
  fluencyLevel,
  secondaryFunctions,
  saving = false,
  onStartPath,
  onBrowse,
}: PathRecommendationStepProps) {
  const [hero, setHero] = useState<OnboardingPick | null>(null);
  const [also, setAlso] = useState<OnboardingPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      const picks = await fetchOnboardingPicks(
        primaryFunction,
        fluencyLevel,
        secondaryFunctions
      );
      if (cancelled) return;
      setHero(picks.hero);
      setAlso(picks.also);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [primaryFunction, fluencyLevel, secondaryFunctions]);

  /** Swap an "also" pick into the hero slot. */
  function promoteToHero(pick: OnboardingPick): void {
    if (!hero) return;
    setAlso((prev) => [hero, ...prev.filter((p) => p.id !== pick.id)].slice(0, 2));
    setHero(pick);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2
          size={28}
          className="animate-spin text-[var(--sg-shell-500)]"
        />
        <p className="text-sm text-[var(--sg-shell-600)]">
          Loading your first mission...
        </p>
      </div>
    );
  }

  if (!hero) {
    // No editorial picks available — go straight to browse
    return (
      <>
        <h1 className="text-2xl font-semibold text-[var(--sg-shell-900)]">
          Open the mission board
        </h1>
        <p className="mt-2 text-[var(--sg-shell-600)]">
          We couldn&apos;t load a first mission just now. Everything live is on
          the board.
        </p>
        <Button
          variant="primary"
          fullWidth
          className="mt-8"
          onClick={onBrowse}
          loading={saving}
          disabled={saving}
        >
          See all missions
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-[var(--sg-shell-900)]">
        Your first mission
      </h1>
      <p className="mt-2 text-[var(--sg-shell-600)]">
        A real brief. A real tool. Work you can use when you finish.
      </p>

      <Card className="mt-8 p-6">
        <h2 className="text-lg font-semibold text-[var(--sg-shell-900)]">
          {hero.display_title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--sg-shell-600)]">
          {hero.display_description}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-[var(--sg-shell-500)]">
          <span className="inline-flex items-center gap-1">
            <Clock size={13} strokeWidth={1.8} />
            {hero.time_estimate_min} min
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen size={13} strokeWidth={1.8} />
            {hero.module_count === 1
              ? "1 step"
              : `${hero.module_count} steps`}
          </span>
        </div>

        {hero.tool_names.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {hero.tool_names.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-[var(--sg-shell-border)] px-2.5 py-0.5 text-[11px] text-[var(--sg-shell-500)]"
              >
                {tool}
              </span>
            ))}
          </div>
        )}

        <Button
          variant="primary"
          fullWidth
          className="mt-5"
          onClick={() => onStartPath(hero)}
          loading={saving}
          disabled={saving}
        >
          Start this mission
        </Button>
      </Card>

      {/* Also for you */}
      {also.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--sg-shell-500)]">
            Or start here
          </p>
          <div className="flex flex-col gap-2">
            {also.map((pick) => (
              <button
                key={pick.id}
                onClick={() => promoteToHero(pick)}
                className="flex items-center justify-between rounded-lg border border-[var(--sg-shell-border)] bg-[var(--sg-shell-100)] px-4 py-3 text-left transition-all hover:border-[var(--sg-forest-500)] hover:bg-[var(--sg-shell-200)]"
              >
                <span className="text-sm font-medium text-[var(--sg-shell-900)]">
                  {pick.display_title}
                </span>
                <span className="ml-3 shrink-0 text-xs text-[var(--sg-shell-500)]">
                  {pick.time_estimate_min} min
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Browse more */}
      <div className="mt-5 flex justify-center">
        <Button variant="link" onClick={onBrowse} disabled={saving}>
          See all missions
        </Button>
      </div>
    </>
  );
}
