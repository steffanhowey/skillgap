"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { GettingStartedRow } from "@/lib/home/gettingStarted";
import type { PathMissionRow, ThisWeekMission } from "@/lib/home/thisWeekMission";
import type { WeeklyStreak } from "@/lib/practice/weeklyStreak";
import { getMissionSoloRoute } from "@/lib/appRoutes";

interface HomePayload {
  timeZone: string;
  mission: ThisWeekMission;
  streak: WeeklyStreak;
  weekStarts: string[];
  checklist: GettingStartedRow[];
}

/**
 * Home: this week's mission, the path, the checklist, and the weekly streak.
 */
export function HomePage() {
  const [payload, setPayload] = useState<HomePayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let cancelled = false;
    fetch(`/api/home?timeZone=${encodeURIComponent(timeZone)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("home");
        return (await response.json()) as HomePayload;
      })
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-[var(--sg-shell-600)]">Couldn&apos;t load this week.</p>;
  }
  if (!payload) {
    return <p className="text-sm text-[var(--sg-shell-500)]">Loading.</p>;
  }

  const checklistOpen = payload.checklist.some((row) => !row.done);

  return (
    <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
      <div className="w-full space-y-12 lg:w-[576px] lg:shrink-0">
        <section className="space-y-4">
          <h2 className="text-[22px] font-semibold leading-7 text-[var(--sg-shell-900)]">
            This week
          </h2>
          <MissionCard mission={payload.mission} />
        </section>
        {payload.mission.state !== "no_path" ? (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-[22px] font-semibold leading-7 text-[var(--sg-shell-900)]">
                Your path
              </h2>
              <p className="text-sm text-[var(--sg-shell-500)]">
                {payload.mission.doneCount} of {payload.mission.missionCount} done
              </p>
            </div>
            <Card className="bg-[var(--sg-white)] px-6" style={{ borderRadius: "var(--sg-radius-lg)" }}>
              <ol>
                {payload.mission.missions.map((row) => (
                  <li
                    key={row.moduleIndex}
                    className="flex items-baseline gap-4 border-b border-[var(--sg-shell-border)] py-3 last:border-b-0"
                  >
                    <span className="w-5 text-sm text-[var(--sg-shell-500)]">{row.number}</span>
                    <span className="min-w-0 flex-1 text-sm text-[var(--sg-shell-900)]">{row.title}</span>
                    <span className="shrink-0 text-sm text-[var(--sg-shell-500)]">
                      {rowText(row, payload.timeZone)}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          </section>
        ) : null}
      </div>
      <div className="flex w-full flex-col gap-5 lg:w-[288px] lg:shrink-0">
        {checklistOpen ? <ChecklistCard rows={payload.checklist} /> : null}
        <StreakCard streak={payload.streak} weekStarts={payload.weekStarts} />
      </div>
    </div>
  );
}

function MissionCard({ mission }: { mission: ThisWeekMission }) {
  const router = useRouter();

  if (mission.state === "no_path") {
    return (
      <Card className="space-y-4 bg-[var(--sg-white)] p-6" style={{ borderRadius: "var(--sg-radius-lg)" }}>
        <p className="text-sm leading-6 text-[var(--sg-shell-700)]">
          Answer three questions to get your path.
        </p>
        <Button variant="cta" size="sm" onClick={() => router.push("/onboard")}>
          Start
        </Button>
      </Card>
    );
  }

  if (mission.state === "in_review") {
    return (
      <Card className="bg-[var(--sg-white)] p-6" style={{ borderRadius: "var(--sg-radius-lg)" }}>
        <p className="text-sm leading-6 text-[var(--sg-shell-700)]">
          Your path is being finished. It&apos;ll be here within a day.
        </p>
      </Card>
    );
  }

  if (mission.state === "path_done") {
    return (
      <Card className="bg-[var(--sg-white)] p-6" style={{ borderRadius: "var(--sg-radius-lg)" }}>
        <p className="text-sm leading-6 text-[var(--sg-shell-700)]">
          You finished {mission.pathTitle}. Your next path will be here within a day.
        </p>
      </Card>
    );
  }

  const href = mission.pathId ? getMissionSoloRoute(mission.pathId) : "/missions";

  return (
    <Card className="space-y-3 bg-[var(--sg-white)] p-6" style={{ borderRadius: "var(--sg-radius-lg)" }}>
      <p className="text-sm text-[var(--sg-shell-500)]">
        {mission.pathTitle}
        {mission.missionNumber != null
          ? ` · Mission ${mission.missionNumber} of ${mission.missionCount}`
          : ""}
      </p>
      <h3 className="text-base font-semibold text-[var(--sg-shell-900)]">{mission.missionTitle}</h3>
      {mission.practices ? (
        <p className="text-sm leading-6 text-[var(--sg-shell-700)]">{mission.practices}</p>
      ) : null}
      <p className="text-sm text-[var(--sg-shell-500)]">
        {mission.tool ? `In ${mission.tool} · ${mission.stepsLabel}` : mission.stepsLabel}
      </p>
      {mission.state === "continue" && mission.stoppedAt ? (
        <p className="text-sm text-[var(--sg-shell-700)]">You stopped at {mission.stoppedAt}.</p>
      ) : null}
      <div className="space-y-2 pt-1">
        <Button variant="cta" size="sm" onClick={() => router.push(href)}>
          {mission.state === "continue" ? "Continue" : "Start"}
        </Button>
        {mission.doLocked ? (
          <p className="text-sm text-[var(--sg-shell-500)]">
            The Do step in this mission is on the paid plan.{" "}
            <Link href="/pricing" className="text-[var(--sg-forest-500)] underline">
              See plans
            </Link>
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function ChecklistCard({ rows }: { rows: GettingStartedRow[] }) {
  return (
    <Card className="space-y-3 bg-[var(--sg-white)] p-4" style={{ borderRadius: "var(--sg-radius-lg)" }}>
      <h2 className="text-sm font-semibold text-[var(--sg-shell-900)]">Getting started</h2>
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex h-8 items-center gap-2 rounded-[var(--sg-radius-btn)] border border-[var(--sg-shell-border)] px-2"
          >
            {row.done ? (
              <Check size={14} strokeWidth={2} className="shrink-0 text-[var(--sg-forest-500)]" aria-hidden />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            <span className="whitespace-nowrap text-[12px] leading-4 text-[var(--sg-shell-700)]">
              {row.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StreakCard({
  streak,
  weekStarts,
}: {
  streak: WeeklyStreak;
  weekStarts: string[];
}) {
  return (
    <Card className="bg-[var(--sg-white)] p-4" style={{ borderRadius: "var(--sg-radius-lg)" }}>
      <h2 className="text-sm font-semibold text-[var(--sg-shell-900)]">{streakTitle(streak.count)}</h2>
      <p className="mt-1 text-sm leading-5 text-[var(--sg-shell-500)]">
        A week counts when you finish one mission.
      </p>
      <div className="mt-4 flex items-center justify-between">
        {streak.lastEightWeeks.map((filled, index) => {
          const current = index === streak.lastEightWeeks.length - 1;
          const className = filled
            ? "bg-[var(--sg-forest-500)]"
            : current
              ? "border border-[var(--sg-shell-900)] bg-transparent"
              : "bg-[var(--sg-shell-200)]";
          return (
            <span
              key={weekStarts[index] ?? index}
              className={`block h-[22px] w-[22px] shrink-0 rounded-full ${className}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-[var(--sg-shell-500)]">
        <span>{weekStarts[0] ? formatWeekStart(weekStarts[0]) : ""}</span>
        <span>This week</span>
      </div>
    </Card>
  );
}

function streakTitle(count: number): string {
  if (count <= 0) return "Start a streak this week";
  if (count === 1) return "1 week in a row";
  return `${count} weeks in a row`;
}

function rowText(row: PathMissionRow, timeZone: string): string {
  if (row.rowState === "done") {
    return row.completedAt ? `Done ${formatDay(row.completedAt, timeZone)}` : "Done";
  }
  if (row.rowState === "paid") return "On the paid plan";
  if (row.rowState === "this_week") return "This week";
  return "Up next";
}

function formatDay(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(iso));
}

function formatWeekStart(ymd: string): string {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
