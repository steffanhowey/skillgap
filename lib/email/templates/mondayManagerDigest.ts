import { SHELL_900 } from "@/lib/palette";
import {
  escapeHtml,
  renderEmailLink,
  renderEmailShell,
  type RenderedEmail,
} from "./shell";

export interface MondayManagerDigestInput {
  recipientName: string;
  activeThisWeek: number;
  missionsCompleted: number;
  nextSessionTime: string;
  href: string;
}

/**
 * Monday note for a team owner: activity counts, next session, one link.
 */
export function renderMondayManagerDigest(
  input: MondayManagerDigestInput,
): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:1.5;color:${SHELL_900};">
      ${escapeHtml(input.recipientName)}, here is the team.
    </p>
    <p style="margin:0 0 8px;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:1.5;color:${SHELL_900};">
      <strong>Active this week.</strong> ${escapeHtml(String(input.activeThisWeek))}
    </p>
    <p style="margin:0 0 8px;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:1.5;color:${SHELL_900};">
      <strong>Missions completed.</strong> ${escapeHtml(String(input.missionsCompleted))}
    </p>
    <p style="margin:0;font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:1.5;color:${SHELL_900};">
      <strong>Next session.</strong> ${escapeHtml(input.nextSessionTime)}
    </p>
    ${renderEmailLink(input.href, "Open the team")}
  `;

  return {
    subject: "Your team this week",
    html: renderEmailShell({
      preheader: `${input.activeThisWeek} active, ${input.missionsCompleted} missions completed`,
      heading: "Your team this week",
      bodyHtml,
    }),
  };
}
