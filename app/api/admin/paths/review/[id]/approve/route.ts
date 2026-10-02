import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminAuth } from "@/lib/admin/verifyAdminAuth";

/**
 * POST /api/admin/paths/review/[id]/approve
 * Moves a generated path from draft to approved and points the requester at it.
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
  const { data: path, error: readError } = await admin
    .from("fp_learning_paths")
    .select("id, review_notes")
    .eq("id", id)
    .maybeSingle();

  if (readError || !path) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error } = await admin
    .from("fp_learning_paths")
    .update({ status: "approved", review_status: "approved" })
    .eq("id", id);

  if (error) {
    console.error("[admin] path approve failed");
    return NextResponse.json({ error: "approve_failed" }, { status: 500 });
  }

  const notes = typeof path.review_notes === "string" ? path.review_notes : "";
  const requestedBy = notes.match(/requested_by=([0-9a-f-]{36})/i)?.[1];
  if (requestedBy) {
    await admin
      .from("fp_profiles")
      .update({ recommended_first_path_id: id })
      .eq("id", requestedBy);
  }

  return NextResponse.json({ ok: true });
}
