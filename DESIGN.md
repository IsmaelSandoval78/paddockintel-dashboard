# PaddockIntel DESIGN.md v5.0.0 — Warm Studio (single system)

> Replaces v3.0.0 "Vintage Editorial" (kraft paper `#EDE3D0`, terracotta, print-poster
> restraint, `--radius-sm`/`--radius-md` at 2-4px). A dark "Hypermodern" direction (glass/
> blur, near-black substrate) was proposed and built out fully in PR #27 — **closed without
> merging, 2026-09-21, same day** — after side-by-side visual references showed the founder
> wanted to stay light, not go dark. This file is that light direction, decided with real
> visual references, not the closed PR. If any other repo doc still describes a dark
> substrate or `.glass-panel`/`backdrop-blur` as current, that doc is stale; this file wins.
>
> Decided 2026-09-21 (founder product decision, same session as the closed PR #27). Named
> references: a Wiza-style light SaaS bento (soft shadow, large radius, generous spacing)
> and a KPI dashboard (solid-color stat tiles, denser grid) — see the four "Light Mode
> References" reviewed before this was written. The founder's own palette pick (four
> swatches, keeping the one with `#EDE7E3` literally in it) sets this system's colors —
> not a designer's guess.

## Identity

PaddockIntel is F1 economic and performance intelligence for people who have seen every
other F1 data tool and know what boring looks like. Where the old kraft-paper identity was
"print poster," this system is "a well-made desk tool" — soft, confident, unmistakably
warm rather than the cold gray/lavender that most light-mode SaaS references default to.
The founder's explicit constraint: don't lose the warmth PaddockIntel already had while
picking up the softness (shadow, radius, spacing) that made the new references feel less
flat than the old one.

## Named references

- **Wiza-style bento** — white cards on a tinted-neutral canvas, soft/diffused shadow (no
  hard offset), large radius (20-28px), generous internal padding, a single accent used
  sparingly (icons, CTAs, hero numbers).
- **KPI dashboard** — solid-color fill tiles for standings/stat blocks instead of white +
  text accent, denser grid, smaller type — the pattern this system borrows for `.tile`
  (see Signature elements), not for the whole page.

This is a **Restrained** color strategy (tinted neutral + two accents used deliberately,
not spread across the surface) — the founder's own palette choice, not a designer default;
the closest analog in the shared vocabulary from the reference review is "Direction C —
Papel cálido," refined against the founder's picked palette (C4) rather than left generic.

## Tokens

```css
/* Substrate — warm cream, not gray or lavender. Closer in spirit to the old kraft-paper
   #EDE3D0 than to any of the cooler light-mode references reviewed — the founder's own
   palette pick kept this hue on purpose. */
--bg              #EDE7E3
--surface          #FFFFFF   /* cards */
--surface-raised   #E4DED9   /* section alternates, nested cells */

/* Borders — soft, warm-neutral, never stark black */
--border           #DFD8D2
--border-subtle    #E7E1DB

/* Text hierarchy */
--text-1           #12303A   /* primary — dark teal-black, not pure black */
--text-2           #6E7C7E
--text-3           #9CACAF

/* Accent — two, used deliberately (never both on the same element) */
--accent           #1A6B78   /* teal — kickers, tags, labels, the standings/stat tile fill */
--accent-dim       #DDEEF0   /* teal wash — tile backgrounds, hover fills */
--accent-2         #F2A03D   /* orange — reserved for hero numbers and primary CTAs only.
                                 Never a kicker or a tag; if both accents show up on the
                                 same tile, the tile has no clear role. */

/* Semantic */
--green            #2F7D5C
--green-dim        #E6F2EC
--gold             #C9A84C
--gold-dim         #F5E8CC

/* Constructor colors — carried over from v3.0.0 unchanged; already tuned for a light
   substrate, no rework needed for this system. */
--team-mercedes    #00A99D
--team-mclaren     #E57700
--team-redbull     #2A5DB0
--team-ferrari     #D40000
--team-alpine      #C04080
--team-aston       #2D7A65
--team-haas        #6A6E70
--team-williams    #2A7CB0
--team-sauber      #259825
--team-rb          #3A5EC4

/* Motion */
--ease             cubic-bezier(0.16, 1, 0.3, 1)
--fast             120ms
--base             180ms

/* Shape — large radii are load-bearing to this system reading as "soft studio" rather
   than the old print-poster sharpness. */
--radius-sm        12px   /* tags, small controls, buttons */
--radius-md        18px   /* standard cards */
--radius-lg        24px   /* the Featured/hero tile only */
```

### Shadow

The other load-bearing signature, alongside radius. Soft, diffused, **tinted toward the
accent hue** rather than neutral gray/black — a plain `rgba(0,0,0,.1)` shadow reads as
generic; a shadow tinted toward `--accent`'s hue reads as considered. No hard offset, no
sharp edge.

```css
--shadow-card: 0 10px 30px -14px rgba(20, 60, 70, 0.12);
--shadow-card-lg: 0 14px 34px -14px rgba(20, 60, 70, 0.15);
```

Never stack a shadow on a tile that already uses `--accent-dim` as its fill — a colored
tile is already visually separated from the canvas; adding a shadow on top of that is the
"timid half-measure" the shared design rules warn against. Pick one separation mechanism
per tile: color fill, or shadow — not both.

## Typography

| Role | Font | Usage |
|---|---|---|
| UI / display / body | Inter (`--pi-sans`) | Everything — headlines, body copy, labels, buttons. Matches the softness of the references; Lora's editorial-serif voice doesn't fit a "soft studio" system the way it fit kraft-paper Vintage Editorial. |
| Data/numbers | JetBrains Mono (`--pi-mono`) | Stats, timestamps, lap times, source lines, kickers — unchanged invariant across every system PaddockIntel has shipped. |

This reverses v3.0.0's "Lora replaces Inter for anything that isn't a number" rule.
Archivo Black, DM Serif Display, and Lora stay loaded (still used by un-migrated
surfaces — see Rollout status) but are not this system's typography going forward.

## Layout — wide contained grid

**max-width: 1400px, centered**, not the old `max-w-5xl` (1024px) and not full-bleed. This
was picked over three alternatives reviewed side by side (full-bleed, this one, and a
denser same-width-as-before option) specifically because it reads well on both a laptop
and a large monitor without the "text far from the screen edge" problem full-bleed had.

- Hero/bento row: 3-column grid, the Featured tile spans 2 columns (`grid-template-
  columns: repeat(3, 1fr)`, Featured gets `col-span-2`)
- Gap: 16px between tiles
- Card internal padding: 20-28px (26-28px for the Featured tile, 18-20px for supporting
  tiles)
- Denser rows (Attention/Learning/Latest-Issue/archive cards) can drop to a 3-4 column
  grid at the same tile radius/shadow rules — density varies by row, the container width
  doesn't

## Signature elements

**Soft card.** White fill, `--radius-md`, `--shadow-card`. The default surface for any
content block — Feed items, Standings (drivers/constructors split), Attention This Week,
Learning, archive cards.

**Hero tile.** The Featured story only. `--radius-lg`, `--shadow-card-lg`, larger internal
padding, a hero number in `--accent-2` (orange) at the bottom — the single most important
piece of real estate on the page, sized and shadowed to say so unambiguously.

**Accent tile.** A tile filled solid with `--accent-dim` (not white) — used for the
Standings summary specifically, matching the KPI-dashboard reference's colored-stat-tile
pattern. Reserve this treatment for the one or two tiles per page that are genuinely
"the number that matters most" — a page where every tile is colored loses the signal.

**Hero numbers.** Unchanged in spirit from every prior PaddockIntel system — a dominant
number (Archivo weight via Inter's bold, not literal Archivo Black), `--accent-2` orange,
paired with a muted JetBrains Mono label underneath.

**Source line.** Unchanged editorial requirement — every data-driven block ends with a
muted JetBrains Mono source citation.

## Motion

- Hover on an interactive card: shadow deepens slightly (`--shadow-card` → `--shadow-card-
  lg`), no lift/translate — the soft-shadow language already implies elevation, adding a
  transform on top reads as redundant motion, not extra polish.
- `prefers-reduced-motion: reduce`: shadow-only hover states are already motion-safe (no
  transform to disable), but any future transform-based interaction still needs the
  static-fallback treatment every prior system required.

## Rollout status

Tokens in `globals.css` are global and cascade site-wide the moment they change (same
mechanism used for every prior full-system swap in this repo). The bespoke soft-card/wide-
grid component treatment described here is fully applied to `magazine-home` as the
flagship implementation; Hub, Circuits, Drivers, Constructors, and the article/digest
reading surfaces inherit the new color tokens automatically but have not had their own
layout pass yet — expect "new palette, old layout" there until a follow-up pass.

## What this replaces, explicitly

- v3.0.0 "Vintage Editorial" (`#EDE3D0` kraft, terracotta, Archivo Black + Lora, 2-4px
  radius, dot-noise texture) — retired for `magazine-home`; still the literal token values
  other un-migrated surfaces render with until their own pass.
- The dark "Hypermodern" direction proposed and built in PR #27 (near-black substrate,
  glass/backdrop-blur, indigo accent) — **closed without merging**, same day it was opened,
  after the founder reviewed light-mode references and chose to stay light. Its
  `--terracotta`→`--accent` alias mechanism and bento-grid instinct were sound; its palette
  and glass/blur direction were not what shipped. Noted here so no future session
  resurrects the dark direction by accident, the same way this repo's history already
  tracks the earlier v2.0.0 "Data Mode" dark attempt (also built, also reverted).
- v0.3.0 "Swiss Industrial Print" and v2.0.0 "Data Mode"/"Story Mode" — already archived
  before v3.0.0 superseded them.

## Known technical debt this system inherits

Everything listed as debt under v3.0.0 (Constructors detail page's `font-serif`/hardcoded
hex, the circuit-detail duplicate-key React warnings) is unchanged and unresolved by this
token swap. See `docs/archive/CONCEPT-V2.md` for the full history.

## Open questions carried forward

**Scorecards (shareable PNGs)** and **Remotion motion exports**: still "light background
always," which now genuinely matches the live site again (unlike during the brief dark
detour) — the old open question about Blueprint `#F4F4F0` vs. the live kraft tone is
effectively resolved in spirit (the live substrate is light again), but the exact hex to
use for exports (this system's `#EDE7E3`, or keep the historically-distinct Blueprint
`#F4F4F0`) is still not explicitly decided. Flag before touching either.
