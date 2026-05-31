# PaddockIntel — Design System

**Style:** Minimalista Premium
**Inspiration:** Linear, Vercel, Raycast — datos densos con mucho aire, tipografía como protagonista, dark-first.

---

## 1. Color

### Base Palette (Dark Mode — Primary)
```
--background:       #0A0A0A   /* Negro casi puro */
--surface:          #111111   /* Cards, panels */
--surface-raised:   #1A1A1A   /* Hover states, elevated */
--border:           #222222   /* Líneas divisorias */
--border-subtle:    #1A1A1A   /* Bordes muy sutiles */
```

### Text
```
--text-primary:     #FAFAFA   /* Títulos, datos principales */
--text-secondary:   #A1A1AA   /* Labels, metadata */
--text-tertiary:    #52525B   /* Placeholders, disabled */
```

### Brand Accent
```
--accent:           #E10600   /* F1 Red — usar con moderación */
--accent-hover:     #FF1801   /* Hover del accent */
--accent-subtle:    #1A0302   /* Background hint para accent */
```

### Semantic
```
--positive:         #22C55E   /* Gains, P1, wins */
--negative:         #EF4444   /* DNF, losses */
--neutral:          #EAB308   /* P2, warnings */
--info:             #3B82F6   /* Links, info */
```

### Light Mode (secondary, future)
```
--background:       #FAFAFA
--surface:          #FFFFFF
--border:           #E4E4E7
--text-primary:     #09090B
--text-secondary:   #71717A
```

---

## 2. Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
/* Numbers and data: */
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum";
```

### Scale
```
--text-xs:    0.75rem  / 12px   /* Badges, fine print */
--text-sm:    0.875rem / 14px   /* Labels, secondary data */
--text-base:  1rem     / 16px   /* Body, table data */
--text-lg:    1.125rem / 18px   /* Section headers */
--text-xl:    1.25rem  / 20px   /* Panel titles */
--text-2xl:   1.5rem   / 24px   /* Page titles */
--text-3xl:   1.875rem / 30px   /* Hero numbers */
--text-4xl:   2.25rem  / 36px   /* Large display */
```

### Weights
```
400 — body, labels
500 — emphasis, table headers
600 — section titles
700 — hero numbers, driver names
```

### Rules
- Numbers always use `tabular-nums` — they must align in tables
- Driver names: `font-weight: 600`, surname in `font-weight: 700`
- Points/stats: large, bold, monospaced feel
- Never use font-size below 12px

---

## 3. Spacing

8px base grid. All spacing is a multiple of 4px.

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px
```

---

## 4. Layout

### Hub Principal
- Two columns: map 60% / panel 40%
- Panel has internal padding: 24px
- Map has zero padding — full bleed
- Max width of right panel content: 380px
- Breakpoint: stack vertically below 1024px (map top, panel bottom)

### Panels & Cards
- Border radius: `8px` for cards, `6px` for badges, `4px` for inputs
- Cards use `--surface` background with `1px solid --border`
- No box shadows — use borders and background contrast instead
- Hover state: `--surface-raised` background transition 150ms

### Driver Row (Top 10 list)
```
[rank] [name]              [pts] [podiums] [rate]
  1    Max Verstappen       195      8      42%
```
- Rank: monospace, `--text-tertiary`, fixed width
- Name: `font-weight: 600`
- Stats: right-aligned, `tabular-nums`
- Separator lines: `1px solid --border-subtle`
- Row height: 48px

### Constructor Row (Top 5 list)
Similar to driver row but with constructor color dot indicator.

---

## 5. Map

- Dark map tiles — use Mapbox dark style or equivalent
- Circuit markers: small dot `8px`, `--accent` color for 2026 circuits
- Historical-only circuits: `--text-tertiary` muted dot
- Selected circuit: white ring around dot, scale 1.3
- No heavy tooltips — click triggers panel swap
- Map controls (zoom) bottom-left, minimal

---

## 6. Components

### Badge
```
Small pill, 6px border-radius
Variants: default (--border bg), positive (green), negative (red), accent (red)
Font: text-xs, font-weight: 500, uppercase, letter-spacing: 0.05em
Padding: 2px 8px
```

### Button
```
Primary: --accent bg, white text, hover --accent-hover
Secondary: --surface bg, --border border, --text-primary text
Ghost: transparent, --text-secondary text, hover --surface
Height: 32px (sm), 36px (default), 40px (lg)
Border-radius: 6px
Font-weight: 500
```

### Panel Transition
```
Right panel content swap: fade out 150ms → fade in 150ms
No sliding animations — content replaces in place
Circuit info panel has X button top-right (ghost, 24px)
```

### Scorecard (Shareable)
```
Aspect: 1:1 default, 9:16 stories, 16:9 wide
Background: --background with subtle grid pattern
Header: PaddockIntel.com wordmark top-left, accent dot
Driver photo area: silhouette if no photo available
Stats: large tabular numbers, high contrast
Footer: paddockintel.com URL, subtle
Brand colors per constructor for comparison cards
```

---

## 7. Motion

Minimal. Fast. Purposeful.

```
--duration-fast:    100ms
--duration-normal:  150ms
--duration-slow:    250ms
--easing:           cubic-bezier(0.16, 1, 0.3, 1)  /* ease-out-expo */
```

- Hover states: 150ms
- Panel swaps: 150ms fade
- Map marker interactions: 100ms
- No bouncing, no spring physics, no decorative animations
- Page transitions: none (instant)

---

## 8. Anti-Patterns (Never Do)

- No gradients on backgrounds — solid colors only
- No glassmorphism / blur effects
- No drop shadows on cards (use borders)
- No rounded corners above 12px
- No more than 2 font weights on one screen
- No color for decoration — color = information
- No empty states with illustrations — use text only
- No skeleton loaders that look like content — use minimal pulse
- No tooltips on hover for primary data — show it inline
- No carousels
- The accent red is F1 — use it for P1, wins, active states only. Not for decoration.

---

## 9. Data Visualization

- Bar charts: horizontal preferred, vertical for time series
- No pie charts — use ranked lists instead
- Sparklines for trend indicators (tiny, inline)
- Color encoding: always pair with label (never color-only)
- Grid lines: `--border-subtle`, very light
- Chart background: transparent (inherits panel bg)

---

## 10. Voice & Labels

- Driver names: Forename + SURNAME (surname caps in display contexts)
- Constructor names: Official short form (Red Bull, Ferrari, Mercedes)
- Points: always numeric, never spelled out
- Positions: P1, P2, P3 — not 1st, 2nd, 3rd
- Dates: DD MMM YYYY (15 Mar 2026)
- Lap times: M:SS.mmm (1:23.456)
- Pit stop times: SS.mmm (23.456s)
