# PaddockIntel DESIGN.md v4.0.0 — Hypermodern (single system)

> Replaces v3.0.0 "Vintage Editorial" (kraft paper `#EDE3D0`, terracotta `#C1502E`,
> Archivo Black + Lora, radius-sm/md at 2-4px). That system, and everything before it
> (v0.3.0 "Swiss Industrial Print", v2.0.0 "Data Mode"/"Story Mode"), is now archived —
> see `docs/archive/CONCEPT-V2.md` §13 for the full lineage. This is a full replacement,
> not a patch: color, type, shape, and motion all change.
>
> Decided 2026-09-21, product decision by the founder (Ismael), explicitly overriding the
> v3.0.0 "light is the differentiator, dark mode not offered" and "no gradients,
> glassmorphism, or shadows" rules. If any other repo doc still asserts those rules as
> current, that doc is stale relative to this one.
>
> **Rollout status:** tokens in `globals.css` are global and cascade site-wide the moment
> they change (same mechanism that made the v0.3.0 → Data Mode → Vintage Editorial
> transitions "free" across most of the codebase — see the migration note below). The
> *bespoke* bento-grid/glass-panel component treatment described here has been fully
> applied to `magazine-home` only, as a flagship demo. Hub, Circuits, Drivers,
> Constructors, and the article/digest reading surfaces inherit the new color tokens
> automatically but have not had an individual layout pass yet — expect them to look
> "new palette, old layout" until a follow-up pass touches each one directly.

## Identity

PaddockIntel is F1 economic and performance intelligence for people who have seen every
other F1 data product and know what boring looks like. The old identity line — "Wikipedia
visual de la Fórmula 1" — was earned through print-poster restraint. The new line: **a
control room, not a magazine.** Precision instrument, not editorial artifact. The bar is
Linear's issue tracker and Stripe's dashboard — software that makes you feel like the
tool itself is competent before you've read a single number.

## Named references (commit to these, don't blend vaguely)

- **Linear** — near-black canvas, a single confident violet-indigo accent, ultra-thin
  low-alpha white borders, generous internal padding, instant/no-bounce micro-interactions.
- **Stripe (dashboard, not marketing site)** — soft radial gradient washes behind hero
  content, glass panels that separate content from background without a hard line, dense
  data that still reads as calm because of spacing, not despite the data.
- **Vercel** — pure-black-adjacent surfaces, monospace for anything that is a value
  (not just a hint of it), restraint on where color appears so the accent still reads as
  a signal, not wallpaper.

This is a **Committed** color strategy (one saturated accent, ~15-25% of surface via
glass/gradient washes, not a full-palette or drenched approach) on a **near-black**
substrate. Not Restrained (that was v3.0.0) — the whole point of this pass is that
restraint alone was reading as flat.

## Tokens

```css
/* Substrate — near-black, not pure #000 (pure black kills the glass/blur effect, which
   needs a hair of value to separate panel from canvas) */
--bg              #08090C
--surface          #0D0F13   /* base panel fill, no blur */
--surface-raised   #14161B   /* nested tile inside a panel */

/* Glass — the actual "hypermodern" surface. Use on real content panels (bento tiles,
   the join card, the newsletter card), not on every div — glass on glass reads as mud. */
--glass-bg         rgba(255, 255, 255, 0.03)
--glass-border      rgba(255, 255, 255, 0.09)
--glass-blur        20px

/* Borders */
--border           rgba(255, 255, 255, 0.10)
--border-subtle    rgba(255, 255, 255, 0.06)

/* Text hierarchy */
--text-1           #F5F6F7   /* primary — near-white, not pure white */
--text-2           #9AA1AC   /* secondary — metadata, mono labels */
--text-3           #5C6370   /* tertiary — ghosts, placeholders */

/* Accent — indigo-violet, replaces terracotta as the single primary accent.
   NEVER a large flat fill — carries links, active states, hero numbers, and the
   gradient-mesh wash, same discipline the old terracotta rule had. */
--accent           #6366F1
--accent-dim       rgba(99, 102, 241, 0.14)   /* wash / hover fill, not a solid tint */
--accent-2         #22D3EE   /* secondary accent — cyan, gradient-mesh companion color and
                                 secondary bar/chart series. Never primary emphasis. */

/* --terracotta / --terracotta-dim stay defined, pointed at the same values as --accent
   /--accent-dim — a compatibility alias, not a coincidence. ~100 files across Hub,
   Circuits, Drivers, Constructors, and the scorecard/records components still reference
   `text-terracotta`/`bg-terracotta`/`var(--terracotta)` and were out of scope for this
   pass (DESIGN.md + magazine-home only, see Rollout status above). They inherit the new
   accent color automatically through this alias, same "cascade for free" mechanic as
   every other token in this file — but the class/variable name itself is still the old
   one there. New v4.0.0 work (magazine-home, shared Navbar/Footer) uses --accent
   directly. Retiring the --terracotta name everywhere is real follow-up work, tracked,
   not done here — a mechanical repo-wide rename across ~100 files is its own PR. */
--terracotta       var(--accent)
--terracotta-dim   var(--accent-dim)

/* Semantic */
--green            #34D399   /* lightened from v3.0.0's #22C55E for AA contrast on #08090C */
--green-dim        rgba(52, 211, 153, 0.14)
--gold             #E8C468   /* lightened from v3.0.0 for dark-bg contrast */
--gold-dim         rgba(232, 196, 104, 0.14)

/* Legacy names kept for cascade compatibility where still referenced by un-migrated
   surfaces (Hub stat bands, Constructors detail page) — values updated to sit inside the
   new dark palette, not deleted. Don't reach for these in new v4.0.0 work; use --accent
   /--surface-raised instead. */
--navy             #1B2333
--mustard          #D9A441

/* On-accent text — for content sitting on a solid --accent-colored fill (rare — the
   accent almost never fills a whole panel, but e.g. a filled CTA button does). */
--text-on-accent      #FAFAFA
--text-2-on-accent    rgba(250, 250, 250, 0.7)
--border-on-accent    rgba(250, 250, 250, 0.35)

/* Team colors — brightened for dark substrate (v3.0.0's were darkened for a light one;
   the same hues now need to hold up against near-black instead) */
--team-mercedes    #1FD6C4
--team-mclaren     #FF8C1A
--team-redbull     #4A7FE0
--team-ferrari     #FF3333
--team-alpine      #E85CA8
--team-aston       #3FA98A
--team-haas        #9CA1A6
--team-williams    #4FA6E0
--team-sauber      #4ADE4A
--team-rb          #6B8FE8

/* Motion — snappier than v3.0.0's 150ms base; Linear-style interactions read as instant */
--ease             cubic-bezier(0.16, 1, 0.3, 1)
--instant          80ms
--fast             120ms
--base             180ms
```

### Migration note

This is a hex-value change plus a shape-rule change (see Shape below), not a structural
rewrite of components that already read from CSS variables — `bg-bg`, `text-text-1`,
`border-border`, etc. cascade automatically the moment `globals.css` changes, the same
mechanism that made the v0.3.0 → Data Mode → Vintage Editorial transitions free across
most of the codebase. Any un-migrated page (Hub, Circuits, Drivers, Constructors,
`.prose-article`) will look "new palette, correct semantics, old layout" immediately —
that's expected, not broken, until it gets its own bento/glass pass. Audit for hardcoded
hex before assuming a component "just works" — the Constructors detail page's `TEAM_HEX`
map and `FollowButton` idle-color props were already-known hardcoded-hex debt under
v3.0.0 and remain so here.

**`--terracotta` is now an alias for `--accent`, not renamed.** ~100 files still reference
`text-terracotta`/`bg-terracotta`/`var(--terracotta)` (Hub, Circuits, Drivers,
Constructors, scorecards, records). Rather than a mechanical repo-wide rename in this PR
(out of scope — see Rollout status above), `--terracotta`/`--terracotta-dim` are defined
as direct aliases of `--accent`/`--accent-dim`, so every un-migrated surface picks up the
new violet accent automatically without a rename. New v4.0.0 code (magazine-home, shared
Navbar/Footer) writes `--accent` directly. The rename itself — dropping the `-terracotta`
name everywhere — is real, tracked follow-up work, not done here.

## Typography

| Role | Font | Usage |
|---|---|---|
| UI / display | Inter (`--pi-sans`) | Everything — headlines, body, labels, buttons. Single-family system, weight/size carries the contrast, matching how Linear itself uses just Inter across the whole product. |
| Data/numbers | JetBrains Mono (`--pi-mono`) | Stats, timestamps, lap times, source lines, IDs — unchanged invariant from every prior system. Still the tell that a value is real data, not copy. |

Archivo Black, DM Serif Display, and Lora (`--pi-display`/`--pi-serif`/`--pi-prose`) stay
loaded and defined — un-migrated surfaces (Hub, article body via `.prose-article`,
Constructors) still use them until their own pass. Do not introduce new usages of any of
the three in v4.0.0 work; Inter carries display weight now (see Scale below).

### Scale

Modular, fluid `clamp()`, ratio ≥1.25 between steps (flat 1.1× scales read as
uncommitted). Hero headline ceiling: `clamp()` max ≤ 6rem — this is a control room, not a
billboard. Letter-spacing floor on display text: ≥ -0.04em.

## Shape

**Not 2-4px anymore.** Hypermodern reads as considered, not sharp:

- `--radius-sm`  8px  — buttons, small controls, pills
- `--radius-md`  14px — bento tiles, cards, the join/newsletter panels
- `--radius-lg`  20px — hero panels, the featured-story tile

No component should read as fully sharp-cornered "print poster" anymore — that was the
v3.0.0 rule, inverted. Circular containers (`rounded-full`) stay available for avatars/
badges, same as before.

## Glass & blur

The signature move of this system. Use `backdrop-filter: blur(var(--glass-blur))
saturate(150%)` on a panel that sits over the gradient-mesh background or over other
content (a sticky nav, a bento tile), paired with `--glass-bg` and a 1px `--glass-border`.

```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(150%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(150%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}
```

**Discipline, same as the old terracotta rule:** glass panels separate real content from
the canvas. They are not a decorative wrapper applied to everything — a glass panel
nested inside another glass panel reads as mud (this is the one absolute ban in this
system, same spirit as the old "never a large terracotta fill"). One layer of glass per
visual depth level.

## Gradient mesh

Soft, low-opacity radial washes of `--accent` and `--accent-2` behind hero content —
the Stripe-dashboard signature. Never used as a background for body text directly; always
behind a glass panel or on truly empty canvas space.

```css
.mesh-glow {
  background:
    radial-gradient(ellipse 800px 500px at 20% -10%, rgba(99, 102, 241, 0.18), transparent 60%),
    radial-gradient(ellipse 600px 400px at 100% 0%, rgba(34, 211, 238, 0.12), transparent 55%);
}
```

This replaces the v3.0.0 dot-noise kraft texture entirely — there is no equivalent
"paper grain" in this system; the canvas is flat `--bg` except where a mesh-glow is
deliberately placed (hero zones, not every section).

## Signature elements

**Bento grid.** Asymmetric grid of glass tiles, varying spans (a 2x2 hero tile next to
1x1 stat tiles), not a uniform card grid — the tell that separates "bento" from "just a
card grid" is that tile sizes carry meaning (the most important thing gets the biggest
tile), not a repeated identical unit. `grid-template-columns: repeat(auto-fit,
minmax(240px, 1fr))` as the breakpoint-free base, explicit `col-span`/`row-span` for the
hero tile.

**Hero numbers.** Unchanged in spirit from v3.0.0 — a dominant number in `--accent`,
paired with a muted JetBrains Mono label. Now sits inside a glass tile instead of a
bordered box, and can be considerably larger given the extra room dark backgrounds give
a saturated color before it looks like a warning.

**Hover micro-interactions.** Every interactive glass tile gets a deliberate hover state:
border brightens from `--glass-border` toward `--accent`-tinted, a subtle
`translateY(-2px)` lift, background lightens a couple percent. Duration `--fast` (120ms),
`--ease`. No bounce, no scale-up (scale reads as a button, not a content tile).

**Source line.** Unchanged requirement from every prior system — every data-driven block
still ends with a muted JetBrains Mono source citation. The visual treatment changes
(sits inside the glass tile now, not below a bordered box) but the editorial policy is
untouched.

## Motion

- Page-load: content already visible by default (per the shared Karpathy/accessibility
  rule — no gating visibility on a class-triggered transition); a subtle stagger on the
  bento grid's tiles is legitimate first-load polish, not required.
- Hover/interaction motion is the primary motion budget in this system — Linear and
  Stripe both under-animate on load and over-deliver on interaction feedback. Match that:
  restrained entrance, decisive hover/focus states.
- `prefers-reduced-motion: reduce` — same requirement as every prior system: static
  fallback renders a complete, usable page, hover lift/translate becomes an instant
  border/background change with no transform.

## What this replaces, explicitly

- v3.0.0 "Vintage Editorial" (`#EDE3D0` kraft, terracotta, Archivo Black + Lora
  everywhere, 2-4px radius, dot-noise texture, "no gradients/glassmorphism/shadows") —
  retired as the live system for `magazine-home`; still the literal token values other
  un-migrated surfaces render with until their own pass, per the Rollout status note above.
- v0.3.0 "Swiss Industrial Print" and v2.0.0 "Data Mode"/"Story Mode" — already archived
  before v3.0.0 superseded them; noted here only so no future session resurrects either
  by accident.

## Known technical debt this system inherits

Everything listed as debt under v3.0.0 (Constructors detail page's `font-serif`/hardcoded
hex, the circuit-detail duplicate-key React warnings) is unchanged and unresolved by this
token swap — a color/shape system change doesn't touch component logic. See
`docs/archive/CONCEPT-V2.md` for the full history if any of that needs picking back up.

## Open questions carried forward

**Scorecards (shareable PNGs)** and **Remotion motion exports** still explicitly say
"light background always" / flag the Blueprint-vs-live-site question as undecided under
v3.0.0. That question is now sharper, not resolved: a dark hypermodern site makes the
"should exports match the live site" argument stronger than it was under kraft-paper
Vintage Editorial, but this hasn't been decided and both surfaces are out of scope for
this pass. Flag before touching either.
