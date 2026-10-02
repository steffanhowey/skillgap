/**
 * Calculate and persist skill receipts for completed paths that never got one.
 *
 * Usage:
 *   npx tsx scripts/backfill-missing-receipts.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { createClient } from "@supabase/supabase-js";
import { calculateSkillReceipt } from "@/lib/skills/receiptCalculator";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function main(): Promise<void> {
  const supabase = getSupabase();
  const { data: achievements, error } = await supabase
    .from("fp_achievements")
    .select("user_id, path_id, path_title, completed_at")
    .is("skill_receipt", null);

  if (error) throw error;

  let updated = 0;
  for (const achievement of achievements ?? []) {
    const { data: progress } = await supabase
      .from("fp_learning_progress")
      .select("item_states, completed_at")
      .eq("user_id", achievement.user_id)
      .eq("path_id", achievement.path_id)
      .eq("status", "completed")
      .single();

    const { data: path } = await supabase
      .from("fp_learning_paths")
      .select("title, items")
      .eq("id", achievement.path_id)
      .single();

    if (!progress || !path) continue;

    const receipt = await calculateSkillReceipt({
      userId: achievement.user_id,
      pathId: achievement.path_id,
      pathTitle: (path.title as string) ?? achievement.path_title,
      completedAt:
        (progress.completed_at as string) ?? achievement.completed_at,
      itemStates: (progress.item_states ?? {}) as Record<
        string,
        { completed?: boolean; evaluation?: Record<string, unknown> }
      >,
      pathItems: (path.items ?? []) as Array<{
        item_id?: string;
        task_type?: string;
        mission?: { objective?: string };
      }>,
    });

    if (!receipt) continue;

    const { error: updateErr } = await supabase
      .from("fp_achievements")
      .update({ skill_receipt: receipt })
      .eq("user_id", achievement.user_id)
      .eq("path_id", achievement.path_id);

    if (updateErr) {
      console.error("[backfill-receipts] persist failed", updateErr);
      continue;
    }

    updated += 1;
    console.log(`Receipt saved for ${achievement.path_id}`);
  }

  console.log(`Updated ${updated} receipt(s)`);
}

void main();
