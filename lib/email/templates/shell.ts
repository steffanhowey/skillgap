import {
  FOREST_500,
  FOREST_900,
  GOLD_100,
  GOLD_900,
  SHELL_300,
  SHELL_50,
  SHELL_600,
  SHELL_900,
} from "@/lib/palette";

/**
 * Escape text before it is placed in email HTML.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

interface EmailShellInput {
  preheader: string;
  heading: string;
  bodyHtml: string;
}

/**
 * Shared HTML document for product email. Colors come from the palette.
 */
export function renderEmailShell(input: EmailShellInput): string {
  const preheader = escapeHtml(input.preheader);
  const heading = escapeHtml(input.heading);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${SHELL_50};color:${SHELL_900};font-family:Georgia, 'Times New Roman', serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SHELL_50};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding:20px 28px;background:${FOREST_900};color:${SHELL_50};font-family:Arial, Helvetica, sans-serif;font-size:14px;letter-spacing:0.04em;">
              SkillGap
            </td>
          </tr>
          <tr>
            <td style="padding:28px;background:${SHELL_50};border:1px solid ${SHELL_300};">
              <h1 style="margin:0 0 16px;font-family:Georgia, 'Times New Roman', serif;font-size:28px;line-height:1.2;color:${FOREST_900};">${heading}</h1>
              ${input.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:1.5;color:${SHELL_600};">
              SkillGap · practice, not a grade
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * One text link styled as the email's single action.
 */
export function renderEmailLink(href: string, label: string): string {
  return `<p style="margin:24px 0 0;font-family:Arial, Helvetica, sans-serif;font-size:16px;">
    <a href="${escapeHtml(href)}" style="color:${FOREST_500};font-weight:600;">${escapeHtml(label)}</a>
  </p>`;
}

/**
 * Highlighted block for the one action in a Pulse issue.
 */
export function renderCallout(title: string, body: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
    <tr>
      <td style="padding:16px 18px;background:${GOLD_100};color:${GOLD_900};font-family:Arial, Helvetica, sans-serif;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(title)}</p>
        <p style="margin:0;font-size:16px;line-height:1.5;">${escapeHtml(body)}</p>
      </td>
    </tr>
  </table>`;
}
