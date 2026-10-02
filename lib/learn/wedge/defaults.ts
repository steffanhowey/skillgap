import type {
  MessageReviewArtifact,
  MessageReviewContext,
} from "@/lib/labs/messageReview/types";

/**
 * Empty confirmed-context draft for the founder-only path.
 */
export function createEmptyWorkContext(): MessageReviewContext {
  return {
    offer: "",
    audienceProblem: "",
    desiredAction: "",
    currentAlternative: "",
    channel: "landing_page",
    proofs: [{ id: "proof-1", text: "", status: "approved_fact" }],
    voiceConstraints: "",
  };
}

function emptyRow(rowId: "row-1" | "row-2" | "row-3") {
  return {
    rowId,
    audienceJob: "",
    desiredAction: "",
    currentAlternative: "",
    messageAngle: "",
    valueClaim: "",
    proofRefs: ["proof-1"],
    objection: "",
    response: "",
    channelExpression: "",
  };
}

/**
 * Empty three-row matrix for the founder-only path.
 */
export function createEmptyMatrix(): MessageReviewArtifact {
  return {
    rows: [emptyRow("row-1"), emptyRow("row-2"), emptyRow("row-3")],
    channelDraft: "",
  };
}
