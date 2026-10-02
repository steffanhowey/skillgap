import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MESSAGE_REVIEW_FIXTURES } from "@/lib/labs/messageReview/fixtures";
import { LAUNCH_MESSAGING_DISCLOSURE } from "@/lib/learn/wedge/config";
import type { WedgePlayerSnapshot } from "@/lib/learn/wedge/playerState";
import { LaunchMessagingPlayer } from "./LaunchMessagingPlayer";

function reviewSnapshot(): WedgePlayerSnapshot {
  const fixture = MESSAGE_REVIEW_FIXTURES[0]!;
  return {
    attemptId: "attempt-1",
    step: "review",
    context: fixture.context,
    matrix: fixture.artifact,
    evaluatedMatrix: null,
    evaluation: null,
    reviewUnavailable: false,
    hasSavedArtifact: true,
  };
}

describe("LaunchMessagingPlayer", () => {
  it("renders the disclosure before the evaluate CTA", () => {
    const html = renderToStaticMarkup(
      <LaunchMessagingPlayer initialSnapshot={reviewSnapshot()} />,
    );

    expect(html).toContain("Launch messaging");
    expect(html).toContain("Step 3 of 5 · Review");
    expect(html).toContain(LAUNCH_MESSAGING_DISCLOSURE);
    expect(html).toContain("Run pressure test");
    expect(html.indexOf(LAUNCH_MESSAGING_DISCLOSURE)).toBeLessThan(
      html.indexOf("Run pressure test"),
    );
    expect(html).toContain("disabled");
    expect(html).not.toContain("quality score");
    expect(html).not.toContain("evidence-backed");
    expect(html).not.toContain("Prefer company?");
  });
});
