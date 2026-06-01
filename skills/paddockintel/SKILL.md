---
name: paddockintel
description: >
  Design and critique system for PaddockIntel — an F1 editorial intelligence
  dashboard and publication. Use when building or reviewing any surface of the
  PaddockIntel ecosystem: the app.paddockintel.com dashboard (Next.js 16 +
  Tailwind v4), Ghost CMS articles, or social content (X, Instagram, LinkedIn).
  Consolidates patterns from five Open Design skills: dashboard · blog-post ·
  magazine-poster · social-carousel · critique.
version: 1.0.0
author: ismael-sandoval / paddockintel
surfaces:
  - dashboard       # app.paddockintel.com — Next.js 16 + Tailwind v4
  - editorial       # paddockintel.com — Ghost CMS (Tripoli theme)
  - social          # X · Instagram · LinkedIn social content
scenarios:
  - championship standings panel
  - constructor battle panel
  - circuit info panel
  - race countdown widget
  - driver profile page
  - article / quick take
  - magazine poster
  - social carousel
  - component critique
---

# PaddockIntel Design & Critique Skill

## 0 · Identity & Design System

**Publication:** PaddockIntel — F1 economic intelligence.  
**Tagline:** Data. Context. Edge.  
**Logo URL:** `https://paddockintel.com/content/images/2026/02/paddockintel-logo-light-xl.png`

### Type Stack
| Role | Font | Notes |
|---|---|---|
| Display / headlines | DM Serif Display | Italic for pull-quotes |
| Body / UI | Inter | 400 / 500 / 600 only |
| Data / code / coordinates | JetBrains Mono | Tabular nums, tracking tight |

### Color Tokens (Light Mode — active)
```css
--pi-bg:        #FAFAF8;   /* warm off-white page */
--pi-surface:   #FFFFFF;   /* card / panel */
--pi-border:    #E5E5E0;   /* subtle separator */
--pi-text-1:    #0A0A0A;   /* primary text */
--pi-text-2:    #6B6B6B;   /* secondary / meta */
--pi-text-3:    #A3A3A0;   /* placeholder / muted */
--pi-accent:    #DC143C;   /* Crimson — race red, CTAs, live dots */
--pi-accent-2:  #1A1A2E;   /* Midnight navy — constructor headers */
--pi-mono:      #1A1A1A;   /* JetBrains Mono text */
```

### Grid & Spacing
- **Dashboard:** 12-col grid, 24px gutter, max-width 1440px
- **Article:** Single col, max-width 720px, line-height 1.75
- **Social:** 1080×1080px (carousel), 1080×1350px (portrait)
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px

### Visual Posture
Editorial Monocle × Tech Utility. Numbers are the hero. White space is earned.
Never: gradients on gradients, purple, rounded-3xl on data tables, emoji in UI.

---

## 1 · Dashboard Skill (app.paddockintel.com)

**Stack:** Next.js 16 · TypeScript · Tailwind v4 · Supabase · Leaflet · next-intl (EN/ES/PT)

### Layout Architecture
```
┌─ Navbar ──────────────────────────────────────────────────┐
│  PADDOCK·INTEL    [links]   Vol.01 · Rd.09 · 2026  [locale]│
└───────────────────────────────────────────────────────────┘
┌─ Map (Leaflet, 60%) ──────┬─ Panel (40%) ─────────────────┐
│  CartoDB Positron light   │  DEFAULT: Championship Panel  │
│  2026 dots: #DC143C       │  ON CLICK: Circuit Panel      │
│  historic dots: #6B6B6B   │                               │
│  selected: ring #DC143C   │                               │
└───────────────────────────┴───────────────────────────────┘
```

### Panel Anatomy — Championship (default)
```
01 · Championship Standings
────────────────────────────
[pos]  [driver]      [team dot]  [pts]   [gap]
  1    Antonelli     ●           187     —
  2    Norris        ●           164     -23
  ...  (top 10)
────────────────────────────
02 · Constructor Battle
[team dot]  [team]       [prize $M]
●  Mercedes              [bar ████░░]  $142M
   ...  (top 5)
```

### Panel Anatomy — Circuit (on map click)
```
[Circuit name — DM Serif Display, 28px]
[Country · GP Round — Inter 500, 14px, --pi-text-2]

[lat, lng — JetBrains Mono, 12px, --pi-text-3]

Last 5 Champions:
YYYY  Driver Name
YYYY  Driver Name  ← last 5 years

Fastest Pit: 0:00.000  [team]
Fastest Lap: 0:00.000  [driver, year]

[View full circuit →]  ← --pi-accent underline
```

### Interaction Rules
- Map → Panel transition: `fade 150ms ease-out`
- Hover on circuit dot: scale 1.2, cursor pointer
- Selected state: ring-2 ring-[--pi-accent] ring-offset-1
- Live data indicator: pulsing dot `animate-pulse` in --pi-accent

### i18n Keys (next-intl)
All panel labels must have EN/ES/PT entries. Numbers: `Intl.NumberFormat`.
Dates: locale-aware via `next-intl` `useFormatter`.

### Dashboard Quality Checklist
- [ ] Numbers legible at 80% zoom (16px minimum for data)
- [ ] Team color dots: 10px circle, no border, correct hex per team
- [ ] Panel swap is instant (no layout shift)
- [ ] Locale switcher changes ALL strings including numbers
- [ ] Leaflet tiles load before data (no empty map flash)
- [ ] Mobile: map collapses to 100% width, panel below

---

## 2 · Editorial Skill (paddockintel.com / Ghost CMS)

**Theme:** Tripoli · **Author slug:** `ismael-sandoval`

### Article Structure
```
[headline — DM Serif Display, competitive keyword]
[deck — 1 sentence, max 145 chars → doubles as meta description]

[hero image — Grok generated, no real people, no RGB codes in prompt]

[body — Inter 400, 720px max, 1.75 line-height]
[pull quote — DM Serif Display Italic, border-left 3px --pi-accent]

Sources:
1. [Outlet Name](URL?ref=paddockintel.com) — description
2. ...
```

### SEO Protocol (mandatory before publish)
| Field | Rule |
|---|---|
| Title tag | ≤ 60 chars, lead keyword |
| Meta description | ≤ 145 chars, matches deck |
| JSON-LD | NewsArticle + BreadcrumbList always; FAQPage if 3+ Q&A; SportsEvent if race result |
| Canonical | Auto via Ghost |
| Validate | Google Rich Results Test before publish |

### Ghost RSS Feed
`/latest/rss/` — NOT `/rss/`

### Content Categories
- **Quick Takes** — economic data, short-form, ≤500 words
- **Paddock Life** — lifestyle, hospitality, culture analysis
- **Dashboard** — links to app.paddockintel.com features

### Anti-Patterns (never)
- Inventing data, URLs, quotes, or statistics — always verify via search
- Publishing without JSON-LD validation
- Hero images with identifiable real people

---

## 3 · Magazine Poster Skill

**Use for:** Announcement graphics, race weekend covers, championship milestone posts.

### Canvas
```
1080 × 1350px (Instagram portrait) or 1080 × 1080px (square)
Background: --pi-bg or --pi-accent-2 (dark variant)
```

### Layout Grid
```
[Vol · Issue · Round — JetBrains Mono, 11px, --pi-text-3, top-left]
[PADDOCK·INTEL — logo or wordmark, top-right]

[Large number or stat — DM Serif Display, 96–144px, dominant]
[Context line — Inter 500, 18px]
[Supporting data — JetBrains Mono, 14px, tabular]

[Bottom bar — --pi-accent strip, 4px]
[paddockintel.com — JetBrains Mono, 11px]
```

### Color Variants
- **Light:** --pi-bg background, --pi-accent-2 type
- **Dark:** --pi-accent-2 background, --pi-bg type, --pi-accent accents
- **Race Red:** --pi-accent background, white type (milestone only)

### Image Generation (Grok)
- Format prompt: `[Subject] [Action] CAMERA [angle] [Style] [Mood]`
- No identifiable real people
- No RGB codes in prompt — use descriptive color language
- Output: 9:16 for Stories, 1:1 for feed

---

## 4 · Social Carousel Skill

**Use for:** 3-card series for X (thread visual), Instagram carousel, LinkedIn document.

### Card Dimensions
- 1080 × 1080px per card
- 3 cards minimum, 5 maximum per carousel

### Card Structure
```
Card 1 — Hook
  [Large statement — DM Serif Display, 52px]
  [Subhead — Inter 500, 20px]
  [1 of 3 →]

Card 2 — Data
  [Section label — JetBrains Mono, 12px, --pi-text-3]
  [Key number — DM Serif Display, 80px, --pi-accent]
  [Context — Inter 400, 18px]

Card 3 — CTA
  [Insight summary — Inter 400, 20px, max 2 lines]
  [paddockintel.com]
  [PADDOCK·INTEL logo]
```

### Publishing Rules
- **X/Twitter:** Primary tweet = no link. Link goes in self-reply to avoid suppression.
- **LinkedIn:** Post text no link. Link in first comment.
- **Instagram:** Link in bio only. Carousel caption ≤ 2200 chars.

---

## 5 · Critique Skill — Five-Dimensional Scoresheet

Apply this before declaring any component, page, or post "done".  
Score each dimension 1–5. Minimum passing: 4 on all five.

### Dimensions

#### 1 · Philosophy (Does it feel like PaddockIntel?)
- 5: Numbers are the hero. Type is precise. Tension between editorial warmth and data coldness.
- 3: Correct fonts and colors but generic layout; could be any sports dashboard.
- 1: Looks like a Bootstrap template with F1 data dropped in.

#### 2 · Hierarchy (Can I read it in 3 seconds?)
- 5: Primary → secondary → tertiary reads in one pass. JetBrains Mono for data, DM Serif for headlines, Inter for body.
- 3: Hierarchy exists but requires effort. Competing weights or sizes.
- 1: Everything is the same size. No clear entry point.

#### 3 · Execution (Is the code / layout tight?)
- 5: No layout shift, no orphaned text, pixel-perfect alignment, transitions are smooth.
- 3: Works but has rough edges — inconsistent spacing, slight jank, hardcoded values.
- 1: Broken on mobile, hardcoded px everywhere, layout shift on data load.

#### 4 · Specificity (Is it F1 / PaddockIntel, or could it be anything?)
- 5: Circuit coordinates in mono, team color dots, Vol/Rd/Year in navbar. Unmistakably F1 intel.
- 3: F1 data present but could be any sports leaderboard.
- 1: Generic chart with "Driver" and "Points" columns.

#### 5 · Restraint (Did we resist the urge to add more?)
- 5: Every element earns its place. Removing anything would hurt. Nothing is decorative noise.
- 3: One or two unnecessary elements — an icon that adds no info, a color that doesn't encode data.
- 1: Icon soup, badge overload, 4 chart types on one screen.

### Critique Output Format
```
COMPONENT: [name]
DATE: [YYYY-MM-DD]

1 Philosophy:    [1–5] — [one line reason]
2 Hierarchy:     [1–5] — [one line reason]
3 Execution:     [1–5] — [one line reason]
4 Specificity:   [1–5] — [one line reason]
5 Restraint:     [1–5] — [one line reason]

TOTAL: [x/25]
STATUS: [SHIP IT / ITERATE / RETHINK]

BLOCKERS (score < 4):
→ [dimension]: [specific fix]

QUICK WINS:
→ [small improvement that costs < 30 min]
```

**SHIP IT** = all 5 scores ≥ 4 (total ≥ 20)  
**ITERATE** = 1–2 scores < 4  
**RETHINK** = 3+ scores < 4  

---

## 6 · Anti-AI-Slop Checklist (run on every output)

Before shipping any surface:

- [ ] No purple gradients, no glassmorphism for its own sake
- [ ] No rounded-3xl on data tables or metric cards
- [ ] No emoji in dashboard UI
- [ ] No Inter as display font (it's body only)
- [ ] No invented data — all numbers verified via search
- [ ] No JSON-LD skipped on articles
- [ ] No links in primary X post (self-reply only)
- [ ] Team colors are the actual 2026 hex values, not approximations
- [ ] All text is legible at 80% zoom
- [ ] Mobile breakpoint tested (375px minimum)

---

## 7 · Reference Data (2026 Season)

### Current Round
Vol.01 · Rd.09 · 2026 — Monaco GP (as of May 31, 2026)

### Team Color Reference (2026)
| Team | Primary Hex |
|---|---|
| Mercedes | #00D2BE |
| Red Bull | #3671C6 |
| Ferrari | #E8002D |
| McLaren | #FF8000 |
| Aston Martin | #358C75 |
| Alpine | #FF87BC |
| Williams | #64C4FF |
| Haas | #B6BABD |
| Kick Sauber | #52E252 |
| Racing Bulls | #6692FF |

### Key Storyline (2026)
Antonelli — youngest F1 championship leader. Anchor economic + performance analysis here.

---

*PADDOCKINTEL.md · v1.0.0 · 2026-05-31 · Apache-2.0*  
*Synthesized from Open Design skills: dashboard · blog-post · magazine-poster · social-carousel · critique*  
*Adapted for PaddockIntel stack: Next.js 16 · Tailwind v4 · Ghost CMS · Supabase · Vercel*