import { NextResponse } from "next/server";
import { getTrackFAccess } from "@/lib/learn/wedge/access";
import {
  LAUNCH_MESSAGING_DISCLOSURE_VERSION,
} from "@/lib/learn/wedge/config";
import {
  WEDGE_NO_STORE,
  wedgeAccessResponse,
  wedgeErrorResponse,
} from "@/lib/learn/wedge/http";
import { allowWedgeRequest } from "@/lib/learn/wedge/rateLimit";
import {
  createWedgeRepository,
  evaluateWedgeMatrix,
} from "@/lib/learn/wedge/session";

/**
 * Server-owned pressure test. Client evaluation JSON is ignored.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const access = await getTrackFAccess();
  const denied = wedgeAccessResponse(access);
  if (denied) return denied;
  if (access.status !== "allowed") return denied!;

  if (!allowWedgeRequest(access.user.id, "evaluate")) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: WEDGE_NO_STORE },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers: WEDGE_NO_STORE },
    );
  }

  if (
    typeof raw !== "object" ||
    raw === null ||
    !("artifact" in raw) ||
    !("processingDisclosureAccepted" in raw) ||
    raw.processingDisclosureAccepted !== true ||
    !("disclosureVersion" in raw) ||
    raw.disclosureVersion !== LAUNCH_MESSAGING_DISCLOSURE_VERSION
  ) {
    return NextResponse.json(
      { error: "Confirm the review disclosure before continuing." },
      { status: 400, headers: WEDGE_NO_STORE },
    );
  }

  try {
    const snapshot = await evaluateWedgeMatrix(
      createWedgeRepository(),
      access.user.id,
      raw.artifact,
    );
    const status = snapshot.reviewUnavailable ? 503 : 200;
    return NextResponse.json(snapshot, { status, headers: WEDGE_NO_STORE });
  } catch (error) {
    return wedgeErrorResponse(error);
  }
}
