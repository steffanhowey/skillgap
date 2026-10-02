import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminAuth } from "@/lib/admin/verifyAdminAuth";

/**
 * POST /api/admin/paths/review/[id]/reject
 * Marks a generated path rejected. It stays out of the catalog.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  if (!(await verifyAdminAuth(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("fp_learning_paths")
    .update({
      status: "rejected",
      review_status: "rejected",
      is_discoverable: false,
    })
    .eq("id", id);

  if (error) {
    console.error("[admin] path reject failed");
    return NextResponse.json({ error: "reject_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
