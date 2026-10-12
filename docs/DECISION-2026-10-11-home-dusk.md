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
`scripts/highlights/race_highlights.py` (reproducible); its top speed is **308 km/h**, not the 307 shown
in the reference. The original file is kept in `docs/design/home-dusk/data/` as design material only.

## Consequences
- PRODUCT.md's "only light-substrate" positioning and the live-timing anti-reference are now under review;
  update them only if the trial is adopted site-wide.
- Visual continuity between the website and the video channels.
- New per-race highlights data is needed after every race weekend; a race without a highlights file simply
  hides those modules (no stale or placeholder numbers).

## v2 — "Zentra skeleton, dusk skin, pit-wall charts" (2026-10-12)
After the first dusk home, Ismael judged the site still visually flat ("eeeh") next to how the data performs
on social. From three references (Zentra light bento dashboard; an AI-generated dusk-landscape UI kit; an
AI-generated dark "pit wall" dashboard) we took one thing each:
- **Structure from Zentra:** a 12-column bento grid of cards; big number + context + source in every card;
  an insight card; a page header naming the race.
- **Identity from the dusk landscape:** the dusk palette, cards with depth (inner highlight + soft shadow),
  and the hero as a landscape — ours is drawn from the real pole-lap speed trace, with the featured
  article's key number as the sun.
- **Chart language from the pit wall:** large glowing line/area charts; warm (leader/pole) against ice (the
  rival) for two-driver comparisons.
Rejected from the AI references: neumorphic knobs/controls, decorative widgets with fake data, the generic
"black + cyan neon" look.

Validated first as a static prototype with real Singapore 2026 data, approved ("bastante wow"), then built
into the home. **Home only**; the rest of the site migrates one surface at a time (articles next, prototype
first — open question: light reading sheet vs. dark body text).

Data rules carried over unchanged: every card hides when its data is missing; per-race data comes from
`race_highlights.py` (now also `raceTrace`: winner-vs-P2 gap per lap — published only if the flag lap
reproduces the official interval —, top-8 running order, VSC/SC and pit laps); the insight card only shows
key numbers already published in our own race-week articles, each linking to its article.
