# Home redesign — "Telemetry at Dusk" (handoff)

Approved by Ismael on 2026-10-11 in a Claude design session. Scope: **the home page only**, on branch
`v2-relanzamiento`, reviewed on a Vercel preview before anything reaches `main`.

## Files in this folder
- `reference/home-reference.html` — static visual reference exported from the approved design canvas.
  Open it in a browser and resize: it is the source of truth for layout, spacing and responsive behaviour.
  It is NOT production code: every number in it must come from real data in production (see "Data").
- `reference/home-desktop.png`, `home-tablet.png`, `home-mobile.png` — full-page screenshots at 1440, 820 and 390 px.
- `data/singapore-2026-ver-pole-speed.json` — 140 speed samples (km/h) along Verstappen's Singapore 2026 pole lap
  (1:31.373), evenly spaced by distance, from PaddockIntel's own F1 live-timing recording. Drives the hero "terrain".
- `DECISION-2026-10-11-home-dusk.md` — decision record to add to `docs/` (this look contradicts PRODUCT.md as written).

## The look in one line
A pit-wall telemetry screen at sunset: graphite ground, warm sunset light, glowing data lines, and the lap itself
drawn as a mountain range.

## Tokens (scope them to the home route, e.g. a `.theme-dusk` wrapper — do NOT change the global theme)
| Token | Value | Use |
|---|---|---|
| ground | `#0D0E12` | page background |
| panel | `#15171D` | cards |
| line | `#262A33` | borders, gauge tracks, dividers (header border `#1E2129`) |
| ink | `#EEF0F3` | primary text |
| ink-2 | `#C9CDD6` | secondary text |
| muted | `#A3A9B6` | labels, captions (≥4.5:1 on panel) |
| warm | `#F07A45` | brand accent: logo dot, gauge arcs, terrain ridge line (single tweakable accent) |
| sunset | `#F2A35E` | kickers, links on dark, hero glow |
| ice | `#8FD3FF` | cool accent, "next race" module only |
| hero sky | `linear-gradient(180deg,#120F17 0%,#2B1626 34%,#6B2A33 62%,#C1502E 84%,#F2A35E 100%)` | hero background (#C1502E = existing terracotta) |
| newsletter band | `linear-gradient(120deg,#2B1626 0%,#5A2534 55%,#A8442E 100%)` | |
| radius | cards 18px, hero 24px, buttons/pills 999px | |
| fonts | Archivo Black (display), JetBrains Mono (data/labels), Instrument Sans (UI/body on this page) | |

**Rule: team colours are data, never decoration.** Team colours appear only in data (standings bars, the duel lines).
Brand accents (warm, sunset, ice) were chosen to match no team.

## Sections (top to bottom) and their data
1. **Header** — logo `PADDOCK·INTEL` (dot in warm), pill nav: Home (active), Feed, Weekly Digest, Voices, Glossary, Hub. Pills wrap on phones.
2. **Hero ("terrain")** — kicker (race · session · date), featured article title + dek + CTA, the key number
   (e.g. `+7.335s`, "winning margin over Leclerc"), and at the bottom the **pole-lap speed trace drawn as three ridges**:
   back ridge = trace smoothed ±10 samples at 62% height, mid = ±4 samples at 82%, front = raw trace with a glowing
   warm polyline. Every peak is a straight, every valley a corner. Caption states the source.
   Data: featured article (existing magazine-home query); key number + speed trace from a per-race highlights source (see below).
3. **Race in numbers** — three radial gauges (270° arc, warm, glow): top speed on the pole lap (307 km/h),
   laps led by the winner (62/62), pole-to-win record at the venue (12/17 in Singapore since 2008). Auto-fit grid, 1 column on phones.
4. **Pole duel** — "Pole decided by 0.054s": cumulative gap after each official sector, two mirrored lines in team colours
   (VER `#3671C6`, LEC `#E8002D`) crossing zero; annotation at the sector where the lead flips ("LEC +0.107 AHEAD").
   Official sector deltas (LEC − VER): S1 +0.023, S2 −0.130, S3 +0.161 → cumulative 0, +0.023, −0.107, +0.054.
5. **Drivers after <race>** — top 5 with team-colour glowing bars + leader margin chip ("ANTONELLI +102"). Data: existing standings source.
   Must be current after every race (the live home showed pre-Singapore numbers on race day).
6. **Next race** — name, circuit, date, countdown, lap record, recent winners. Data: races/records tables.
7. **Latest** — feed items (title + source · date). Data: existing feed.
8. **Newsletter band** — "Follow the facts, not the hype." + email + "Get the numbers" (existing Resend newsletter flow).
9. **Footer.**

## Per-race highlights (new, small)
Gauges, the key number, the duel and the speed trace are per-race facts that probably don't exist in Supabase yet.
Propose the smallest source that works (e.g. a `race_highlights` table via Supabase CLI migration, or a typed JSON per
race in the repo), with a source field for every number. Seed it ONLY with the verified Singapore 2026 values in this
handoff. Anything missing for a race → hide that module; never invent or fall back to stale numbers.

## Responsive
Breakpoints match the reference: 1440 desktop, 820 tablet (hero stacks, two-column rows stack), 390 phone
(single column, hero title ~2rem, key number ~3.2rem, nav pills wrap). No horizontal scroll at 360 px.
Fluid type with clamp() (the reference uses container units; plain clamp()/vw is fine in production).

## Must not change
JSON-LD (Article/NewsArticle, FAQPage, BreadcrumbList), EEAT signals, URLs/slugs, `trailingSlash: true`,
next-intl EN/ES/PT (all new copy goes through the message files), other pages' look.

## Accessibility
Real `<a>`/`<button>`/`<label>`; charts are SVG with `role="img"` + a sentence `aria-label`; text contrast ≥4.5:1;
touch targets ≥44px; honour `prefers-reduced-motion` for any glow/animation.
