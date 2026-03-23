import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/admin/verifyAdminAuth";
import {
  publishLaunchCatalog,
  type PublishLaunchCatalogOptions,
} from "@/lib/missions/orchestrators/publishLaunchCatalog";

async function authorize(request: Request): Promise<NextResponse | null> {
  const authorized = await verifyAdminAuth(request);
  if (authorized) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeTopicScope(input: unknown): string[] | undefined {
  if (typeof input === "string" && input.trim()) {
    return [input.trim()];
  }

  if (!Array.isArray(input)) {
    return undefined;
  }

  const topicSlugs = input
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return topicSlugs.length > 0 ? topicSlugs : undefined;
}

async function handlePublish(
  request: Request,
  options: PublishLaunchCatalogOptions,
): Promise<NextResponse> {
  const authError = await authorize(request);
  if (authError) return authError;

  try {
    const result = await publishLaunchCatalog(options);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** GET /api/pipeline/missions/publish */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const topicScope = normalizeTopicScope(url.searchParams.getAll("topic"));

  return handlePublish(request, { topicSlugs: topicScope });
}

/** POST /api/pipeline/missions/publish */
export async function POST(request: Request): Promise<NextResponse> {
  let body: { topicSlug?: unknown; topicSlugs?: unknown } = {};

  try {
    body = await request.json();
  } catch {
    // Publish the full approved slice when no body is provided.
  }

  return handlePublish(request, {
    topicSlugs:
      normalizeTopicScope(body.topicSlugs) ??
      normalizeTopicScope(body.topicSlug),
  });
}
