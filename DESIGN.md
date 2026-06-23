# PaddockIntel DESIGN.md v0.3.0

Extends v0.2.0 (Hub-only) to govern all four surfaces: Hub, Blog, Digest, Book. One visual language everywhere — no separate "editorial skin," no separate "blog look."

## Identity
Swiss Industrial Print. Confident, data-forward, zero ornamentation. Reads like a technical print magazine, not a sports blog.

## Color
- Background: `#F4F4F0` — off-white, warm paper tone
- Accent: `#E61919` — racing red, used sparingly: links, active states, key callouts. Never as a large fill.
- Text: near-black, not pure `#000` — softened for long-form reading in Blog/Book
- Border-radius: `0` everywhere. No exceptions, on any surface.

## Typography
- **Display/headlines** — Archivo Black. Section titles, hero numbers, KPI labels.
- **Data/numbers** — JetBrains Mono. Stats, timestamps, lap times, anything tabular.
- **Body/prose (NEW)** — Lora, regular weight, line-height 1.6+. Neither Archivo Black nor JetBrains Mono is built for paragraphs — don't force them into article bodies. This is the one true addition this version makes, because Blog and Book are the first surfaces with real long-form text. Editorial serif over Inter — decided to give Blog/Book a distinct "reading" register from the Hub's data-forward UI.

## Neumorphism
Reserved exclusively for Hub home KPI cards. Does not appear in Blog, Digest, or Book. If a future surface wants a "lifted" card, propose it explicitly — never default to it.

## Surface-specific layout notes

**Blog**
- Max content width ~680-720px for readability
- Header stats block in JetBrains Mono
- Body in Lora
- Pull-quotes / Verdict section may use Archivo Black, but only for short callout lines — never full paragraphs

**Digest**
- Card-list layout
- Headline: Inter, bold
- Source chip: JetBrains Mono, small, uppercase
- `our_summary`: Inter, regular (short-form, stays Inter — Lora is reserved for long-form reading surfaces only)

**Book**
- Page-like rhythm — wider margins than Blog
- Chapter numbers in Archivo Black
- Body in Lora
- Background may shift to pure white per "page" to differentiate from web chrome; accent red reserved for chapter dividers only

## Responsive breakpoints
Mobile/tablet-first across every surface — Hub, Blog, Digest, Book all get checked at 375px, 768px, and 1280px minimum.

- **Phone (<768px)**: Bento grids → single column. Headlines use `clamp()`, never fixed `rem`. Blog/Book content → full-width with padding, no fixed max-width. Data tables → horizontal scroll or stacked card fallback. Nav → collapsed menu.
- **Tablet (768-1024px)**: Bento grids → 2-column. Blog/Book max-width still relaxed, not yet the full 680-720px desktop column.
- **Desktop (>1024px)**: Full layout as specified per surface above.

## Share button component
Appears on every Digest item card and Blog article preview card — same component, same position, everywhere.

- Shape: square, `0` border-radius, matches every other interactive element
- Icon-only (share glyph), no label text
- Mobile/tablet: triggers native OS share sheet via Web Share API — WhatsApp, Facebook, etc. appear automatically based on what's installed, no extra code needed
- Desktop fallback (no Web Share API support): small flyout menu — copy link, X, Facebook, WhatsApp (via `wa.me/?text=` link, no SDK needed) — WhatsApp gets priority placement given the ES/PT audience in LatAm and Brazil — square corners, accent-red border on hover, no shadow
- Color: text/icon in near-black by default, accent red `#E61919` only on hover/active state — same restraint rule as every other accent usage

## Motion pieces (Remotion) — "Blueprint" standard
Applies to any data-driven video composition (track dominance, season trends, etc.) — not a separate brand, the same Swiss Industrial Print discipline applied to motion.

- **Background**: `#F4F4F0` with a subtle technical grid (graph-paper lines, barely darker than the base) — functional, not decorative. Communicates precision instead of decoration.
- **Line drawing**: the track/path draws progressively (`stroke-dashoffset` animation), never appears all at once
- **Dominance highlight**: the leading driver's segment renders in accent red `#E61919`, solid, hard edge — no blur, no glow, no gradient
- **Secondary driver**: stays neutral black/gray — never a second saturated color. One real accent, same rule as everywhere else in the system
- **Depth without darkness**: hard-offset shadows (no blur) on floating elements — same "sticker on paper" language as Hub cards, just applied to a moving element
- **Measurement call-outs**: tick marks at segment start/end with a JetBrains Mono delta label (e.g. `|— Δ0.32s —|`) — styled like architectural dimension lines, grows naturally out of the grid background
- **One stat at a time**: the largest element on screen is always a single number/label — never multiple competing call-outs
- **Camera**: fixed top-down technical-drawing angle — no forced 3D perspective
- **Easing**: organic acceleration/deceleration on every motion, never linear or hard-cut

## What does NOT change between surfaces
Color palette, zero border-radius, accent-color discipline, Archivo Black reserved for headline-weight text only. These are the load-bearing walls — no surface drifts from them, even under deadline pressure.
