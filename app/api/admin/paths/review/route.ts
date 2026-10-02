import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminAuth } from "@/lib/admin/verifyAdminAuth";

/**
 * GET /api/admin/paths/review
 * Pending generated paths, plus free first missions auto-approved for admin visibility.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!(await verifyAdminAuth(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fp_learning_paths")
    .select("id, title, status, review_status, generation_source, role_function, created_at")
    .or("review_status.eq.pending,generation_source.eq.onboarding_free")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[admin] path review list failed");
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }

  return NextResponse.json({ paths: data ?? [] });
}
