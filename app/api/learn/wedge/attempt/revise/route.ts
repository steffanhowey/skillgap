import { NextResponse } from "next/server";
import { getTrackFAccess } from "@/lib/learn/wedge/access";
import {
  WEDGE_NO_STORE,
  wedgeAccessResponse,
  wedgeErrorResponse,
} from "@/lib/learn/wedge/http";
import {
  createWedgeRepository,
  reviseWedgeMatrix,
} from "@/lib/learn/wedge/session";

/**
 * Persist explicit accept/reject choices as the current matrix version.
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
    const snapshot = await reviseWedgeMatrix(
      createWedgeRepository(),
      access.user.id,
      raw,
    );
    return NextResponse.json(snapshot, { headers: WEDGE_NO_STORE });
  } catch (error) {
    return wedgeErrorResponse(error);
  }
}
