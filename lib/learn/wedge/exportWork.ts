import {
  REVIEW_DISCLAIMER,
  formatMessageMatrix,
  formatReviewReport,
} from "@/lib/labs/messageReview/export";
import type {
  MessageReviewArtifact,
  MessageReviewContext,
  MessageReviewResult,
} from "@/lib/labs/messageReview/types";
import { LAUNCH_MESSAGING_ALLOWED_COPY } from "./config";

/**
 * Export context, matrix, and claim ledger for a real review.
 */
export function formatLaunchMessagingExport(input: {
  context: MessageReviewContext;
  artifact: MessageReviewArtifact;
  result: MessageReviewResult | null;
}): string {
  const proofLedger = input.context.proofs
    .map(
      (proof) =>
        `- ${proof.id} [${proof.status === "approved_fact" ? "approved fact" : "hypothesis"}]: ${proof.text}`,
    )
    .join("\n");

  const review =
    input.result == null
      ? "No server review is attached to this export."
      : formatReviewReport(input.context, input.result);

  return `LAUNCH MESSAGING EXPORT

${LAUNCH_MESSAGING_ALLOWED_COPY}

CONTEXT
Offer: ${input.context.offer}
Audience / problem: ${input.context.audienceProblem}
Desired action: ${input.context.desiredAction}
Current alternative: ${input.context.currentAlternative}
Channel: ${input.context.channel}
Voice constraints: ${input.context.voiceConstraints || "None supplied"}

PROOF LEDGER
${proofLedger}

MESSAGE MATRIX
${formatMessageMatrix(input.artifact)}

CHANNEL DRAFT
${input.artifact.channelDraft}

${review}${input.result == null ? `\n\n${REVIEW_DISCLAIMER}` : ""}
`;
}
