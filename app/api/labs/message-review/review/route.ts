import { NextResponse } from "next/server";
import { getMessageReviewLabAccess } from "@/lib/labs/messageReview/access";
import { allowMessageReviewRequest } from "@/lib/labs/messageReview/rateLimit";
import { reviewMessageArtifact } from "@/lib/labs/messageReview/reviewer";
import { MessageReviewReviewRequestSchema } from "@/lib/labs/messageReview/schemas";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * Pressure-test one confirmed artifact without writing progression or evidence.
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

  const parsed = MessageReviewReviewRequestSchema.safeParse(raw);
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

  if (!allowMessageReviewRequest(access.user.id, "review")) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: NO_STORE_HEADERS },
    );
  }

  const result = await reviewMessageArtifact(
    parsed.data.context,
    parsed.data.artifact,
  );

  return NextResponse.json(
    result,
    {
      status: result.status === "unavailable" ? 503 : 200,
      headers: NO_STORE_HEADERS,
    },
  );
}
