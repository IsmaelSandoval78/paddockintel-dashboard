# Decision 2026-10-11 — Home page "Telemetry at Dusk" (dark, warm) — trial on the home only

**Status:** proposed (home only, preview branch `home-dusk`). Decide on site-wide adoption after review.
Design handoff: `docs/design/home-dusk/` (HANDOFF.md, reference/, data/).

## Context
- PRODUCT.md states that dark mode is not offered and positions PaddockIntel as "the only light-substrate
  F1 property". It also lists "anything that looks like a live timing screen" as an anti-reference.
- The authoritative design system is DESIGN.md **v5.0.0 "Warm Studio"** (warm cream `#EDE7E3`, teal +
  orange accents), decided 2026-09-21. (The handoff copy of this record named Swiss Industrial Print v0.3.0
  as current — that system was superseded twice before this decision; corrected here.)
- This is the **third** dark direction tried for PaddockIntel: the navy "Data Mode" (reverted Aug 23 2026)
  and the dark "Hypermodern" direction built out in PR #27 and closed without merging (Sep 21 2026).
- CLAUDE.md bans gradients and glassmorphism site-wide. This design uses gradients (hero sky, newsletter
  band) and glow, deliberately.
- Ismael finds the current home too flat. PaddockIntel's best-performing videos (YouTube Shorts) use a dark,
  warm "night telemetry" look, and after a structured inspiration review (Oct 11) he explicitly chose to
  revisit a dark look for the home: graphite + sunset warm light + data drawn as terrain.

## Decision
Build the home page in the "Telemetry at Dusk" look as a scoped trial:
- Only the home route changes; all other pages keep DESIGN.md v5.0.0 Warm Studio.
- Scoping mechanism: the home wraps its content in `.theme-dusk`, which redefines the existing CSS tokens
  (`--bg`, `--surface`, `--text-1`, ...). The shared Navbar and Footer pick the dusk tokens up through
  `body:has(.theme-dusk)` on the home only — no second header, no global token change.
- It is warm (sunset over graphite, terracotta inside the gradient), not the reverted navy "Data Mode" and
  not PR #27's glass/blur. No `backdrop-blur`; glass stays banned.
- **Scoped exception to CLAUDE.md:** gradients (hero sky, newsletter band) and glow are allowed inside
  `.theme-dusk` only. Gradient *text* stays banned everywhere. Outside the home, the CLAUDE.md "Do Not"
  list applies unchanged.
- Team colours are reserved for data.
- Every number on the home comes from real data with a stated source: Supabase for standings, races and
  pole-to-win history; `content/race-highlights/<year>-<round>.json` for per-race facts that don't exist in
  Supabase (pole-lap speed trace, laps led, sector deltas), each value carrying its own `source`.

## Data note (found while implementing, 2026-10-11)
The handoff's `data/singapore-2026-ver-pole-speed.json` was labelled as coming from PaddockIntel's own
live-timing recording. That recording contains timing data only — no car telemetry — so it cannot be the
source. The production trace is regenerated from FastF1 car telemetry by
`scripts/highlights/pole-speed-trace.py` (reproducible); its top speed is **308 km/h**, not the 307 shown
in the reference. The original file is kept in `docs/design/home-dusk/data/` as design material only.

## Consequences
- PRODUCT.md's "only light-substrate" positioning and the live-timing anti-reference are now under review;
  update them only if the trial is adopted site-wide.
- Visual continuity between the website and the video channels.
- New per-race highlights data is needed after every race weekend; a race without a highlights file simply
  hides those modules (no stale or placeholder numbers).
