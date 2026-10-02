"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getMissionRoute } from "@/lib/appRoutes";
import type { FirstPathAssignment } from "@/lib/onboarding/firstMission";

interface PathResultStepProps {
  assignment: FirstPathAssignment;
  why: string;
  onStart: () => void;
  onHome: () => void;
}

/**
 * End of onboarding: the path, why it fits, and the first mission.
 */
export default function PathResultStep({
  assignment,
  why,
  onStart,
  onHome,
}: PathResultStepProps) {
  const mission = assignment.path ?? assignment.interim;
  const preparing = assignment.state === "preparing";

  return (
    <div className="mx-auto max-w-xl space-y-6 text-center">
      <h1
        className="text-3xl text-[var(--sg-shell-900)]"
        style={{ fontFamily: "var(--font-display), Fraunces, Georgia, serif" }}
      >
        Your path
      </h1>
      {preparing ? (
        <p className="text-sm leading-6 text-[var(--sg-shell-600)]">
          Your path is being prepared; you&apos;ll have it within a day.
        </p>
      ) : (
        <div className="space-y-3">
          <p
            className="text-xl text-[var(--sg-shell-900)]"
            style={{ fontFamily: "var(--font-display), Fraunces, Georgia, serif" }}
          >
            {mission?.pathTitle}
          </p>
          <p className="text-sm leading-6 text-[var(--sg-shell-600)]">{why}</p>
          {mission ? (
            <p className="text-sm text-[var(--sg-shell-900)]">
              {mission.missionTitle} · {mission.estimatedMinutes} min
            </p>
          ) : null}
        </div>
      )}
      {mission ? (
        <div className="space-y-4">
          <Button variant="primary" onClick={onStart}>
            Start your first mission
          </Button>
          <p>
            <Link
              href={getMissionRoute(mission.pathId)}
              className="text-sm text-[var(--sg-shell-600)] underline decoration-[var(--sg-shell-border)] underline-offset-2"
            >
              See the whole path
            </Link>
          </p>
        </div>
      ) : (
        <Button variant="primary" onClick={onHome}>
          Go to home
        </Button>
      )}
    </div>
  );
}
