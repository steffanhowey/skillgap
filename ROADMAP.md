# SkillGap — Product Roadmap to Launch

**October 2, 2026.** The execution document. It replaces the "Build" sections of `claude/phase3-90-day-plan.md`; the commercial plan (offer, buyers, $500, triggers, scoreboard) stands. It incorporates an adversarial review (18 findings, 10 required changes, all adopted) and uses **Uxcel** as the single product reference for the app shell and the team layer.

## What changed under review

1. **The first paying crew is a company kickoff team**: five named colleagues, placed by their manager, scheduled by Steffan. Anonymity, matching, scheduled starts, waiting rooms and AI crewmate members serve nobody on day 21. They move to the cross-company phase.
2. **Launch scope is the plan's day-14 list, whole, and nothing else.** The draft had 24 launch items (35–45 engineer-days). It now has the nine the plan committed to, plus four the draft forgot: the deploy itself, email deliverability, legal pages, and change-email.
3. **"Aggregate-only" reporting is replaced by Uxcel's boundary**: the manager sees each person's activity (missions completed, tools used, last active, path stage, assignments). The manager never sees the work: reflections, artifacts, quick-check answers, crew chat. This makes "you can see who's actually doing it" true and keeps the learner's work private.
4. **The profile has a specified record**, not a copy audit. See "The profile record."
5. **One price, $49/seat.** No crew premium until a crew has retained. The kickoff is the premium SKU because it includes Steffan's hours.
6. **Four missions at two fluency levels** (Experimenter, Practitioner, ~79% of workers per Section) for the kickoff, each tested in the tool and dated. Not eight across four levels.
7. **Streak = one real mission a week; two freezes earned, not replenished.** A weekly-replenished skip is a 50% bar that never dies.
8. **The live session is in the product, via a drop-in video API in the existing room.** Steffan's call: the rooms already have the timer, sprints, AI host and chat; sending people to Zoom makes it a stranger experience. Daily Prebuilt embedded in `/environment/[id]` is a day of work, not a video build. Daily's free tier is 10,000 participant-minutes a month, then $0.004 a minute (verified Oct 2); ten kickoff teams use ~9,000. The product still owns before (mission, agenda) and after (recap, profile update, next mission); the recap remains the artifact nobody else produces. No recording at launch.
9. **AI crewmates as members are out** until cross-company crews exist. The AI companion stays as a tool inside the Do step, summoned by mention, badged, opt-in. (Cal. Bus. & Prof. Code §17941 safe harbor: disclose.)
10. **One reference, Uxcel**, for shell, learner surfaces and team admin. The 15-product mood board is gone.

## The product, as it ships

**SkillGap is where a marketing team gets AI-native.** Each person gets a path built from their role, fluency and what they do; each week they do one real mission in the AI tools they already use; their skill profile records what they've practiced; the manager sees who's doing the work and never sees the work itself. A company starts with a four-week kickoff Steffan runs; after that, seats. Individuals can join on their own. Crews of strangers come later, once there are strangers.

Language rules: "practiced," never "proven." "Checked against your own criteria," never "verified." Nothing on the front door says "AI builds your path" or "AI coaches you."

## Uxcel → SkillGap: the shell

Their surface, what it becomes here, and what we drop. Study each at full resolution on Mobbin before building; match layout, density and hierarchy, then apply the SkillGap palette and type (forest, shell, Fraunces display, DM Sans body).

| Uxcel | SkillGap | Notes |
|---|---|---|
| Landing: "Learn UX design… in just 5 minutes a day" + an interactive question before signup | Landing: headline says what it is and who it's for in one sentence; one live fluency-check question before signup | Their "try before you sign up" is the pattern |
| Onboarding: progress bar, one question per screen, role dropdown, daily goal, "Skip for now / Continue, or press Enter" | Role → Fluency → "What you do most" (pick 3) → first path | Username step removed; handle generated |
| Home: "Continue learning" card, bulletin board, right rail with Getting-started checklist, Individual/Team toggle, streak with "Savers" | Home: this week's mission card (one Start), right rail with Getting-started checklist, team card, weekly streak with freezes | Their checklist is the first-session tunnel |
| Career Paths (29 units, certification, Enroll → confirm) | Role paths ("the AI-native content marketer"), 4–8 missions, credential at end, Start → confirm | Public, indexable, shareable |
| Courses → Levels → Lessons → Level Test; "complete the first level of every course free" | Paths → Missions; first mission of every path free; paid after | Boot.dev gating, Uxcel's banner copy |
| Lesson: text + visual + References + Key skills + "Complete the lesson quiz" | Mission: Watch (content-lake embed) → Do (in the real tool) → Check → Reflect | Do is ours; there is no Uxcel analog |
| Quiz: progress bar, instant Correct/Incorrect, "View theory," "11 in a row" | Check: 2–3 questions, instant result, "See why," + self-check ("Did you ship it?") | Reflect is 2 lines, private |
| Design Briefs (practical project briefs) | Missions are briefs with a tool and a deliverable | Closest Uxcel analog to Do |
| Skill Graph (radar, score, reliability, peer rank) | Skill profile: practice log + "What you've practiced" statements. No radar. No peer rank | See "The profile record" |
| Certifications, Share (LinkedIn/X/link) | Credential page per completed path, share prompt at completion | Accredible: prompt at earning |
| Teams: Getting Started checklist ("invite members," "send your first assignment") | Team: same checklist | Manager's first session has a tunnel too |
| Teams: Dashboard (hours, chart, skill graph, assignments, completions) | Team home: active this week, missions completed, next session, assignments | No chart at n≤10; counts and names |
| Teams: Assignments (table: assignees, due, status, progress; Add Assignment modal with tabs) | Assign a path or mission to one person or everyone, with a due date | Week 5+ |
| Teams: Reporting (per-member card: counts + assignments; filters Late/Assigned) | Per-person: missions completed, tools, last active, path stage, assignments | Never the work |
| Teams: Members (email, name, role, Active/Invited, joined), Invite member | Same, plus Resend invite | Pending invites with resend |
| Leagues, Arcade, Leaderboards, Salary Explorer, Job Board, Screening | Dropped | No population; not the job |

## The profile record

What gets stored when a mission is completed, and who sees what. This is the differentiator, so it is specified, not described.

| Field | Stored | Learner sees | Manager sees | Public credential shows |
|---|---|---|---|---|
| Mission, path, skill tags | yes | yes | yes | yes |
| Tool used (picked from a list) | yes | yes | yes | yes |
| Completed at; time spent | yes | yes | yes (date only) | date only |
| Self-check ("Did you ship it?" yes/no/partly) | yes | yes | no | no |
| Quick-check score | yes | yes | no | no |
| Artifact pointer (link or upload; optional) | yes | yes | no | no |
| Reflection (2 lines) | yes | yes | no | no |
| Derived "What you've practiced" statements | computed from mission metadata, never from AI judgment | yes | yes | yes |

Frequency and recency are shown as a practice calendar (Babbel/Uxcel pattern). The learner can share their full profile with their manager with one toggle; the default is the activity view above. The manager who asks "can I see what she actually made" gets a scripted answer: ask her to share it; the product won't.

## Flows, final

L = days 1–14, before the first kickoff. S = days 15–60, built when a paying team asks, in the order listed. Q1 = after $5K or after ten teams, whichever first.

### L — Launch (fourteen days, in this order)

| Day | Flow | Work | Done when |
|---|---|---|---|
| 1 | G0 Deploy | Commit the 119 files. Vercel Pro. Production env. skillgap.ai DNS. Delete synthetic cron. Hide goals/tasks/commitments/notes/projects/labs/GitHub/rooms from nav. | A stranger can load skillgap.ai and sign up |
| 1–2 | B1 Login + deliverability | Resend; SPF/DKIM/DMARC on the sending domain; magic link lands in Gmail, Outlook, iCloud inboxes; change-email flow | Three test mailboxes receive the link in the inbox |
| 2 | A5 Pricing + B3 Pay | Stripe Checkout (individual $49/mo, founding annual $468), Payment Link for the $1,500 kickoff, webhook → plan state, Stripe customer portal | A test card produces a paid profile |
| 2 | Legal | Terms, privacy, refund policy pages; cookie line; a one-sentence data statement on the Do step ("Your work stays yours; we never grade it; delete on request") | Linked from footer and checkout |
| 3–4 | B1 Onboarding | Role → Fluency → What you do most → first path. Remove username. Match Uxcel's one-question-per-screen. | A new user reaches a path in under 90 seconds |
| 3–5 | B2 First path | Generator proposes; Steffan approves in the existing review queue; "your path, and why" screen. Free users get a hand-finished role path, no generation, no queue. | Paying user: path within 24h. Free user: instant |
| 5–8 | C2 Mission loop | Watch (embed) → Do (tool, deliverable, companion opt-in) → Check (2–3 Qs, instant result, self-check) → Reflect (2 lines) → done → profile record written → next mission from profile | One mission completes end to end and the profile shows it |
| 6–8 | G3 Missions | Four missions, two levels, for the small-team marketer; each tested in the tool, dated | Steffan completed each in the tool this week |
| 8–9 | C4 Profile | Practice log + "What you've practiced" + practice calendar; share-with-manager toggle | Matches the record table above |
| 9–10 | E1/E2 Team | Invite by email/link (pending, resend); team home (active, completed, next session); per-person activity view | A manager invites five people and sees them |
| 10–11 | C1 Home + C5 rhythm | This week's mission card; weekly streak, two earned freezes; Friday email; Monday manager digest | Emails send from a cron |
| 11–12 | A4 Credential | Credential page per completed path; share prompt at completion; language audit | Shareable, OG image renders |
| 12–13 | A1/A2 Front door | Landing copy for the product as sold; one live fluency question; three hand-finished public role paths with "start this path" | A stranger understands it in one headline |
| 13 | G5 Scoreboard | One query: CURR, teams, seats, MRR, missions/week. PostHog events. | The Friday row fills itself |
| 14 | D3 Video in the room | Daily Prebuilt embedded in the existing room page; room's timer, AI host and chat stay; the local `getUserMedia` camera and screen-share code are replaced, not kept alongside | Five people on one call in the room, from a Daily free-tier account; agenda visible; 45 minutes uninterrupted |

Sold by hand during L, not built: crew placement (a calendar invite), the session agenda (a page), moderation (Steffan is in every session), Pulse (hand-written from the signals feed, sent via Resend broadcast or beehiiv).

### S — When a paying team asks (days 15–60), in this order

1. E3 Billing management via Stripe portal (add/remove seats, invoices, cancel, pause).
2. D2 Crew home for a kickoff team: the existing room relabeled; this week's shared mission; next session time with one Join button; agenda before, recap after. **The recap**: AI host drafts from the mission completions and the lead's notes; lead edits; posted to the crew.
3. E-assign: manager assigns a path or mission with a due date (Uxcel Assignments).
4. C3 Path view with "why this next"; path regeneration on role change.
5. C6 Next path after completion, from profile + team context.
6. F2 Cancel/pause/win-back; F3 lapsed-learner email.
7. F4 Export and delete (delete-on-request by hand from day 1).
8. D7 End of kickoff: "continue as a team" screen → seats.
9. Companion in Do: badged, @-summoned, opt-in, with the disclosure line.
10. G2 Crew ops page: teams, members, attendance, floor alerts (spreadsheet until here).

### Q1 — After ten teams or $5K

Cross-company crews (identity as role, opt-in reveal, text-first; Zoom only for named crews). Scheduled starts with a human floor of three and a hard rule: no crew within 14 days → solo mode plus a credit. Matching by function × fluency × availability × time zone, which is decoration until there are fifty people to match. Alumni leads. L&D pilot kit (SOW, aggregate PDF report, privacy one-pager, security answers). Pulse automation from signals. AI crewmate members, reconsidered only if cross-company crews fail to fill.

## Decided edge cases (one paragraph each, no rows)

**Time zones.** Kickoff teams share one; it's set at purchase. Cross-company crews (Q1) match on zone before anything else.
**A missed session.** It runs if two humans show. No recording at launch; the recap is the record. Miss two in a row and the lead messages you directly.
**A toxic member.** In a company team, the manager removes them; in a cross-company crew (Q1), the lead removes them and the crew continues if it's at or above three, else it merges with the next starting crew. Report button at Q1; before that, the lead is in the room.
**The manager who wants to see one person's work.** Scripted: "Ask her to share it. The product shows you what she practiced, not what she made." Written into the team home and the kickoff deck.
**The learner who finishes everything.** Before S5 ships: Steffan hand-assigns the next path within a day. After: the profile proposes it.
**Mobile.** Missions are desktop (they happen in desktop AI tools). Emails, the team home, the profile and the crew chat must read on a phone. Nothing else is promised.
**Accessibility.** Keyboard-complete onboarding and mission loop; contrast at AA on the palette; captions where the content lake embed has them. No claim beyond that.
**Confidential work.** Never graded, never shown to a manager, deleted on request, stated in one sentence on the Do step. Agencies bringing client work are told this on the kickoff call.
**Refunds.** Kickoff: full refund if cancelled before session two; prorated after. Seats: monthly, cancel anytime, no refund of a started month. Annual: 30 days.

## World-class, defined

Not "beautiful." Measured against Uxcel on five surfaces, each with a tell that means it failed.

| Surface | Bar | Fails if |
|---|---|---|
| First 90 seconds | Uxcel onboarding: one question per screen, keyboard-first, a path at the end | More than four screens; any screen needs a heading to explain itself |
| Home | Uxcel home: one Continue card, one checklist, one streak | A dashboard; KPI tiles; more than one primary button |
| Mission | Uxcel lesson + quiz: instant feedback, "see why," one action | A "Mark complete" with nothing checked; a wall of instructions above the work |
| Profile | Codecademy's "What you've learned to do" inside Uxcel's layout | A radar chart; a score; the word "proven" |
| Team | Uxcel Reporting: per-person cards, counts, assignments | A chart at n=5; status pills; anything the manager can't act on |

Design-system constraints from the repo stand (`lib/palette.ts`, `components/ui/`, no hardcoded colors, sparing monospace).

## Decisions made (Oct 2)

1. **Sessions in the product** via Daily Prebuilt in the existing room. Not Zoom, not Meet. Day 14 of the build.
2. **Pulse on Resend broadcasts.** One vendor for magic links, product email and the newsletter.
3. **Founding annual at $468** ($39/month effective). Holds price; the first hundred lock it.

## Today (Friday, October 2)

1. Commit the 119 files. Push.
2. Create the Vercel project; set env; first deploy to a preview URL.
3. Buy nothing yet except what step 2 needs.
4. Write the kickoff offer in one paragraph and send it to the first five names on the list: Blue North portfolio marketing leads via Dave, two Let's Imagine/Inflow contacts, two agency owners.
5. Open the four mission briefs as empty docs: title, tool, deliverable, level. Fill one.

Monday is day 4. By Friday the 9th (day 7), the gate: deployed, Stripe live, ten conversations held, or nothing else happens.
