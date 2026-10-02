import { SHELL_600, SHELL_900 } from "@/lib/palette";
import {
  escapeHtml,
  renderEmailLink,
  renderEmailShell,
  type RenderedEmail,
} from "./shell";

export interface FridayCheckInInput {
  recipientName: string;
  missionCompleted: boolean;
  thisWeekTitle: string;
  nextMissionTitle: string;
  streakState: string;
  href: string;
}

/**
 * Friday learner note: this week, next week, streak, one link.
 */
export function renderFridayCheckIn(input: FridayCheckInInput): RenderedEmail {
  const thisWeek = input.missionCompleted
    ? `Completed: ${input.thisWeekTitle}`
    : `Still open: ${input.thisWeekTitle}`;
  const bodyHtml = `
    <p style="margin:0 0 12px;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:1.5;color:${SHELL_900};">
      ${escapeHtml(input.recipientName)}, here is the week.
    </p>
    <p style="margin:0 0 8px;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:1.5;color:${SHELL_900};">
      <strong>This week.</strong> ${escapeHtml(thisWeek)}
    </p>
    <p style="margin:0 0 8px;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:1.5;color:${SHELL_900};">
      <strong>Next week.</strong> ${escapeHtml(input.nextMissionTitle)}
    </p>
    <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:1.5;color:${SHELL_600};">
      ${escapeHtml(input.streakState)}
    </p>
    ${renderEmailLink(input.href, "Open this week's mission")}
  `;

  return {
    subject: "This week, next week",
    html: renderEmailShell({
      preheader: `${thisWeek} Next: ${input.nextMissionTitle}`,
      heading: "This week, next week",
      bodyHtml,
    }),
  };
}
