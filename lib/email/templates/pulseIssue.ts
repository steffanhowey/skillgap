import { SHELL_900 } from "@/lib/palette";
import {
  escapeHtml,
  renderCallout,
  renderEmailLink,
  renderEmailShell,
  type RenderedEmail,
} from "./shell";

export interface PulseIssueInput {
  issueTitle: string;
  /** The issue body. A sent issue is about 300 words. */
  editorial: string;
  doThisWeek: string;
  href: string;
}

/**
 * Pulse newsletter shell for a Resend Broadcast.
 * The editorial is the ~300-word issue. The callout is the one action.
 */
export function renderPulseIssue(input: PulseIssueInput): RenderedEmail {
  const paragraphs = input.editorial
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-family:Georgia, 'Times New Roman', serif;font-size:17px;line-height:1.6;color:${SHELL_900};">${escapeHtml(paragraph)}</p>`,
    )
    .join("");

  const bodyHtml = `
    ${paragraphs}
    ${renderCallout("Do this this week", input.doThisWeek)}
    ${renderEmailLink(input.href, "Open SkillGap")}
  `;

  return {
    subject: input.issueTitle,
    html: renderEmailShell({
      preheader: input.doThisWeek,
      heading: input.issueTitle,
      bodyHtml,
    }),
  };
}
