# PaddockIntel — Radical pivot, decided 2026-08-24

> Paste this section into `CLAUDE.md` (or keep as a linked file `CLAUDE.md` references) so
> every future Claude Code session inherits it. This is NOT optional scope — these are
> committed decisions, not proposals under evaluation.

## 1. Infrastructure — Vercel → Cloudflare (non-negotiable)

Migration off Vercel to Cloudflare is decided, not open for debate. Before executing:
- Confirm Next.js 16 App Router compatibility path on Cloudflare (Workers/Pages via
  `@cloudflare/next-on-pages` or equivalent — verify current supported approach, this changes
  fast, do not assume last year's guidance still applies)
- Every env var / secret currently in Vercel needs an equivalent in Cloudflare — audit
  `.env.local` against Cloudflare's secret/binding model before cutover
- Supabase itself is unaffected (it's not hosted on Vercel) — only the Next.js app's hosting
  changes
- See SEO-EXPERT.md "Cloudflare migration" section for the redirect/SEO cutover checklist —
  zero tolerance for broken historical Ghost slugs during this move
- Cutover plan needs a rollback path — do not do this as a one-way door on a Friday

## 2. Visual direction — SUPERSEDED 2026-08-24, read the update below first

> The section below this line describes the original aiweekly.co-as-skin plan. It is
> **superseded** by the decision recorded immediately after it. Kept for context on how the
> thinking evolved — do not implement the aiweekly.co visual skin described below.

### 2b. FINAL — one unified visual system, confirmed 2026-08-24

**PaddockIntel adopts a single design system across the entire site — Hub, Circuits, Drivers,
Constructors, Blog, Digest, Book. No more "two modes," no more per-surface skin decisions.**
This replaces v0.3.0 "Swiss Industrial Print," replaces the reverted Data Mode, and replaces
the aiweekly.co-as-visual-skin plan below. It does NOT replace the aiweekly.co-derived
*information architecture* ideas (ranked feeds, an "Attention This Week"-style dashboard,
numbered Digest issues) — those survive as content structure, just executed in this visual
language instead of a dense mono aesthetic.

**Working name: "Vintage Editorial."** Reference: 2011 Japan Earthquake & Tsunami infographic
style (poster-format data storytelling, warm retro palette, illustrated single-subject visuals)
— see the two circuit mockups from this session for applied examples.

**Tokens (draft, to be formalized in the unified DESIGN.md rewrite):**
- Background: kraft paper `#EDE3D0` with a subtle noise/dot texture (not flat) — replaces
  `#F4F4F0` everywhere, including Hub
- Primary accent: terracotta `#C1502E` — replaces `--red: #E61919` as the primary accent
  color site-wide. Same usage discipline as before (punctual only, never a large fill) —
  only the hue changes, not the restraint rule
- Secondary: navy `#2B3A4A` — for illustrated map/diagram backgrounds, secondary data points
- Tertiary: mustard `#D9A441` — for secondary bar/chart series, never primary emphasis
- Text: near-black `#2B2620`, muted `#6B5F4E` for labels/metadata
- Typography: Archivo Black (headlines, hero numbers) + Lora (body/prose — now also
  appropriate for Hub surfaces, not just Blog/Book) + JetBrains Mono (data labels, still
  invariant across the whole site per the old DESIGN.md rule)
- Illustration pattern: single-subject illustrated visuals (a circuit as a "map with
  epicenter rings" instead of a flat schematic map, an "attention dashboard" rendered as
  poster-style stat blocks instead of a dense table) — this is the core differentiator from
  both the old Swiss Industrial look and the aiweekly.co density approach

**What carries over from the aiweekly.co research (information architecture, not visual skin):**
- Ranked/numbered content (circuit intel, attention dashboard entries) — render as poster-style
  numbered stat rows or bar charts in the new visual language, not as a dense mono list
- "Attention This Week" dashboard concept (Fastest riser / Most covered / Biggest fall /
  Dominant theme) — still a real content feature to build, now styled as Vintage Editorial
  poster blocks instead of a text-dense dashboard
- Numbered Digest issues — still valid, numbering treatment now in Archivo Black hero-number
  style consistent with the rest of the system

**Scope: full site, not just Circuits.** This confirmed decision (2026-08-24) extends what was
initially scoped to Circuits + post-race template only — it is now the standing visual system
everywhere, including the Hub home page (Hero/Ticker/TheGrid) whenever those are next touched.
It does NOT mean rebuild the kinetic home immediately — see the "still open" note at the end
of this document — but any new component built from this point forward uses Vintage Editorial
tokens, not the old `#F4F4F0`/`--red: #E61919` Swiss Industrial tokens.

**Immediate next step:** the unified `DESIGN.md` rewrite (already in progress from an earlier
session in this thread) must be built around these tokens as the sole system, replacing all
prior "Data Mode / Story Mode / v0.3.0" content rather than layering on top of it.

---

### 2a. ORIGINAL PLAN (superseded, kept for context only) — Hub + Blog reference: aiweekly.co

Target format (structure, not literal skin) for Hub and Blog: **aiweekly.co**. Keep SEO and
EEAT intact through the change — this is a redesign of presentation, not a reduction of rigor.

**What to carry over from the reference:**
- Dense, ranked, numbered story feed (rank number + source + relative time, e.g. "11m ago")
- An "Attention This Week" style dashboard: for F1 this becomes **Fastest riser** (biggest
  points/position gain this round), **Most covered** (most-discussed driver/team across
  tracked coverage), **Biggest fall**, **Dominant theme** (strategy/regulation/narrative of
  the week) — this does not exist anywhere in F1 media today, it is a real differentiation
  opportunity, not just a visual borrow
- Numbered digest issues (e.g. "#524" equivalent for PaddockIntel's Digest)
- Text-first, low-motion information density — this is a real philosophical shift away from
  the current kinetic-scroll Hub (GSAP/Three.js WarpField-heavy), not just a palette change
- "Who's Who" entity index — already exists as Drivers/Constructors pages, may need a unified
  index view
- Editor's Blog kept structurally distinct from Issues/Digest — matches existing Blog vs.
  Digest split, no restructuring needed there

**Scope confirmed 2026-08-24 — narrower than "rebuild the whole Hub," read carefully:**

The kinetic-scroll home page (`Hero.tsx` / `WarpField.tsx` / `Ticker.tsx` / `TheGrid.tsx` /
`StreaksSection.tsx` etc., per `SKILL.md` §10) is **NOT confirmed for replacement or archival**
— the user did not ask to touch it, so it stays exactly as-is unless a future session says
otherwise. Do not delete, archive, or restructure any of those components without an explicit
go-ahead in a later session — "rehacer todo si hace falta" was general appetite for boldness,
not a standing order to gut the working kinetic home.

**What IS confirmed and in scope, specifically:**

1. **Circuits section — map treatment.** Replace/redesign the current flat d3-geo SVG circuit
   map view with an aiweekly.co-density treatment: information-dense, data-forward, closer to
   a intelligence-dashboard read than a decorative map. This is scoped to `/circuits` and
   circuit detail pages — not the Hub homepage's own map-adjacent components (if any share
   code with Circuits, extract/duplicate rather than let a Circuits-specific redesign leak
   into the Hub home by accident).
2. **Post-race article/recap template.** A new article template specifically for "what
   happened after this race" content, structured to embed real Supabase-sourced stat blocks
   inline (not prose paraphrasing numbers) — think stat callout modules, standings deltas,
   pace/telemetry blocks — placeable within the five-section EDITORIAL.md structure, not a
   replacement for it. This is a new template variant, additive to the existing article system,
   not a fork of it.

**Before building either:** read `DESIGN.md` and `SKILL.md` first regardless. EEAT/schema
requirements (NewsArticle, FAQPage, BreadcrumbList, author attribution) survive any visual
rebuild unchanged — those are structural, not stylistic. See `EDITORIAL.md` and the four
advisor `.md` files (`SEO-EXPERT.md`, `DATA-EXPERT.md`, `EEAT-EXPERT.md`,
`SPORTS-JOURNALISM-EXPERT.md`) — none of their requirements are waived by either redesign.

**Still open, ask before assuming:** whether "Hub" beyond Circuits (i.e. the home page itself)
ever adopts this density treatment is undecided. Do not extend the aiweekly.co pattern past
Circuits + the post-race template without checking first.

## 3. User accounts — Google + email login, personalization

New feature, not previously scoped in any prior document:
- Auth: Google OAuth + email (magic link or password — decide auth provider before building;
  Supabase Auth is the natural fit given the existing Supabase dependency, verify current
  Supabase Auth + Cloudflare compatibility before committing)
- Personalization: follow constructors, follow drivers, follow "experts"
- **Experts** are external voices (X/Twitter or wherever sourced) — this is new curated content,
  not PaddockIntel's own editorial voice. See EEAT-EXPERT.md and SPORTS-JOURNALISM-EXPERT.md —
  attribution and identity verification are hard requirements before any expert take is
  surfaced to a user
- Personalization changes content *ordering*, never fabricates or reorders factual
  rankings/standings — same rule Mi Box already established (`docs/archive/CONCEPT-V2.md` §13.6): a
  user's followed content surfaces higher in their feed, but official standings/results
  tables stay untouched and accurate for everyone
- Privacy policy must be real and specific once accounts exist — see EEAT-EXPERT.md
  trustworthiness section

## 4. Content — new data-only vertical, beyond economics

PaddockIntel expands from "economic angle on F1" to also include **deep statistical/data
analysis** as its own pillar — pace indices, proprietary metrics, the kind of rigorous
data-forward content that (as of this decision) doesn't exist yet anywhere in F1 media at this
depth. This is a real product bet on being first, not a features add-on.
- Every new metric needs a public methodology page before it's cited anywhere — see
  DATA-EXPERT.md
- Same sourcing/EEAT rigor as economics content, no lighter version for this vertical
- FastF1 batch pipeline (already documented in SKILL.md §18) is the likely computational
  backbone for new metrics — the home Optiplex (Ubuntu/CasaOS/Docker) is available to scale
  for additional automation/Python compute if the pipeline needs more than the current setup

## 5. Advisor files — mandatory reads before publishing

Four new `.md` files exist in the repo (place under e.g. `docs/advisors/` or wherever the
other root `.md` docs live) and must be read before any article, digest issue, or
data-vertical piece ships:
- `SEO-EXPERT.md`
- `DATA-EXPERT.md`
- `EEAT-EXPERT.md`
- `SPORTS-JOURNALISM-EXPERT.md`

These do not replace `EDITORIAL.md` (voice/structure) or `DESIGN.md` (visual tokens) — they
are an additional gate. `CLAUDE.md`/`SKILL.md` should be updated to reference all four by path,
the same way they already reference `DESIGN.md` and `EDITORIAL.md`.

## Open items, not yet decided — flag before building, don't assume

- Auth provider final choice (Supabase Auth vs. alternative) — not decided in this session
- Whether the aiweekly.co-style Hub replaces the kinetic-scroll Hub entirely or coexists as a
  new default with the old one archived — not decided, needs explicit direction before a
  rebuild starts
- OpenF1/jolpica-f1 commercial licensing status — still unresolved (see `docs/archive/CONCEPT-V2.md` §13),
  now more urgent given the explicit ad-monetization + expanded data-vertical direction
