# PaddockIntel Dashboard

**hub.paddockintel.com** — F1 economic and performance intelligence hub. Interactive, editorial platform covering historical F1 data (1950–present) across four surfaces: Hub (stats/map), Blog, Digest (newsletter), and Book.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 · Supabase (Postgres + Ergast dataset) · Vercel · next-intl (EN/ES/PT)

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

Currently auto-deploys to **Vercel** on push to `main`. A migration to Cloudflare
Workers (OpenNext adapter) is decided and technically ready (see
`docs/CLOUDFLARE-MIGRATION.md`) but the production domain has **not** cut over yet —
confirm current status in `docs/ROADMAP-SEMANA.md` before assuming either platform.
