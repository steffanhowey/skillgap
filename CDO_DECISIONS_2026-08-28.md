> **SUPERSEDED — October 2, 2026.** This document narrowed SkillGap to an "evidence-backed launch messaging" wedge. That direction is retired. The product is an AI-native learning environment for marketers that builds and adapts each person's learning path. See the Skillgap project's `claude/90-day-5k-mrr-mission.md`. Kept for history only.

# CDO Decisions — Make the Value Obvious

**Date:** 2026-08-28  
**Role:** Chief Design Officer  
**Status:** In force. Extends `CPO_DECISIONS_2026-08-28.md`. Does not reopen product scope.  
**Owner:** Design / product

---

## The design problem

SkillGap already has a usable visual system and two good teaching patterns: the do-task flow in `MissionViewer`, and the labeled step machine in the Message Review lab.

The first session does not use either pattern.

A first-time product marketer cannot answer three questions without thinking:

1. What is this?
2. What do I get?
3. What do I do now?

Marketing sells a live room. Onboarding taxes them with a handle. Missions opens a catalog. The briefing is a memo. The CPO solo player is the right product decision wrapped in leftover room chrome. That is why the product feels like “I don’t know what this is.”

---

## Design thesis

A learning product earns love when the next action is the only obvious thing on the screen, and the value of finishing is visible before the work starts.

SkillGap’s first session is one sentence:

> Do one real marketing mission in a real tool. Leave with work you can use.

Everything else is session two.

---

## The three questions (non-negotiable)

Every shipped screen must answer all three in under five seconds. If a sentence does not help a PMM answer one of them, cut it or hide it.

| Question | User-facing proof |
|----------|-------------------|
| What is this? | One noun: a mission. Not a catalog, room, pulse, or platform. |
| What do I get? | One artifact, named before they start. |
| What do I do now? | One primary CTA. No peer CTA until the work is underway or done. |

---

## The calls

### DD1. First session is a tunnel, not a campus

Until the learner has completed one mission:

- One recommended mission
- One 60-second brief
- One solo step at a time
- Proof at the end

Hide search, filters, browse, launch-path duplicates, and room as a peer path.

### DD2. Promise what the product actually delivers

Lead promise: real mission, real tool, work you can use.

Rooms, community, and market pulse are session-two rewards. They may not lead marketing, onboarding, or the mission rail.

### DD3. Brief once. Then do.

The user may hear the mission story once: framing, artifact, how we’ll know it’s done.

They may not hear it on the marketing page, the onboard card, the detail page, and the do-task briefing. After the 60-second brief, the solo player coaches the current step only.

### DD4. Steal the lab’s teaching pattern, not the lab

Every learning step uses:

- Where you are (`Step 2 of 4 · Build`)
- Why this step (`One coaching line`)
- The work
- One primary action

Watch steps may not use honor-system “Mark Complete” as the only instruction.

### DD5. Room is a footnote until the first artifact exists

After the first completed step, a quiet link is allowed. It may never share visual weight with Start / Continue / Submit.

### DD6. Speak like a marketer, not like the taxonomy

Say mission, not rep.  
Say missions, not launch catalog.  
Say work or proof, not skill receipt, until they have one.  
Say marketing work, not launch domain.

### DD7. Do not rebrand. Finish the learning kit.

Keep forest, shell, Fraunces display, Button, Card, Modal. Add learning patterns on top: progress strip, brief section, light journey framing, shared empty state. Do not invent a second visual language.

### DD8. The CPO solo route stays. The CPO solo *experience* does not.

`/missions/[id]/solo` is correct. The first implementation was a compatibility wrap. Design owns the chrome, coaching, and completion story.

---

## First-session map

```
Marketing  →  Signup  →  Role  →  Fluency  →  Mission pick
                                              ↓
                                    60-second brief
                                              ↓
                              Solo: one step, one action
                                              ↓
                                 Done + honest proof
                                              ↓
                                    Next mission
```

Handle collection is deferred. A generated handle is fine until they care about being found.

---

## What we will not do

- Redesign the logo, palette, or type family
- Expand the Message Review lab as a product surface
- Add coach-mark tours, confetti, or empty “delight”
- Build a new component library before the tunnel works
- Put rooms back in the lead promise

---

## Operating rule

If a screen needs a heading to explain itself, the screen failed. Fix the information architecture before adding copy.
