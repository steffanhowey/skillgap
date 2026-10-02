"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { HOME_ROUTE, getMissionSoloRoute } from "@/lib/appRoutes";
import { createClient } from "@/lib/supabase/client";
import type { FirstPathAssignment } from "@/lib/onboarding/firstMission";
import { pathWhy } from "@/lib/onboarding/pathWhy";
import {
  FOCUS_OPTIONS,
  FLUENCY_OPTIONS,
  MARKETING_ROLE_OPTIONS,
  primaryFunctionForRole,
  type FocusArea,
  type FluencyLevel,
  type MarketingRole,
  type ProfessionalFunction,
} from "@/lib/onboarding/types";
import {
  trackStepViewed,
  trackStepCompleted,
  trackFunctionSelected,
  trackFluencySelected,
  trackOnboardingCompleted,
} from "@/lib/onboarding/tracking";
import FunctionStep from "./steps/FunctionStep";
import FluencyStep from "./steps/FluencyStep";
import FocusStep from "./steps/FocusStep";
import PathResultStep from "./steps/PathResultStep";

const QUESTIONS = [
  "What do you do?",
  "How much do you use AI at work today?",
  "What takes most of your week?",
] as const;

interface SavedProgress {
  step: number;
  marketingRole: MarketingRole | null;
  primaryFunction: ProfessionalFunction | null;
  fluencyLevel: FluencyLevel | null;
  focusAreas: FocusArea[];
}

export default function OnboardPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: "var(--sg-white)", color: "var(--sg-shell-900)" }}
        >
          <p className="text-[var(--sg-shell-600)]">Loading...</p>
        </div>
      }
    >
      <OnboardContent />
    </Suspense>
  );
}

function OnboardContent() {
  const { user, authState } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReOnboard = searchParams.get("step") === "username";

  const savedProgress = useRef<SavedProgress | null>(
    (() => {
      if (isReOnboard || typeof window === "undefined") return null;
      try {
        const raw = localStorage.getItem("sg_onboard_progress");
        return raw ? (JSON.parse(raw) as SavedProgress) : null;
      } catch {
        return null;
      }
    })(),
  );

  const [step, setStep] = useState(
    isReOnboard ? 2 : Math.min(savedProgress.current?.step ?? 0, 2),
  );
  const [saving, setSaving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [assignment, setAssignment] = useState<FirstPathAssignment | null>(null);
  const wizardStartRef = useRef(Date.now());
  const stepStartRef = useRef(Date.now());

  const [marketingRole, setMarketingRole] = useState<MarketingRole | null>(
    savedProgress.current?.marketingRole ?? null,
  );
  const [primaryFunction, setPrimaryFunction] =
    useState<ProfessionalFunction | null>(savedProgress.current?.primaryFunction ?? null);
  const [fluencyLevel, setFluencyLevel] = useState<FluencyLevel | null>(
    savedProgress.current?.fluencyLevel ?? null,
  );
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>(
    savedProgress.current?.focusAreas ?? [],
  );

  useEffect(() => {
    if (!user || isReOnboard) return;
    let cancelled = false;
    const supabase = createClient();
    void supabase
      .from("fp_profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.onboarding_completed) router.replace(HOME_ROUTE);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isReOnboard, router]);

  useEffect(() => {
    trackStepViewed(step);
    stepStartRef.current = Date.now();
    setActiveIndex(-1);
  }, [step]);

  useEffect(() => {
    if (isReOnboard) return;
    localStorage.setItem(
      "sg_onboard_progress",
      JSON.stringify({ step, marketingRole, primaryFunction, fluencyLevel, focusAreas }),
    );
  }, [step, marketingRole, primaryFunction, fluencyLevel, focusAreas, isReOnboard]);

  const finish = useCallback(
    async (handleOnly = false) => {
      if (!user) return;
      setSaving(true);
      try {
        const res = await fetch("/api/onboarding/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            handleOnly
              ? { handleOnly: true }
              : {
                  marketingRole,
                  primaryFunction,
                  fluencyLevel,
                  focusAreas,
                },
          ),
        });
        const data = (await res.json()) as {
          username?: string;
          assignment?: FirstPathAssignment;
        };
        if (!res.ok || !data.username) {
          setSaving(false);
          return;
        }

        const totalDuration = Date.now() - wizardStartRef.current;
        trackOnboardingCompleted(totalDuration, isReOnboard ? 1 : 3);
        localStorage.removeItem("sg_onboard_progress");

        fetch("/api/avatar/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: data.username, userId: user.id }),
        }).catch(() => {});

        if (handleOnly || !data.assignment) {
          router.push(HOME_ROUTE);
          return;
        }

        setAssignment(data.assignment);
        setStep(3);
        setSaving(false);
      } catch {
        setSaving(false);
      }
    },
    [user, marketingRole, primaryFunction, fluencyLevel, focusAreas, isReOnboard, router],
  );

  useEffect(() => {
    if (!isReOnboard || !user) return;
    void finish(true);
  }, [isReOnboard, user, finish]);

  const optionCount =
    step === 0
      ? MARKETING_ROLE_OPTIONS.length
      : step === 1
        ? FLUENCY_OPTIONS.length
        : FOCUS_OPTIONS.length;

  const applyIndex = useCallback(
    (index: number, toggleFocus: boolean) => {
      setActiveIndex(index);
      if (step === 0) {
        const role = MARKETING_ROLE_OPTIONS[index]?.value;
        if (role) {
          setMarketingRole(role);
          setPrimaryFunction(primaryFunctionForRole(role));
        }
        return;
      }
      if (step === 1) {
        const value = FLUENCY_OPTIONS[index]?.value;
        if (value) setFluencyLevel(value);
        return;
      }
      if (!toggleFocus) return;
      const value = FOCUS_OPTIONS[index]?.value;
      if (!value) return;
      setFocusAreas((current) => {
        if (current.includes(value)) return current.filter((area) => area !== value);
        if (current.length >= 3) return current;
        return [...current, value];
      });
    },
    [step],
  );

  const goNext = useCallback(() => {
    const elapsed = Date.now() - stepStartRef.current;
    if (step === 0) {
      if (!marketingRole) return;
      trackStepCompleted(0, marketingRole, elapsed);
      if (primaryFunction) trackFunctionSelected(primaryFunction, []);
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!fluencyLevel) return;
      trackStepCompleted(1, fluencyLevel, elapsed);
      trackFluencySelected(fluencyLevel, false);
      setStep(2);
      return;
    }
    if (focusAreas.length === 0) return;
    trackStepCompleted(2, focusAreas.join(","), elapsed);
    void finish(false);
  }, [step, marketingRole, primaryFunction, fluencyLevel, focusAreas, finish]);

  const skip = useCallback(() => {
    if (step < 2) {
      setStep((current) => current + 1);
      return;
    }
    void finish(false);
  }, [step, finish]);

  useEffect(() => {
    if (isReOnboard || step === 3) return;
    function onKey(event: KeyboardEvent): void {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => {
          const next = current < 0 ? 0 : (current + 1) % optionCount;
          applyIndex(next, false);
          return next;
        });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => {
          const next = current <= 0 ? optionCount - 1 : current - 1;
          applyIndex(next, false);
          return next;
        });
      } else if (event.key === "Enter") {
        event.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyIndex, goNext, isReOnboard, optionCount, step]);

  if (authState === "loading" || isReOnboard) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--sg-white)", color: "var(--sg-shell-900)" }}
      >
        <p className="text-[var(--sg-shell-600)]">Loading...</p>
      </div>
    );
  }

  if (authState === "anonymous") {
    router.replace("/login");
    return null;
  }

  const canContinue =
    step === 0 ? marketingRole != null : step === 1 ? fluencyLevel != null : focusAreas.length > 0;
  const progress = step >= 3 ? 100 : ((step + 1) / QUESTIONS.length) * 100;
  const mission = assignment?.path ?? assignment?.interim ?? null;

  if (step === 3 && assignment) {
    return (
      <div
        className="flex min-h-screen items-center px-4"
        style={{
          background: "var(--sg-white)",
          color: "var(--sg-shell-900)",
          fontFamily: "var(--font-body), 'DM Sans', sans-serif",
        }}
      >
        <PathResultStep
          assignment={assignment}
          why={pathWhy({
            role: primaryFunction,
            fluency: fluencyLevel,
            focusAreas,
          })}
          onStart={() => {
            if (mission) router.push(getMissionSoloRoute(mission.pathId));
            else router.push(HOME_ROUTE);
          }}
          onHome={() => router.push(HOME_ROUTE)}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--sg-white)",
        color: "var(--sg-shell-900)",
        fontFamily: "var(--font-body), 'DM Sans', sans-serif",
      }}
    >
      <div className="fixed inset-x-0 top-0 h-1 bg-[var(--sg-shell-200)]" aria-hidden="true">
        <div
          className="h-full bg-[var(--sg-forest-500)] transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="mx-auto w-full max-w-xl px-4 pb-32 pt-16 sm:pt-24">
        <h1
          className="text-center text-3xl text-[var(--sg-shell-900)]"
          style={{ fontFamily: "var(--font-display), Fraunces, Georgia, serif" }}
        >
          {QUESTIONS[step]}
        </h1>

        {step === 0 && (
          <FunctionStep
            activeIndex={activeIndex}
            selected={marketingRole}
            onChoose={(index) => applyIndex(index, true)}
          />
        )}
        {step === 1 && (
          <FluencyStep
            activeIndex={activeIndex}
            selected={fluencyLevel}
            onChoose={(index) => applyIndex(index, true)}
          />
        )}
        {step === 2 && (
          <FocusStep
            activeIndex={activeIndex}
            selected={focusAreas}
            onChoose={(index) => applyIndex(index, true)}
          />
        )}
      </main>

      <footer
        className="fixed inset-x-0 bottom-0 border-t border-[var(--sg-shell-border)]"
        style={{ background: "var(--sg-shell-50)" }}
      >
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-4">
          <Button variant="ghost" size="sm" onClick={skip} disabled={saving}>
            Skip for now
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--sg-shell-500)]">or press Enter</span>
            <Button
              variant="primary"
              size="sm"
              onClick={goNext}
              disabled={!canContinue || saving}
              loading={saving}
            >
              Continue
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
