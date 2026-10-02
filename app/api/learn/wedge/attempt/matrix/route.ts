import { NextResponse } from "next/server";
import { getTrackFAccess } from "@/lib/learn/wedge/access";
import {
  WEDGE_NO_STORE,
  wedgeAccessResponse,
  wedgeErrorResponse,
} from "@/lib/learn/wedge/http";
import {
  createWedgeRepository,
  saveWedgeMatrix,
} from "@/lib/learn/wedge/session";

/**
 * Persist the three-row matrix on the caller's attempt.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const access = await getTrackFAccess();
  const denied = wedgeAccessResponse(access);
  if (denied) return denied;
  if (access.status !== "allowed") return denied!;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers: WEDGE_NO_STORE },
    );
  }

  try {
    const snapshot = await saveWedgeMatrix(
      createWedgeRepository(),
      access.user.id,
      raw,
    );
    return NextResponse.json(snapshot, { headers: WEDGE_NO_STORE });
  } catch (error) {
    return wedgeErrorResponse(error);
  }
}
