# PaddockIntel Dashboard

**hub.paddockintel.com** — F1 economic and performance intelligence hub. Interactive, editorial platform covering historical F1 data (1950–present) across four surfaces: Hub (stats/map), Blog, Digest (newsletter), and Book.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 · Supabase (Postgres + Ergast dataset) · Cloudflare Workers (OpenNext) · next-intl (EN/ES/PT)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll need a `.env.local` with Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and a service role key for server routes) — see `.env.example` if present, or ask for the values, they are **not** in git.

## Key docs — read these before making changes

- **`DESIGN.md`** — the single source of truth for visual tokens (color, type, spacing, motion). Never hardcode a value that contradicts this file.
- **`PRODUCT.md`** — brand voice, anti-references, design principles.
- **`EDITORIAL.md`** — source of truth for voice/structure/process on any article, digest issue, or newsletter copy.
- **`CLAUDE.md`** / **`AGENTS.md`** — guidelines for AI coding agents working in this repo.
- **`docs/archive/`** — superseded planning/spec docs (including the old `PHASES.md` status log and the shipped `RECORDS-HUB-SPEC*.md` specs), kept for historical reference only. Not the active plan.

## Database / migrations

This project has **no linked Supabase CLI/DB URL** — schema changes are written as
`.sql` files under `supabase/migrations/` (for the record and for future CLI linking)
but applied by hand in the Supabase Dashboard SQL Editor, one file per change. Write
the migration file first, then paste its contents into the SQL Editor and run it —
don't skip the file (it's the only record of what changed and why).

## Deploy

Production runs on **Cloudflare Workers** (OpenNext adapter) — `hub.paddockintel.com`,
`paddockintel.com`, and `www.paddockintel.com` cut over 2026-09-09/10 and have been
stable since (see `docs/CLOUDFLARE-MIGRATION.md`). Pushing to `main` triggers
`.github/workflows/deploy-cloudflare.yml`, which runs `opennextjs-cloudflare deploy
--rclone` — it skips docs/articles/digest-only pushes (`paths-ignore`) since those
don't touch the Worker's code.

**Vercel is not decorative — don't disconnect it.** It still auto-deploys on push and
runs the daily digest cron (`vercel.json` → `/api/digest/send`), in parallel with an
equivalent cron trigger on the Cloudflare Worker (`wrangler.jsonc`). Both are
idempotent (guarded by `sent_at IS NULL`), so having both running doesn't double-send
— but removing Vercel without replacing that cron path first would break the digest.
