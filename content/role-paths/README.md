# Role paths

A role path is a file in this folder. Seeding copies it into `fp_learning_paths`. A path is the whole file. A mission is one module inside it: watch, then do, then check, then reflect.

## File

Export one `RolePathSeed` from a `.ts` file (not `types.ts`).

- `slug` — stable id. The seeder upserts on this.
- `title` — the path name a learner sees.
- `role_function` — which onboarding role this path is for (`generalist`, `content`, `product_marketing`, `demand_gen`, `brand`, `social`, `agency`).
- `missions` — four missions, in order.

## Each mission

- `title`
- `why` — one line
- `level` — `exploring` or `practicing`
- `minutes`
- `practices` — one sentence, in the learner's voice. Example: "Turned a webinar transcript into five LinkedIn posts with Claude."
- `skill_tags` — canonical topic slugs
- `tested_on` — the date you last did this mission yourself (`YYYY-MM-DD`)
- `watch` — `content_id` from the content lake, or a YouTube URL plus `start_seconds` and `end_seconds`. Plus `what_to_look_for`.
- `do` — `tool`, `deliverable`, `steps` (3 to 5), `done_when`
- `check` — 2 or 3 multiple-choice questions. Each has the prompt, the choices, the correct choice, and a one-line why.
- `reflect` — one `prompt`

## Seeding

`npm run seed:role-paths` validates every file and upserts approved role paths. It refuses the whole run if any field still says `TODO`. Finish the copy, then seed again. The command is safe to re-run.
