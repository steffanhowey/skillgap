> **SUPERSEDED — October 2, 2026.** This document narrowed SkillGap to an "evidence-backed launch messaging" wedge. That direction is retired. The product is an AI-native learning environment for marketers that builds and adapts each person's learning path. See the Skillgap project's `claude/90-day-5k-mrr-mission.md`. Kept for history only.

# PRD: Prove the Real Work Wedge

**Status:** Approved for value validation, not production implementation  
**Version:** 2.0  
**Date:** 2026-08-27  
**Initial user:** Product marketers and marketing generalists  
**Experiment:** Claim-Safe Message Review  
**Decision owner:** Product / founder

## 1. Executive decision

SkillGap will not build the full Real Work Loop yet.

The immediate task is to prove one narrow claim:

> Given the same marketing brief and starting artifact, SkillGap catches consequential problems and produces a more usable revision than an excellent standalone AI review prompt.

Until that is demonstrated, SkillGap will not invest in public evidence, skill receipts, fluency progression, room integration, catalog expansion, or generalized artifact infrastructure.

This is a validation PRD. Shipping the prototype is not success. Success means proving an advantage over the user's normal AI workflow.

## 2. Why this comes next

The current product can guide a mission, send a prompt to an AI tool, evaluate pasted work, complete progress, and issue a receipt. That is a complete loop, but a good prompt in ChatGPT or Claude can reproduce most of it with less friction.

The next product risk is not engineering feasibility. It is whether SkillGap contributes anything users cannot easily get from a well-constructed prompt.

The proposed wedge is not content generation. It is a specialized pressure test that:

- traces each claim to supplied proof;
- flags unsupported or overstated language at the exact location;
- detects message angles that are duplicates in substance;
- tests whether each angle advances the desired audience action;
- compares each angle with the current alternative;
- identifies weak objections and evasive responses;
- checks channel fit; and
- produces a clear revision diff.

If this pressure test does not beat a strong baseline, the product direction must change before more infrastructure is built.

## 3. Product position for this experiment

For this phase, SkillGap is a marketing work reviewer.

It is not:

- a professional skill certifier;
- an independent fact checker;
- proof that the user authored the work;
- proof that the work performed in market;
- a learning-path completion system; or
- a social coworking product.

A reviewed artifact does not update `fp_user_skills`, issue an achievement, create a skill receipt, or make a public claim.

## 4. Target user and trigger

The participant is a product marketer, content marketer, demand-generation marketer, or marketing generalist who:

- has a real messaging deliverable due for review within seven days;
- already uses ChatGPT, Claude, or another general-purpose AI tool;
- can provide organization-approved context or a sanitized brief;
- has a named reviewer, approver, campaign, or publication destination; and
- is willing to compare SkillGap with their normal workflow.

The initial trigger is:

> I have a message matrix or message draft that is about to be reviewed. Before I send it, help me find weak claims, weak differentiation, and channel problems that my normal AI workflow missed.

Users without an imminent deliverable are not valid participants for this experiment.

## 5. User promise

Use this copy during validation:

> Pressure-test your message before review.

Supporting copy:

> Bring a live brief and draft. SkillGap maps claims to proof, flags material weaknesses, and gives you a revision you can inspect before sending.

Do not use:

- campaign-ready;
- approved;
- verified skill;
- independently verified;
- guaranteed to perform;
- applied in work; or
- better than ChatGPT.

The final phrase becomes eligible only after the controlled comparison gate passes.

## 6. The output

The prototype produces two linked outputs:

1. **Review-Ready Message Matrix**
2. **One channel draft** based on the user's selected angle

The matrix contains three rows with these fields:

- audience and urgent job;
- desired audience action;
- current alternative or competing choice;
- message angle;
- value claim;
- proof IDs or explicit hypothesis label;
- objection and response; and
- channel expression.

The channel draft is one concrete asset for the selected destination, such as:

- landing-page hero and supporting paragraph;
- one marketing email;
- one paid-social unit;
- one organic-social post;
- one sales-enablement message; or
- one stakeholder-review summary.

The user interface stores rows as structured fields. Markdown is not the product format.

Exports:

- copy formatted text;
- copy one selected channel asset;
- CSV for the matrix; and
- a plain-text review report.

## 7. Required context

The user begins by pasting a brief or sanitized source packet.

The prototype extracts these fields for confirmation:

1. Offer or product
2. Audience and urgent problem
3. Desired audience action
4. Current alternative or reason not to choose the offer
5. Destination channel
6. Approved proof entries
7. Voice and prohibited claims

Each proof entry receives a stable ID and one status:

- `approved_fact`
- `hypothesis`

The user must confirm extracted context before review. Low-confidence or absent values remain blank. The system must never invent context to complete the form.

Minimum entry requirements:

- brief or source text: 200 to 20,000 characters;
- offer: 20 to 1,500 characters;
- audience/problem: 20 to 1,500 characters;
- desired action: 10 to 500 characters;
- current alternative: 10 to 1,000 characters;
- channel: one supported enum value; and
- proof: at least one entry of 10 to 500 characters.

## 8. Prototype experience

### Step 1: Bring the work

The user pastes:

- their brief or sanitized context; and
- their current message matrix or message draft.

The prototype explains what is sent to OpenAI before submission.

### Step 2: Confirm the frame

SkillGap extracts the seven context fields. The user corrects and confirms them.

The screen must make the difference between an approved fact and a hypothesis understandable without facilitator explanation.

### Step 3: Run the pressure test

SkillGap reviews the original artifact against the confirmed context.

Every issue includes:

- exact row, field, or quoted span;
- severity: `blocking`, `material`, or `minor`;
- rule violated;
- relevant proof ID, when applicable;
- why the issue matters; and
- one concrete change.

### Step 4: Inspect the revision

Show:

- original and proposed text;
- additions and removals;
- resolved and unresolved issues; and
- the proof mapping for every factual claim.

The user may accept, reject, or edit every change. SkillGap never silently replaces the artifact.

### Step 5: Export and use

The user exports the matrix, one channel draft, or both.

The prototype records only non-content research events. It does not complete a learning path or issue evidence.

## 9. Review rules

### 9.1 Claim-to-proof traceability

Every factual claim must map to one or more confirmed `approved_fact` proof IDs.

If no proof supports a factual claim, it is blocking unless the claim is rewritten and visibly labeled as a hypothesis.

The reviewer cannot establish whether user-supplied proof is true. It can only determine whether the artifact stays within the supplied proof.

### 9.2 Audience and action fit

Each angle must:

- name or unmistakably address the confirmed audience;
- connect to the confirmed urgent job or problem; and
- support the desired audience action.

### 9.3 Differentiation

Each angle must make a distinct case against the confirmed current alternative.

Three paraphrases of the same benefit fail this check even if their wording differs.

### 9.4 Objection quality

Each row must include a plausible objection and a response that answers rather than evades it.

### 9.5 Channel fit

The expression must be usable in the selected channel and obey confirmed voice and prohibited-claim constraints.

### 9.6 Result language

There is no numeric score in the prototype.

Allowed overall states:

- **Blocking issues remain**
- **Material revisions recommended**
- **Checklist cleared against supplied context**
- **Review unavailable**

Even after clearance, display:

> Checked against the context and proof you supplied. Factual accuracy, authorship, stakeholder approval, and market performance were not independently verified.

## 10. The comparison test

Every valid study task starts with one original artifact created through the participant's normal AI workflow.

Create three branches from that same original:

### Branch A: Original workflow

The participant's artifact before any added review.

### Branch B: Canonical prompt baseline

Run one excellent, reusable self-review prompt using:

- the same confirmed context;
- the same original artifact;
- the same review goals; and
- the participant's normal general-purpose AI tool.

Also run the same canonical prompt with `gpt-4o-mini` to separate model advantage from workflow advantage.

### Branch C: SkillGap pressure test

Run the structured SkillGap review and generate a proposed revision using `gpt-4o-mini`.

The SkillGap branch does not receive output from Branch B.

### Blinded comparison

Strip product names and randomize output order.

Two experienced marketers independently judge the strongest Branch B output against Branch C. A third judge resolves disagreements.

Judges evaluate:

- factual grounding against supplied proof;
- audience and desired-action fit;
- differentiation against the current alternative;
- objection quality;
- channel usability;
- number of material issues remaining;
- editing required before review; and
- overall preference for the real destination.

Judges must explain each preference. A bare ranking is not sufficient.

## 11. Validation stages

### Stage 0: Internal dry run

Use three synthetic or company-safe briefs.

Required before outside participants:

- no unsupported claim is silently approved;
- every issue points to an exact location;
- every proof reference resolves to a confirmed proof ID;
- review failure returns unavailable, not cleared;
- no content appears in logs or analytics; and
- the canonical baseline prompt is strong enough that the test is not rigged.

### Stage 1: Concierge discovery

Run 8 to 10 sessions with external marketers.

This stage tests:

- whether users understand the frame;
- whether the pressure test catches consequential issues;
- whether the revision is easier to apply than normal AI feedback;
- whether the workflow adds tolerable effort; and
- whether users take the output into a real review.

Stage 1 is directional. Report raw counts and reasons, not statistically confident percentages.

Minimum gate to Stage 2:

- at least eight valid completed sessions;
- at least six users complete context through first review without facilitator rescue;
- at least six blinded comparisons prefer SkillGap over the original artifact;
- at least five sessions contain a judge-confirmed material issue that the participant had not identified;
- at least five users send, incorporate, approve, publish, or use the output in a decision within seven days;
- median added active time is no more than 10 minutes; and
- zero severe misunderstandings about proof, privacy, or what SkillGap verified.

Missing this gate means revise the job, artifact, or pressure test. It does not justify building more infrastructure.

### Stage 2: Controlled comparison

Run at least 30 matched task sets using the protocol in Section 10.

Production foundation is unlocked only when all are true:

- SkillGap is preferred over the strongest canonical-prompt result in at least 21 of 30 adjudicated comparisons;
- SkillGap catches a judge-confirmed material issue missed by the strongest baseline in at least 15 of 30 sets;
- at least 90% of blocking flags are upheld by judge consensus;
- at least 24 of 30 participants complete without operator rescue;
- median added active time remains no more than 10 minutes;
- at least 15 of 30 outputs are incorporated, sent for review, approved, published, or used in a decision within seven days;
- at least nine participants voluntarily start a second real-work review within 30 days before follow-up prompting; and
- no privacy or trust guardrail is breached.

Report raw counts, confidence intervals, disagreement, and failure reasons. Do not describe a 30-task study as definitive market proof.

## 12. Workplace outcome definitions

The fixed day-seven follow-up goes to every participant, including people who did not return to the prototype.

Outcomes:

- `exported_only`
- `sent_for_review`
- `incorporated_into_deliverable`
- `approved_or_published`
- `changed_decision`
- `not_used`
- `no_response`

`sent_for_review` means only that the work entered review. It is not labeled Applied.

The strongest v1 outcome is:

> Incorporated into a real deliverable, approved or published, or changed a work decision. User-reported.

Non-response remains in the denominator.

## 13. Privacy and research rules

Participants must be authorized to use the context they provide.

Before any request:

- state that SkillGap sends the supplied text to OpenAI;
- state whether the participant's chosen baseline tool receives the same text;
- instruct users not to submit confidential information their organization prohibits;
- explain study retention and deletion; and
- obtain separate consent before human judges see artifact content.

Prototype defaults:

- no durable product artifact storage;
- no source text, artifact text, proof, or feedback in logs or analytics;
- browser state only for the working session;
- explicit export controlled by the participant; and
- research bundles retained only for consented participants, access-restricted, de-identified, and deleted within 30 days of adjudication.

Withdrawal before adjudication removes the participant's content from the comparison set.

## 14. Prototype technical scope

This is an invitation-only lab, not a production mission.

Requirements:

- authenticated allowlist;
- hidden from catalog, onboarding, search, and public routes;
- text input only;
- no database migration;
- no achievement, receipt, profile, progress, room, or public-sharing writes;
- `gpt-4o-mini` for SkillGap completion calls;
- strict JSON Schema for extraction and review;
- `SAFETY_PROMPT` in every content-evaluation call;
- 20-second application timeout;
- fail-closed unavailable state;
- exact input-size limits;
- no prompt or artifact content in URLs; and
- no automatic use of a participant's external AI account.

The canonical baseline prompt is checked into the repository and versioned. Any change to it or the SkillGap reviewer creates a new experiment version.

## 15. Analytics contract

Only these content-free events are allowed:

- `message_review_started`
- `context_confirmed`
- `pressure_test_completed`
- `revision_exported`
- `second_review_started`

Allowed properties:

- experiment version;
- anonymous study participant ID;
- timestamps from the server;
- duration buckets;
- issue counts by severity;
- export type; and
- whether operator rescue occurred.

Forbidden properties:

- brief text;
- artifact text;
- proof text;
- issue quotes;
- feedback;
- company, product, campaign, or person names; and
- external-tool prompt content.

Study outcomes and judge ratings live in the controlled research dataset, not client-authored product events.

## 16. Acceptance criteria

1. An unauthorized user cannot discover or open the lab.
2. A participant sees the OpenAI and research disclosure before submitting content.
3. The prototype extracts all seven context fields and leaves unsupported values blank.
4. The participant must confirm proof entries and their fact/hypothesis status.
5. The same original artifact and confirmed context feed every comparison branch.
6. Branch C never receives Branch B output.
7. Every SkillGap issue identifies an exact row, field, or quote.
8. Every factual claim in a cleared artifact maps to confirmed proof or a visible hypothesis label.
9. The prototype contains no numeric quality score.
10. Model failure, malformed output, or missing review fields returns Review unavailable.
11. The user can inspect and reject every proposed revision.
12. The user can export structured matrix data and one channel draft.
13. The prototype makes no progress, skill, receipt, achievement, room, or sharing write.
14. No user content appears in logs, events, URLs, or public metadata.
15. Judge packets hide product identity and randomize branch order.
16. Every judge decision includes reasons and supports adjudication.
17. Every participant receives the fixed day-seven outcome follow-up.
18. Non-response remains in the outcome denominator.
19. Stage 2 cannot begin unless every Stage 1 minimum is met.
20. Production implementation cannot begin unless every Stage 2 gate is met.

## 17. Test plan

### Automated

- Context extraction schema and size limits.
- Missing-field behavior.
- Proof-ID assignment and mapping.
- Exact-span issue validation.
- Unsupported-claim fixtures.
- Duplicate-angle fixtures.
- Audience/action mismatch fixtures.
- Channel-constraint fixtures.
- Prompt-injection fixture inside the brief and artifact.
- Strict reviewer-output schema.
- Unavailable failure path.
- Allowlist enforcement.
- Event-property allowlist and content rejection.
- Confirmation that no progression or evidence service is called.

Add a `test` script using the existing Vitest dependency before implementation.

### Internal manual

- Three safe end-to-end dry runs.
- Copy and CSV export.
- Keyboard-only completion.
- Mobile-width review and diff inspection.
- Content inspection across server logs and analytics.
- Baseline prompt quality review by someone who did not write the SkillGap prompt.

### Research quality

- Identical source bundle across branches.
- Randomized branch labels.
- Two independent judges.
- Third-judge adjudication.
- Recorded operator rescue.
- Fixed follow-up timing.
- Experiment-version pinning.

## 18. Execution plan

### Slice 0: Lock the test

- Finalize the target user, trigger, artifact fields, and judge rubric.
- Write the strongest canonical baseline prompt.
- Create 12 synthetic edge-case fixtures.
- Run three internal dry comparisons.

Stop if the baseline is weak or the proposed wedge cannot be judged blindly.

**Slice 0 execution checkpoint — 2026-08-27**

- Locked versioned baseline, specialist, fixture, response-schema, and judge contracts.
- Added 12 synthetic fixtures with deterministic checks for exact issue spans and resolvable proof IDs.
- Ran the three fixed same-model dry comparisons with randomized blinded artifact order.
- SkillGap met the expected detection contract in 3 of 3 cases and won the blinded artifact preference in 2 of 3.
- The canonical baseline caught the invented metric and duplicate-angle problem, so it is not a weak comparator.
- The remaining known risk is revision quality on duplicate angles: the baseline revision won that case.

This checkpoint proves that the test is executable and the wedge is judgeable. It does **not** prove user value or authorize production infrastructure. Slice 1 may proceed only as the invitation-only validation lab described below.

### Slice 1: Build the lab

- Add the invite-only page.
- Add context extraction.
- Add structured artifact input.
- Add the pressure-test route.
- Add annotated issues and revision diff.
- Add formatted, CSV, and channel-asset export.
- Add content-free study events.

Do not connect production progression, catalog, rooms, achievements, or sharing.

**Slice 1 execution checkpoint — 2026-08-27**

- Built the authenticated, invitation-only lab with server-side extraction,
  claim review, editable revisions, exports, rate limits, disclosures, and
  content-free study events.
- Reworked the initial implementation after live usability review exposed the
  experiment's internal data model. The participant experience now uses six
  focused states: add work, check source, check draft, see findings, choose
  changes, and use the reviewed draft.
- Completed the unsupported-metric case in an authenticated desktop browser:
  SkillGap isolated the unsupported conversion claim, proposed wording grounded
  in the supplied pilot evidence, preserved participant choice, and copied the
  approved final draft successfully.
- Verified the completion screen at a mobile breakpoint with no horizontal
  overflow or undersized visible controls.
- Fixed two live extraction defects found during the walkthrough: explicitly
  labeled hypotheses are now preserved, and a labeled channel draft is separated
  from its supporting matrix.
- Added a post-generation claim-safety guard so removing an unsupported number
  cannot leave behind the same unproved outcome as an unquantified claim.
- The lab suite passes 26 automated tests; TypeScript and scoped lint pass.

This checkpoint completes the lab build, not the value claim. The next body of
work is Slice 2: recruit 8–10 target marketers, run the blinded Stage 1 study,
and decide whether preference and real-use evidence justify any production
investment.

### Slice 2: Run Stage 1

- Recruit 8 to 10 qualified marketers.
- Observe without coaching past normal UI.
- Run the fixed comparison and day-seven follow-up.
- Report raw counts, failures, quotes with consent, and decision.

### Slice 3: Revise or stop

- If Stage 1 misses the gate, revise the job, output, or reviewer and repeat Stage 1.
- If users do not value the pressure test, stop this wedge.
- Do not compensate by adding content, rooms, credentials, or more missions.

### Slice 4: Run Stage 2

- Freeze experiment and baseline versions.
- Run at least 30 matched sets.
- Complete blinded judgment and adjudication.
- Measure actual use and unprompted repeat behavior.
- Make the production decision from Section 11.

## 19. File-level implementation map

### Existing files to reference or change

- `package.json`
- `lib/breaks/scoring.ts`
- `lib/breaks/contentSafety.ts`
- `lib/learn/toolRegistry.ts`
- `app/globals.css`
- existing primitives in `components/ui/`

### New prototype files

- `app/(learn)/labs/message-review/page.tsx`
- `components/labs/MessageReviewPrototype.tsx`
- `components/labs/ContextConfirmation.tsx`
- `components/labs/StructuredMessageMatrix.tsx`
- `components/labs/PressureTestResults.tsx`
- `components/labs/RevisionDiff.tsx`
- `app/api/labs/message-review/extract/route.ts`
- `app/api/labs/message-review/review/route.ts`
- `lib/labs/messageReview/types.ts`
- `lib/labs/messageReview/contextExtractor.ts`
- `lib/labs/messageReview/reviewer.ts`
- `lib/labs/messageReview/baselinePrompt.ts`
- `lib/labs/messageReview/export.ts`
- `lib/labs/messageReview/fixtures.ts`
- `scripts/report-message-review-validation.ts`

Tests are co-located with pure modules and routes.

## 20. Explicitly deferred

Do not build during validation:

- production artifact tables;
- artifact version history;
- public evidence pages;
- public excerpts or share tokens;
- achievements or skill receipts;
- `fp_user_skills` updates;
- fluency claims;
- catalog or onboarding cutover;
- sample mode;
- room handoff;
- room presence changes;
- synthetic-participant work;
- generalized mission projection;
- automated email or push follow-up;
- file uploads or third-party document integrations; or
- team workspaces.

These may become valid later. None helps answer the current product question.

## 21. What validation unlocks

If Stage 2 passes, write a separate production PRD in this order:

1. Private artifact persistence and authoritative evaluation
2. Reusable workspace, versions, and destination-friendly exports
3. Durable workplace-outcome measurement
4. Repeat-task workflow
5. Skill evidence only after multiple applied artifacts or an independent transfer task
6. Optional public sharing after explicit consent
7. Social workflow only when real participant density exists

The prior broad Real Work Loop architecture is not an implementation mandate. Reuse only the parts justified by validated behavior.

## 22. Decision framework

- **SkillGap loses to the canonical prompt:** Stop this wedge or change the professional job.
- **Quality wins but friction is high:** Simplify context capture and handoff before production.
- **Issues are accurate but not consequential:** Change the review rules or artifact.
- **Users export but do not use the work:** The output is not valuable enough.
- **Users use it but do not return:** Treat it as a one-off tool, not a learning loop.
- **Users return voluntarily and the controlled comparison wins:** Build the production foundation.
- **Privacy misunderstanding or content leakage occurs:** Stop the experiment immediately.

## 23. Definition of done

This validation body of work is done when:

1. Stage 1 and, if earned, Stage 2 are completed under the fixed protocol;
2. every result includes raw numerator, denominator, exclusions, and failure reasons;
3. actual workplace outcomes include every participant, including non-response;
4. the team can state the material advantage users received over the strongest baseline;
5. the team records a clear build, revise, change-job, or stop decision; and
6. no production infrastructure is justified by prototype completion alone.

The product earns the next investment only when users and blinded reviewers can identify a consequential improvement that a strong standalone AI prompt did not provide.
