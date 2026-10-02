import { NextResponse } from "next/server";
import { getTrackFAccess } from "@/lib/learn/wedge/access";
import {
  WEDGE_NO_STORE,
  wedgeAccessResponse,
  wedgeErrorResponse,
} from "@/lib/learn/wedge/http";
import { createWedgeRepository, loadWedgeSession } from "@/lib/learn/wedge/session";

/**
 * Start or resume the founder-only launch-messaging attempt.
 */
export async function GET(): Promise<NextResponse> {
  const access = await getTrackFAccess();
  const denied = wedgeAccessResponse(access);
  if (denied) return denied;
  if (access.status !== "allowed") return denied!;

  try {
    const snapshot = await loadWedgeSession(
      createWedgeRepository(),
      access.user.id,
    );
    return NextResponse.json(snapshot, { headers: WEDGE_NO_STORE });
  } catch (error) {
    return wedgeErrorResponse(error);
  }
}

export async function POST(): Promise<NextResponse> {
  return GET();
}
