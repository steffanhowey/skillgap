import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import {
  FLUENCY_OPTIONS,
  FUNCTION_OPTIONS,
  MARKETING_ROLE_OPTIONS,
} from "@/lib/onboarding/types";
import { practiceCalendar } from "@/lib/practice/practiceCalendar";

/**
 * GET /api/profile/practice
 * The signed-in learner's practice record. Private fields stay on this response.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const timeZone = safeTimeZone(new URL(request.url).searchParams.get("timeZone"));
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("fp_profiles")
    .select("username, marketing_role, fluency_level, primary_function, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const { data: logRows } = await admin
    .from("fp_practice_log")
    .select(
      "id, path_id, mission_title, practices, tool, artifact_url, self_check, check_score, reflection, seconds_spent, completed_at",
    )
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  const logs = asLogs(logRows);
  const pathTitles = await loadPathTitles(
    admin,
    [...new Set(logs.map((log) => log.pathId))],
  );

  const sinceIso =
    oldest(logs.map((log) => log.completedAt)) ??
    (typeof profile?.created_at === "string" ? profile.created_at : new Date().toISOString());

  const tools = new Set(logs.map((log) => log.tool).filter((tool): tool is string => Boolean(tool)));

  return NextResponse.json({
    timeZone,
    handle: handleFrom(typeof profile?.username === "string" ? profile.username : null),
    roleLabel: roleLabel(
      typeof profile?.marketing_role === "string" ? profile.marketing_role : null,
      typeof profile?.primary_function === "string" ? profile.primary_function : null,
    ),
    fluencyLabel: fluencyLabel(
      typeof profile?.fluency_level === "string" ? profile.fluency_level : null,
    ),
    practicingSince: formatMonth(sinceIso, timeZone),
    records: logs.map((log) => ({
      ...log,
      pathTitle: pathTitles.get(log.pathId) ?? "Path",
    })),
    calendar: practiceCalendar(
      logs.map((log) => log.completedAt),
      new Date(),
      timeZone,
    ),
    missionCount: logs.length,
    toolCount: tools.size,
  });
}

interface PracticeRecord {
  id: string;
  pathId: string;
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

function asLogs(value: unknown): PracticeRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.path_id !== "string") return [];
    const artifact = typeof row.artifact_url === "string" ? row.artifact_url : null;
    return [
      {
        id: row.id,
        pathId: row.path_id,
        missionTitle: typeof row.mission_title === "string" ? row.mission_title : "Mission",
        practices: typeof row.practices === "string" ? row.practices : "",
        tool: typeof row.tool === "string" && row.tool ? row.tool : null,
        artifactUrl:
          artifact && (artifact.startsWith("https://") || artifact.startsWith("http://"))
            ? artifact
            : null,
        selfCheck: typeof row.self_check === "string" ? row.self_check : null,
        checkRight: typeof row.check_score === "number" ? row.check_score : null,
        reflection: typeof row.reflection === "string" && row.reflection ? row.reflection : null,
        secondsSpent: typeof row.seconds_spent === "number" ? row.seconds_spent : 0,
        completedAt:
          typeof row.completed_at === "string" ? row.completed_at : new Date(0).toISOString(),
      },
    ];
  });
}

async function loadPathTitles(
  admin: ReturnType<typeof createAdminClient>,
  ids: string[],
): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  if (ids.length === 0) return titles;
  const { data } = await admin.from("fp_learning_paths").select("id, title").in("id", ids);
  if (!Array.isArray(data)) return titles;
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.id === "string" && typeof row.title === "string") {
      titles.set(row.id, row.title);
    }
  }
  return titles;
}

function handleFrom(username: string | null): string {
  if (!username) return "Your profile";
  return username.startsWith("@") ? username : `@${username}`;
}

function roleLabel(marketingRole: string | null, primaryFunction: string | null): string | null {
  const role = MARKETING_ROLE_OPTIONS.find((option) => option.value === marketingRole);
  if (role) return role.label;
  return FUNCTION_OPTIONS.find((option) => option.value === primaryFunction)?.label ?? null;
}

function fluencyLabel(value: string | null): string | null {
  return FLUENCY_OPTIONS.find((option) => option.value === value)?.label ?? null;
}

function oldest(values: string[]): string | null {
  if (values.length === 0) return null;
  return values.reduce((earliest, value) => (value < earliest ? value : earliest));
}

function formatMonth(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(iso));
}

function safeTimeZone(value: string | null): string {
  if (!value) return "UTC";
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return value;
  } catch {
    return "UTC";
  }
}
