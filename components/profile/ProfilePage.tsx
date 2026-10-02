"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import type { PracticeDay } from "@/lib/practice/practiceCalendar";

interface PracticeRecord {
  id: string;
  pathTitle: string;
  missionTitle: string;
  practices: string;
  tool: string | null;
  artifactUrl: string | null;
  selfCheck: string | null;
  checkRight: number | null;
  reflection: string | null;
  secondsSpent: number;
  completedAt: string;
}

interface ProfilePayload {
  timeZone: string;
  handle: string;
  roleLabel: string | null;
  fluencyLabel: string | null;
  practicingSince: string;
  records: PracticeRecord[];
  calendar: PracticeDay[][];
  missionCount: number;
  toolCount: number;
}

/**
 * Profile: what you've practiced, the practice log, and the practice calendar.
 */
export function ProfilePage() {
  const [payload, setPayload] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let cancelled = false;
    fetch(`/api/profile/practice?timeZone=${encodeURIComponent(timeZone)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("profile");
        return (await response.json()) as ProfilePayload;
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
    return <p className="text-sm text-[var(--sg-shell-600)]">Couldn&apos;t load your profile.</p>;
  }
  if (!payload) {
    return <p className="text-sm text-[var(--sg-shell-500)]">Loading.</p>;
  }

  const identity = [payload.roleLabel, payload.fluencyLabel].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
      <div className="w-full space-y-12 lg:w-[576px] lg:shrink-0">
        <header className="space-y-1">
          <h1
            className="text-[32px] font-semibold leading-10 text-[var(--sg-shell-900)]"
            style={{ fontFamily: "var(--font-display), Fraunces, Georgia, serif" }}
          >
            {payload.handle}
          </h1>
          {identity ? <p className="text-sm text-[var(--sg-shell-700)]">{identity}</p> : null}
          <p className="text-sm text-[var(--sg-shell-500)]">
            Practicing since {payload.practicingSince}
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-[22px] font-semibold leading-7 text-[var(--sg-shell-900)]">
            What you&apos;ve practiced
          </h2>
          {payload.records.length === 0 ? (
            <p className="text-sm leading-6 text-[var(--sg-shell-600)]">
              Finish a mission and what you practiced shows up here.
            </p>
          ) : (
            <ul>
              {payload.records.map((record) => (
                <li
                  key={record.id}
                  className="border-b border-[var(--sg-shell-border)] py-3 last:border-b-0"
                >
                  <p className="text-sm leading-6 text-[var(--sg-shell-900)]">
                    {record.practices.trim() || record.missionTitle}
                  </p>
                  <p className="mt-1 text-sm text-[var(--sg-shell-500)]">
                    {[record.tool, formatDay(record.completedAt, payload.timeZone)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-[22px] font-semibold leading-7 text-[var(--sg-shell-900)]">
              Practice log
            </h2>
            <p className="mt-1 text-sm text-[var(--sg-shell-500)]">Only you see this.</p>
          </div>
          {payload.records.length === 0 ? null : (
            <Card className="bg-[var(--sg-white)] px-6" style={{ borderRadius: "var(--sg-radius-lg)" }}>
              <ul>
                {payload.records.map((record) => {
                  const open = openId === record.id;
                  return (
                    <li key={record.id} className="border-b border-[var(--sg-shell-border)] last:border-b-0">
                      <button
                        type="button"
                        className="flex w-full flex-col items-start gap-1 py-3 text-left"
                        aria-expanded={open}
                        onClick={() => setOpenId(open ? null : record.id)}
                      >
                        <span className="text-sm font-medium text-[var(--sg-shell-900)]">
                          {record.missionTitle}
                        </span>
                        <span className="text-sm text-[var(--sg-shell-500)]">
                          {[
                            record.pathTitle,
                            formatDay(record.completedAt, payload.timeZone),
                            formatMinutes(record.secondsSpent),
                            record.tool,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </button>
                      {open ? <RecordDetail record={record} /> : null}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </section>
      </div>

      <div className="w-full lg:w-[288px] lg:shrink-0">
        <Card className="bg-[var(--sg-white)] p-4" style={{ borderRadius: "var(--sg-radius-lg)" }}>
          <h2 className="text-sm font-semibold text-[var(--sg-shell-900)]">Practice calendar</h2>
          <div className="mt-4 grid w-fit grid-flow-col grid-rows-7 gap-1" aria-hidden>
            {payload.calendar.flat().map((day) => (
              <span
                key={day.date}
                className={`block h-4 w-4 ${
                  day.count > 0 ? "bg-[var(--sg-forest-500)]" : "bg-[var(--sg-shell-200)]"
                }`}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--sg-shell-600)]">
            {countLine(payload.missionCount, "mission", "missions")} practiced ·{" "}
            {countLine(payload.toolCount, "tool", "tools")}
          </p>
        </Card>
      </div>
    </div>
  );
}

function RecordDetail({ record }: { record: PracticeRecord }) {
  const work = workLabel(record.selfCheck);
  return (
    <div className="space-y-2 pb-3 text-sm leading-6 text-[var(--sg-shell-700)]">
      {work ? <p>Did it at work: {work}</p> : null}
      {record.checkRight != null ? <p>Check: {record.checkRight} right</p> : null}
      {record.reflection ? <p>{record.reflection}</p> : null}
      {record.artifactUrl ? (
        <p>
          <a
            href={record.artifactUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--sg-forest-500)] underline"
          >
            Your link
          </a>
        </p>
      ) : null}
    </div>
  );
}

function workLabel(value: string | null): string | null {
  if (value === "yes") return "Yes";
  if (value === "partly") return "Partly";
  if (value === "not_yet") return "Not yet";
  return null;
}

function formatMinutes(seconds: number): string {
  const minutes = seconds <= 0 ? 0 : Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

function formatDay(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(iso));
}

function countLine(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
