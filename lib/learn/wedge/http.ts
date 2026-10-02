import { NextResponse } from "next/server";
import type { TrackFAccess } from "./access";
import { WedgeSessionError } from "./session";

export const WEDGE_NO_STORE = { "Cache-Control": "no-store" };

/**
 * Hide the path from anyone outside the founder allowlist.
 */
export function wedgeAccessResponse(access: TrackFAccess): NextResponse | null {
  if (access.status === "unauthenticated") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: WEDGE_NO_STORE },
    );
  }
  if (access.status === "forbidden") {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: WEDGE_NO_STORE },
    );
  }
  return null;
}

/**
 * Map session failures to HTTP responses without leaking internals.
 */
export function wedgeErrorResponse(error: unknown): NextResponse {
  if (error instanceof WedgeSessionError) {
    return NextResponse.json(
      {
        error: error.message,
        fields: error.fields,
      },
      { status: error.status, headers: WEDGE_NO_STORE },
    );
  }
  console.warn("[wedge] unexpected session error");
  return NextResponse.json(
    { error: "Request failed" },
    { status: 500, headers: WEDGE_NO_STORE },
  );
}
