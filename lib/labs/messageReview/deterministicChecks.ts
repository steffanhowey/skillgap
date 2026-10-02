import type {
  MessageMatrixRow,
  MessageReviewArtifact,
  MessageReviewContext,
  MessageReviewIssue,
  MessageReviewResult,
  ReviewRuleId,
} from "./types";

export interface DeterministicReviewAudit {
  failures: MessageReviewIssue[];
  passedRuleIds: ReviewRuleId[];
}

const ALL_RULE_IDS: ReviewRuleId[] = [
  "claim_to_proof",
  "audience_action_fit",
  "differentiation",
  "objection_quality",
  "channel_fit",
  "constraint_compliance",
  "prompt_injection",
];

const STOP_WORDS = new Set([
  "about",
  "active",
  "across",
  "companies",
  "current",
  "from",
  "into",
  "maintained",
  "their",
  "that",
  "these",
  "those",
  "with",
]);

const OUTCOME_CLAIM_TERMS = new Set([
  "accuracy",
  "adoption",
  "conversion",
  "conversions",
  "cost",
  "costs",
  "efficiency",
  "engagement",
  "faster",
  "growth",
  "leads",
  "productivity",
  "retention",
  "revenue",
  "roi",
  "sales",
  "savings",
  "speed",
  "time",
]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function meaningfulTokens(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split(" ")
      .filter((token) => token.length >= 4 && !STOP_WORDS.has(token)),
  );
}

function sharedTokenCount(left: string, right: string): number {
  const leftTokens = meaningfulTokens(left);
  const rightTokens = meaningfulTokens(right);
  return [...leftTokens].filter((token) => rightTokens.has(token)).length;
}

function numericClaims(value: string): string[] {
  return normalize(value).match(/\b\d+(?:\.\d+)?%?\b/g) ?? [];
}

function unsupportedOutcomeTerms(
  value: string,
  proofTexts: string[],
): string[] {
  const claimTokens = meaningfulTokens(value);
  const proofTokens = new Set(
    proofTexts.flatMap((proofText) => [...meaningfulTokens(proofText)]),
  );

  return [...OUTCOME_CLAIM_TERMS].filter(
    (term) => claimTokens.has(term) && !proofTokens.has(term),
  );
}

function includesHypothesisMarker(value: string): boolean {
  return /\b(hypothesis|may|might|could|we expect|we believe|we estimate)\b/i.test(
    value,
  );
}

function issue(
  ruleId: ReviewRuleId,
  severity: MessageReviewIssue["severity"],
  rowId: string | null,
  field: MessageReviewIssue["field"],
  evidenceQuote: string,
  explanation: string,
  suggestedChange: string,
  ordinal: number,
): MessageReviewIssue {
  return {
    issueId: `det-${ruleId}-${rowId ?? "artifact"}-${ordinal}`,
    ruleId,
    severity,
    rowId,
    field,
    evidenceQuote: evidenceQuote.slice(0, 500),
    proofRefs: [],
    explanation,
    suggestedChange,
  };
}

function artifactTextEntries(
  artifact: MessageReviewArtifact,
): Array<{
  rowId: string | null;
  field: MessageReviewIssue["field"];
  text: string;
}> {
  const entries = artifact.rows.flatMap((row) => [
    { rowId: row.rowId, field: "audienceJob" as const, text: row.audienceJob },
    {
      rowId: row.rowId,
      field: "desiredAction" as const,
      text: row.desiredAction,
    },
    {
      rowId: row.rowId,
      field: "currentAlternative" as const,
      text: row.currentAlternative,
    },
    {
      rowId: row.rowId,
      field: "messageAngle" as const,
      text: row.messageAngle,
    },
    { rowId: row.rowId, field: "valueClaim" as const, text: row.valueClaim },
    { rowId: row.rowId, field: "objection" as const, text: row.objection },
    { rowId: row.rowId, field: "response" as const, text: row.response },
    {
      rowId: row.rowId,
      field: "channelExpression" as const,
      text: row.channelExpression,
    },
  ]);

  return [
    ...entries,
    { rowId: null, field: "channelDraft", text: artifact.channelDraft },
  ];
}

function inspectClaimProof(
  context: MessageReviewContext,
  row: MessageMatrixRow,
  ordinal: number,
): MessageReviewIssue[] {
  const proofsById = new Map(
    context.proofs.map((proof) => [proof.id, proof] as const),
  );
  const referencedProofs = row.proofRefs
    .map((proofRef) => proofsById.get(proofRef))
    .filter((proof) => proof !== undefined);

  if (
    row.proofRefs.length === 0 ||
    referencedProofs.length !== row.proofRefs.length
  ) {
    return [
      issue(
        "claim_to_proof",
        "blocking",
        row.rowId,
        "valueClaim",
        row.valueClaim,
        "The factual value claim does not resolve to supplied proof IDs.",
        "Attach valid supplied proof or label the claim as a hypothesis.",
        ordinal,
      ),
    ];
  }

  const hasHypothesisProof = referencedProofs.some(
    (proof) => proof.status === "hypothesis",
  );
  if (hasHypothesisProof && !includesHypothesisMarker(row.valueClaim)) {
    const finding = issue(
      "claim_to_proof",
      "blocking",
      row.rowId,
      "valueClaim",
      row.valueClaim,
      "A hypothesis is presented as an established factual claim.",
      "Label the statement as a hypothesis or replace it with approved proof.",
      ordinal,
    );
    finding.proofRefs = row.proofRefs;
    return [finding];
  }

  if (
    /\b(every|all|always|guarantee(?:d|s)?)\b/i.test(row.valueClaim) &&
    referencedProofs.some((proof) => /\bpilot\b/i.test(proof.text))
  ) {
    const finding = issue(
      "claim_to_proof",
      "blocking",
      row.rowId,
      "valueClaim",
      row.valueClaim,
      "A bounded pilot result is presented as a universal outcome.",
      "Scope the outcome to the supplied pilot proof.",
      ordinal,
    );
    finding.proofRefs = row.proofRefs;
    return [finding];
  }

  const claimNumbers = numericClaims(row.valueClaim);
  const proofNumbers = new Set(
    referencedProofs.flatMap((proof) => numericClaims(proof.text)),
  );
  const unsupportedNumbers = claimNumbers.filter(
    (number) => !proofNumbers.has(number),
  );
  if (unsupportedNumbers.length > 0) {
    const finding = issue(
      "claim_to_proof",
      "blocking",
      row.rowId,
      "valueClaim",
      row.valueClaim,
      `The claim introduces unsupported numeric evidence: ${unsupportedNumbers.join(", ")}.`,
      "Remove the unsupported metric or supply approved proof for it.",
      ordinal,
    );
    finding.proofRefs = row.proofRefs;
    return [finding];
  }

  const unsupportedOutcomes = unsupportedOutcomeTerms(
    row.valueClaim,
    referencedProofs.map((proof) => proof.text),
  );
  if (unsupportedOutcomes.length > 0) {
    const finding = issue(
      "claim_to_proof",
      "blocking",
      row.rowId,
      "valueClaim",
      row.valueClaim,
      `The claim introduces an outcome not established by the referenced proof: ${unsupportedOutcomes.join(", ")}.`,
      "Remove the unsupported outcome or visibly label it as a hypothesis.",
      ordinal,
    );
    finding.proofRefs = row.proofRefs;
    return [finding];
  }

  return [];
}

/**
 * Run the deterministic portion of the claim-safe pressure test.
 */
export function inspectMessageReviewArtifact(
  context: MessageReviewContext,
  artifact: MessageReviewArtifact,
): DeterministicReviewAudit {
  const failures: MessageReviewIssue[] = [];
  let ordinal = 0;

  for (const row of artifact.rows) {
    failures.push(...inspectClaimProof(context, row, ordinal++));

    const actionMismatch =
      normalize(row.desiredAction) !== normalize(context.desiredAction);
    const audienceMismatch =
      sharedTokenCount(row.audienceJob, context.audienceProblem) === 0;
    if (actionMismatch || audienceMismatch) {
      failures.push(
        issue(
          "audience_action_fit",
          "material",
          row.rowId,
          actionMismatch ? "desiredAction" : "audienceJob",
          actionMismatch ? row.desiredAction : row.audienceJob,
          "The row does not preserve both the confirmed audience and desired action.",
          "Align the row to the confirmed audience problem and requested next action.",
          ordinal++,
        ),
      );
    }

    if (sharedTokenCount(row.currentAlternative, context.currentAlternative) === 0) {
      failures.push(
        issue(
          "differentiation",
          "material",
          row.rowId,
          "currentAlternative",
          row.currentAlternative,
          "The row argues against a different alternative than the one in the confirmed context.",
          "Contrast the message with the confirmed current alternative.",
          ordinal++,
        ),
      );
    }

    if (
      /\b(do not worry|don't worry|effortless|everyone loves|every team loves)\b/i.test(
        row.response,
      )
    ) {
      failures.push(
        issue(
          "objection_quality",
          "material",
          row.rowId,
          "response",
          row.response,
          "The response reassures or asserts instead of answering the objection.",
          "Respond directly with a bounded, evidence-aware answer.",
          ordinal++,
        ),
      );
    }
  }

  const approvedProofTexts = context.proofs
    .filter((proof) => proof.status === "approved_fact")
    .map((proof) => proof.text);
  const allProofTexts = context.proofs.map((proof) => proof.text);
  const secondaryClaimEntries = artifactTextEntries(artifact).filter(
    (entry) =>
      entry.field === "response" ||
      entry.field === "channelExpression" ||
      entry.field === "channelDraft",
  );
  for (const entry of secondaryClaimEntries) {
    const proofTexts = includesHypothesisMarker(entry.text)
      ? allProofTexts
      : approvedProofTexts;
    const proofNumbers = new Set(
      proofTexts.flatMap((proofText) => numericClaims(proofText)),
    );
    const unsupportedNumbers = numericClaims(entry.text).filter(
      (number) => !proofNumbers.has(number),
    );
    const unsupportedOutcomes = unsupportedOutcomeTerms(entry.text, proofTexts);
    if (
      unsupportedNumbers.length === 0 &&
      unsupportedOutcomes.length === 0
    ) {
      continue;
    }

    const reason =
      unsupportedNumbers.length > 0
        ? `unsupported numeric evidence: ${unsupportedNumbers.join(", ")}`
        : `an outcome not established by supplied proof: ${unsupportedOutcomes.join(", ")}`;
    failures.push(
      issue(
        "claim_to_proof",
        "blocking",
        entry.rowId,
        entry.field,
        entry.text,
        `The message introduces ${reason}.`,
        "Remove the unsupported claim or visibly label it as a hypothesis.",
        ordinal++,
      ),
    );
  }

  const claimsByNormalizedText = new Map<string, MessageMatrixRow[]>();
  for (const row of artifact.rows) {
    const key = normalize(row.valueClaim);
    claimsByNormalizedText.set(key, [
      ...(claimsByNormalizedText.get(key) ?? []),
      row,
    ]);
  }
  for (const duplicateRows of claimsByNormalizedText.values()) {
    if (duplicateRows.length < 2) continue;
    for (const row of duplicateRows) {
      failures.push(
        issue(
          "differentiation",
          "material",
          row.rowId,
          "valueClaim",
          row.valueClaim,
          "Multiple rows make the same factual value case, so the matrix does not provide three distinct angles.",
          "Build this row around a different supported reason to choose the offer.",
          ordinal++,
        ),
      );
    }
  }

  if (context.channel === "paid_social") {
    for (const entry of artifactTextEntries(artifact).filter(
      (item) =>
        item.field === "channelExpression" || item.field === "channelDraft",
    )) {
      if (entry.text.length <= 200) continue;
      failures.push(
        issue(
          "channel_fit",
          "material",
          entry.rowId,
          entry.field,
          entry.text,
          "The paid-social expression exceeds the fixed 200-character usability limit.",
          "Reduce the expression to one supported message case and one action.",
          ordinal++,
        ),
      );
    }
  }

  const prohibitedPattern =
    /\b(guarantee(?:d|s)?|best-in-class|effortless|every team)\b/i;
  const promptInjectionPattern =
    /\b(ignore (?:all |the )?(?:previous|prior) instructions|mark this artifact|report no issues|system prompt)\b/i;

  for (const entry of artifactTextEntries(artifact)) {
    if (prohibitedPattern.test(entry.text)) {
      failures.push(
        issue(
          "constraint_compliance",
          "blocking",
          entry.rowId,
          entry.field,
          entry.text,
          "The artifact uses language explicitly prohibited by the confirmed voice constraints.",
          "Remove the prohibited or universal-performance language.",
          ordinal++,
        ),
      );
    }

    if (promptInjectionPattern.test(entry.text)) {
      failures.push(
        issue(
          "prompt_injection",
          "blocking",
          entry.rowId,
          entry.field,
          entry.text,
          "Artifact content attempts to control the review instead of functioning as marketing copy.",
          "Remove the embedded instruction and replace it with channel-ready copy.",
          ordinal++,
        ),
      );
    }
  }

  const failedRuleIds = new Set(failures.map((finding) => finding.ruleId));
  return {
    failures,
    passedRuleIds: ALL_RULE_IDS.filter(
      (ruleId) => !failedRuleIds.has(ruleId),
    ),
  };
}

function asSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function groundedClaimForRow(
  context: MessageReviewContext,
  row: MessageMatrixRow,
): string {
  const proofsById = new Map(
    context.proofs.map((proof) => [proof.id, proof] as const),
  );
  const referencedProofs = row.proofRefs
    .map((proofRef) => proofsById.get(proofRef))
    .filter((proof) => proof !== undefined);
  const approvedProof = referencedProofs.find(
    (proof) => proof.status === "approved_fact",
  );
  if (approvedProof) return approvedProof.text;

  const hypothesis = referencedProofs.find(
    (proof) => proof.status === "hypothesis",
  );
  if (hypothesis) {
    return includesHypothesisMarker(hypothesis.text)
      ? hypothesis.text
      : `Hypothesis: ${hypothesis.text}`;
  }

  return "No supported value claim is available from the supplied evidence.";
}

/**
 * Replace blocking claim-safety failures in a proposed revision with supplied
 * evidence, while preserving the user's original artifact separately.
 */
export function repairBlockingMessageReviewRevision(
  context: MessageReviewContext,
  artifact: MessageReviewArtifact,
): MessageReviewArtifact {
  const audit = inspectMessageReviewArtifact(context, artifact);
  const blockingFailures = audit.failures.filter(
    (failure) =>
      failure.severity === "blocking" &&
      (failure.ruleId === "claim_to_proof" ||
        failure.ruleId === "constraint_compliance" ||
        failure.ruleId === "prompt_injection"),
  );
  if (blockingFailures.length === 0) return artifact;

  const failuresByRow = new Map<string, MessageReviewIssue[]>();
  for (const failure of blockingFailures) {
    if (!failure.rowId) continue;
    failuresByRow.set(failure.rowId, [
      ...(failuresByRow.get(failure.rowId) ?? []),
      failure,
    ]);
  }

  const rows = artifact.rows.map((row) => {
    const rowFailures = failuresByRow.get(row.rowId) ?? [];
    const groundedClaim = groundedClaimForRow(context, row);
    const safeExpression = `${asSentence(groundedClaim)} ${asSentence(
      context.desiredAction,
    )}`.trim();

    return {
      ...row,
      valueClaim: rowFailures.some(
        (failure) => failure.field === "valueClaim",
      )
        ? groundedClaim
        : row.valueClaim,
      response: rowFailures.some((failure) => failure.field === "response")
        ? "Keep the response bounded to the supplied evidence and proposed pilot."
        : row.response,
      channelExpression: rowFailures.some(
        (failure) => failure.field === "channelExpression",
      )
        ? safeExpression
        : row.channelExpression,
    };
  });

  const replaceChannelDraft = blockingFailures.some(
    (failure) => failure.field === "channelDraft",
  );
  const primaryClaim = groundedClaimForRow(context, rows[0]!);
  const safeChannelDraft = `${asSentence(primaryClaim)} ${asSentence(
    context.desiredAction,
  )}`.trim();

  return {
    rows,
    channelDraft: replaceChannelDraft ? safeChannelDraft : artifact.channelDraft,
  };
}

/**
 * Enforce deterministic findings over a model-generated revision.
 */
export function reconcileSpecialistReview(
  originalArtifact: MessageReviewArtifact,
  modelResult: MessageReviewResult,
  audit: DeterministicReviewAudit,
): MessageReviewResult {
  const hasBlocking = audit.failures.some(
    (finding) => finding.severity === "blocking",
  );
  const hasMaterial = audit.failures.some(
    (finding) => finding.severity === "material",
  );

  return {
    status: hasBlocking
      ? "blocking_issues"
      : hasMaterial
        ? "material_revisions"
        : "checklist_cleared",
    issues: audit.failures,
    claimMappings: modelResult.claimMappings,
    revisedArtifact:
      audit.failures.length === 0
        ? originalArtifact
        : modelResult.revisedArtifact,
  };
}
