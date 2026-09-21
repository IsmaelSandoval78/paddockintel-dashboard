# Product

## Register

brand

## Users

F1 enthusiasts and data-driven fans who want historical depth, not just live race updates. They open the hub between races to explore records, compare drivers across eras, and understand the economics behind the sport. They are opinionated, informed, and have seen every other F1 data tool — they know what boring looks like. Desktop-first but expect mobile to work.

## Product Purpose

**hub.paddockintel.com** — F1 economic and performance intelligence hub. Interactive, map-driven editorial property covering historical data from 1950 to present. The purpose is not to replicate official F1 data products but to make that data feel worth exploring: every screen should reward curiosity. Success is a user spending 20 minutes tracing a driver's career arc they didn't plan to investigate.

## Brand Personality

Precise. Kinetic. Authoritative.

**Updated 2026-09-21 (DESIGN.md v4.0.0 "Hypermodern"):** the hub is no longer the "only
light-substrate F1 property" — that positioning is retired, a deliberate founder call to
move to a near-black, glass-panel, Linear/Stripe-inspired surface. What survives from the
old personality line is the *precision*, not the paper: PaddockIntel reads as a control
room, not a broadcast graphic. Motion exists to carry meaning — laps out, gap closing,
lights out — not as decoration. Copy is terse and specific, never broadcast-voice hype.

## Anti-references

- **F1.com / ESPN broadcast UI**: saturated red, broadcast typography, hero metrics with gradient *text*, heavy decorative gradients used as background wallpaper rather than a deliberate wash. Anything that looks like a live timing screen or a TV lower-third.
- **Generic/committee SaaS dashboard**: this is the sharper version of the old "SaaS dashboard (cold)" line, not its deletion — DESIGN.md v4.0.0 deliberately shares surface language with Linear/Stripe (dark, Inter, glass, indigo accent), so "looks like a dashboard" is no longer itself disqualifying. What's still banned: genericness — identical card grids with icon + heading + body and nothing distinguishing it from any other dashboard, blue-grey palettes with no committed accent, metric tiles with no editorial voice or F1 specificity. The bar moved from "avoid this whole aesthetic family" to "execute this aesthetic family with an unmistakably-PaddockIntel point of view."
- **Pitwall / Ergast data dump**: Raw data with no hierarchy, dense tables without curation, UX that prioritises completeness over experience. A tool for engineers, not fans.
- **Awwwards agency experimental**: Effects for effects' sake, illegible data under layers of motion, scroll-hijacks that obscure rather than reveal. Motion without informational purpose does not ship here.

## Design Principles

1. **Motion maps to meaning** — Every animation references an F1 concept (lights out, flying lap, gap closing, g-force). If you cannot name the F1 reference, cut the animation.
2. **Precision over decoration** — Data surfaces earn their place by telling a story, same as before — but the vehicle is now hierarchy, spacing, and a glass/bento surface language instead of an editorial-print one. A standings table is not a table; it is a chapter, still.
3. **Dark, deliberately** — **Updated 2026-09-21, reverses the prior "light is the differentiator" rule.** DESIGN.md v4.0.0 runs a near-black substrate (`--bg`, currently `#08090C` — see `DESIGN.md` for the current token, don't hardcode it here) with a single committed indigo-violet accent (`--accent`) carried through glass panels and gradient-mesh washes. This was a deliberate founder decision to move away from the print-poster identity that preceded it, not an accident or a partial rollout — don't "restore" light mode without being asked.
4. **Specificity over genericism** — Unmistakably F1. Circuit coordinates in JetBrains Mono, team colors brightened for the dark substrate, lap times parsed carefully. Nothing interchangeable with another sport — or with another dark SaaS dashboard, see Anti-references above.
5. **Restraint compounds** — Every element earns its place. The accent and the glass effect are signal, not wallpaper — one layer of glass per depth, the accent never a large flat fill. The aggregate of invisible correctness creates interfaces people trust without knowing why.

## Accessibility & Inclusion

Target: WCAG AA minimum.
- Body text contrast ≥ 4.5:1 against `--bg` (currently `#08090C` under DESIGN.md v4.0.0 — verify against the live token, this file doesn't restate it to avoid drift)
- Large text ≥ 3:1
- Keyboard navigation complete across all interactive surfaces
- `prefers-reduced-motion`: GSAP teardown via `matchMedia`, static fallback renders a complete, usable page — no blank sections, no hidden content; hover-lift/translate micro-interactions collapse to an instant border/background change with no transform
- Tabular numbers (`font-variant-numeric: tabular-nums`) on all stat columns
- i18n: EN / ES / PT via next-intl
