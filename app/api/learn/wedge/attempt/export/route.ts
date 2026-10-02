import { NextResponse } from "next/server";
import { getTrackFAccess } from "@/lib/learn/wedge/access";
import {
  WEDGE_NO_STORE,
  wedgeAccessResponse,
  wedgeErrorResponse,
} from "@/lib/learn/wedge/http";
import {
  createWedgeRepository,
  exportWedgeWork,
} from "@/lib/learn/wedge/session";

/**
 * Export persisted context, matrix, and claim ledger.
 */
export async function GET(): Promise<NextResponse> {
  const access = await getTrackFAccess();
  const denied = wedgeAccessResponse(access);
  if (denied) return denied;
  if (access.status !== "allowed") return denied!;

  try {
    const exported = await exportWedgeWork(
      createWedgeRepository(),
      access.user.id,
    );
    return NextResponse.json(exported, { headers: WEDGE_NO_STORE });
  } catch (error) {
    return wedgeErrorResponse(error);
  }
}
