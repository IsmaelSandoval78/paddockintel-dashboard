# Product

## Register

brand

## Users

F1 enthusiasts and data-driven fans who want historical depth, not just live race updates. They open the hub between races to explore records, compare drivers across eras, and understand the economics behind the sport. They are opinionated, informed, and have seen every other F1 data tool — they know what boring looks like. Desktop-first but expect mobile to work.

## Product Purpose

**hub.paddockintel.com** — F1 economic and performance intelligence hub. Interactive, map-driven editorial property covering historical data from 1950 to present. The purpose is not to replicate official F1 data products but to make that data feel worth exploring: every screen should reward curiosity. Success is a user spending 20 minutes tracing a driver's career arc they didn't plan to investigate.

## Brand Personality

Editorial. Kinetic. Authoritative.

The hub is the only light-substrate F1 property. Where competitors go dark and loud, PaddockIntel goes editorial and precise. Motion exists to carry meaning — laps out, gap closing, lights out — not as decoration. Copy is terse and specific, never broadcast-voice hype.

## Anti-references

- **F1.com / ESPN broadcast UI**: Dark mode sports media aesthetic, saturated red, broadcast typography, hero metrics with gradient accents, heavy gradients everywhere. Anything that looks like a live timing screen or a TV lower-third.
- **SaaS dashboard (cold)**: Inter on everything, blue-grey palette, identical card grids with icon + heading + body, metric tiles, no editorial voice. Feels like it was designed by committee.
- **Pitwall / Ergast data dump**: Raw data with no hierarchy, dense tables without curation, UX that prioritises completeness over experience. A tool for engineers, not fans.
- **Awwwards agency experimental**: Effects for effects' sake, illegible data under layers of motion, scroll-hijacks that obscure rather than reveal. Motion without informational purpose does not ship here.

## Design Principles

1. **Motion maps to meaning** — Every animation references an F1 concept (lights out, flying lap, gap closing, g-force). If you cannot name the F1 reference, cut the animation.
2. **Editorial, not dashboard** — Data surfaces earn their place by telling a story. A standings table is not a table; it is a chapter. Hierarchy and restraint over completeness.
3. **Light is the differentiator** — The warm off-white substrate (`#F4F4F0`) is a deliberate brand position. Dark mode is not offered. The spectacle is motion and typography, not darkness.
4. **Specificity over genericism** — Unmistakably F1. Circuit coordinates in JetBrains Mono, team colors darkened for the light substrate, lap times parsed carefully. Nothing interchangeable with another sport.
5. **Restraint compounds** — Every element earns its place. Nothing decorative. The aggregate of invisible correctness creates interfaces people trust without knowing why.

## Accessibility & Inclusion

Target: WCAG AA minimum.
- Body text contrast ≥ 4.5:1 against `--bg` (`#F4F4F0`)
- Large text ≥ 3:1
- Keyboard navigation complete across all interactive surfaces
- `prefers-reduced-motion`: GSAP teardown via `matchMedia`, static fallback renders a complete, usable page — no blank sections, no hidden content
- Tabular numbers (`font-variant-numeric: tabular-nums`) on all stat columns
- i18n: EN / ES / PT via next-intl
