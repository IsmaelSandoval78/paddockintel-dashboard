---
name: paddockintel
description: >
  Design and critique system for PaddockIntel — an F1 kinetic intelligence
  hub and publication. Use when building or reviewing any surface of the
  PaddockIntel ecosystem: the hub.paddockintel.com dashboard (Next.js 16 +
  Tailwind v4 + GSAP + Three.js), Ghost CMS articles, or social content.
  Design language: VELOCITY — motion-first kinetic editorial on a light
  substrate. See DESIGN.md for the full system.
version: 2.0.0
author: ismael-sandoval / paddockintel
surfaces:
  - dashboard       # hub.paddockintel.com — Next.js 16 + Tailwind v4 + GSAP + Three.js
  - editorial       # paddockintel.com — Ghost CMS (Tripoli theme)
  - social          # X · Instagram · LinkedIn social content
scenarios:
  - kinetic home experience
  - championship standings (THE GRID)
  - race chapters (last race / next race)
  - circuit detail page
  - driver profile page
  - article / quick take
  - magazine poster
  - social carousel
  - component critique
---

# PaddockIntel Design & Critique Skill — VELOCITY

## 0 · Identity & Design System

**Publication:** PaddockIntel — F1 economic & performance intelligence.
**Tagline:** Data. Context. Edge.
**Design language:** VELOCITY — kinetic editorial. The only light F1 property
on the internet; the spectacle is choreography, not darkness.
**Logo URL:** `https://paddockintel.com/content/images/2026/02/paddockintel-logo-light-xl.png`

### Type Stack
| Role | Font | Notes |
|---|---|---|
| Kinetic display / headlines | Archivo Black | Massive, cropped, bleeding off-canvas |
| Body / UI (rare) | Inter | 400 / 500 — the hub speaks in labels |
| Data / timing / labels | JetBrains Mono | Tabular nums, tracking 0.12–0.18em |
| Editorial pull-quotes | DM Serif Display | Ghost CMS articles only |

### Color Tokens (hub — light substrate, never dark)
```css
--bg:             #FAFAF7;   /* paper white */
--surface-raised: #F1F0EC;   /* cells, alternates */
--text-1:         #0A0A0A;   /* ink */
--text-2:         #6B6B6B;   /* meta */
--text-3:         #B5B4AE;   /* ghosts */
--red:            #E10600;   /* official F1 red — THE accent */
--red-dim:        #FBE9E8;   /* red wash */
```
Team colors: darkened-for-light variants only (see DESIGN.md §05).

### Motion Stack (the differentiator)
- **GSAP 3.13+** — SplitText, ScrollTrigger, DrawSVGPlugin, ScrambleTextPlugin
- **Three.js** — WebGL particle fields, dynamic import `ssr:false`, DPR ≤ 2
- Every animation maps to an F1 concept (lights out, flying lap, gap closing,
  g-force, timing feed). Motion without meaning does not ship.
- `prefers-reduced-motion` → static editorial fallback, always flawless.

### Visual Posture
Kinetic editorial. Numbers make their entrance through motion, then stand
still and let you read them. White space is earned. Scale discomfort
(16vw surnames) is brand confidence.
Never: dark page backgrounds, scroll-jacking, purple, gradients on data,
rounded-3xl, motion loops outside ticker/particles.

---

## 1 · Dashboard Skill (hub.paddockintel.com)

**Stack:** Next.js 16 · TypeScript · Tailwind v4 · Supabase · GSAP · Three.js · next-intl (EN/ES/PT)

### Home — one continuous scroll story
```
01 WARP HERO     100svh · Three.js warp field · leader surname 16vw
                 SplitText stagger entrance · GSAP counters · parallax
02 TICKER        race-red strip · infinite marquee standings feed
03 LAST RACE     circuit SVG draws itself (DrawSVG scrubbed) · podium
04 NEXT RACE     giant countdown digits · track draw · lap record red
05 THE GRID      top 10 · scroll-velocity skew · ghost numerals ·
                 scrubbed point bars · team-color hover floods
06 STREAKS       counters fire on viewport enter
07 FOOTER        wordmark at viewport width
```

### Architecture pattern
- Server Component fetches Supabase data (batched `Promise.all`)
- One client orchestrator (`HomeExperience`) receives serializable props,
  registers GSAP plugins once, owns ScrollTrigger context + custom cursor
- WebGL components: separate dynamic imports inside client wrappers

### Interaction Rules
- Entrances 0.6–1.2s, power4/expo out · staggers 0.03–0.08s
- Scrub effects tied to native scroll — never hijack scroll position
- Custom cursor desktop-only: red dot + trailing ring, grows on targets
- Touch: no cursor, no mouse-parallax, particles ≤ 1/3, reveals intact
- Live indicator: pulsing red dot

### i18n Keys (next-intl)
All labels EN/ES/PT via `hub.*` keys. Numbers `Intl.NumberFormat`.
Locale-neutral mono strings (RD.08, PTS, timing) may be hardcoded.

### Dashboard Quality Checklist
- [ ] 60fps scroll on mid-range hardware (transform/opacity only in DOM)
- [ ] Zero layout shift from animations (reserve space, tabular-nums)
- [ ] Reduced-motion renders a flawless static editorial page
- [ ] WebGL failure → clean static fallback
- [ ] Mobile 375px: type clamps down, all data readable, reveals work
- [ ] Hero text paints before canvas (WebGL off critical path)
- [ ] Locale switcher changes ALL strings

---

## 2 · Editorial Skill (paddockintel.com / Ghost CMS)

**Theme:** Tripoli · **Author slug:** `ismael-sandoval`

### Article Structure
```
[headline — DM Serif Display, competitive keyword]
[deck — 1 sentence, max 145 chars → doubles as meta description]
[hero image — Grok generated, no real people, no RGB codes in prompt]
[body — Inter 400, 720px max, 1.75 line-height]
[pull quote — DM Serif Display Italic, border-left 3px race red]

Sources:
1. [Outlet Name](URL?ref=paddockintel.com) — description
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

### Anti-Patterns (never)
- Inventing data, URLs, quotes, or statistics — always verify
- Publishing without JSON-LD validation
- Hero images with identifiable real people

---

## 3 · Magazine Poster Skill

**Canvas:** 1080×1350 (IG portrait) or 1080×1080 (square).
Light variant: paper white bg, ink type, red accents.
Dark variant allowed here ONLY (exportable asset, not the hub).
Layout: Vol/Rd mono top-left · wordmark top-right · dominant stat in
Archivo Black 96–144px · red 4px bottom strip · paddockintel.com mono.

---

## 4 · Social Carousel Skill

1080×1080 per card, 3–5 cards.
Card 1 hook (Archivo Black statement) · Card 2 data (number in red) ·
Card N CTA (paddockintel.com + wordmark).
X: no link in primary post — self-reply. LinkedIn: link in first comment.

---

## 5 · Critique Gate — Six-Dimensional Scoresheet

Score 1–5 each. Minimum to ship: **4 on all six**.

| # | Dimension | Question |
|---|---|---|
| 1 | **Philosophy** | Does it feel like PaddockIntel — kinetic editorial, not SaaS, not generic dark-F1? |
| 2 | **Hierarchy** | Primary info readable in 3 seconds, even mid-animation? |
| 3 | **Execution** | 60fps, zero layout shift, no jank, clean fallbacks? |
| 4 | **Specificity** | Unmistakably F1 intel — timing mono, team colors, circuit shapes? |
| 5 | **Restraint** | Every element AND every motion earns its place? |
| 6 | **Motion** | Does each animation encode an F1 concept? Does reduced-motion still ship a flawless page? |

```
COMPONENT: [name] · DATE: [YYYY-MM-DD]
1 Philosophy: [1–5] — [reason]
2 Hierarchy:  [1–5] — [reason]
3 Execution:  [1–5] — [reason]
4 Specificity:[1–5] — [reason]
5 Restraint:  [1–5] — [reason]
6 Motion:     [1–5] — [reason]
TOTAL: [x/30] · STATUS: [SHIP IT / ITERATE / RETHINK]
```

**SHIP IT** = all six ≥ 4 · **ITERATE** = 1–2 below 4 · **RETHINK** = 3+ below 4

---

## 6 · Anti-AI-Slop Checklist (run on every output)

- [ ] No dark page backgrounds on the hub
- [ ] No motion without F1 meaning — no floating blobs
- [ ] No scroll hijacking
- [ ] No purple, no glassmorphism, no rounded-3xl on data
- [ ] No emoji in dashboard UI
- [ ] No Inter as display font
- [ ] No invented data — Supabase or verified sources only
- [ ] Team colors are darkened-for-light variants, not raw broadcast hex
- [ ] Reduced-motion fallback tested
- [ ] Mobile 375px tested

---

## 7 · Reference Data (2026 Season)

Query Supabase for all standings/results — never hardcode.
Team on-light hex variants: see DESIGN.md §05.

---

*SKILL.md · v2.0.0 · 2026-06-12 · Apache-2.0*
*VELOCITY kinetic editorial system · Next.js 16 · Tailwind v4 · GSAP · Three.js · Supabase*
