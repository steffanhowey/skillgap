import { NextResponse } from "next/server";
import { getMessageReviewLabAccess } from "@/lib/labs/messageReview/access";
import { extractMessageReviewContext } from "@/lib/labs/messageReview/contextExtractor";
import { allowMessageReviewRequest } from "@/lib/labs/messageReview/rateLimit";
import { MessageReviewExtractRequestSchema } from "@/lib/labs/messageReview/schemas";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * Extract confirmable context and structure the participant's existing draft.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const access = await getMessageReviewLabAccess();
  if (access.status === "unauthenticated") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
  if (access.status === "forbidden") {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = MessageReviewExtractRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        fields: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (!allowMessageReviewRequest(access.user.id, "extract")) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: NO_STORE_HEADERS },
    );
  }

  const extraction = await extractMessageReviewContext({
    brief: parsed.data.brief,
    artifactText: parsed.data.artifactText,
  });
  if (!extraction) {
    return NextResponse.json(
      { error: "Extraction unavailable" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(extraction, { headers: NO_STORE_HEADERS });
}
