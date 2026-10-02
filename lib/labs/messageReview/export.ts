import type {
  MessageReviewArtifact,
  MessageReviewContext,
  MessageReviewResult,
} from "./types";

const REVIEW_DISCLAIMER =
  "Checked against the context and proof you supplied. Factual accuracy, authorship, stakeholder approval, and market performance were not independently verified.";

function safeSpreadsheetCell(value: string): string {
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value;
}

function csvCell(value: string): string {
  const safeValue = safeSpreadsheetCell(value);
  return `"${safeValue.replaceAll('"', '""')}"`;
}

/**
 * Format the confirmed three-row matrix for pasting into a document.
 */
export function formatMessageMatrix(
  artifact: MessageReviewArtifact,
): string {
  return artifact.rows
    .map(
      (row, index) => `ANGLE ${index + 1}: ${row.messageAngle}
Audience / job: ${row.audienceJob}
Desired action: ${row.desiredAction}
Current alternative: ${row.currentAlternative}
Value claim: ${row.valueClaim}
Proof: ${row.proofRefs.join(", ")}
Objection: ${row.objection}
Response: ${row.response}
Channel expression: ${row.channelExpression}`,
    )
    .join("\n\n");
}

/**
 * Format the selected channel asset without surrounding metadata.
 */
export function formatChannelAsset(
  artifact: MessageReviewArtifact,
): string {
  return artifact.channelDraft.trim();
}

/**
 * Create a spreadsheet-safe CSV representation of the matrix.
 */
export function createMessageMatrixCsv(
  artifact: MessageReviewArtifact,
): string {
  const headers = [
    "Row",
    "Audience / job",
    "Desired action",
    "Current alternative",
    "Message angle",
    "Value claim",
    "Proof IDs",
    "Objection",
    "Response",
    "Channel expression",
  ];
  const rows = artifact.rows.map((row) => [
    row.rowId,
    row.audienceJob,
    row.desiredAction,
    row.currentAlternative,
    row.messageAngle,
    row.valueClaim,
    row.proofRefs.join("; "),
    row.objection,
    row.response,
    row.channelExpression,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((value) => csvCell(value)).join(","))
    .join("\r\n");
}

/**
 * Format a participant-controlled plain-text report of findings and proof context.
 */
export function formatReviewReport(
  context: MessageReviewContext,
  result: MessageReviewResult,
): string {
  const statusLabels: Record<MessageReviewResult["status"], string> = {
    blocking_issues: "Blocking issues remain",
    material_revisions: "Material revisions recommended",
    checklist_cleared: "Checklist cleared against supplied context",
    unavailable: "Review unavailable",
  };
  const issueText =
    result.issues.length === 0
      ? "No blocking or material issues were identified."
      : result.issues
          .map(
            (issue, index) => `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.ruleId}
Location: ${issue.rowId ?? "Channel draft"} / ${issue.field}
Evidence: "${issue.evidenceQuote}"
Why it matters: ${issue.explanation}
Change: ${issue.suggestedChange}
Proof: ${issue.proofRefs.join(", ") || "None"}`,
          )
          .join("\n\n");

  return `MESSAGE REVIEW REPORT

Status: ${statusLabels[result.status]}
Channel: ${context.channel}

ISSUES
${issueText}

CLAIM / PROOF MAP
${result.claimMappings
  .map(
    (mapping) =>
      `- ${mapping.rowId ?? "channel draft"} / ${mapping.field}: "${mapping.claim}" → ${mapping.status} (${mapping.proofRefs.join(", ") || "no proof ID"})`,
  )
  .join("\n")}

${REVIEW_DISCLAIMER}`;
}

export { REVIEW_DISCLAIMER };
