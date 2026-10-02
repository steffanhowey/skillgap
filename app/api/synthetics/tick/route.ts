import { NextResponse } from "next/server";

// retired Oct 2, 2026 — see ROADMAP.md

/**
 * Synthetic-user cron is retired. The route stays so old callers fail closed.
 */
export function GET(): NextResponse {
  return NextResponse.json({ error: "Gone" }, { status: 410 });
}

/**
 * Synthetic-user tick is retired. The route stays so old callers fail closed.
 */
export function POST(): NextResponse {
  return NextResponse.json({ error: "Gone" }, { status: 410 });
}
