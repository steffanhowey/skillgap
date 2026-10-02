"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MISSIONS_ROUTE } from "@/lib/appRoutes";

interface ProjectExperienceShellProps {
  title: string;
  artifactLabel?: string | null;
  stepNumber: number;
  stepCount: number;
  stepKind: string;
  coachingLine: string;
  progressPercent: number;
  headerRight?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Light project frame for a taught solo unit.
 */
export function ProjectExperienceShell({
  title,
  artifactLabel,
  stepNumber,
  stepCount,
  stepKind,
  coachingLine,
  progressPercent,
  headerRight,
  footer,
  children,
}: ProjectExperienceShellProps) {
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
              {title}
            </h1>
            {artifactLabel ? (
              <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sg-forest-500)]">
                {artifactLabel}
              </p>
            ) : null}
          </div>
          {headerRight}
        </div>
        <div className="h-1 w-full bg-[var(--sg-shell-100)]" aria-hidden="true">
          <div
            className="h-full bg-[var(--sg-forest-500)] transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-[880px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
              Step {stepNumber} of {stepCount} · {stepKind}
            </p>
            <p className="text-base leading-7 text-[var(--sg-shell-900)]">
              {coachingLine}
            </p>
          </div>
          {children}
          {footer}
        </div>
      </main>
    </div>
  );
}
