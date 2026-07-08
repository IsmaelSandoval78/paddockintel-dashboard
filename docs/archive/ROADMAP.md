# PaddockIntel Dashboard — Build Roadmap

## Phase 0 — Foundation (DO THIS FIRST)
Before writing any feature code:

1. `npx create-next-app@latest . --typescript --tailwind --app --src-dir=false`
2. Install: `@supabase/supabase-js`, `next-intl`, `leaflet` or `mapbox-gl`
3. Setup env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Setup i18n with `next-intl`: locales `en`, `es`, `pt`
5. Setup Tailwind with CSS variables from DESIGN.md in `globals.css`
6. Create `lib/supabase/client.ts` and `lib/supabase/server.ts`

**Success criteria:** `npm run dev` runs, `/en`, `/es`, `/pt` routes work, Supabase connection verified.

---

## Phase 1 — Hub Principal (MVP)

### 1.1 Layout Shell
- Two-column layout: map (60%) + panel (40%)
- Responsive: stacks vertically below 1024px
- Navigation bar: PaddockIntel logo + Circuits / Drivers / Constructors / Compare links + locale switcher

### 1.2 Map Component
- Interactive map centered on world view
- Circuit markers from `circuits` table (lat, lng)
- 2026 circuits: accent red dot
- Historical-only circuits: muted gray dot
- Click handler → triggers panel swap

**Query:**
```sql
SELECT c.id, c.name, c.location, c.country, c.lat, c.lng,
  MAX(r.year) as last_race_year,
  BOOL_OR(r.year = 2026) as is_2026
FROM circuits c
LEFT JOIN races r ON r.circuit_id = c.id
GROUP BY c.id, c.name, c.location, c.country, c.lat, c.lng
```

### 1.3 Default Right Panel — Top 10 Drivers
Current season (2026) standings after latest race.

**Query:**
```sql
SELECT 
  d.forename, d.surname, d.nationality, d.driver_ref,
  ds.points, ds.position, ds.wins,
  COUNT(CASE WHEN r2.position IN (1,2,3) THEN 1 END) as podiums,
  COUNT(r2.id) as races_entered
FROM driver_standings ds
JOIN drivers d ON d.id = ds.driver_id
JOIN races r ON r.id = ds.race_id
LEFT JOIN results r2 ON r2.driver_id = ds.driver_id 
  AND r2.race_id IN (SELECT id FROM races WHERE year = 2026)
WHERE r.year = 2026
  AND ds.race_id = (SELECT MAX(id) FROM races WHERE year = 2026 AND date <= CURRENT_DATE)
ORDER BY ds.position
LIMIT 10
```

Display: position, name, points, podiums, win rate (wins/races_entered as %)

### 1.4 Default Right Panel — Top 5 Constructors
Below the drivers list.

**Query:**
```sql
SELECT 
  c.name, c.constructor_ref,
  cs.points, cs.position, cs.wins
FROM constructor_standings cs
JOIN constructors c ON c.id = cs.constructor_id
JOIN races r ON r.id = cs.race_id
WHERE r.year = 2026
  AND cs.race_id = (SELECT MAX(id) FROM races WHERE year = 2026 AND date <= CURRENT_DATE)
ORDER BY cs.position
LIMIT 5
```

### 1.5 Circuit Info Panel (on map click)
Replaces right panel content with fade transition.
Has X button to return to default state.

**Queries needed:**
```sql
-- Basic info + first/total races
SELECT 
  c.name, c.location, c.country,
  MIN(r.year) as first_race_year,
  COUNT(r.id) as total_races
FROM circuits c
JOIN races r ON r.circuit_id = c.id
WHERE c.id = $circuitId
GROUP BY c.id, c.name, c.location, c.country

-- Last 5 champions at this circuit
SELECT r.year, d.forename, d.surname
FROM results res
JOIN races r ON r.id = res.race_id
JOIN drivers d ON d.id = res.driver_id
WHERE r.circuit_id = $circuitId AND res.position = 1
ORDER BY r.year DESC
LIMIT 5

-- Fastest pit stop ever at this circuit
SELECT ps.duration, ps.milliseconds, con.name as constructor, r.year
FROM pit_stops ps
JOIN races r ON r.id = ps.race_id
JOIN results res ON res.race_id = ps.race_id AND res.driver_id = ps.driver_id
JOIN constructors con ON con.id = res.constructor_id
WHERE r.circuit_id = $circuitId AND ps.milliseconds > 0
ORDER BY ps.milliseconds ASC
LIMIT 1

-- Fastest lap ever at this circuit
SELECT res.fastest_lap_time, d.forename, d.surname, r.year
FROM results res
JOIN races r ON r.id = res.race_id
JOIN drivers d ON d.id = res.driver_id
WHERE r.circuit_id = $circuitId 
  AND res.fastest_lap_time IS NOT NULL
  AND res.fastest_lap_time != '\N'
ORDER BY res.fastest_lap_time ASC
LIMIT 1
```

Display: name, location, first race, total races, last 5 winners, fastest pit, fastest lap.
CTA button: "View full circuit →" links to `/[locale]/circuits/[circuit_ref]`

---

## Phase 2 — Circuits Page

- Same map but showing ALL circuits (2026 + historical)
- Color coding: red = 2026 active, gray = historical only
- Click → inline panel (same pattern as hub)
- "View full circuit" → `/circuits/[circuit_ref]`

### Circuit Detail Page
Full page with all available data:
- Header: circuit name, country, location
- Stats grid: first race, total races, total drivers, total constructors
- Last 10 winners table
- Lap record (fastest lap ever)
- Pit stop record
- Year by year results (paginated)
- Link back to circuits page

---

## Phase 3 — Drivers Page

### List View
Organized by ERA:
- Modern (2014–present): Hybrid era
- Turbo (1977–1988): First turbo era  
- Classic (1950–1976): Naturally aspirated golden era
- (within each era: alphabetical or by championships)

Each driver card: name, nationality flag, years active, championships, race wins.
Click → driver detail page.

### Driver Detail Page
Full stats dashboard:
- Championships, race wins, podiums, pole positions
- Win rate, podium rate
- DNF count and rate
- Fastest laps in career
- Years active, teams raced for
- Career points total
- Best/worst finishing position
- Head-to-head record vs teammates (if data available)

---

## Phase 4 — Constructors Page

Organized by era (same as drivers).
Constructor card: name, nationality, years active, championships, wins.
Detail page: similar stats treatment.

---

## Phase 5 — Comparator

### Driver A vs Driver B
- Search/select two drivers
- Side-by-side stat comparison
- Metrics: wins, podiums, poles, DNFs, win rate, podium rate, championships, fastest laps
- Visual: horizontal bar charts showing relative performance
- Shareable scorecard generation (1:1, 9:16, 16:9)

### Scorecard Export
- Canvas-based generation client-side
- PaddockIntel.com watermark always present
- Download as PNG
- Share buttons: X, copy link

---

## Token Optimization Rules for Claude Code

1. **Read before writing** — always read existing file before modifying
2. **One component per task** — don't rebuild multiple components in one prompt
3. **Query first** — validate Supabase query works before building UI around it
4. **Reuse patterns** — establish panel pattern in Phase 1, reference it everywhere
5. **Types first** — define TypeScript interfaces before components that use them
6. **No full-file rewrites** — surgical edits only, surgical changes principle
