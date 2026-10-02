import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

interface EventBody {
  event?: unknown;
  properties?: unknown;
}

/**
 * POST /api/events
 * First-party product analytics. Auth optional; anonymous events store user_id null.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as EventBody;
    const event = typeof body.event === "string" ? body.event.trim() : "";
    if (!event || event.length > 120) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const properties =
      body.properties &&
      typeof body.properties === "object" &&
      !Array.isArray(body.properties)
        ? (body.properties as Record<string, unknown>)
        : {};

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();
    const { error } = await admin.from("fp_product_events").insert({
      user_id: user?.id ?? null,
      event,
      properties,
    });

    if (error) {
      console.error("[events] insert failed:", error);
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[events] request failed:", error);
    return new NextResponse(null, { status: 204 });
  }
}
