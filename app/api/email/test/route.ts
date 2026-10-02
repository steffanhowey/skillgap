import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/client";
import { renderFridayCheckIn } from "@/lib/email/templates/fridayCheckIn";
import { renderMondayManagerDigest } from "@/lib/email/templates/mondayManagerDigest";
import { renderPulseIssue } from "@/lib/email/templates/pulseIssue";

type EmailTemplateName =
  | "fridayCheckIn"
  | "mondayManagerDigest"
  | "pulseIssue";

interface TestEmailBody {
  template: EmailTemplateName;
  to: string;
}

const TEMPLATES: readonly EmailTemplateName[] = [
  "fridayCheckIn",
  "mondayManagerDigest",
  "pulseIssue",
];

/**
 * True when the body names a template and a recipient.
 */
function parseBody(value: unknown): TestEmailBody | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (
    typeof body.template !== "string" ||
    !TEMPLATES.includes(body.template as EmailTemplateName)
  ) {
    return null;
  }
  if (typeof body.to !== "string" || !body.to.includes("@")) return null;
  return {
    template: body.template as EmailTemplateName,
    to: body.to,
  };
}

/**
 * Public origin used in the one link inside each test email.
 */
function siteOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured && configured.startsWith("http")) return configured.replace(/\/$/, "");
  return "https://skillgap.ai";
}

/**
 * POST /api/email/test
 * Sends one of the three product templates. Protected by ADMIN_SECRET.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed: TestEmailBody | null = null;
  try {
    parsed = parseBody(await request.json());
  } catch (err) {
    console.error("[email/test] invalid json:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!parsed) {
    return NextResponse.json(
      { error: "Body requires template and to" },
      { status: 400 },
    );
  }

  const origin = siteOrigin();
  const rendered =
    parsed.template === "fridayCheckIn"
      ? renderFridayCheckIn({
          recipientName: "there",
          missionCompleted: false,
          thisWeekTitle: "Write the launch note in the tool you already use",
          nextMissionTitle: "Turn that note into the version you would send",
          streakState: "No streak yet. One mission this week starts it.",
          href: `${origin}/missions`,
        })
      : parsed.template === "mondayManagerDigest"
        ? renderMondayManagerDigest({
            recipientName: "there",
            activeThisWeek: 4,
            missionsCompleted: 3,
            nextSessionTime: "Thursday, 10:00am",
            href: `${origin}/missions`,
          })
        : renderPulseIssue({
            issueTitle: "Pulse — test issue",
            editorial:
              "This is a test of the Pulse shell. A real issue is about 300 words, written from the signals feed, with one thing to do this week.",
            doThisWeek: "Send one piece of work through the tool you already use, and keep the version you would actually ship.",
            href: origin,
          });

  const result = await sendEmail({
    to: parsed.to,
    subject: rendered.subject,
    html: rendered.html,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: result.id });
}
