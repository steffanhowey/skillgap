# SkillGap.ai — Product Shipping Audit

**Auditor role:** senior product-minded engineering leader
**Date:** 2026-05-31
**Method:** Static inspection of the repo at `/Users/steffanhowey/focusparty`. Production build executed (`next build`, exit 0). Database **contents** could not be inspected (Supabase MCP points at the wrong project) — every DB-state claim is marked **[VERIFY-SQL]** and Section 6 ships the queries to settle them.

> **Accuracy note:** An earlier pass of this audit chased invented file paths (`app/page.tsx`, `PathPlayer.tsx`, `/api/progress`) that **do not exist** in this repo. Those produced false "missing homepage / no auth / no migrations" conclusions. This document is rebuilt from the **real** tree and supersedes any earlier verbal findings.

---

# 1. Executive Verdict

**This is a real, substantial, partially-coherent app — not a landing page and not a prototype.** It is much further along than a typical pre-MVP. It also carries the scars of fast iteration: heavy surface-area sprawl, duplicate route groups, ~40 strategy docs, and a large autonomous content pipeline that may or may not be producing live data.

**State in one line:** A genuinely-built learning app with a curated, hardcoded "launch" content set, a working build, real auth, and a real Do/Prove flow — wrapped in too many half-finished surfaces, missing the two things every public launch needs (analytics + lead capture), and gated on one unknown: *what's actually in the database.*

**What is already working (verified in code + green build):**
- **Production build compiles** — `next build` exits 0. (`package.json`, build log)
- **Marketing homepage** at `/` — real, on-brand (forest/cream), but hero-only. (`app/(marketing)/page.tsx`)
- **Auth** — magic-link OTP login, signup, onboarding, global session refresh via middleware. (`middleware.ts`, `lib/supabase/middleware.ts`, `app/(auth)/*`, `app/onboard/*`)
- **Admin auth** — `verifyAdminAuth` / `requireAdmin` guard **45 of 49** admin API routes; `is_admin` on `fp_profiles`. (`lib/admin/verifyAdminAuth.ts`, `lib/admin/requireAdmin.ts`)
- **A curated launch experience that does NOT depend on the AI pipeline** — missions, rooms, and taxonomy are **static TypeScript** (~1,041 lines, zero DB calls). (`lib/launchMissionContent.ts`, `lib/launchRooms.ts`, `lib/launchTaxonomy.ts`, `lib/launchFrontDoor.ts`)
- **The "Do" flow is real** — substantial mission components (MissionDetailPage 804 LOC, MissionViewer 839, MissionBriefModal 640, QuickCheckViewer, ReflectionViewer).
- **The "Prove" model exists** — `fp_learning_progress` table with per-item state, completion, and RLS. (`supabase/migrations/20260326_codify_learning_progress.sql`, `lib/useLearnProgress.ts`)

**What is NOT working yet / unverified:**
- **No product analytics** (no PostHog/GA/Vercel Analytics). You would launch blind. (The `app/api/analytics/*` routes are *internal skill-intelligence* aggregation, not user analytics.)
- **No lead/email capture** (no waitlist, no Resend/SendGrid). The homepage's only conversion is "sign up now."
- **Homepage is a stub past the hero** — the `See how it works` CTA anchors to `#how-it-works`, a section that **doesn't exist**.
- **Severe route sprawl / duplication** — `(hub)`, `(lobby)`, `(public)`, `(learn)` contain overlapping `rooms`, `practice`, `progress`, `skills`. Canonical paths are ambiguous. `(hub)/learn` just redirects to `/missions`.
- **DB state unknown [VERIFY-SQL]** — whether any published paths, provisioned rooms, real users, or seeded content exist. The static launch content reduces this risk but doesn't eliminate it (rooms and live presence need DB rows).
- **3 unguarded seed routes + missing `CRON_SECRET`** — narrow but real security/ops gaps (Section 8).

**Shortest path to useful-live:** You are **~1–2 focused weeks** from a credible public MVP, *if the DB has (or we seed) a handful of real users + provisioned launch rooms*. The fastest coherent product is: **homepage → signup → onboarding → pick a launch mission → do it → save proof.** That spine already exists in code. The work is **subtraction (hide half the routes), verification (DB state), and two additions (analytics + email capture)** — not new feature-building.

---

# 2. Current Product Inventory

Legend: ✅ works · 🟡 incomplete · 🟨 mocked/hardcoded · ❌ missing · ❓ needs manual/SQL verification

| Item | Status | Evidence |
|---|---|---|
| **Marketing homepage** | 🟡 | `app/(marketing)/page.tsx` — real hero, on-brand; no sections below the fold; `#how-it-works` anchor is dead |
| **Auth: login (OTP)** | ✅ | `app/(auth)/login/page.tsx`, Supabase magic link |
| **Auth: signup** | ✅ | `app/(auth)/signup/page.tsx` |
| **Onboarding** | ✅ (code) ❓ (flow) | `app/onboard/page.tsx`, `app/onboard/steps`, `lib/onboarding/*`, `components/onboarding/*` |
| **Session refresh middleware** | ✅ | `middleware.ts` → `lib/supabase/middleware.ts` (`updateSession`) |
| **Hub shell + nav** | ✅ | `components/shell/HubShell.tsx`, `app/(hub)/layout.tsx` |
| **Missions catalog (Learn/Browse)** | ✅ (code) | `app/(hub)/missions/page.tsx`, `components/missions/MissionsPage.tsx` (726 LOC) |
| **Mission detail / Do flow** | ✅ (code) | `components/missions/MissionDetailPage.tsx` (804), `MissionBriefModal.tsx` (640) |
| **Mission viewer (Watch/Do/Check/Reflect)** | ✅ (code) | `components/learn/MissionViewer.tsx` (839), `QuickCheckViewer.tsx`, `ReflectionViewer.tsx`, `LearnVideoPlayer.tsx` |
| **Curated launch content** | 🟨 (by design) | `lib/launchMissionContent.ts`, `lib/launchRooms.ts`, `lib/launchTaxonomy.ts` — **static, no DB** |
| **Progress / proof model** | ✅ (schema) ❓ (live) | `fp_learning_progress` migration; `lib/useLearnProgress.ts` |
| **Skill receipt / credential** | 🟡 | `components/learn/SkillReceipt.tsx`, `app/api/learn/skill-receipt/[pathId]/route.ts` |
| **Rooms / live co-working** | 🟡 ❓ | `app/(hub)/rooms`, `app/(lobby)/rooms/[id]`, `lib/parties.ts`, `lib/rooms/*`, realtime hooks; needs DB rows + presence |
| **Synthetic users** | ✅ (code) ❓ (live) | `lib/synthetics/*`, `app/api/synthetics/tick` (cron */2min) |
| **AI curriculum generator** | ✅ (code) ❓ (used) | `lib/learn/curriculumGenerator.ts` (838), structured outputs, gpt-4o-mini |
| **Content pipeline (discover→evaluate→shelf)** | ✅ (code) ❓ (live) | `lib/breaks/*`, `app/api/breaks/*`, `app/api/pipeline/*` |
| **Intelligence / skill-heat / index** | ✅ (code) ❓ (live) | `lib/intelligence/*`, `app/api/intelligence/*`, `app/(public)/index`, `app/(public)/pulse` |
| **Admin dashboard** | ✅ (code) | `app/(admin)/admin/*` (14 pages), `components/admin/*` |
| **Admin API guards** | ✅ (45/49) | `verifyAdminAuth` / `requireAdmin`; unguarded: `admin/auth` (expected), 3 `seed-*` routes |
| **Goals / tasks system** | ✅ (code) | `app/(hub)/goals`, `app/(hub)/tasks`, `lib/goals.ts`, `lib/tasks.ts` |
| **GitHub integration** | 🟡 | `lib/integrations/github.ts`, `app/api/integrations/*`; **no `GITHUB_CLIENT_ID/SECRET` in env** |
| **Cron jobs (17)** | ✅ (config) ❓ (auth in prod) | `vercel.json`; require `CRON_SECRET` (not in `.env.local`) |
| **Database migrations** | 🟡 | `supabase/migrations/*.sql` (20 files) — *retroactive documentation*, real schema lives in Supabase |
| **Product analytics** | ❌ | no PostHog/GA/Plausible/Vercel Analytics anywhere |
| **Lead capture / email** | ❌ | no waitlist, no Resend/SendGrid/Postmark |
| **Payments / subscription** | ❌ | none in repo (pricing only in `PRICING_STRATEGY.md`) |
| **Tests** | 🟡 | Vitest configured; ~20 `*.test.ts` (launch*, mission*, contentSafety, curriculumPrompt, achievements) |
| **Deployment config** | ✅ | `vercel.json`, `next.config.ts`; Vercel serverless assumed |

---

# 3. Architecture Summary

- **Framework:** Next.js **16.1.6**, App Router, React **19.2.3**. (`package.json`)
- **Package manager:** **npm** (`package-lock.json` present; no pnpm/yarn lockfile).
- **Language:** TypeScript strict. ~112k LOC (app 19.5k / lib 52.8k / components 39.6k).
- **Styling:** Tailwind v4 + CSS custom properties; brand tokens (`--sg-*`, forest/sage/shell) per `.claude/rules/figma-code-connect.md`. Homepage hardcodes a few brand hexes deliberately to dodge a ThemeProvider accent override (`app/(marketing)/page.tsx` comment).
- **Components:** Server Components by default; `'use client'` where needed. Shared primitives in `components/ui/`. Feature folders under `components/*`.
- **State / data fetching:** Custom hooks in `lib/use*.ts` (≈60 hooks) wrapping Supabase queries + realtime + optimistic updates. No Redux/Zustand/React-Query.
- **Backend / API:** 116 route handlers under `app/api/*` (named `GET/POST/...`). Plus 17 Vercel Cron GET endpoints.
- **Database:** Supabase Postgres. ~70 `fp_`-prefixed tables referenced in code. **Migrations are retroactive documentation** — many say "table already exists at runtime (created pre-migration)." Source of truth is the live DB, not the repo → **schema-drift risk**.
- **Auth:** Supabase Auth (magic-link OTP). Two clients: SSR/anon (`lib/supabase/server.ts`, `client.ts`, `middleware.ts`) and **service-role admin** (`lib/supabase/admin.ts`, bypasses RLS — server-only). Middleware refreshes session on every non-asset request.
- **AI:** OpenAI `6.27.0`, `gpt-4o-mini`, structured outputs (`response_format: json_schema`), `SAFETY_PROMPT` discipline. Canonical pattern in `lib/breaks/scoring.ts`.
- **Deployment assumptions:** Vercel serverless (60s), Vercel Cron, env vars in Vercel project settings.

**Architectural concerns (ranked):**
1. **Surface-area sprawl.** Five+ route groups with overlapping `rooms/practice/progress/skills`. No single source of truth for "the app's real navigation." High cognitive + maintenance load; confusing for launch.
2. **Schema lives only in the DB.** Code references ~70 tables; migrations don't fully reproduce them. A fresh environment cannot be rebuilt from the repo. Onboarding a second engineer or a staging DB is currently hard.
3. **Large autonomous machinery for a pre-launch product.** 17 crons + synthetics + multi-stage content/intelligence pipelines. Powerful, but most are *not required* for the MVP spine and each is a cost/error surface.
4. **Static launch content vs. dynamic pipeline coexist.** Good hedge (launch doesn't depend on AI), but two content systems = ambiguity about which one users actually see. Must be made explicit.

---

# 4. MVP Readiness Matrix

| Capability | Status | Evidence | MVP importance | Recommended action |
|---|---|---|---|---|
| Public marketing homepage | 🟡 Partial | `app/(marketing)/page.tsx` (hero only; dead `#how-it-works`) | Must-have | Add 3 sections (how-it-works, sample missions, footer) + email capture |
| Learning library / catalog | ✅ Ready (code) | `components/missions/MissionsPage.tsx` | Must-have | Confirm it renders static launch catalog with empty DB |
| Learning object detail page | ✅ Ready (code) | `components/missions/MissionDetailPage.tsx` | Must-have | Manual click-through QA |
| Pathway/course structure | ✅ Ready (code) | `lib/types/learning.ts`, `fp_learning_paths`, curriculum gen | Should-have | Verify ≥1 path/mission per launch lane [VERIFY-SQL] |
| Workshop/challenge (mission) structure | ✅ Ready (code) | `lib/launchMissionContent.ts`, MissionViewer | Must-have | Keep static; don't depend on pipeline |
| Resource/template structure | 🟡 Partial | `lib/learn/contentLake.ts`, `fp_content_lake` | Later | Defer; not required for spine |
| User authentication | ✅ Ready | `app/(auth)/*`, `middleware.ts` | Must-have | E2E test OTP in prod env |
| User dashboard | 🟡 Partial | `app/(hub)/home`, `app/(hub)/dashboard`, `app/(hub)/profile` | Must-have | Pick ONE home surface; hide the rest |
| Progress tracking | ✅ Ready (schema) | `fp_learning_progress`, `lib/useLearnProgress.ts` | Must-have | Verify writes succeed end-to-end [VERIFY-SQL] |
| Completion / proof artifact | 🟡 Partial | `components/learn/SkillReceipt.tsx`, skill-receipt API | Should-have | Make completion produce a visible receipt |
| Admin / content management | ✅ Ready (code) | `app/(admin)/admin/*`, 45/49 routes guarded | Should-have | Set `is_admin` on your account; lock 3 seed routes |
| Search / filtering | 🟡 Partial | `app/api/learn/search/*`, `components/learn/SearchDropdown.tsx` | Later | Defer; static catalog is small |
| Responsive / mobile | ❓ Needs verify | Tailwind responsive classes present; not tested | Should-have | Manual mobile QA of the 5-screen spine |
| Payment / subscription | ❌ Missing | none | Later | Defer — launch free, capture intent |
| Waitlist / lead capture | ❌ Missing | none | Must-have | Add email capture on homepage |
| Analytics | ❌ Missing | none (product) | Must-have | Add Vercel Analytics + PostHog |
| Email notifications | ❌ Missing | none | Later | Defer (transactional OTP is Supabase's) |
| Deployment readiness | 🟡 Partial | build ✅; env/cron secrets incomplete | Must-have | Set all prod env vars incl. `CRON_SECRET` |

---

# 5. Core User Journey Audit

### Journey A — First-time visitor: *Can they understand SkillGap?*
- **Works:** `/` renders a clean, on-brand hero: "Become AI-native in your role," clear subhead, two CTAs. Looks credible.
- **Breaks / fake:** Everything below the hero is missing. `See how it works` → `#how-it-works` scrolls nowhere. No proof, no sample of what you'll do, no email capture.
- **MVP need:** 3 short sections (How it works: Learn→Do→Prove; 2–3 sample launch missions; footer) + an email field for "not ready to sign up."
- **Can wait:** testimonials, pricing, SEO path-preview pages.

### Journey B — Learning discovery: *Can they browse what to learn?*
- **Works (code):** `MissionsPage.tsx` is a real catalog; launch lanes (prompt-engineering, claude-code, github-copilot × professional domains) are defined statically.
- **Breaks / unverified:** Whether the catalog renders with an empty DB, and whether room/recommendation widgets error without data. **[VERIFY-SQL]** + manual QA.
- **MVP need:** catalog renders from static launch content regardless of DB.
- **Can wait:** AI search, personalization, trending.

### Journey C — Learning detail: *Can they understand a specific mission?*
- **Works (code):** `MissionDetailPage` + `MissionBriefModal` render promise, why-now, artifact, checklist, completion standard — all present in `launchMissionContent.ts`. This is genuinely good product content.
- **Breaks:** modal-first entry is recent (git log) — needs click QA for dead ends.
- **MVP need:** open mission → read brief → start. Already built.

### Journey D — Practical action: *Can they actually DO something?*
- **Works (code):** MissionViewer = Watch (YouTube embed) → Do (mission steps + artifact) → Check (QuickCheck) → Reflect (Reflection). Real components, not stubs.
- **Breaks / unverified:** YouTube embeds need a valid `YOUTUBE_API_KEY` for metadata; AI evaluation needs `OPENAI_API_KEY` at runtime. Reflection/quiz persistence depends on `fp_learning_progress` writes succeeding. **[VERIFY-SQL]**
- **MVP need:** at least the Do + Reflect steps must save. Watch can degrade gracefully if a video is missing.

### Journey E — Progress / proof: *Can they save/complete/prove?*
- **Works (schema):** `fp_learning_progress` tracks item_states, items_completed, completed_at, status; unique `(user_id, path_id)`; RLS by `auth.uid()`.
- **Breaks / unverified:** End-to-end write path not verified live; skill-receipt rendering on completion is partial.
- **MVP need:** completing a mission flips status→completed and shows a receipt/confirmation.

### Journey F — Return visit: *Any reason to come back?*
- **Works (code):** "Continue learning," queue board (`MyQueueBoard.tsx`), goals, streak/achievement scaffolding, rooms with synthetic activity.
- **Breaks:** without analytics + email, you can't re-engage anyone who leaves. Rooms feel alive only if synthetics run (cron + `SYNTHETICS_ENABLED`) and there's DB seed.
- **MVP need:** at minimum, a logged-in user sees their in-progress mission on return. (Built.) Re-engagement email is post-MVP.

---

# 6. Data & Content Model Review

**Confirmed real (in code/migrations):**
- **Users:** Supabase `auth.users` + `fp_profiles` (`is_admin`, username, avatar). Onboarding state on profile.
- **Learning paths:** `fp_learning_paths` (curriculum gen writes here), `fp_skill_tags`.
- **Progress/proof:** `fp_learning_progress` (per-item JSONB state, completion, RLS) — the spine of "Prove."
- **Missions:** `fp_mission_briefs`, `fp_mission_path_projections`, `fp_mission_editorial_decisions`, `fp_mission_generation_runs`.
- **Rooms:** `fp_parties`, `fp_party_participants`, `fp_room_blueprints` (editorial draft→approved→provisioned), `fp_room_background_*`.
- **Content lake:** `fp_content_lake` (+ embeddings), `fp_break_content_*`, `fp_creators`, `fp_signals`, `fp_article_candidates`.
- **Skills/taxonomy:** `fp_skills`, `fp_skill_domains`, `fp_user_skills`, `fp_topic_taxonomy`, `fp_topic_skill_map`, `fp_skill_market_state`.
- **Tasks/goals/sessions:** `fp_tasks`, `fp_projects`, `fp_goals`, `fp_session_*`, `fp_commitments`, `fp_notes`.

**Launch content (static, in TS — no DB):** `lib/launchTaxonomy.ts`, `lib/launchMissionContent.ts`, `lib/launchRooms.ts`, `lib/launchFrontDoor.ts`. Topics: **prompt-engineering, claude-code, github-copilot** × professional domains. This is your real, shippable MVP content backbone.

**The smallest schema that matters for MVP** (everything else can lie dormant):
```
auth.users                      -- Supabase
fp_profiles(id, username, is_admin, onboarded fields)
fp_learning_paths(id, slug, title, status, modules/items, skill tags)  -- OR rely on static launch content
fp_learning_progress(user_id, path_id, item_states, status, completed_at, UNIQUE(user_id,path_id))
fp_parties(+participants)       -- only if rooms are in the MVP
```
**Opinion:** For the first launch, **lean on the static launch content for catalog + missions** and use `fp_learning_progress` only for save/complete. Treat the AI pipeline, content lake, intelligence, and synthetics as **dormant infrastructure** — present but not on the critical path. Don't model anything new.

### 🔎 Run these read-only diagnostics (paste into Supabase SQL editor)
Delete any line that errors on a missing table.
```sql
-- 1) Row counts for the tables the MVP depends on
SELECT 'fp_profiles'           AS tbl, count(*) FROM fp_profiles
UNION ALL SELECT 'fp_profiles_admins',     count(*) FROM fp_profiles WHERE is_admin = true
UNION ALL SELECT 'fp_learning_paths',      count(*) FROM fp_learning_paths
UNION ALL SELECT 'fp_learning_paths_pub',  count(*) FROM fp_learning_paths WHERE status = 'published'
UNION ALL SELECT 'fp_learning_progress',   count(*) FROM fp_learning_progress
UNION ALL SELECT 'fp_progress_completed',  count(*) FROM fp_learning_progress WHERE status = 'completed'
UNION ALL SELECT 'fp_mission_briefs',      count(*) FROM fp_mission_briefs
UNION ALL SELECT 'fp_parties',             count(*) FROM fp_parties
UNION ALL SELECT 'fp_party_participants',  count(*) FROM fp_party_participants
UNION ALL SELECT 'fp_room_blueprints',     count(*) FROM fp_room_blueprints
UNION ALL SELECT 'fp_content_lake',        count(*) FROM fp_content_lake
UNION ALL SELECT 'fp_skills',              count(*) FROM fp_skills
UNION ALL SELECT 'fp_topic_taxonomy',      count(*) FROM fp_topic_taxonomy
ORDER BY tbl;

-- 2) ⭐ THE LAUNCH-GATING QUERY: are launch missions projected into the catalog?
--    If this returns 0 rows, the missions list is EMPTY until an admin runs
--    POST /api/pipeline/missions/publish.
SELECT mission_lane_key, title, generation_engine, is_cached, created_at
FROM fp_learning_paths
WHERE generation_engine = 'mission_projection' AND is_cached = true
ORDER BY created_at DESC;

-- 2b) All paths (any engine), for context
SELECT id, slug, title, status, generation_engine, is_cached, created_at
FROM fp_learning_paths
ORDER BY created_at DESC
LIMIT 25;

-- 3) Are launch rooms provisioned and discoverable?
SELECT id, name, status, is_discoverable, created_at
FROM fp_parties
ORDER BY created_at DESC
LIMIT 25;

-- 4) Confirm the proof table has the unique index the upsert needs
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'fp_learning_progress';

-- 5) Confirm RLS is enabled on user-data tables
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('fp_profiles','fp_learning_progress','fp_parties','fp_party_participants','fp_tasks','fp_goals');

-- 6) Do YOU have an admin account? (replace with your email)
SELECT p.id, p.username, p.is_admin
FROM fp_profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'steffan.howey@gmail.com';
```

---

# 7. Design System & Brand Implementation Review

**Brand intent (from `.claude/rules/figma-code-connect.md` + brand HTML):** mature, editorial, forest/sage/shell, Fraunces display + DM Sans body, light-first, color = meaning. **No purple, no generic AI gradients.**

**What's implemented:**
- ✅ Tokens exist: forest/sage/shell/teal/gold CSS variables; `lib/palette.ts`; rules in `.claude/rules/ui-components.md`.
- ✅ Homepage matches intent: forest-900 hero, Fraunces headline, DM Sans body, subtle dot-grid, pulse dot. On-brand and trustworthy.
- ✅ Reusable primitives: `components/ui/` (Button, Card, Modal, MenuItem) with documented variants.
- 🟡 **Two-source brand drift:** the *figma-code-connect* rules say "use brand HTML, NOT `app/globals.css`/`lib/palette.ts`," while the in-app theme uses `--color-*` from `globals.css`. The homepage even hardcodes hexes to escape a ThemeProvider accent override. There are `page.tsx`/`page-v2`/`brand/` variants — i.e., a brand migration that's **half-applied** between the marketing surface and the in-app surface.
- ❓ **Consistency inside the app** (hub/missions/rooms) vs. the marketing brand is unverified visually — needs a screenshot pass.

**Where it likely feels generic/unfinished:** below-the-fold homepage (empty), and any in-app screen still on the *old* `--color-*` dark theme rather than the new forest/cream brand. The audit's brand direction ("coral" accent, "slash graphic language") is **not** present — current accent system is forest/teal/gold, no coral, no diagonal motifs.

**Recommendation:** Pick **one** brand source of truth (the new forest/cream system) and confirm the *5 MVP screens* (home, signup, onboarding, missions list, mission detail) are visually consistent. Don't re-theme the 40 other routes — hide them.

---

# 8. Technical Risk Review (by launch impact)

**P0 — blocks or endangers launch**
1. **The catalog depends on a DB "publish" step that may not have run.** `/api/missions/catalog` reads `fp_learning_paths` rows with `generation_engine='mission_projection'` + `is_cached=true` + an approved `mission_lane_key`. These rows are created **only** by an admin running `POST /api/pipeline/missions/publish`. **If that hasn't run in prod, the missions list is empty → no MVP.** Also DB-dependent: **progress writes** (`fp_learning_progress`), **rooms** (`fp_parties`), **your admin flag** (`fp_profiles.is_admin` — needed to *call* the publish route). **Mitigation:** run Section 6 SQL (#1, #2) to check for projection rows; if zero, set yourself admin and POST the publish route; re-check. *(Risk: HIGH until verified — this is the launch-gating item.)*
2. **`CRON_SECRET` not in `.env.local`** but required by `verifyAdminAuth` for cron GETs. In prod, Vercel Cron must send `Authorization: Bearer $CRON_SECRET`. If unset → **all 17 crons 401** (synthetics die, pipeline stalls). **Mitigation:** set `CRON_SECRET` in Vercel + rely on Vercel's cron auth. *(Medium.)*
3. **3 unguarded admin seed routes:** `app/api/admin/seed-content-lake`, `seed-onboarding-picks`, `seed-topic-skill-map` — no `verifyAdminAuth`. Publicly callable; can write data / spend tokens. **Mitigation:** add `verifyAdminAuth` (1-line each). *(Medium — narrow blast radius but real.)*

**✅ Resolved during audit — confirmed strength:**
- **Route-level auth IS enforced.** `lib/supabase/middleware.ts` redirects unauthenticated users from a `PROTECTED_PREFIXES` list (`/missions`, `/rooms`, `/progress`, `/admin`, etc.) → `/login?next=…`, sends authed users from `/` → `/missions`, and force-redirects users with incomplete onboarding → `/onboard` (with a `fp_onboarded` cookie cache). Genuinely solid. *No action needed.*

**⚠️ CORRECTION — the catalog is NOT static; it requires a DB "publish" step (this is the #1 launch gotcha):**
The flow is **static content → admin publish → DB rows → catalog**:
1. `lib/launchMissionContent.ts` holds the *editorial copy* for each mission lane (static).
2. **An admin must run `POST /api/pipeline/missions/publish`** → `projectApprovedMissions()` (`lib/missions/services/missionProjectionService.ts`) → writes rows into `fp_learning_paths` with `generation_engine='mission_projection'`, `is_cached=true`, `mission_lane_key=…`.
3. `/api/missions/catalog` → `listPublishedLaunchCatalogPaths()` reads **only those projected rows** back.

**Therefore: if the publish step has not been run against the production DB, the missions list is EMPTY — there is no MVP, no matter how good the static content is.** This is the first thing to verify/run. (See P0 #1 and T1.)

**P1 — degrades UX / credibility**
4. **No analytics + no error monitoring.** You can't see signups, drop-off, or runtime errors. **Mitigation:** Vercel Analytics + PostHog (or Sentry for errors). *(Medium.)*
5. **Homepage dead anchor + empty below-fold.** Credibility hit. *(Small fix.)*
6. **Route sprawl / duplicate surfaces.** Users (or you) can navigate into half-built `(lobby)`/`(public)` screens. **Mitigation:** gate non-MVP routes behind admin or remove from nav. *(Medium.)*

**P2 — maintainability / latent**
7. **Schema not reproducible from repo.** Migrations are retroactive docs. **Mitigation:** `pg_dump --schema-only` into `supabase/migrations/` as a baseline. *(Medium, do soon after launch.)*
8. **Service-role client (`lib/supabase/admin.ts`) bypasses RLS** — fine, but ensure it's never imported into a client component. **Mitigation:** grep for `lib/supabase/admin` in any `'use client'` file. *(Low-medium.)*
9. **GitHub integration half-wired** (no creds) — ensure it fails gracefully and isn't surfaced in MVP nav. *(Low.)*
10. **Build warnings / mobile** unverified beyond exit-0. *(Low.)*

**Good news:** No build failures, type errors block the build, broken core imports, or obvious client/server boundary violations were found in the spine. Admin and cron auth are *mostly* correct (45/49). RLS is present on user tables (verify with SQL #5).

---

# 9. What to Cut for MVP (be ruthless)

**Cut / hide entirely for v1 (present in repo, not needed to be useful):**
- **The autonomous content + intelligence machinery on the critical path:** content discovery, evaluation, shelf, topic clustering, signals, skill-heat, AI Skills Index, Pulse dashboard (`app/(public)/index`, `app/(public)/pulse`, most of `app/api/breaks/*`, `app/api/intelligence/*`, `app/api/signals/*`). Leave the crons *off* or *unlisted*; ship the static launch content instead.
- **Rooms/live/social — UNLESS** SQL shows provisioned rooms + you enable synthetics. Live presence with an empty room is worse than no room. Consider launching **solo Learn→Do→Prove first**, rooms in v1.1.
- **GitHub & external integrations** (`app/api/integrations/*`).
- **Goals/tasks/sessions** as headline features (they're built, but they dilute the core promise). Keep accessible, don't market.
- **Skill graph / market-state / credentials-as-shareable** (Phase 2–4 docs) — keep the simple completion receipt, defer the graph.
- **Payments** — launch free; capture intent.
- **Admin CMS depth** — you only need: set `is_admin`, view users, (optionally) approve rooms. The other 12 admin pages can wait.
- **Duplicate route groups** — collapse `(lobby)`/`(public)`/`(learn)` overlaps; keep `(marketing)`, `(auth)`, `(hub)`, `(admin)`.

**Keep (the spine):** homepage → signup → onboarding → missions catalog (static) → mission detail → MissionViewer (Watch/Do/Check/Reflect) → progress save → completion receipt.

---

# 10. Recommended MVP Definition

**Core promise:** *"Learn the tools. Close the gap."* — Do one real AI mission tied to your work in ~40 minutes and walk away with proof.

**Include:**
- Homepage that explains Learn→Do→Prove + email capture.
- OTP signup + lightweight onboarding (function + fluency).
- A catalog of the **static launch missions** (prompt-engineering, Claude Code, Copilot × a few domains).
- Mission detail + the full **Watch → Do → Check → Reflect** flow.
- **Save + complete + a visible proof receipt** (`fp_learning_progress` + `SkillReceipt`).
- Vercel Analytics + PostHog + error monitoring.

**Exclude (v1):** rooms/social (unless DB-ready), AI pipeline & intelligence dashboards, skill graph, payments, integrations, goals/tasks marketing, deep admin.

**Minimum content:** **6–10 complete launch missions** across 2–3 topics and 2–3 functions (mostly already authored in `launchMissionContent.ts` — verify coverage and fill gaps).

**Minimum backend:** auth (have), `fp_profiles` + `fp_learning_progress` writes working (verify), static catalog (have). Crons can stay **off**.

**Minimum design polish:** the **5 spine screens** consistent on the new forest/cream brand + mobile-passable. Ignore the other 40 routes.

**Minimum analytics/feedback:** pageviews, signup conversion, mission-start, mission-complete events; an email field; a feedback link (mailto or Tally).

---

# 11. Fastest Path to Live (phased)

### Phase 0 — Stabilize *(½–1 day, Risk: low)*
- **Run Section 6 SQL**; record what content/users/rooms actually exist. *(files: n/a)*
- **Lock the 3 seed routes** with `verifyAdminAuth`. *(`app/api/admin/seed-*/route.ts`)*
- **Set all prod env vars** in Vercel incl. `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`. *(Vercel settings)*
- **Decide rooms in/out** of v1 based on SQL.
- **Done =** you know the true data state; no unguarded write routes; build deploys to a Vercel preview that loads `/`.

### Phase 1 — Make the product coherent *(2–4 days, Risk: medium, Complexity: M)*
- **Tame navigation:** reduce HubShell nav to the spine; hide/redirect `(lobby)`/`(public)`/duplicate routes. *(`components/shell/HubShell.tsx`, `lib/appRoutes.ts`)*
- **Pick one home surface** (`home` vs `dashboard`); delete/redirect the other. *(`app/(hub)/home`, `app/(hub)/dashboard`)*
- **Verify catalog + mission flow render with the real DB state** (empty-state safe). Manual click-through of Journeys B→E. *(`components/missions/*`, `components/learn/*`)*
- **Done =** a logged-in user can go signup → onboard → catalog → mission → do → save, with no dead ends or empty crashes.

### Phase 2 — Make it useful *(2–4 days, Risk: medium, Complexity: M)*
- **Guarantee 6–10 complete launch missions**; fill `launchMissionContent.ts` gaps; confirm each has video + steps + check + reflection. *(`lib/launchMissionContent.ts`, `lib/launchTaxonomy.ts`)*
- **Make completion produce a receipt** and surface "Continue" on return. *(`components/learn/SkillReceipt.tsx`, `lib/useLearnProgress.ts`, MissionCompletionSummary)*
- **Mobile QA** of the 5 screens.
- **Done =** a stranger completes a mission and sees proof; returning user resumes.

### Phase 3 — Make it launchable *(2–3 days, Risk: low-medium, Complexity: S–M)*
- **Homepage finish:** how-it-works section, 2–3 sample missions, footer, kill the dead anchor. *(`app/(marketing)/page.tsx`)*
- **Email capture** → `fp_*` table or Resend audience. *(new `app/api/leads/route.ts` + form)*
- **Analytics + error monitoring** wired (Vercel Analytics + PostHog + Sentry). *(`app/layout.tsx`, env)*
- **Feedback link.** Final pre-launch QA pass + deploy to prod domain.
- **Done =** public can land, understand, sign up (or leave email), complete a mission, and you can see it happen.

---

# 12. First 10 Engineering Tickets (in execution order)

**T1 — Verify DB state & publish the launch catalog**
- *Goal:* confirm the missions catalog is non-empty in prod. *Why:* **this is the launch gate** — the catalog reads `mission_projection` rows that only exist after an admin runs the publish step. *Scope:* (a) run Section 6 SQL #1/#2; (b) if query #2 returns 0 rows: set `is_admin=true` on your `fp_profiles` row (SQL #6), then `POST /api/pipeline/missions/publish` (with admin session or `Authorization: Bearer $ADMIN_SECRET`); (c) re-run #2 to confirm rows appear; (d) load `/missions` and confirm the catalog renders. *Files:* `app/api/pipeline/missions/publish/route.ts`, `lib/missions/services/missionProjectionService.ts`, `lib/missions/services/launchCatalogService.ts`. *Acceptance:* query #2 returns one row per approved lane; `/missions` shows them. *Deps:* none. *Complexity:* S–M.

**T2 — Guard the 3 unprotected seed routes**
- *Goal:* no public write/spend endpoints. *Scope:* add `verifyAdminAuth` guard to `seed-content-lake`, `seed-onboarding-picks`, `seed-topic-skill-map`. *Files:* `app/api/admin/seed-*/route.ts`. *Acceptance:* unauthenticated POST → 401; authed admin → works. *Deps:* none. *Complexity:* S.

**T3 — Provision prod env + cron auth**
- *Goal:* crons and runtime keys work in prod. *Scope:* set `CRON_SECRET`, `OPENAI_API_KEY`, `YOUTUBE_API_KEY`, `NEXT_PUBLIC_SITE_URL`, Supabase keys in Vercel; verify a cron returns 200. *Files:* Vercel settings, `vercel.json`. *Acceptance:* manual GET to one cron with bearer = 200; without = 401. *Deps:* none. *Complexity:* S.

**T4 — Collapse navigation to the MVP spine**
- *Goal:* coherent product. *Scope:* trim HubShell nav; redirect/hide `(lobby)`, `(public)`, duplicate `rooms/practice/progress/skills`; choose one home. *Files:* `components/shell/HubShell.tsx`, `lib/appRoutes.ts`, `app/(hub)/*`. *Acceptance:* nav shows only spine; no link reaches a half-built screen. *Deps:* T1. *Complexity:* M.

**T5 — Empty-state-proof the catalog & mission flow**
- *Goal:* app never crashes on missing DB rows. *Scope:* ensure MissionsPage/MissionDetailPage render from static launch content; guard room/recommendation widgets. *Files:* `components/missions/*`, `lib/useLaunchCatalog.ts`. *Acceptance:* with an empty `fp_parties`, catalog + detail still render. *Deps:* T1. *Complexity:* M.

**T6 — End-to-end progress save/complete**
- *Goal:* "Prove" works. *Scope:* verify Reflection/QuickCheck writes to `fp_learning_progress`; completing flips status→completed. *Files:* `lib/useLearnProgress.ts`, MissionViewer, ReflectionViewer. *Acceptance:* complete a mission as a test user → row shows `status=completed`. *Deps:* T1. *Complexity:* M.

**T7 — Completion receipt surfaced**
- *Goal:* tangible proof. *Scope:* show `SkillReceipt`/`MissionCompletionSummary` on completion; "Continue" on return. *Files:* `components/learn/SkillReceipt.tsx`, `components/missions/MissionCompletionSummary.tsx`. *Acceptance:* finishing a mission shows a receipt; revisiting shows progress. *Deps:* T6. *Complexity:* S–M.

**T8 — Homepage completion**
- *Goal:* visitors understand + can act. *Scope:* add how-it-works, sample missions, footer; remove dead `#how-it-works` (or build it). *Files:* `app/(marketing)/page.tsx`. *Acceptance:* no dead anchors; page explains Learn→Do→Prove. *Deps:* none. *Complexity:* S–M.

**T9 — Email/lead capture**
- *Goal:* capture non-signups. *Scope:* email form on homepage → `fp_leads` table or Resend audience; basic validation. *Files:* new `app/api/leads/route.ts`, homepage form, migration. *Acceptance:* submitting email stores it; visible in DB. *Deps:* T8. *Complexity:* S–M.

**T10 — Analytics + error monitoring**
- *Goal:* see the funnel and crashes. *Scope:* Vercel Analytics + PostHog (pageview, signup, mission_start, mission_complete) + Sentry. *Files:* `app/layout.tsx`, `lib/analytics.ts`, env. *Acceptance:* events appear in PostHog from a real session. *Deps:* none. *Complexity:* S–M.

---

# 13. First PR Recommendation

**PR title:** `chore(security+ops): guard seed routes, set cron auth, and snapshot DB state`

**What it changes:**
- Adds `verifyAdminAuth` to the 3 unguarded `seed-*` admin routes.
- Adds a short `docs/RUNBOOK.md` (or PR description) capturing the Section 6 SQL output + the prod env-var checklist (incl. `CRON_SECRET`).
- No behavior change to the user-facing spine.

**Why first:** It's tiny, removes the only real security exposure, forces the env/cron config that otherwise silently breaks prod, and produces the **ground-truth DB snapshot** every later ticket depends on — all without touching the app's hot path. Maximum uncertainty-reduction per line changed.

**Files involved:** `app/api/admin/seed-content-lake/route.ts`, `app/api/admin/seed-onboarding-picks/route.ts`, `app/api/admin/seed-topic-skill-map/route.ts`, new `docs/RUNBOOK.md`.

**Acceptance criteria:** unauthenticated POST to each seed route → 401; authed admin still works; build green; RUNBOOK lists real table counts + a checked env-var list.

---

# 14. Open Questions

**Must answer before launch**
- **DB content reality** — are there published paths and (if rooms ship) provisioned rooms? *(Assumption pending SQL: in-app catalog can run on static launch content, so likely OK.)*
- **Rooms in or out of v1?** Live presence with no real users + no synthetics is a negative. *(Assumption: ship solo Learn→Do→Prove first, rooms v1.1, unless SQL shows seeded rooms.)*
- **Which home surface is canonical** — `home` vs `dashboard`? *(Assumption: keep `home`, redirect `dashboard`.)*
- **Free at launch?** *(Assumption: yes; capture email/intent, no payments.)*
- **Brand source of truth** — new forest/cream everywhere, or keep the old in-app `--color-*` theme for the hub? *(Assumption: new brand on the 5 spine screens only.)*

**Can answer after MVP**
- Turn the AI content pipeline + intelligence dashboards back on?
- Skill graph / shareable credentials depth.
- Search relevance, recommendations.

**Nice to decide later**
- Team/enterprise, the public AI Skills Index, tool-provider partnerships, the "coral + slash" brand language from the audit brief (not yet in code).

---

# 15. Final Recommendation

**Are we close?** Closer than the repo's chaos suggests. The hard part — a real Learn→Do→Prove flow, working auth, a green build, and *curated, pipeline-independent launch content* — **already exists.** This is not a "build the MVP" job; it's a **"reveal the MVP that's buried in here"** job.

**Biggest blocker:** not code — it's **coherence + the unknown DB state.** Too many surfaces, and you don't yet know what's live behind them. Resolve both and a credible MVP appears.

**What to do next (in order):** (1) Run Section 6 SQL **and publish the launch catalog** (`POST /api/pipeline/missions/publish`) — without projected rows there is literally no product. (2) Ship the first PR (guard seed routes + env/cron + snapshot). (3) Collapse navigation to the 5-screen spine and empty-state-proof it. (4) Verify progress save end-to-end. (5) Finish the homepage + add email capture + analytics. Then launch free, watch the funnel, and decide on rooms/pipeline from real data.

**What to avoid:** turning the crons + AI pipeline + intelligence dashboards + skill graph + rooms back on "to be impressive." They are the main source of risk, cost, and incoherence, and **none are required to deliver the core promise.** Subtract aggressively; ship the spine; let real usage tell you what to build next.

**Most realistic live MVP path:** **~1.5–2 weeks** to a public, free, single-player **"do one real AI mission and get proof"** product on the existing static launch content — with rooms and the intelligence engine deliberately dormant until the basics earn the right to switch them on.
