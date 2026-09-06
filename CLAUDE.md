# PaddockIntel Dashboard — Claude Code Guidelines

## Project Overview

**hub.paddockintel.com** — F1 economic and performance intelligence hub.
Interactive map-driven dashboard with historical data from 1950 to present.
Stack: Next.js 16 + TypeScript + Tailwind v4 + Supabase + Vercel + d3-geo (SVG map) + next-intl.
i18n: EN / ES / PT. Default locale: `en`.

---

## Karpathy Principles (always apply)

### 1. Think Before Coding
- State assumptions explicitly before implementing
- If ambiguous, ask — never guess and run
- Present tradeoffs when multiple approaches exist
- Stop and surface confusion rather than hiding it

### 2. Simplicity First
- Minimum code that solves the problem
- No abstractions for single-use code
- No speculative features or "flexibility" not requested
- If 50 lines can do what 200 do, write 50

### 3. Surgical Changes
- Touch only what the task requires
- Do not refactor adjacent code unless asked
- Match existing code style even if you'd do it differently
- If you spot unrelated dead code, mention it — don't delete it

### 4. Goal-Driven Execution
- Define success criteria before starting
- Multi-step tasks: state a plan with verification steps
- Loop until criteria are met, not until it "looks right"

---

## Architecture

```
paddockintel-dashboard/
├── app/
│   ├── [locale]/           # EN / ES / PT routing
│   │   ├── page.tsx        # Hub principal (map + panels)
│   │   ├── circuits/       # Página de circuitos
│   │   ├── drivers/        # Página de drivers
│   │   ├── constructors/   # Página de constructores
│   │   └── compare/        # Comparador interactivo
│   └── api/                # Supabase server-side queries
├── components/
│   ├── map/                # Mapa interactivo SVG con d3-geo (circuitos)
│   ├── panels/             # Panel derecho dinámico
│   ├── cards/              # Driver cards, constructor cards
│   ├── scorecards/         # Shareable scorecards
│   └── ui/                 # Primitivos (botones, badges, etc.)
├── lib/
│   ├── supabase/           # Client + server + queries
│   └── i18n/               # next-intl config
├── locales/
│   ├── en.json
│   ├── es.json
│   └── pt.json
└── public/
    └── circuits/           # Circuit layout images
```

---

## Supabase Schema

All data lives in Supabase. Never use mock data — always query real tables.

### Key Tables

**circuits** — `id, circuit_ref, name, location, country, lat, lng, alt, url`
**drivers** — `id, driver_ref, number, code, forename, surname, dob, nationality, url`
**constructors** — `id, constructor_ref, name, nationality, url`
**races** — `id, year, round, circuit_id, name, date, time, url` + FP/quali/sprint dates
**results** — `id, race_id, driver_id, constructor_id, grid, position, position_text, points, laps, fastest_lap_time, fastest_lap_speed, status_id`
**driver_standings** — `id, race_id, driver_id, points, position, wins`
**constructor_standings** — `id, race_id, constructor_id, points, position, wins`
**pit_stops** — `race_id, driver_id, stop, lap, duration, milliseconds`
**lap_times** — `race_id, driver_id, lap, position, time, milliseconds`
**qualifying** — qualifying results
**sprint_results** — sprint race results
**driver_stats** — pre-aggregated driver stats
**constructor_stats** — pre-aggregated constructor stats
**status** — status codes for results (DNF, DSQ, etc.)
**seasons** — season metadata

### Query Patterns

- Always use server-side Supabase client in `app/api/` routes
- Use `driver_stats` and `constructor_stats` for aggregated data — avoid heavy joins on every request
- For current season: filter `races.year = 2026`
- For podiums: `results.position IN (1, 2, 3)`
- For fastest pit stop: `MIN(pit_stops.milliseconds)` joined with constructors
- For fastest lap history: `MIN(results.fastest_lap_time)` — note this is text, parse carefully

---

## Hub Principal Layout

```
┌─────────────────────────────┬──────────────────────┐
│                             │  [default state]      │
│     MAPA INTERACTIVO        │  01 · Top 10 Drivers  │
│     SVG map (d3-geo)        │  ─────────────────    │
│     (60% width)             │  02 · Top 5 Constructors
│                             │  (40% width)          │
│     Click circuit →         │                       │
│     panel swap fade 150ms   │  [circuit selected]   │
│                             │  Circuit Info Panel   │
│                             │  + X to close         │
└─────────────────────────────┴──────────────────────┘
```

**Panel default data:**
- Top 10 drivers: name, points, podiums, win rate (wins/races)
- Top 5 constructors: name, points, podiums, fastest lap of season, fastest pit stop of season

**Panel circuit data (on map click):**
- Circuit name, location, country, coordinates (JetBrains Mono)
- First race year + total races since 1950
- Last 5 champions (year + driver name)
- Fastest pit stop ever (constructor + time + year)
- Fastest lap ever (driver + time + year)
- Link to full circuit page

---

## Design System

`DESIGN.md` is the single source of truth for all visual tokens (colors, typography, spacing, motion). Do not duplicate values here — they drift out of sync. Read `DESIGN.md` before touching any styling.

**Current system: DESIGN.md v3.0.0 "Vintage Editorial"** — one unified visual language across Hub, Circuits, Drivers, Constructors, Blog, Digest, and Book (no more per-surface "modes"). Kraft-paper substrate, terracotta accent, `--radius-sm`/`--radius-md` (no longer zero-radius). Decided 2026-08-24, not yet applied to `globals.css`. Full design history (Swiss Industrial Print, Data Mode, Story Mode — all superseded) lives in `docs/archive/CONCEPT-V2.md` §13; this file does not restate it.

- Tailwind v4 utility classes only — no inline styles, no CSS modules unless absolutely necessary
- Use CSS variables from `globals.css` — never hardcode hex values that exist as tokens
- Never hardcode spacing in `px` where Tailwind tokens exist
- Tabular numbers always: `font-variant-numeric: tabular-nums` on any stat column

---

## i18n Rules

- All user-facing strings go through `next-intl` — never hardcode text in components
- Locale routing: `/en/`, `/es/`, `/pt/`
- Translation keys use dot notation: `hub.drivers.title`
- Numbers and dates via `useFormatter` from next-intl
- Locale switcher: text only, no dropdown library

---

## Performance Rules

- All Supabase queries are server-side (React Server Components by default)
- No client-side fetching unless interactive (map clicks, comparator, locale switcher)
- Paginate any list over 20 items
- Images: `next/image` always, WebP format
- Map component (`components/map/`): client component (`"use client"`) — d3-geo projections run in the browser

**Mobile strategy (confirmed 2026-08-04, v2 relaunch):** PWA, not a native app, for the Dutch GP launch — `manifest.json` + add-to-homescreen icon + a basic service worker for fast/offline-tolerant loading. Native app is a post-launch decision, revisit only with real traction.

---

## Scorecards (Shareable)

- Generated client-side as canvas/PNG
- Always include paddockintel.com watermark + logo
- Aspect ratios: 1:1 (Instagram), 9:16 (Stories/TikTok), 16:9 (X/Twitter)
- Light background always — never a dark scorecard, matches the live site's light-substrate identity. **Open question, not yet decided:** whether that means the old Blueprint `#F4F4F0` (kept deliberately cold/distinct from the site) or the new kraft-paper `--bg: #EDE3D0` from DESIGN.md v3.0.0 (visual consistency with the live site) — this is the same undecided question DESIGN.md flags under "Motion pieces (Remotion)". Do not resolve it without asking; flag it if you touch scorecard generation before it's decided.

---

## Critique Gate

Before declaring any component, page, or feature done, score these five dimensions.
Minimum to ship: **4 on all five**. If any score < 4, iterate before moving on.

| # | Dimension | Question |
|---|---|---|
| 1 | **Philosophy** | Does it feel like PaddockIntel — editorial, not SaaS? |
| 2 | **Hierarchy** | Can I read the primary info in 3 seconds? |
| 3 | **Execution** | No layout shift, no jank, no hardcoded values? |
| 4 | **Specificity** | Is it unmistakably F1 intel, not generic sports? |
| 5 | **Restraint** | Does every element earn its place? Nothing decorative? |

**SHIP IT** = all five ≥ 4 · **ITERATE** = 1–2 below 4 · **RETHINK** = 3+ below 4

---

## Do Not

- Do not use Next.js 14/15 APIs or patterns — this is Next.js 16, breaking changes apply
- Do not use Tailwind v3 config syntax — this is Tailwind v4
- ~~Do not use any F1 official API (no Ergast, no OpenF1 live)~~ — **superseded 2026-08-04 (v2 relaunch):** OpenF1 (live/historical telemetry) and jolpica-f1 (`api.jolpi.ca/ergast/f1`, Ergast successor) are now approved sources, needed for the Delta Ribbon comparator. Supabase stays the authority layer — precompute/cache external calls there, never call OpenF1/jolpica directly from a request path. See `docs/archive/CONCEPT-V2.md` §3.
- Do not add dependencies without asking first
- Do not hardcode any F1 data that exists in Supabase
- Do not hardcode standings, points, results, or statistics — always query or verify
- Do not use `any` type in TypeScript
- Do not commit `.env` files
- Do not generate placeholder or lorem ipsum content
- Do not invent circuit records, lap times, or historical data — query Supabase
- Do not use inline styles or hardcoded hex values — use CSS variables from globals.css
- Do not reintroduce Leaflet or a 3D globe — the map is a flat SVG using a d3-geo Natural Earth projection
- Do not use `rounded-3xl`, gradients, glassmorphism, or shadows on data surfaces — shape is `--radius-sm`/`--radius-md` only per DESIGN.md v3.0.0 (Vintage Editorial), not zero-radius anymore; illustrated circular containers (`rounded-full`) are the one deliberate exception, not a UI card pattern
- Two-tone pie/donut breakdowns are allowed (max 3 segments) per DESIGN.md v3.0.0 — prefer ranked lists otherwise
## Skills
Before starting any task, read `.claude/skills/paddockintel/SKILL.md` (loaded automatically as the
`paddockintel` skill). DESIGN.md is the source of truth for visual tokens.

Before any content task (article, digest issue, copy), also read the four advisor files in
`docs/advisors/`: `SEO-EXPERT.md`, `DATA-EXPERT.md`, `EEAT-EXPERT.md`, `SPORTS-JOURNALISM-EXPERT.md`.
They are an additional gate on top of `EDITORIAL.md` — they do not replace it.

Separately — before shipping anything touching auth, user data, API tokens/secrets, third-party
content ingestion (experts personalization), dependency upgrades, or infrastructure changes
(Cloudflare, Supabase), read `docs/advisors/CYBERSECURITY-EXPERT.md`. Different trigger than the
four content advisors above — this one gates engineering work, not editorial work.
