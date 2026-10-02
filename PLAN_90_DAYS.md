# SkillGap — The 90-Day Plan

**October 2 → December 30, 2026.** One plan. Built on `claude/90-day-5k-mrr-mission.md` (product definition), `claude/phase1-codebase-inventory.md` (what exists), and `claude/phase2-learning-environment-market.md` (where it sits, with sources).

## The product, as sold

**SkillGap is where a marketing team gets AI-native.** Each person gets a learning path built from their role, fluency, and what they actually do, made of weekly missions done in the AI tools they already use. Their skill profile updates from what they've practiced. The manager sees the whole team's profiles without a sales call.

What a buyer hears: *"Your team, fluent in AI, one real mission a week, and you can see who's actually doing it."*

What a buyer never hears: "AI builds your learning path," "AI coaches you," "AI-powered." Those are ChatGPT features now. We sell the profile, the practice, and the habit.

## The offer

One product, three ways in.

| | Price | What it is | Who |
|---|---|---|---|
| **Team Kickoff** (the opening) | **$1,500 flat**, four weeks, up to 5 seats | Steffan sets each person's path, runs one 45-minute live session a week in a SkillGap room, the manager gets the team profile view from day one. Seats continue at $49/seat/month after week four. | The first ten teams |
| **Team seats** (the destination) | **$49/seat/month**, 3-seat minimum, monthly, cancel anytime | Self-serve. Manager invites the team; the third seat unlocks the team view. $468/seat/year annual. | Every team after the first ten |
| **Individual** (the door) | **$49/month**, or **$348/year founding** (first 100, rate locked) | One marketer, own path, own profile, credential page. | Stipend-reimbursed marketers who find us through Pulse |

**Founding teams:** the first ten teams keep $49/seat for life and are listed on the site with their logo. The eleventh team should want to be on that list.

**What counts toward $5K MRR:** seats and individual subscriptions. Kickoff cash does not. The scoreboard tracks both so the cash month and the recurring month are never confused.

## Who the first ten teams are

Ranked by how warm they are, not how big.

1. **Blue North / Sparkhaus portfolio companies.** Dave Knox's network. Seed-stage companies with 2–5 person marketing teams and a founder who owns "AI for marketing" (53% of sub-$1M firms, per MAII). One intro email from Dave to the portfolio's marketing leads is the highest-leverage ask in the plan.
2. **Let's Imagine and Inflow clients and contacts.** Companies Steffan has already done creative work for. They know his taste; the ask is "let me make your marketing team AI-native."
3. **Small marketing agencies (5–25 people).** Steffan's own world. Agencies have to be AI-native to survive the Superside/Awesomic pressure and have the clearest reason to show clients a team profile. They also churn least on a team plan because the whole shop uses it.
4. **Cincinnati / NKY startups** outside the Blue North portfolio: Cintrifuse, Brandery alumni, Main Street Ventures companies. Local, reachable in person, reference-able to each other.
5. **Marketing leads in Exit Five, PMA, and marketing Slacks** who react to a public role path or a Pulse issue. Coldest; last.

**Conversations needed:** 30–50 to close 10 at a 20–33% rate. Track every one.

## Three 30-day blocks

### Days 1–30 — Ship the loop, sell the first three kickoffs

**Targets by day 30:** deployed at skillgap.ai; 3 kickoffs sold ($4,500 cash); first kickoff running; Pulse issue #3 sent; 15+ conversations held; MRR $0–$245 (first individual subs and any early seat conversions).

**Build (days 1–14, then stop):**
1. Commit the 119 uncommitted files. The Aug 28 state is the baseline.
2. Deploy to Vercel Pro, point skillgap.ai at it. Delete the synthetic-users cron. Hide goals, tasks, commitments, notes, projects, labs, GitHub from nav. Keep rooms reachable only from inside a mission.
3. Stripe: a Payment Link for the kickoff; Checkout for seats and individual; a webhook that sets `fp_profiles` plan state. Resend for magic links, the Friday email, and the manager digest. PostHog free tier.
4. **The first-session loop, for Marketing, end to end:** onboarding (function, fluency, "what you do most," three picks; username step removed, handle generated) → generator proposes a path → Steffan approves it in the existing review queue (draft → approved; never auto-published) → first mission in the solo player → skill profile updates → next mission recommended from the profile. One path type: workflow-specific. The other two stay off.
5. **Missions:** retire the five generic launch missions. Write eight real ones for small-team marketers across the four fluency levels, using the content lake for Watch and the learner's own work for Do. Check = quick-check and reflection. The AI review of a submission stays off by default.
6. **Team view:** invite seats; manager sees each person's profile and this week's mission status. One page. No charts.
7. **Weekly habit:** the week's mission as the one thing on the home screen; a weekly streak with one skip; Friday email ("this week, next week"); Monday manager digest. These are the only two measured retention mechanics in the category, so they ship in week two, not later.
8. **Credential page** per completed path, branded, with the share prompt fired at completion.

**Sell (day 1 onward, overlapping the build):** the first kickoffs are sold on a conversation and a Payment Link before the deploy is done. The first team starts in week three on whatever is live. Steffan is the onboarding; the product catches up.

**Distribute:** Pulse issue #1 goes out day 7, from the signals feed, hand-curated, 300 words, one "do this this week." Three public role paths (small-team generalist, content marketer, agency account lead) published by day 21 and posted in Exit Five and PMA.

### Days 31–60 — Convert the first kickoffs, sell the next four

**Targets by day 60:** 7 kickoffs sold cumulative; first 3 kickoffs converted to seats at ≥60% of seats retained; MRR $1,500–$2,500; CURR ≥ 60%; Pulse at 300–800 subscribers; 35+ conversations held.

**Build only what a paying team asked for.** Expected asks, in likely order: a second path type (general skill, function-adapted) once a person finishes their first path; path regeneration when someone changes role; a manager export. Nothing else.

**The retention question gets answered here.** Day 45 is the first kickoff's conversion point. If fewer than 40% of seats continue, selling stops for a week and the week-2-to-4 experience gets fixed with those teams on the phone. If 60%+ continue, the kickoff is the engine and the plan accelerates.

**Founding teams** get their logo on the site the day they convert.

### Days 61–90 — Ten teams, self-serve seats open

**Targets by day 90:** 10 teams on seats; MRR $5,000 or a clear path (e.g., $3,500 MRR with three kickoffs converting in January); team seats purchasable self-serve without a conversation; Pulse at 800–1,500; week-over-week retention published internally as the one number that matters.

**Build:** self-serve team checkout and invite flow (the kickoff becomes an optional add-on, not the only door). The founding individual annual closes at 100 or December 30, whichever first.

**Sell:** second-order referrals from the first ten (each founding team asked for one intro, not a referral program). Agencies asked to bring one client team.

## The $500

| Line | Amount |
|---|---|
| Vercel Pro, 3 months | $60 |
| Stripe fees on ~$15K cash through the quarter | ~$150 (budgeted; scales with revenue) |
| OpenAI API for path generation and content scoring | ~$50 |
| Domain / DNS / email domain verification | ~$20 |
| Newsletter platform | $0 (Resend from the product, or beehiiv free to 2,500) |
| Analytics | $0 (PostHog free) |
| Reserve for one unexpected thing | $220 |
| **Ads** | **$0** |

## What gets built, in one list

Deploy. Stripe. Resend. PostHog. First-session loop for one function. Eight missions. Team view. Weekly streak and two emails. Credential page. Then only what a paying team asks for. Nothing on the intelligence engine, rooms, content pipeline, synthetic users, the lab, or the recommendation loop beyond "next mission from the profile."

## Kill and pivot triggers

| Date | Trigger | Action |
|---|---|---|
| Day 7 | Not deployed, Stripe not live, or fewer than 10 conversations held | Nothing else happens until all three are true |
| Day 14 | No kickoff sold | Re-examine the segment, not the product: switch the first list (e.g., from portfolio companies to agencies), run 10 more conversations by day 21 |
| Day 21 | Still no kickoff sold | Price test: $750 for a two-week kickoff with the same conversion to seats. One more week |
| Day 30 | Fewer than 2 kickoffs sold | The buyer is wrong, not the price. Stop outbound to teams for one week; talk to the 15+ people who said no and write down the one reason that repeats |
| Day 45 | First kickoff converts <40% of seats | Stop selling. Fix weeks 2–4 with the first teams. Resume when a team says they'd be upset if it disappeared |
| Day 60 | MRR <$1,000 and fewer than 4 teams | The 90-day number will miss. Keep the plan, cut the target, and say so. Do not change the product |
| Day 90 | MRR <$5,000 | Read the retention number before the revenue number. $3K MRR with 70% retention is a business; $5K with 30% is not |

## The weekly scoreboard

One row per week, every Friday:

| Teams paying | Seats paying | MRR | Cash collected | Kickoffs in flight | Conversations held | Missions completed | CURR (week-over-week retention of people who did a mission last week) | Pulse subscribers |

CURR is the number. Duolingo found it had five times the impact of any other metric; nobody in this category publishes it. By day 90, SkillGap will have it.

## What this plan does not do

It does not rebrand. It does not restart the intelligence engine. It does not make rooms the pitch. It does not grade anyone's confidential work. It does not write another PRD. It does not spend on ads against incumbents spending a third of revenue on marketing. And it does not let the founder build the recommendation loop instead of having the next conversation, which is the single most likely way this fails.

## The honest odds

Per the Phase 2 report: roughly one in ten for $5K truly recurring by December 30; roughly one in four for a $5K cash month inside the window; better than even for first revenue inside 30 days and five to ten teams whose managers have looked at a practiced profile and either paid for a second month or said why not. That last outcome is the one no competitor has and no research can supply. The plan is built to get it even where the headline number slips.
