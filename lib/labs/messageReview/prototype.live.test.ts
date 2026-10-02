import { config } from "dotenv";
import { describe, expect, it } from "vitest";
import { extractMessageReviewContext } from "./contextExtractor";
import { formatMessageMatrix } from "./export";
import { MESSAGE_REVIEW_FIXTURES } from "./fixtures";
import { reviewMessageArtifact } from "./reviewer";

config({ path: ".env.local", quiet: true });

const describeLive =
  process.env.RUN_MESSAGE_REVIEW_LIVE === "1" ? describe : describe.skip;

describeLive("message review prototype live extraction", () => {
  it(
    "extracts the seven-field frame without changing the source draft",
    async () => {
      const fixture = MESSAGE_REVIEW_FIXTURES[0]!;
      const brief = `Offer: ${fixture.context.offer}
Audience and urgent problem: ${fixture.context.audienceProblem}
Desired audience action: ${fixture.context.desiredAction}
Current alternative: ${fixture.context.currentAlternative}
Destination channel: ${fixture.context.channel}
Approved proof:
${fixture.context.proofs.map((proof) => `- ${proof.status}: ${proof.text}`).join("\n")}
Voice and prohibited claims: ${fixture.context.voiceConstraints}`;
      const artifactText = `${formatMessageMatrix(fixture.artifact)}

CHANNEL DRAFT
${fixture.artifact.channelDraft}`;

      const extraction = await extractMessageReviewContext({
        brief,
        artifactText,
      });

      expect(extraction).not.toBeNull();
      expect(extraction?.context.offer.length).toBeGreaterThanOrEqual(20);
      expect(extraction?.context.proofs.length).toBeGreaterThan(0);
      expect(extraction?.artifact.rows).toHaveLength(3);
      expect(extraction?.artifact.channelDraft).toBe(artifactText);
    },
    30_000,
  );

  it(
    "returns a strict pressure-test result for an unsupported metric",
    async () => {
      const fixture = MESSAGE_REVIEW_FIXTURES.find(
        (candidate) => candidate.id === "invented-metric",
      )!;

      const result = await reviewMessageArtifact(
        fixture.context,
        fixture.artifact,
      );

      expect(result.status).toBe("blocking_issues");
      expect(result.issues.some((issue) => issue.ruleId === "claim_to_proof")).toBe(
        true,
      );
    },
    30_000,
  );
});
