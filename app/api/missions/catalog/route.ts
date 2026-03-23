import { NextResponse } from "next/server";
import { listPublishedLaunchCatalogPaths } from "@/lib/missions/services/launchCatalogService";

/** GET /api/missions/catalog */
export async function GET(): Promise<NextResponse> {
  try {
    const catalog = await listPublishedLaunchCatalogPaths();
    return NextResponse.json({ catalog });
  } catch (error) {
    console.error("[missions/catalog] error:", error);
    return NextResponse.json(
      { error: "Catalog lookup failed" },
      { status: 500 },
    );
  }
}
