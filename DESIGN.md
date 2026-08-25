# PaddockIntel DESIGN.md v3.0.0 — Vintage Editorial (single system)

> Replaces v0.3.0 "Swiss Industrial Print" and the v2.0.0 "Data Mode / Story Mode" two-register
> system (built Aug 11–23 2026, reverted Aug 23 2026 — see `docs/archive/CONCEPT-V2.md` §13.11 for that
> history). This is not a patch on top of either — it is a full replacement. If any other repo
> doc still describes Data Mode, Story Mode, or `#F4F4F0`/`--red: #E61919` as current, that doc
> is stale; this file wins.
>
> Decided 2026-08-24, in a Claude.ai planning session (not yet applied to code). Before writing
> any component against these tokens, confirm `globals.css` has actually been updated — until
> then, the live site still runs on the old v0.3.0 tokens.

## Identity (unchanged)

PaddockIntel is the **Wikipedia visual de la Fórmula 1**: autoridad de datos verificables +
storytelling que hace sentir al lector "el que entiende el juego por dentro" — nunca el drama
manufacturado de los medios genéricos de F1.

## One system, not two

There is no Data Mode, no Story Mode, no per-surface skin decision. Hub, Circuits, Drivers,
Constructors, Blog, Digest, and Book all share one `:root` and one visual language:
**Vintage Editorial** — a warm, poster-style, illustrated-data aesthetic, reference: 2011 Japan
Earthquake & Tsunami-style infographic (single-subject illustration + hero numbers + ranked
stat blocks + bar/pie breakdowns, on a kraft-paper substrate).

This replaces the old rule "each surface has an assigned mode" entirely — there is nothing to
assign anymore.

## Tokens

```css
/* Substrate */
--bg              #EDE3D0   /* kraft paper base, with subtle dot-noise texture — see Texture */
--surface         #EDE3D0
--surface-raised  #E4D9C2   /* section alternates, cells — slightly darker kraft */

/* Borders */
--border          #2B2620   /* full-weight divider, near-black-brown, never pure #000 */
--border-subtle   #C9BC9F   /* ghost hairlines, dashed rules */

/* Text hierarchy */
--text-1          #2B2620   /* primary — near-black-brown */
--text-2          #6B5F4E   /* secondary — metadata, mono labels */
--text-3          #A69A82   /* tertiary — ghosts, placeholders */

/* Accent */
--terracotta      #C1502E   /* primary accent — replaces old --red. Same discipline: links,
                                active states, key callouts, hero numbers. NEVER a large fill. */
--terracotta-dim  #F2DDD3   /* terracotta wash for hover states */
--navy            #2B3A4A   /* secondary — illustrated map/diagram backgrounds, dark blocks */
--mustard         #D9A441   /* tertiary — secondary bar/chart series, never primary emphasis */
--gold            #C9A84C   /* achievements/championships, unchanged from v0.3.0 */
--gold-dim        #F5E8CC
--green           #22C55E   /* positive deltas, unchanged from v0.3.0 */
--green-dim       #E8F5EE

/* Motion */
--ease            cubic-bezier(0.16, 1, 0.3, 1)
--fast            100ms
--base            150ms

/* Shape */
--radius-sm       2px       /* cards, stat blocks — a small radius now, not zero. See Shape. */
--radius-md       4px       /* illustrated map containers, circular diagram frames */
```

### On-accent text — for dark/navy panels

The tokens above all assume content sits on the light kraft substrate. Some components
(a stat band on `--navy`, a highlighted callout) put content *inside* a dark panel instead —
`--text-1`/`--text-2`/`--border-subtle` don't have workable contrast there. Three tokens cover
that case:

```css
--text-on-accent      #FAFAF7   /* primary text/icons on a dark or accent-colored panel
                                    (--navy, --terracotta) — e.g. the Ticker on --terracotta */
--text-2-on-accent    #A7ADB2   /* secondary/muted text on a dark panel — e.g. a stat band's
                                    label under a hero number */
--border-on-accent    #7E878F   /* hairline dividers inside a dark panel */
```

**Both `-on-accent` tokens are derived from `--text-on-accent`, never from `--text-2`/
`--border-subtle`.** Blending two already-dark colors together stays dark no matter the ratio —
`--text-2` (`#6B5F4E`) blended 60% over `--navy` (`#2B3A4A`) measures **1.44:1** contrast,
effectively illegible. Starting from a light color and dialing the opacity down is the only way
to land in a legible range: `--text-2-on-accent` is `--text-on-accent` blended 60% over `--navy`
(5.13:1, passes WCAG AA), `--border-on-accent` is the same at 40% (3.18:1, fine for a
non-text hairline). If a future dark panel needs its own on-accent text/border color, compute it
the same way — don't reach for `--text-2`/`--border-subtle` as the blend source. Added
2026-08-24, fixing a hardcoded-hex regression on the Constructors detail page's stat bands — see
"Known technical debt" below.

**Migration note:** this is a hex-value change plus a shape-rule change (see Shape below), not
a structural rewrite. Any component already reading from CSS variables (`var(--bg)`,
`var(--red)`, etc.) updates automatically once `globals.css` changes — the same mechanism that
made both the Data Mode rollout and its revert "cascade for free" across most of the codebase
(`docs/archive/CONCEPT-V2.md` §13.5, §13.11). Audit for hardcoded hex first (Constructors detail page is
the known offender, still Phase 2 — see below).

## Typography

| Role | Font | Usage |
|---|---|---|
| Display/headlines | Archivo Black | Hero numbers, section titles, short callout lines — never full paragraphs |
| Body/prose | Lora | **Now used everywhere**, not just Blog/Book — this is a real change from v0.3.0/v2, where Lora was long-form-only and Hub used Inter for UI. Vintage Editorial's editorial-poster identity calls for prose everywhere it appears, even short captions |
| Data/numbers | JetBrains Mono | Stats, timestamps, lap times, source lines — unchanged invariant, still applies everywhere |

Inter is retired as a UI font under this system — Lora replaces it for anything that isn't a
number. If a specific component (form inputs, buttons) genuinely needs a plain UI sans for
legibility at small sizes, propose it explicitly rather than defaulting back to Inter.

## Texture

Every surface carries a **subtle dot-noise texture** over the kraft base (see the two circuit
mockups from the 2026-08-24 session for the reference implementation — `radial-gradient` dots,
~1px, low opacity, 3px grid). This is load-bearing to the "poster on paper" identity — a flat
`#EDE3D0` fill without texture reads as a generic warm background, not as Vintage Editorial.

```css
background-image: radial-gradient(#00000006 1px, transparent 1px);
background-size: 3px 3px;
```

## Shape

**Not zero-radius anymore.** The old "radius-cero universal, no exceptions" rule from v0.3.0 is
retired under this system:
- Stat blocks, cards: `--radius-sm` (2px) — barely-there rounding, still reads as "print," not
  soft/app-like
- Illustrated map/diagram circular containers: full circle (`border-radius: 50%`) — this is a
  deliberate illustration choice (the "epicenter map" pattern), not a UI card
- Buttons/small controls: `--radius-sm`
- No component should read as `rounded-2xl`/pill-shaped/glassmorphic — the ceiling is "print
  poster," not "consumer app"

## Signature elements

**Hero numbers.** A dominant Archivo Black figure (a lap record, a win count, a red-flag
duration) in `--terracotta`, paired with a muted JetBrains Mono label underneath. This is the
single most repeated pattern in the system — see both circuit mockups.

**Illustrated single-subject diagrams.** Replace flat schematic maps with an illustrated,
single-subject treatment: a circuit becomes a navy circle containing a simplified ghost
trace of the track with concentric rings marking a point of interest (an incident, a record
corner) — directly modeled on the earthquake-epicenter pattern from the reference infographic.
This applies to circuits now, and should be the default pattern for any single-subject visual
going forward (a driver's career arc, a constructor's dominant era) — propose the specific
illustration per case, don't force the exact epicenter-rings motif where it doesn't fit.

**Poster-style bar/pie breakdowns.** Ranked or comparative data renders as flat-color bar
charts (terracotta primary series, mustard secondary) or simple two-tone pie/donut breakdowns
— not tables, not the old JetBrains-Mono-dense ranked-row pattern. Never pie charts with more
than 3 segments (readability ceiling from the reference style).

**Stat block grids.** 3-up (sometimes 2-up) grids of Archivo Black number + JetBrains Mono
label, divided by hairlines, inside a bordered container — the direct equivalent of the
earthquake infographic's icon+number blocks (quake distance, aftershock count, etc.).

**Source line.** Every data-driven block ends with a JetBrains Mono, muted-color source
citation (`SOURCE: SUPABASE (table) · VERIFIED AGAINST X`) — this is the Vintage Editorial
execution of the project's existing "every number has a source" line (see `docs/archive/CONCEPT-V2.md`
§11), now a required visual element, not just an editorial policy.

## Track dominance rule — unchanged

Flat/non-isometric by default. Subtype A (real crossover, e.g. Suzuka bridge) gets pillars +
shadow. Subtype B (severe elevation without crossing, e.g. Spa Eau Rouge-Raidillon, COTA T1)
gets ascending terraces, never an invented bridge. This rule is orthogonal to the visual system
change — it governs geometric accuracy, not palette, and survives untouched.

## What this replaces, explicitly

- v0.3.0 Swiss Industrial Print (`#F4F4F0`, zero-radius, JetBrains-Mono-dense ranked lists) —
  retired as the live system, though its "every number sourced, ranked not pie-charted" DNA
  carries forward into the new poster-style bar patterns
- v2.0.0 Data Mode (`#0B1220` dark navy) — already reverted before this document; this
  supersedes it a second time, for clarity, so no future session resurrects it by accident
- v2.0.0 Story Mode (planned but never built warm palette for Blog/Book only) — absorbed into
  this system, now applying everywhere instead of two surfaces
- The aiweekly.co-as-visual-skin plan (dense, mono, low-motion) — superseded same day it was
  proposed; see `DECISIONS-2026-08-24-radical-pivot.md` §2 for the full history. Its
  information-architecture ideas (ranked attention dashboard, numbered issues) survive,
  re-skinned into this system

## Known technical debt this system inherits

Constructors detail page (`app/[locale]/(hub)/constructors/[slug]/page.tsx`) still has
`font-serif` outside the type system and no `'use client'`/motion — this was already Phase 2
debt under the old system (`docs/archive/CONCEPT-V2.md` §7) and remains Phase 2 debt under this
one. Do not attempt to patch it token-by-token; rebuild it against these tokens using
`DriverDetailExperience.tsx` as structural reference, same recommendation as before.

**Partial exception, 2026-08-24:** the stat-band/Rivalry/Pit Wall hardcoded hex (introduced by
the Aug 24 "Rivalry, Pit Wall, Circuit Domination" rebuild, plus one older stat band from the
page's original June build) was patched to real tokens, including two new ones —
`--border-on-accent`/`--text-2-on-accent`, see "On-accent text" above — as a scoped regression
fix, not a rebuild. Two zones were deliberately left out of that fix, still hardcoded, still
open:
- **Hero's own dark stat band** (races/wins/championships block, right ~40% of the hero,
  roughly L727–753) — a third, separate dark-panel instance using `#0A0A0A` (not `--navy`) as
  its background, with its own `#2A2A2A`/`#F4F4F0`/`#6B6B6B` internal text/border colors. Same
  fix pattern as the stat bands above would apply (`--navy` or a dedicated darker token, plus
  `--border-on-accent`/`--text-2-on-accent`) — just confirm first whether `#0A0A0A` should stay
  a distinct near-black or also become `--navy`, since unlike the other two panels this one was
  never touched by the Aug 24 rebuild.
- **`TEAM_HEX`** (the team-color swatch map, ~L37–58) and the **`FollowButton` idle-color
  props** (`idleBorderColor`/`idleTextColor`, ~L720–722) — unrelated hardcoded-hex debt, not
  part of the Aug 24 regression.

## Motion pieces (Remotion) — re-evaluate, not yet decided

The old "Blueprint" export standard (`#F4F4F0`, hard lines, no glow, technical grid) was
explicitly *independent* of the live site's mode so exports wouldn't need to match a dark
dashboard. Now that the live site itself is warm/illustrated, it's an open question whether
exports should adopt Vintage Editorial too (for visual consistency with the live site) or keep
the colder Blueprint look (for a deliberate "measurement tool" contrast). Not decided — flag
this explicitly before touching any Remotion composition.