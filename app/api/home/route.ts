import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { canDoMission, getPlan } from "@/lib/billing/plan";
import { gettingStarted } from "@/lib/home/gettingStarted";
import {
  thisWeekMission,
  type PathRowState,
  type ThisWeekMission,
  type WeekItem,
  type WeekModule,
  type WeekPath,
} from "@/lib/home/thisWeekMission";
import { recentWeekStarts, weeklyStreak } from "@/lib/practice/weeklyStreak";

/**
 * GET /api/home
 * This week's mission, the path, the checklist, and the weekly streak.
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
    .select(
      "onboarding_completed, recommended_first_path_id",
    )
    .eq("id", user.id)
    .maybeSingle();

  const { data: progressRows } = await admin
    .from("fp_learning_progress")
    .select("path_id, status, item_states, current_item_index, last_activity_at")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("last_activity_at", { ascending: false })
    .limit(1);

  const { data: logRows } = await admin
    .from("fp_practice_log")
    .select("path_id, module_index, completed_at, self_check")
    .eq("user_id", user.id);

  const logs = asLogs(logRows);
  const progress = asProgress(progressRows?.[0]);
  const assignedPathId =
    typeof profile?.recommended_first_path_id === "string"
      ? profile.recommended_first_path_id
      : null;
  const activePathId = progress?.pathId ?? assignedPathId;
  const stored = activePathId ? await loadPath(admin, activePathId) : null;
  const path = stored?.path ?? null;
  const matchingProgress =
    progress && path && progress.pathId === path.id ? progress : null;

  const completedOnPath = logs.filter((log) => log.pathId === path?.id);
  let mission = thisWeekMission({
    path,
    progress: matchingProgress
      ? {
          itemStates: matchingProgress.itemStates,
          currentItemIndex: matchingProgress.currentItemIndex,
        }
      : null,
    completedModuleIndexes: completedOnPath.map((log) => log.moduleIndex),
    completedAtByModule: Object.fromEntries(
      completedOnPath.map((log) => [log.moduleIndex, log.completedAt]),
    ),
    plan: (await getPlan(user.id)).plan,
  });

  if (
    path &&
    stored &&
    mission.moduleIndex != null &&
    mission.state !== "in_review" &&
    mission.state !== "path_done" &&
    mission.state !== "no_path"
  ) {
    mission = await applyAccess(user.id, mission, stored.items);
  }

  const now = new Date();
  return NextResponse.json({
    timeZone,
    mission,
    streak: weeklyStreak(
      logs.map((log) => log.completedAt),
      now,
      timeZone,
    ),
    weekStarts: recentWeekStarts(now, timeZone, 8),
    checklist: gettingStarted({
      onboardingCompleted: profile?.onboarding_completed === true,
      practiceCount: logs.length,
      triedAtWork: logs.some(
        (log) => log.selfCheck === "yes" || log.selfCheck === "partly",
      ),
    }),
  });
}

async function applyAccess(
  userId: string,
  mission: ThisWeekMission,
  items: WeekItem[],
): Promise<ThisWeekMission> {
  const accessItems = items.map((item) => ({
    item_id: item.itemId,
    task_type: item.taskType,
    module_index: item.moduleIndex,
  }));
  const missions = [];
  for (const row of mission.missions) {
    if (row.rowState === "done" || !mission.pathId) {
      missions.push(row);
      continue;
    }
    const allowed = await canDoMission(userId, mission.pathId, {
      moduleIndex: row.moduleIndex,
      items: accessItems,
    });
    const rowState: PathRowState = allowed
      ? row.moduleIndex === mission.moduleIndex
        ? "this_week"
        : "up_next"
      : "paid";
    missions.push({ ...row, rowState });
  }
  const current = missions.find((row) => row.moduleIndex === mission.moduleIndex);
  return {
    ...mission,
    doLocked: current?.rowState === "paid",
    missions,
  };
}

async function loadPath(
  admin: ReturnType<typeof createAdminClient>,
  pathId: string,
): Promise<{ path: WeekPath; items: WeekItem[] } | null> {
  const { data } = await admin
    .from("fp_learning_paths")
    .select("id, title, items, modules, review_status, status")
    .eq("id", pathId)
    .maybeSingle();
  if (!data?.id || typeof data.title !== "string") return null;
  const items = readItems(data.items);
  const modules = readModules(data.modules, items);
  return {
    items,
    path: {
      id: data.id,
      title: data.title,
      reviewStatus: typeof data.review_status === "string" ? data.review_status : null,
      status: typeof data.status === "string" ? data.status : null,
      modules,
      items,
    },
  };
}

function readItems(value: unknown): WeekItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const mission = row.mission;
    let tool: string | null = null;
    if (mission && typeof mission === "object") {
      const toolValue = (mission as Record<string, unknown>).tool;
      if (typeof toolValue === "string") tool = toolValue;
      if (toolValue && typeof toolValue === "object") {
        const name = (toolValue as Record<string, unknown>).name;
        if (typeof name === "string") tool = name;
      }
    }
    return [
      {
        itemId: typeof row.item_id === "string" ? row.item_id : "",
        taskType: typeof row.task_type === "string" ? row.task_type : "watch",
        moduleIndex: typeof row.module_index === "number" ? row.module_index : 0,
        tool,
      },
    ];
  });
}

function readModules(value: unknown, items: WeekItem[]): WeekModule[] {
  if (Array.isArray(value) && value.length > 0) {
    return value.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const row = entry as Record<string, unknown>;
      const index = typeof row.index === "number" ? row.index : null;
      if (index == null) return [];
      return [
        {
          index,
          title: typeof row.title === "string" && row.title ? row.title : "Mission",
          practices: typeof row.practices === "string" && row.practices ? row.practices : null,
        },
      ];
    });
  }
  const seen = new Set<number>();
  const modules: WeekModule[] = [];
  for (const item of items) {
    if (seen.has(item.moduleIndex)) continue;
    seen.add(item.moduleIndex);
    modules.push({
      index: item.moduleIndex,
      title: `Mission ${modules.length + 1}`,
      practices: null,
    });
  }
  return modules;
}

interface ProgressRow {
  pathId: string;
  itemStates: Record<string, { completed?: boolean; skipped?: boolean }>;
  currentItemIndex: number;
}

function asProgress(value: unknown): ProgressRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.path_id !== "string") return null;
  return {
    pathId: row.path_id,
    itemStates: asItemStates(row.item_states),
    currentItemIndex: typeof row.current_item_index === "number" ? row.current_item_index : 0,
  };
}

function asItemStates(
  value: unknown,
): Record<string, { completed?: boolean; skipped?: boolean }> {
  if (!value || typeof value !== "object") return {};
  const states: Record<string, { completed?: boolean; skipped?: boolean }> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    states[key] = {
      completed: row.completed === true,
      skipped: row.skipped === true,
    };
  }
  return states;
}

interface PracticeLog {
  pathId: string;
  moduleIndex: number;
  completedAt: string;
  selfCheck: string | null;
}

function asLogs(value: unknown): PracticeLog[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    if (typeof row.path_id !== "string" || typeof row.module_index !== "number") return [];
    return [
      {
        pathId: row.path_id,
        moduleIndex: row.module_index,
        completedAt: typeof row.completed_at === "string" ? row.completed_at : new Date(0).toISOString(),
        selfCheck: typeof row.self_check === "string" ? row.self_check : null,
      },
    ];
  });
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
