import { NextResponse } from "next/server";
import { getMessageReviewLabAccess } from "@/lib/labs/messageReview/access";
import { MessageReviewEventRequestSchema } from "@/lib/labs/messageReview/schemas";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

/**
 * Record one strictly content-free validation event.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const access = await getMessageReviewLabAccess();
  if (access.status === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (access.status === "forbidden") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = MessageReviewEventRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const properties: Record<string, unknown> = {
    experiment_version: parsed.data.experimentVersion,
    study_participant_id: parsed.data.studyParticipantId,
  };
  if (parsed.data.durationBucket) {
    properties.duration_bucket = parsed.data.durationBucket;
  }
  if (parsed.data.issueCounts) {
    properties.issue_counts = parsed.data.issueCounts;
  }
  if (parsed.data.exportType) {
    properties.export_type = parsed.data.exportType;
  }
  if (parsed.data.operatorRescue !== undefined) {
    properties.operator_rescue = parsed.data.operatorRescue;
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("fp_product_events").insert({
      user_id: access.user.id,
      event: parsed.data.event,
      properties,
    });
    if (error) {
      console.warn("[message-review/events] event insert unavailable");
    }
  } catch {
    console.warn("[message-review/events] event insert unavailable");
  }

  return new NextResponse(null, { status: 204 });
}
