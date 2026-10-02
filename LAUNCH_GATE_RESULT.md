# Launch Gate Result

**A — Catalog already has published launch missions.**

The launch gate is **CLEARED**. `GET /api/missions/catalog` returns 5 fully-formed missions across all 5 approved lane keys. No publish or generation step is needed. Verified against the app's real configured Supabase project (the app boots from `.env.local`, which points at the correct SkillGap project — not the wrong MCP project).

---

# Evidence

### Catalog endpoint (unauthenticated, HTTP 200)
```
$ curl -s http://localhost:3000/api/missions/catalog | jq '.catalog | length, [.[].mission_lane_key]'
5
[
  "prompt-engineering:research-insight",
  "prompt-engineering:positioning-messaging",
  "claude-code:research-insight",
  "claude-code:positioning-messaging",
  "github-copilot:research-insight"
]
```
- HTTP 200, response time ~1.8s (first hit compiles the route), `error` field absent, `catalog` is an array of 5.
- Each row is a real mission, not a stub. Example (`id: 9bdd2a2e…`): *"Crafting a Prompt Engineering Research Brief for Marketers"* — one `task_type: "do"` item, ChatGPT tool, 3 steps, a full `tool_prompt`, required sections, and 3 explicit success criteria. `view_count: 5`, created 2026-03-21.
- All 5 carry `generation_engine` provenance via `mission_projection` lane keys and were served by `listPublishedLaunchCatalogPaths()` (which filters `generation_engine='mission_projection' AND is_cached=true`). The endpoint returning them is proof those projected rows exist.

### Unauthenticated route checks (middleware correct)
```
/            HTTP 200   renders
/signup      HTTP 200   renders
/login       HTTP 200   renders
/onboard     HTTP 307 → /login?next=%2Fonboard
/missions    HTTP 307 → /login?next=%2Fmissions
```

> Step 2 SQL was **not run** — it is only needed when the catalog is empty (Outcome B/C). We are in Outcome A. (The admin-flag / RLS / brief-count queries remain available if you want them for the record.)

---

# Catalog State

- **Count:** 5
- **Lane keys:** all 5 approved lanes present (prompt-engineering ×2, claude-code ×2, github-copilot ×1)
- **`/missions` renders:** the data layer is confirmed live (HTTP 200, 5 real missions). The page itself is auth-gated (307 → `/login`), so its *rendered* browser state requires a session — see MVP Spine State.

---

# MVP Spine State

Legend: ✅ verified now · 🟩 code-verified (read end-to-end, not run) · ⛔ blocked on a real login session · ⚠️ depends on a provisioned room

| # | Step | State | Notes |
|---|------|-------|-------|
| 1 | `/` homepage | ✅ | HTTP 200 |
| 2 | `/signup` | ✅ | HTTP 200, real OTP form |
| 3 | magic-link OTP callback | ⛔ | I can't receive the email; **you drive this** |
| 4 | onboarding (4 steps) | 🟩⛔ | `app/onboard/page.tsx` → function, fluency, path pick, username. **No LLM.** Sets `fp_profiles.onboarding_completed=true` + `username`. Gate verified (307). |
| 5 | `/missions` renders | 🟩⛔ | Served by static `useLaunchCatalog` → `/api/missions/catalog` (5 missions confirmed). Auth-gated. |
| 6 | open a mission | 🟩⛔ | `/missions/[id]` → `MissionDetailPage` |
| 7 | start mission | 🟩✅ | **Primary action is "Start in Room"** → `prepareMissionRoomEntry` → `/environment/[partyId]`. **Room dependency MET** — all 6 launch rooms exist, persistent + launch-visible (see below). |
| 8 | do/complete the step | 🟩✅ | Mission runs **inside the room** via `RoomMissionOverlay` → `ContentViewer` → `MissionViewer`. Each launch mission is **single-item**. Mission is loaded by `missionId` query param, so any of the 6 rooms can host any of the 5 missions. |
| 9 | `PATCH /api/learn/paths/[id]` writes progress | 🟩 | `useCurriculum.completeItem` PATCHes `{ item_completed, item_state }`. Route upserts `fp_learning_progress` on `(user_id, path_id)`, 401 without session. |
| 10 | `status='completed'` | 🟩 | Single item complete ⇒ `completedCount >= items.length` ⇒ atomic `status='completed'` + `completed_at` (race-guarded). |
| 11 | receipt / proof rendered | 🟩 | On first completion: creates `fp_achievements`, computes `SkillReceipt` via `lib/skills/receiptCalculator` (**pure compute, no LLM**), persists it. |

**LLM-free completion is achievable as you asked.** `completeItem` never sends a `submission`, and the route's `evaluateSubmission` (gpt-4o-mini) only runs `if (body.submission)`. The only way to trigger an LLM call is to type into MissionViewer's textarea and press **Submit**. Using **Skip** (or just advancing) completes the item with zero OpenAI calls. The receipt still renders (it's deterministic).

---

# Blockers

**One true blocker remains.** The room dependency (previously open) is now **confirmed MET**.

1. **Login is magic-link OTP — needs you.** All protected routes correctly redirect to `/login`. I cannot receive the email, so I can't autonomously exercise steps 4–11. (Per your decision: **you drive the browser**; runbook below.) This is the *only* thing standing between here and a fully-proven spine.

**Resolved during verification — room dependency MET (`fp_parties`):**
All **6** launch rooms exist, `persistent = true`, and launch-visible: Content Systems (`waiting`), Research Room, Workflow Studio, Open Studio, Campaign Sprint, Messaging Lab (all `active`). The mission "Start in Room" action will offer a room (`availableRooms` non-empty), `/environment/[id]` loads the mission by its `missionId` param, so any room hosts any mission. One junk row (`dsfasdfsa`, id `f31119ad…`) has a `blueprint_id` and no `launch_room_key`, so the app correctly excludes it — harmless leftover test data (optional cleanup, not a blocker).

No code bugs, no build failures, no broken routes were found in the spine. Auth, progress upsert, completion atomicity, and receipt calculation are all sound on read; catalog and rooms are confirmed present in the real DB.

---

# Next Recommended Action

**Walk the browser spine yourself and confirm "Prove" persists.** Catalog (5 missions) and rooms (6 launch rooms) are confirmed in the real DB; the only unproven link is the live human OTP walk. Do this one thing:

### Browser runbook (you drive; LLM-free)
1. App is running at **http://localhost:3000** (dev server up).
2. `/signup` (or `/login`) → enter your email → open the magic link → land authenticated.
3. Onboarding: function (e.g. Marketing), fluency (e.g. Practicing), pick the recommended path, set a username. (No AI calls.)
4. Land on `/missions` → confirm **5 missions** render.
5. Open one (e.g. the Prompt Engineering research brief) → confirm the brief reads correctly.
6. Click **Start in Room** → you should land in `/environment/[id]` with the mission overlay (a room is guaranteed to be offered).
7. In the overlay, **do NOT type a submission** (that fires gpt-4o-mini). Use **Skip / advance** to complete the single item.
8. Confirm the **completion + skill receipt** screen appears.

### Verify persistence (Supabase dashboard)
```sql
SELECT user_id, path_id, status, items_completed, items_total, completed_at
FROM fp_learning_progress
ORDER BY last_activity_at DESC LIMIT 5;

SELECT user_id, path_id, completed_at, (skill_receipt IS NOT NULL) AS has_receipt
FROM fp_achievements
ORDER BY completed_at DESC LIMIT 5;
```
**Pass = one row with `status='completed'` and `has_receipt = true`.** Report success, or the exact step + any console/network error if it breaks.

### Optional cleanup (not a blocker)
Delete the junk test party so it never leaks into a room list:
```sql
DELETE FROM fp_parties WHERE id = 'f31119ad-6ab9-40fb-b3dc-a668fd133bdb'; -- "dsfasdfsa"
```

### Browser runbook (you drive; LLM-free)
1. App is running at **http://localhost:3000** (dev server is up).
2. Go to `/signup` (or `/login`) → enter your email → open the magic link → land back authenticated.
3. Complete onboarding: pick a function (e.g. Marketing), fluency (e.g. Practicing), a recommended path, set a username. (No AI calls.)
4. You'll land on `/missions` — confirm **5 missions** render.
5. Open one (e.g. the Prompt Engineering research brief). Confirm the brief reads correctly.
6. Click **Start in Room**. Watch where it goes:
   - Lands in `/environment/[id]` (or `/i/[slug]`) with the mission overlay → room exists ✅
   - Bounces to the rooms list with nothing to enter → **room dependency unmet** (run the SQL above).
7. In the room overlay, **do NOT type a submission** (that triggers gpt-4o-mini). Use **Skip / advance** to complete the single item.
8. Confirm the **completion + skill receipt** appears.
9. Verify persistence in the Supabase dashboard:
```sql
SELECT user_id, path_id, status, items_completed, items_total, completed_at
FROM fp_learning_progress
ORDER BY last_activity_at DESC LIMIT 5;

SELECT user_id, path_id, completed_at, (skill_receipt IS NOT NULL) AS has_receipt
FROM fp_achievements
ORDER BY completed_at DESC LIMIT 5;
```
**Pass = one row with `status='completed'` and `has_receipt = true`.** Report where it succeeded or the exact step + any console/network error if it broke.
