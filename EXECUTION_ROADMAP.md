> **SUPERSEDED — October 2, 2026.** This document narrowed SkillGap to an "evidence-backed launch messaging" wedge. That direction is retired. The product is an AI-native learning environment for marketers that builds and adapts each person's learning path. See the Skillgap project's `claude/90-day-5k-mrr-mission.md`. Kept for history only.

# Execution Roadmap — Track F (14 days)

**Status:** In force  
**Date:** 2026-08-28  
**Owner:** CPO / founder  
**Horizon:** 14 days from Day 0  
**Extends:** [`CPO_DECISIONS_2026-08-28.md`](CPO_DECISIONS_2026-08-28.md), [`CDO_DECISIONS_2026-08-28.md`](CDO_DECISIONS_2026-08-28.md)  
**Does not replace:** [`PRD_Evidence_Backed_Launch_Messaging.md`](PRD_Evidence_Backed_Launch_Messaging.md) — that PRD is the full target; this file cuts it to what we build **now**.

Reread this on Monday before writing code. If a task is not on this page, it is out of scope.

---

## 1. Locked decisions

| Call | Decision |
|------|----------|
| Optimize for | **Track F now.** Tunnel polish only if a bug blocks Start → solo → complete. |
| Horizon | **14 days.** Spine + one allowlisted path that produces a reviewed matrix. |
| Who uses it | **Founder only** (at most 1–2 internals later). Not a public invite. |
| Track V (lab study) | **Parked.** No Message Review recruiting until the native path exists. |
| Track F shape | **Minimum spine + thin native path.** Not the full 9-step 60-minute PRD journey. |
| Lab URL | **Do not promote** `/labs/message-review` into the product center. Reuse its evaluator. |

These supersede “wait for Stage 2 before any production-shaped work” for this private allowlist only. Stage 2 still gates public claims, catalog cutover, and fluency.

---

## 2. The bet

The five published missions let someone *practice*. They do not produce an evidence-linked artifact SkillGap can evaluate and persist.

The Message Review lab already has the strongest evaluator in the repo. It is a study surface, not the product.

For two weeks we move that evaluator behind a real attempt / artifact / eval spine and a path that uses the CDO solo chrome — so the founder can confirm proof, build a three-row matrix, get a fail-closed review, revise, and export. If that loop is not obviously useful, we do not grow schema, catalog, or claims.

---

## 3. Done on day 14

Allowlisted founder can complete **without** a room, **without** `/labs/message-review`, and **without** a public catalog card:

1. Confirm launch context and a proof ledger (approved fact vs hypothesis).
2. Build a 3-row message matrix.
3. Run a **server-owned** pressure test (deterministic checks + model review; model cannot override blockers).
4. See a revision diff; accept or reject each change explicitly.
5. Export context + matrix + claim ledger.
6. Reload and resume the same attempt.

**Allowed copy:** “AI-reviewed against the proof you supplied.”

**Forbidden this horizon:** public receipt, fluency bump, “evidence-backed” on profile, “better than ChatGPT,” sixth public mission, marketing CTA for this path.

**Not done if:** evaluation is client-authoritative; artifacts vanish on refresh; the path is still the lab URL; a non-allowlisted user can hit it in production; or we shipped a sixth public mission.

---

## 4. Now vs not now

| Area | Now (14 days) | Not now |
|------|---------------|---------|
| Path | Context → matrix → review → diff → export | Full launch-brief editor, cold baseline, Watch, independent transfer, day-7 follow-up |
| Entry | Hidden allowlisted route | Public catalog card, marketing promise change |
| Users | Founder allowlist | Invite list, Stage 1/2 recruiting, 12–20 pilot |
| Data | Attempts, artifacts, evaluations, LLM runs | Evidence events, recommendation decisions, capability–skill joins as a graph product |
| Intelligence | One dated editorial JSON packet in repo | Signal / cluster / `market_demand` pipeline |
| Claims | Honest practiced / AI-reviewed language | Proven, verified, market-backed, platform 8/10 |
| Surfaces | One private path + CDO chrome | Lab expansion, rooms as product, rebrand, new component library |

### Cut vs production PRD

| PRD step | This 14 days | Why |
|----------|--------------|-----|
| Qualify / 30-day outcome | Skip | Founder-only |
| Cold baseline | Skip | Not needed to prove the spine |
| Watch / orient | Skip | Do not invent curriculum this sprint |
| Full launch-brief editor | Thin context form (objective, ICP, audience, channel, proofs) | Those fields *are* the brief inputs; a longer editor is not the week-3 start |
| Scaffolded matrix | **Hero artifact** | Work a PMM takes into review |
| Independent transfer | Skip | Stage 2 / 8/10 gate |
| Channel asset | Optional export of `channelDraft` only | Not a required activity |
| Day-7 follow-up | Skip | Later |
| Intelligence pipeline | Dated editorial JSON packet | CPO D4 |
| Capability graph + skill joins | One seeded application row | Enough to FK an attempt |
| Public receipts / fluency | Forbidden | PRD §11.3 P0 |

---

## 5. Reuse, do not rewrite

| Asset | Use |
|-------|-----|
| [`lib/labs/messageReview/`](lib/labs/messageReview/) | Types, deterministic checks, review prompt, schemas, fixtures |
| [`lib/labs/messageReview/access.ts`](lib/labs/messageReview/access.ts) | Allowlist **pattern** — new env var, not the lab list |
| [`components/learn/SoloMissionPlayer.tsx`](components/learn/SoloMissionPlayer.tsx) | Step strip, coaching line, one CTA |
| [`lib/breaks/contentSafety.ts`](lib/breaks/contentSafety.ts) | `SAFETY_PROMPT` on every consequential LLM call |
| [`lib/breaks/scoring.ts`](lib/breaks/scoring.ts) | Canonical structured-output / fail-graceful pattern |

Public product stays: five editorial missions + CDO first-session tunnel. Marketing does **not** rebrand to “evidence-backed launch system.”

---

## 6. Product surface (founder-only)

```
Allowlisted session
        ↓
Hidden entry (not in catalog)
        ↓
Confirm context + proofs
        ↓
Build three-row matrix
        ↓
Server pressure test
        ↓
Revision diff (explicit accept/reject)
        ↓
Export work
```

- **Route:** e.g. `/missions/launch-messaging` or an unpublished path id — not a catalog card, not the marketing CTA.
- **Chrome:** CDO solo pattern — `Step X of Y · kind`, one coaching line, one primary action. Room footnote only after the first saved artifact.
- **Disclosure:** visible before any model call (same honesty as PRD §4.3).

---

## 7. Schema v0 (not a second platform)

PRD §10.2 is too much FK graph for 14 days. Ship a slice that can grow into those tables.

### Create / seed

1. **`fp_capability_applications`** — seed `pmm-b2b-saas-evidence-backed-launch-v1`.
2. **`fp_learning_attempts`** — `application_id` required; `source_packet_id` **nullable** in v0 (packet = versioned JSON + hash on the attempt).
3. **`fp_artifacts` / `fp_artifact_versions`** — types this horizon: `work_context`, `message_matrix` only.
4. **`fp_evaluations` / `fp_evaluation_criteria`** — bind to `artifact_version_id` + content hash.
5. **`fp_llm_runs`** — operation, prompt/schema versions, input/output hashes, latency, tokens, cost, status, trace id. **Never** store raw user content.

### Skip this horizon

- `fp_work_context_versions` as its own table (context is an artifact)
- `fp_skill_evidence_events`
- `fp_recommendation_decisions`
- Signal dedupe / intelligence pipeline work
- Catalog cutover

### CTO gate before `apply_migration`

1. Use **SkillGap** Supabase MCP only (`supabase-skillgap`).
2. List live migrations vs repo; do **not** “reconcile 39 vs 8” as a project.
3. One **additive** migration only.
4. RLS: user owns their rows; service role for evaluation writes; zero cross-user reads.
5. Generate types after apply.

### AI gateway

- New [`lib/ai/gateway.ts`](lib/ai/gateway.ts) (and thin operation registry as needed).
- Model: `gpt-4o-mini` only.
- Strict `json_schema` + Zod after parse.
- Lab reviewer logic moves **behind** the gateway — do not fork a second rubric.
- Fail closed: `review_unavailable`; preserve artifact; no evidence on timeout/malformed/provider error.
- Deterministic blockers always win over model opinion.

---

## 8. Day-by-day

### Day 0 — Unblock only

Founder dogfoods the CDO tunnel once (magic link). Fix **only** bugs that prevent Start → solo → complete. No design pass. No Track F UI.

### Days 1–4 — Spine

- Additive migration + RLS + generated types.
- Gateway + `fp_llm_runs`.
- Persist attempt → artifact version → evaluation against lab fixtures in **tests** (UI optional).
- Seed capability application + dated editorial packet (repo JSON).

### Days 5–9 — Path

- Allowlisted player: context → matrix → review → diff → export.
- Save / resume same attempt across reload.
- Fail-closed empty states.
- Honest disclosure before any model call.
- CDO chrome (progress, step label, one coaching line, one CTA).

### Days 10–11 — Harden

- Port lab fixture set as CI on prompt/rubric change: **0 critical false clears** on existing blocking cases. Owned by [`lib/learn/wedge/fixtureCi.test.ts`](lib/learn/wedge/fixtureCi.test.ts).
- Rate limit per user per operation. In-memory, best-effort per instance; `evaluate` is the only paid Track F operation this horizon.
- Confirm no user content in logs or analytics payloads. Owned by [`lib/learn/wedge/hygiene.test.ts`](lib/learn/wedge/hygiene.test.ts).

### Days 12–14 — Founder use

- One real or sanitized launch through the path.
- If the export would not go into a real review: **cut or fix** — do not add brief editor, transfer, or a second path.

---

## 9. Kill / continue

### Kill or narrow if

- Founder cannot finish without operator rescue.
- Review feels like generic ChatGPT (no claim–proof rigor).
- Save / resume loses work.
- Schema work blows Days 1–4 → fall back: JSONB on one attempt row; postpone normalized eval tables.

### Continue to week 3+ only if export is useful

Order is fixed. **§13 replaces the earlier brief-editor-first list.**

1. Teach one **existing** public launch mission (no sixth).
2. Same attempt, optional room.
3. Track F stays the **check**, not the classroom.
4. Then — and only then — catalog / invite talk.

---

## 10. Explicitly out of the build list

- Lab UI expansion; Stage 1/2 recruiting
- Intelligence engine / `market_demand` labels
- Sixth public mission; new functions; rooms as a product bet
- Public receipts; fluency advancement; “proven”; “verifiable”
- Rebrand; new component library
- Full PRD personalization; 7-day use check; 12–20 pilot
- Another strategy or PRD document before this path ships

---

## 11. Later (production PRD — do not build yet)

When Day 14 passes the founder-use test, reopen [`PRD_Evidence_Backed_Launch_Messaging.md`](PRD_Evidence_Backed_Launch_Messaging.md) as the backlog for:

- Full Watch → Do → Check → Reflect journey and transfer gate
- Source packet tables, capability–skill graph, recommendation decisions
- Evidence events and calibrated private receipts
- Stage 2 gates for public claims and catalog cutover
- Pilot metrics (12–20 users)

Until then, that file is **reference**, not the sprint checklist.

---

## 12. Operating rule

If a task does not make the founder-only evidence→matrix→review→export loop more truthful, more completable, or more measurable, it is out of scope.

Days 1–9 are the spine and path. Days 10–11 are harden. Days 12–14 are founder use of a **real or sanitized launch**, not the SignalDesk lab fixture.

---

## 13. Destination stack and week-3 order (addendum)

This 14-day cut is a **loading dock**, not a different company. Track F stays founder-only plumbing until Day 14 passes. Do not write another PRD from this section.

### What SkillGap is for

| Reference | Donates |
|-----------|---------|
| Duolingo | Short returning loop. One unit, come back tomorrow. |
| growth.design | How a lesson looks and teaches. Craft visible in the step. |
| Maven | Do this unit with other people. |
| Skillshare | Show the work. |
| Focusmate / Cave Day | Rooms: presence while working, never the product bet. |

Rooms are **session-two on the same attempt**. They are not a product bet this horizon and they are not forbidden forever. Do not start a rooms workstream before a taught public lesson exists.

### Week 3+ (locked)

Continue only if the Day 14 export would go into a real review. Then, in this order:

1. One **public** hero unit, same path, **no sixth card**: sourced Watch (content lake / YouTube embed) → in-product Do (make the brief on the page) → Check → Reflect. Copy-prompt-to-ChatGPT is not the lesson.
2. Same attempt, optional room (footnote until the first saved artifact; never a rooms sprint).
3. Track F as the **check spine**, not the classroom.
4. Only then catalog / invites.

Do **not** start week 3 with a thin launch-brief editor, independent transfer, or Stage 1 comparisons on this path. Those grow the check into the product. The curriculum generator and lake stay the factory for assembling this unit and later ones — they are not parked out of the product.
