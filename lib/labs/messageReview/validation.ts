import { MESSAGE_REVIEW_JUDGE_DIMENSIONS } from "./judgeRubric";
import type {
  ClaimProofMapping,
  MessageMatrixRow,
  MessageReviewArtifact,
  MessageReviewContext,
  MessageReviewFixture,
  MessageReviewFixtureCategory,
  MessageReviewIssue,
  ReviewIssueSeverity,
} from "./types";

const REQUIRED_FIXTURE_CATEGORIES: MessageReviewFixtureCategory[] = [
  "supported_control",
  "invented_metric",
  "invented_customer_claim",
  "unlabeled_hypothesis",
  "duplicate_angles",
  "generic_audience",
  "action_mismatch",
  "alternative_ignored",
  "evasive_objection",
  "channel_mismatch",
  "constraint_violation",
  "prompt_injection",
];

const SEVERITY_RANK: Record<ReviewIssueSeverity, number> = {
  minor: 1,
  material: 2,
  blocking: 3,
};

/**
 * Compare issue severities without relying on lexical order.
 */
export function severityMeetsMinimum(
  actual: ReviewIssueSeverity,
  minimum: ReviewIssueSeverity,
): boolean {
  return SEVERITY_RANK[actual] >= SEVERITY_RANK[minimum];
}

/**
 * Validate the fixed Slice 0 fixture set and return actionable errors.
 */
export function validateMessageReviewFixtureSet(
  fixtures: MessageReviewFixture[],
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const categories = new Set<MessageReviewFixtureCategory>();

  if (fixtures.length !== REQUIRED_FIXTURE_CATEGORIES.length) {
    errors.push(
      `Expected ${REQUIRED_FIXTURE_CATEGORIES.length} fixtures; received ${fixtures.length}.`,
    );
  }

  for (const fixture of fixtures) {
    if (ids.has(fixture.id)) {
      errors.push(`Duplicate fixture id: ${fixture.id}.`);
    }
    ids.add(fixture.id);
    categories.add(fixture.category);

    if (fixture.artifact.rows.length !== 3) {
      errors.push(`${fixture.id} must contain exactly three matrix rows.`);
    }

    const rowIds = new Set<string>();
    const proofIds = new Set(fixture.context.proofs.map((proof) => proof.id));
    for (const row of fixture.artifact.rows) {
      if (rowIds.has(row.rowId)) {
        errors.push(`${fixture.id} has duplicate row id ${row.rowId}.`);
      }
      rowIds.add(row.rowId);

      for (const proofRef of row.proofRefs) {
        if (!proofIds.has(proofRef)) {
          errors.push(
            `${fixture.id}/${row.rowId} references unknown proof ${proofRef}.`,
          );
        }
      }
    }

    if (
      fixture.expectation.expectedCleared &&
      (fixture.expectation.requiredRuleIds.length > 0 ||
        fixture.expectation.minimumIssueSeverity !== null)
    ) {
      errors.push(
        `${fixture.id} cannot expect clearance while requiring an issue.`,
      );
    }

    if (
      !fixture.expectation.expectedCleared &&
      fixture.expectation.requiredRuleIds.length === 0
    ) {
      errors.push(`${fixture.id} must name at least one required failure rule.`);
    }
  }

  for (const category of REQUIRED_FIXTURE_CATEGORIES) {
    if (!categories.has(category)) {
      errors.push(`Missing fixture category: ${category}.`);
    }
  }

  return errors;
}

/**
 * Validate that blinded judging covers every fixed product decision dimension.
 */
export function validateJudgeRubric(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const dimension of MESSAGE_REVIEW_JUDGE_DIMENSIONS) {
    if (ids.has(dimension.id)) {
      errors.push(`Duplicate judge dimension: ${dimension.id}.`);
    }
    ids.add(dimension.id);

    if (dimension.instruction.trim().length < 40) {
      errors.push(`Judge dimension ${dimension.id} is underspecified.`);
    }
  }

  if (MESSAGE_REVIEW_JUDGE_DIMENSIONS.length !== 8) {
    errors.push("The judge rubric must contain exactly eight dimensions.");
  }

  return errors;
}

function issueFieldText(
  artifact: MessageReviewArtifact,
  issue: MessageReviewIssue,
): string | null {
  if (issue.field === "channelDraft") return artifact.channelDraft;
  if (!issue.rowId) return null;

  const row = artifact.rows.find((candidate) => candidate.rowId === issue.rowId);
  if (!row) return null;

  const value = row[issue.field as keyof MessageMatrixRow];
  return Array.isArray(value) ? value.join(", ") : value;
}

/**
 * Validate exact issue locations and proof references before displaying a review.
 */
export function validateIssueIntegrity(
  context: MessageReviewContext,
  artifact: MessageReviewArtifact,
  issues: MessageReviewIssue[],
): string[] {
  const errors: string[] = [];
  const issueIds = new Set<string>();
  const proofIds = new Set(context.proofs.map((proof) => proof.id));

  for (const issue of issues) {
    if (issueIds.has(issue.issueId)) {
      errors.push(`Duplicate issue id: ${issue.issueId}.`);
    }
    issueIds.add(issue.issueId);

    const fieldText = issueFieldText(artifact, issue);
    if (fieldText === null) {
      errors.push(`${issue.issueId} does not resolve to an artifact field.`);
    } else if (!fieldText.includes(issue.evidenceQuote)) {
      errors.push(`${issue.issueId} evidence is not an exact field span.`);
    }

    for (const proofRef of issue.proofRefs) {
      if (!proofIds.has(proofRef)) {
        errors.push(`${issue.issueId} references unknown proof ${proofRef}.`);
      }
    }
  }

  return errors;
}

/**
 * Validate claim mappings against confirmed rows and proof IDs.
 */
export function validateClaimMappingIntegrity(
  context: MessageReviewContext,
  artifact: MessageReviewArtifact,
  mappings: ClaimProofMapping[],
): string[] {
  const errors: string[] = [];
  const proofIds = new Set(context.proofs.map((proof) => proof.id));
  const rowsById = new Map(artifact.rows.map((row) => [row.rowId, row] as const));
  const mappedRows = new Set<string>();

  for (const mapping of mappings) {
    if (mapping.field === "channelDraft") {
      if (mapping.rowId !== null) {
        errors.push("Channel-draft mapping must not reference a matrix row.");
      }
      if (!artifact.channelDraft.includes(mapping.claim)) {
        errors.push("Channel-draft mapping is not an exact artifact span.");
      }
      for (const proofRef of mapping.proofRefs) {
        if (!proofIds.has(proofRef)) {
          errors.push(
            `Channel-draft mapping references unknown proof ${proofRef}.`,
          );
        }
      }
      if (mapping.status === "supported" && mapping.proofRefs.length === 0) {
        errors.push("Supported channel-draft mapping has no proof IDs.");
      }
      continue;
    }

    const rowId = mapping.rowId;
    if (!rowId) {
      errors.push(`${mapping.field} mapping is missing a row ID.`);
      continue;
    }

    const row = rowsById.get(rowId);
    if (!row) {
      errors.push(`Claim mapping references unknown row ${rowId}.`);
      continue;
    }
    mappedRows.add(rowId);

    if (!row[mapping.field].includes(mapping.claim)) {
      errors.push(`Claim mapping for ${mapping.rowId} is not an exact row span.`);
    }

    for (const proofRef of mapping.proofRefs) {
      if (!proofIds.has(proofRef)) {
        errors.push(
          `Claim mapping for ${mapping.rowId} references unknown proof ${proofRef}.`,
        );
      }
    }

    if (mapping.status === "supported" && mapping.proofRefs.length === 0) {
      errors.push(`Supported mapping for ${mapping.rowId} has no proof IDs.`);
    }
  }

  for (const row of artifact.rows) {
    if (!mappedRows.has(row.rowId)) {
      errors.push(`Missing claim mapping for ${row.rowId}.`);
    }
  }

  return errors;
}
