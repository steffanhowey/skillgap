# Deploy checklist — Day 1 (October 2, 2026)

`npm run build` passed locally on Node v24.18.0 (Next.js 16.1.6). Names only. Values stay in `.env.local` and the Vercel dashboard.

## Environment variables

Set these on the Vercel project for Production (and Preview, if you want preview deploys to boot).

**Copy from `.env.local`:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (in `.env.local`; the OpenAI SDK reads it from `new OpenAI()` with no `process.env` line)
- `YOUTUBE_API_KEY`
- `ADMIN_SECRET`
- `LEGACY_LEARN_DISCOVERY_ENABLED`

**Not in `.env.local`. Set it or the crons 401:**

- `CRON_SECRET`

**Read by the app. Set when that feature should work. Omit to leave the feature off or on its fallback:**

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NEXT_PUBLIC_SITE_URL` (use `https://skillgap.ai` once DNS is live; share links fall back to `NEXT_PUBLIC_APP_URL`, then `VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL`)
- `NEXT_PUBLIC_APP_URL`
- `BREAK_CURATOR_ENABLED`
- `SYNTHETICS_ENABLED`
- `MESSAGE_REVIEW_LAB_ALLOWLIST`
- `TRACK_F_ALLOWLIST`

**Do not set.** Vercel injects `NODE_ENV`, `VERCEL_URL`, and `VERCEL_PROJECT_PRODUCTION_URL`. `RUN_MESSAGE_REVIEW_LIVE` and `MESSAGE_REVIEW_FIXTURE_IDS` are test-only.

In Supabase Auth, add the production URL and `/callback` to the redirect allow list before a stranger can finish signup.

## Vercel project settings

- Plan: **Pro** (the remaining crons include sub-daily schedules).
- Framework preset: **Next.js**.
- Node.js version: **22.x**. Next.js 16.1.6 requires Node.js 20.9 or newer. This repo does not set `engines`. The local build that passed used Node v24.18.0; 22.x is the LTS to select. Use 24.x if 22.x is not in the selector.
- Root directory, build command (`npm run build` / `next build`), and output directory: leave the Next.js defaults.

## Crons still in `vercel.json`

`/api/synthetics/tick` is removed. That route returns 410.

| Path | Schedule |
|---|---|
| `/api/backgrounds/rotate` | `0 6 * * *` |
| `/api/pipeline/run` | `0 */3 * * *` |
| `/api/topics/cluster` | `0 * * * *` |
| `/api/signals/collect` | `*/15 * * * *` |
| `/api/breaks/scaffold` | `0 4,16 * * *` |
| `/api/breaks/discover-hot` | `15 */2 * * *` |
| `/api/rooms/auto-generate` | `0 */4 * * *` |
| `/api/rooms/lifecycle` | `0 5 * * *` |
| `/api/analytics/aggregate` | `0 2 * * *` |
| `/api/analytics/calibrate` | `0 3 * * 0` |
| `/api/learn/ingest-articles` | `0 */6 * * *` |
| `/api/intelligence/practitioner-aggregate` | `0 3 * * *` |
| `/api/intelligence/skill-heat` | `30 3 * * *` |
| `/api/intelligence/synthesize` | `0 6 * * 1` |
| `/api/intelligence/generate-index` | `0 7 * * 1` |
| `/api/intelligence/cleanup` | `0 4 * * 0` |

## DNS — skillgap.ai off Namecheap parking

Add `skillgap.ai` and `www.skillgap.ai` to the Vercel project first. The domain card shows the A and CNAME values for this project. Use those if they differ from the general-purpose pair below.

In Namecheap → Domain List → skillgap.ai → Advanced DNS:

1. Delete the parking records: URL Redirect, and any A, AAAA, or CNAME on `@` or `www` that points at Namecheap parking.
2. Add the records. Leave nameservers on Namecheap BasicDNS so any existing mail records stay.

| Type | Host | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Newer projects sometimes get a different anycast address (for example `216.198.79.1`) and a project CNAME (for example `xxxx.vercel-dns-017.com`). The domain card is the value to enter. Redirect `www` to the apex after both show as valid.
