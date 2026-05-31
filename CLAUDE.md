# PaddockIntel Dashboard — Claude Code Guidelines

## Project Overview
**hub.paddockintel.com** — F1 economic and performance intelligence hub.
Interactive map-driven dashboard with historical data from 1950 to present.
Stack: Next.js 15 + TypeScript + Supabase + Vercel. i18n: ES / EN / PT.

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
│   ├── [locale]/           # ES / EN / PT routing
│   │   ├── page.tsx        # Hub principal (map + panels)
│   │   ├── circuits/       # Página de circuitos
│   │   ├── drivers/        # Página de drivers
│   │   ├── constructors/   # Página de constructores
│   │   └── compare/        # Comparador interactivo
│   └── api/                # Supabase server-side queries
├── components/
│   ├── map/                # Mapa interactivo (circuitos)
│   ├── panels/             # Panel derecho dinámico
│   ├── cards/              # Driver cards, constructor cards
│   ├── scorecards/         # Shareable scorecards
│   └── ui/                 # Primitivos (botones, badges, etc.)
├── lib/
│   ├── supabase/           # Client + server + queries
│   └── i18n/              # Translations ES/EN/PT
├── locales/
│   ├── es.json
│   ├── en.json
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
**qualifying** — via qualifying table
**sprint_results** — sprint race results
**driver_stats** — pre-aggregated driver stats
**constructor_stats** — pre-aggregated constructor stats
**status** — status codes for results (DNF, DSQ, etc.)
**seasons** — season metadata

### Query Patterns

Always use server-side Supabase client in `app/api/` routes.
Use `driver_stats` and `constructor_stats` for aggregated data — avoid heavy joins on every request.
For current season: filter `races.year = 2026`.
For podiums: `results.position IN (1, 2, 3)`.
For fastest pit stop: `MIN(pit_stops.milliseconds)` joined with constructors.
For fastest lap history: `MIN(results.fastest_lap_time)` — note this is text, parse carefully.

---

## Hub Principal Layout

```
┌─────────────────────────────┬──────────────────────┐
│                             │  [default state]      │
│     MAPA INTERACTIVO        │  Top 10 Drivers       │
│     (60% width)             │  ─────────────────    │
│                             │  Top 5 Constructors   │
│     Click circuit →         │  (40% width)          │
│     panel swap (inline)     │                       │
│                             │  [circuit selected]   │
│                             │  Circuit Info Panel   │
│                             │  + X to close         │
└─────────────────────────────┴──────────────────────┘
```

**Panel default data:**
- Top 10 drivers: name, points, podiums, win rate (wins/races)
- Top 5 constructors: name, points, podiums, fastest lap of season (race name), fastest pit stop of season (race name)

**Panel circuit data (on map click):**
- Circuit name, location, country
- First race year
- Total races since 1950
- Last 5 champions (year + driver name)
- Fastest pit stop ever (constructor + time + year)
- Fastest lap ever (driver + time + year)
- Link to full circuit page

---

## Design System
See DESIGN.md for full visual spec.
TailwindCSS only — no inline styles, no CSS modules unless absolutely necessary.
Dark mode first. Use CSS variables defined in globals.css.

---

## i18n Rules
- All user-facing strings go through i18n — never hardcode text
- Locale routing: `/es/`, `/en/`, `/pt/`
- Default locale: `en`
- Translation keys use dot notation: `hub.drivers.title`

---

## Performance Rules
- All Supabase queries are server-side (React Server Components)
- No client-side fetching unless interactive (map clicks, comparator)
- Paginate any list over 20 items
- Images: next/image always, WebP format

---

## Scorecards (Shareable)
- Generated client-side as canvas/PNG
- Always include PaddockIntel.com watermark + logo
- Aspect ratios: 1:1 (IG), 9:16 (Stories/TikTok), 16:9 (X/Twitter)
- Driver comparison: side-by-side stats with brand colors

---

## Do Not
- Do not use any F1 official API (no Ergast, no OpenF1 live)
- Do not add dependencies without asking first
- Do not hardcode any F1 data that exists in Supabase
- Do not use `any` type in TypeScript
- Do not commit .env files
- Do not generate placeholder/lorem ipsum content
