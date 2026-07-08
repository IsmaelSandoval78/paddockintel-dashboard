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
- **`PHASES.md`** — living status log of what's actually shipped vs. pending. Check here before assuming a feature does or doesn't exist.
- **`CLAUDE.md`** / **`AGENTS.md`** — guidelines for AI coding agents working in this repo.
- **`docs/archive/`** — superseded planning docs, kept for historical reference only. Not the active plan.

## Database / migrations

Schema changes **always** go through the Supabase CLI, never pasted directly into the SQL Editor:

```bash
npx supabase migration new nombre_del_cambio
# edit the generated .sql file
npx supabase db push
```

The full baseline schema lives in `supabase/migrations/00000000000000_baseline_schema.sql`. If `npx supabase migration list` ever shows local/remote out of sync, resolve it with `supabase migration repair` — don't just re-run migrations blindly.

## Deploy

Auto-deploys to Vercel on push to `main`.
