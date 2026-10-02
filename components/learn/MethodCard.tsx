"use client";

import { Card } from "@/components/ui/Card";
import { formatNextBriefMethod } from "@/lib/learn/taughtHero/lesson";
import type { ContentBriefPromptUpgrade } from "@/lib/learn/taughtHero/types";

interface MethodCardProps {
  brief: ContentBriefPromptUpgrade;
}

/**
 * The takeaway card a marketer can reuse on the next brief.
 */
export function MethodCard({ brief }: MethodCardProps) {
  return (
    <Card className="space-y-3 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sg-forest-500)]">
        Your next-brief method
      </p>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[var(--sg-shell-900)]">
        {formatNextBriefMethod(brief)}
      </pre>
    </Card>
  );
}
