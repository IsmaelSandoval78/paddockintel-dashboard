# PaddockIntel · Project Skill (canonical)
# Read this before every task. Source of truth for route structure, data model, and implementation patterns.
# DESIGN.md (repo root, v0.3.0) is the source of truth for visual tokens — Swiss Industrial Print —
# and governs all four surfaces, including Hub. This file does not restate it; it implements it.
# EDITORIAL.md (repo root) is the source of truth for voice, article structure, and writing process —
# read it before drafting any article, digest issue, or newsletter copy.

---

## 00 · IDENTITY & SURFACES

**paddockintel.com** — single Next.js application unifying four surfaces:

- **Hub** — F1 statistics: drivers/constructors/compare/circuits/scorecards (existing, live)
- **Blog** — economic-angle editorial articles (replacing the suspended Ghost site)
- **Digest** — curated weekly aggregator of external F1/F1-economics news with original synthesis on top
- **Book** — collectible, chapter-based presentation of published articles + live data, no content of its own

All four read from one Supabase project. Design language: **Swiss Industrial Print** (DESIGN.md v0.3.0) —
confident, data-forward, zero ornamentation, zero border-radius, one visual language across every surface.
Stack: Next.js 16 · TypeScript · Tailwind v4 · Supabase · next-intl (EN/ES/PT). GSAP/Three.js exist as
established Hub patterns (§06–07) but are **not** a global dependency for new surfaces — see §06 note.

**Locale routing — `localePrefix: 'as-needed'` (decided 2026-06-23, Phase 1):**
Default locale (`en`) carries no path prefix anywhere on the site — Hub is `/`, `/circuits`, etc. (not
`/en/...`). `es`/`pt` keep their prefix (`/es/...`, `/pt/...`). This is site-wide, not a blog-only quirk —
it exists so the 106 historical Ghost blog slugs (root-level, no locale prefix) land at the exact same
path with zero redirect mapping. Route groups `(hub)` `(blog)` `(digest)` `(book)` all sit under
`app/[locale]/` and inherit this. Configured once in `lib/i18n/routing.ts` — `Link`/`useRouter`/
`usePathname` from `lib/i18n/navigation.ts` handle it transparently, no per-component changes needed.

---

## 01 · ROUTE STRUCTURE & DATA MODEL

```
app/[locale]/
  (hub)/      drivers, constructors, compare, circuits, scorecards...   [existing]
  (blog)/[slug]                                                         [new]
  (digest)/weekly/[issue-slug]                                          [new]
  (book)/season/[year]                                                  [new]
```

Shared across all groups: Supabase client, next-intl config, root layout, design tokens (DESIGN.md).
Each group gets its own nested layout for surface-specific chrome (article width, digest card list,
book pagination).

**New Supabase tables (already created, Phase 1):**

`articles` — `id, slug, title, meta_description, body (markdown), published_at, locale` + optional FKs
(`race_id`, `driver_id`, `constructor_id`, `season_id` — lets an article reference live stats instead of
hardcoded numbers) + `faq_items` (jsonb, for NewsArticle + FAQPage structured data)

`digest_items` — `id, issue_id, source_name, source_url, headline, our_summary (1-2 sentences, original
wording), entity_tags (text[]), published_at`

`digest_issues` — `id, slug, published_at, intro_synthesis` (the original-analysis paragraph tying the
week's items together)

**Content ingestion:** write content locally with frontmatter → `scripts/ingest-article.ts` upserts into
Supabase. No heavyweight CMS UI.
```
articles/2026-austria-gp-economic-impact.md  →  scripts/ingest-article.ts  →  Supabase
```

**FastF1 / telemetry rule:** FastF1 is Python — it never runs inside the Next.js/Vercel runtime. All
telemetry computation (track dominance, tire degradation, upgrade ROI, teammate deltas, the proprietary
pace index) happens in an offline batch script, run after each race weekend, that writes pre-calculated
results into Supabase. Next.js pages only ever read from Supabase — same pattern as Ergast data, never a
live call to FastF1 from the web app.

---

## 02 · EDITORIAL & OPERATING PRINCIPLES

**Sourcing rule (absolute):** never invent data, URLs, IDs, or quotes. Always verify with search before
including external information. Digest items use the numbered-source format:
`1. [Outlet Name — description](url?ref=paddockintel.com)`. One quote max per source; default to
paraphrase.

**EEAT signals (required, not optional):**
- `/about` or `/author/ismael-sandoval` — real, verifiable background. Every article and digest issue
  links to it.
- First-party data (proprietary FastF1-derived metrics — Driver Pace Index, circuit insights) is the
  strongest EEAT asset in the project — surface it as the thing that makes the site citable, never bury
  it as "just a Hub feature."

**i18n for editorial content:** every article ships in EN/ES/PT simultaneously — not staggered. English
is the source of truth (existing SEO equity lives there), but all three locales are written/reviewed with
care, never machine-translated and left unchecked. `articles.locale` supports this without schema
changes — each locale is its own row, its own review pass. hreflang tags across all three versions of
each article, same pattern the Hub already uses for other pages.

**Newsletter & distribution:** the Digest is one piece of content, two delivery formats — not two
projects. Web: the `(digest)` route group page. Email: same `digest_items` data via Resend + React Email
(React components double as templates). Needs an email capture component (input + button) feeding a
subscriber table in Supabase — appears on Blog, Digest, and Hub pages.

**Low-touch by design, selectively:**
- Automated, no manual trigger: FastF1 batch pipeline (post-race-weekend cron), sitemap.xml + RSS
  (build-time from Supabase), Digest email send (fires on `published` flag in Supabase, never manual
  export/send)
- Stays deliberately manual: article writing/economic analysis, digest item selection + synthesis
  paragraph — full automation of curation is exactly how EEAT and trust erode into thin content

**SEO continuity (non-negotiable — this is the recovery point):** Ghost served every article at the
domain root with a trailing slash (e.g. `paddockintel.com/suzuka-2026-.../`, no `/blog/` prefix). The
`(blog)/[slug]` route group lands at the same root path — **no redirect map needed** for the 106
historical slugs. The one real requirement: `trailingSlash: true` in `next.config` (already set) so every
article URL ends in `/` exactly like the old Ghost URLs. Every article ships with NewsArticle +
BreadcrumbList + FAQPage schema, validated in Google Rich Results Test before publish. Title ≤ 60 chars,
meta description ≤ 145 chars. `redirects.json` stays scaffolded for future one-off slug changes only.

**Austria GP scope ladder — target Sun, June 28:** all three new surfaces live, scoped to MVP:
1. Blog — one article on the Austria GP's economic angle, full schema, live at a real slug.
2. Digest — one issue, 6-10 items, real verified sources, one synthesis paragraph. No coverage-cluster
   mechanism yet — not earned at this content volume.
3. Book — one chapter view rendering that article in book-style layout, typography only.
Anything beyond this ladder before Austria is scope creep. Defer it.

**Known tech debt — carry forward, don't block on:** Supabase PostgREST max-rows cap truncating
Ferrari/McLaren at 1,000 rows · `middleware.ts` deprecation warning · Driver page polish (Season by
Season align-items, Qualifying Record scroll, Russell nationality mapping) · Constructors detail page
redesign.

---

## 03 · CSS TOKENS (globals.css — never hardcode these values)

Aligned to DESIGN.md v0.3.0 — Swiss Industrial Print, governs Hub + Blog + Digest + Book.

```css
/* Substrate */
--bg              #F4F4F0   /* page base — warm off-white paper */
--surface         #F4F4F0
--surface-raised  #ECEBE6   /* section alternates, cells */

/* Borders */
--border          #0A0A0A   /* 1px divider — full weight */
--border-subtle   #B5B4AE   /* ghost hairlines */

/* Text hierarchy */
--text-1          #0A0A0A   /* primary — near black, never pure #000 */
--text-2          #6B6B6B   /* secondary — metadata, section labels */
--text-3          #B5B4AE   /* tertiary — ghosts, placeholders */

/* Accent */
--red             #E61919   /* racing red — links, active states, key callouts. Never a large fill. */
--red-dim         #FBE9E8   /* red wash for hover states */
--gold            #C9A84C
--gold-dim        #F5E8CC
--green           #22C55E
--green-dim       #E8F5EE

/* Motion */
--ease            cubic-bezier(0.16, 1, 0.3, 1)
--fast            100ms
--base            150ms

/* Shape */
--radius          0          /* zero everywhere, no exceptions, on any surface */
```

**Tailwind usage:** `bg-bg`, `text-text-1`, `text-text-2`, `text-text-3`, `text-red`, `border-border`,
`border-border-subtle`, `bg-surface-raised`. `rounded-none` (or no radius utility at all) everywhere.

**Migration note:** Hub components currently reference `--bg: #FAFAF7` in `globals.css`. DESIGN.md v0.3.0
intentionally extends to Hub (confirmed decision, 2026-06-24) — updating the single CSS variable in
`globals.css` is the actual code change required to apply this; it has **not** been made yet. Audit any
component with a hardcoded `rounded-*` (other than `rounded-none`) at the same time — zero-radius is a
DESIGN.md hard rule the existing Hub may not yet satisfy everywhere.

**Neumorphism:** reserved exclusively for Hub home KPI cards. Does not appear in Blog, Digest, or Book.
Never default to it on a new surface — propose explicitly if one wants a "lifted" card.

---

## 04 · FONTS

| Role | CSS var | Tailwind class | Usage |
|---|---|---|---|
| Display/headlines | `var(--pi-display)` | `font-display` | Archivo Black — section titles, hero numbers, KPI labels, short callout lines only |
| UI / short-form | `var(--pi-sans)` | `font-sans` | Inter, regular weight — Hub UI labels, Digest `our_summary` (short-form only) |
| Long-form prose | `var(--pi-prose)` | `font-prose` | Lora, regular/medium, line-height 1.6+ — Blog/Book body copy only |
| Data/numbers | `var(--pi-mono)` | `font-mono` | JetBrains Mono — stats, timestamps, lap times, anything tabular |

**Always** `tabular-nums` on any numeric column — body has `font-variant-numeric: tabular-nums` globally.
**Never** DM Serif Display. Archivo Black for display weight only — never forced into paragraphs.

Body font decision **locked 2026-06-22**: Lora for Blog/Book long-form reading surfaces (gives them a
distinct "reading" register from the Hub's data-forward UI); Digest `our_summary` stays Inter since it's
short-form. Wired via `next/font/google` in `app/[locale]/layout.tsx` (`--pi-prose` → `--font-prose`).

**Surface-specific (DESIGN.md):**
- **Blog** — max content width ~680-720px desktop; header stats in JetBrains Mono; body in Lora;
  pull-quotes/Verdict may use Archivo Black for short lines only.
- **Digest** — card-list layout; headline Inter bold; source chip JetBrains Mono small uppercase;
  `our_summary` Inter regular (short-form, not Lora).
- **Book** — page-like rhythm, wider margins than Blog; chapter numbers Archivo Black; body Lora;
  background may shift to pure white per "page"; accent red reserved for chapter dividers only.

---

## 05 · GLOBAL CSS UTILITIES (globals.css)

```css
.kinetic-mask       /* overflow:hidden display:block — wraps SplitText containers */
                    /* children animate with yPercent from below the mask clip */

.velocity-cursor    /* applied to <body> by HomeExperience on desktop+motion */
                    /* cursor:none on body + a + button */

.pulse-red          /* live dot animation — 1.5s ease-in-out infinite scale+opacity */
                    /* usage: <span class="pulse-red inline-block w-1.5 h-1.5 rounded-full bg-red" /> */

.era-grid-*         /* responsive auto-fill grids for driver/constructor card eras */
```

---

## 06 · GSAP PATTERNS — Hub legacy cookbook

**Scope note:** these patterns are already shipped across Hub (`components/home/kinetic/*`,
`components/circuits/kinetic/*`). They remain valid documentation for maintaining that code. They are
**not** the default for Blog/Digest/Book: per docs/archive/PHASES.md, "GSAP — only adopt on a specific page once a
specific effect justifies it; never a global dependency." New surfaces should reach for CSS-native motion
(scroll-driven animations, transitions, `prefers-reduced-motion` respected) first, and only dynamic-import
GSAP on a specific page when a specific effect earns it.

### Register once per client tree
```tsx
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, ScrambleTextPlugin);
```
All GSAP 3.13+ plugins are free — no license check needed.

### SplitText "lights out" — chars rise one by one
```tsx
// ALWAYS inside document.fonts.ready.then() — fonts must load first
// ALWAYS set visibility:hidden on el until GSAP fires (no flash)
const split = new SplitText(el, { type: 'chars' });
gsap.set(el, { visibility: 'visible' });
gsap.from(split.chars, {
  yPercent: 110,    // exits from below kinetic-mask
  duration: 1.0,
  stagger: { each: Math.min(0.035, 0.26 / split.chars.length) },  // cap for long names
  ease: 'power4.out',
  delay: 0.18,      // hero; scroll-triggered = scrollTrigger: { start:'top 85%', once:true }
});
// Wrap el in .kinetic-mask — overflow:hidden clips the rise
```

### ScrambleText — timing-monitor meta lines
```tsx
gsap.to(el, {
  duration: 1.1,
  scrambleText: { text: finalText, chars: '0123456789·/|', speed: 0.4 },
  ease: 'none',
});
// Set el innerHTML to '' before animation, show finalText as static fallback if !motionOk
```

### Counter "gap closing"
```tsx
const obj = { v: 0 };
gsap.to(obj, {
  v: targetNumber,
  duration: 1.4,   // hero counters: 1.8s
  ease: 'expo.out',
  scrollTrigger: { trigger: el, start: 'top 88%', once: true },
  onUpdate() { el.textContent = String(Math.round(obj.v)); },
});
// Attach data-val={value} to el; GSAP reads it at trigger time
```

### DrawSVG — "flying lap" track draws on scroll
```tsx
gsap.fromTo(pathRef.current,
  { drawSVG: '0%' },
  {
    drawSVG: '100%',
    ease: 'none',
    scrollTrigger: { trigger: wrapRef.current, start: 'top 88%', end: 'bottom 45%', scrub: 1 },
  },
);
// SVG needs two <path>: ghost (stroke:var(--border-subtle) 1.5px) + animated (stroke:var(--text-1) 3.5px)
```

### Scroll-velocity skew — g-force
```tsx
const proxy = { skew: 0 };
const skewSetter = gsap.quickSetter(container, 'skewY', 'deg');
const clamp = gsap.utils.clamp(-3.5, 3.5);
ScrollTrigger.create({
  trigger: section,
  start: 'top bottom', end: 'bottom top',
  onUpdate(self) {
    const skew = clamp(self.getVelocity() / -350);
    if (Math.abs(skew) > Math.abs(proxy.skew)) {
      proxy.skew = skew;
      gsap.to(proxy, { skew: 0, duration: 0.8, ease: 'power3', overwrite: true,
        onUpdate: () => skewSetter(proxy.skew) });
    }
  },
});
```

### Infinite ticker — pit wall feed
```tsx
// Duplicate content × 2 in DOM (two <Half /> siblings)
gsap.to(trackRef.current, { xPercent: -50, duration: 36, ease: 'none', repeat: -1 });
// Parent: overflow-hidden. Content: w-max flex will-change-transform
```

### Rows launch from left — grid forming
```tsx
gsap.from('.grid-row', {
  x: -48, autoAlpha: 0, duration: 0.7, stagger: 0.055, ease: 'power4.out',
  scrollTrigger: { trigger: listRef.current, start: 'top 82%', once: true },
});
```

### gsap.context — always use, always revert
```tsx
const ctx = gsap.context(() => {
  // all animations here
}, rootRef);
return () => ctx.revert();
```

---

## 07 · THREE.JS WARPFIELD (Hub Hero background only)

`components/home/kinetic/WarpField.tsx` — dynamically imported `{ ssr: false }`.

Pattern: N line-segments (head + tail) travel toward camera along z-axis.
- Tail length = `0.6 + velocity * 9` — streak encodes speed
- Color split: 78% ink (#0a0a0a) · 14% team color · 8% race red
- Scroll → `boost` multiplier (decays at 0.94/frame)
- Mouse → camera parallax (cam.x lerp 0.035)
- `renderer.setClearColor(0x000000, 0)` — transparent, floats on paper substrate
- `devicePixelRatio` capped at 2
- Always dispose: geometry, material, renderer on unmount

Desktop density: 320. Mobile: 100. Three.js is Hub-Hero-specific — do not introduce it on Blog/Digest/Book
without the same justification bar as §06.

---

## 08 · fitToWidth (kinetic display type — never wraps)

`components/home/kinetic/fitText.ts`

```tsx
// Call after document.fonts.ready.then()
fitToWidth(el)           // scales fontSize so text fits parent exactly (0.97 safety margin)
cleanup = observeFit(el) // ResizeObserver keeps it fitted on resize
// return () => cleanup?.()  in useEffect
```

Used on: Hero surname (h1), LastRaceChapter circuit name (h2), KineticFooter wordmark.
Always set `whitespace-nowrap` and initial `fontSize: clamp(...)` as CSS fallback.

---

## 09 · TEAM COLORS

`components/home/kinetic/teamColors.ts` — darkened for light substrate.

```ts
import { teamColor } from '@/components/home/kinetic/teamColors';
const color = teamColor(driver.constructor_ref); // returns hex or #B5B4AE fallback
```

Keys: `mercedes`, `mclaren`, `red_bull`, `ferrari`, `alpine`, `aston_martin`, `haas`, `williams`, `sauber`
/ `kick_sauber`, `rb` / `alphatauri`, `cadillac`, `audi`.

CSS vars also available: `--team-mercedes`, `--team-mclaren`, `--team-redbull`, `--team-ferrari`,
`--team-alpine`, `--team-aston`, `--team-haas`, `--team-williams`, `--team-sauber`, `--team-rb`.

Team color usage:
- `border-left` or `border-top` hairlines on cards/rows
- Hover flood: `background: color; opacity: 0.07` — `origin-left scale-x-0 group-hover:scale-x-100`
- Point bars in TheGrid
- P1 badge background
- Ghost dot tint in WarpField

---

## 10 · HOME PAGE ARCHITECTURE (Hub)

```
app/[locale]/page.tsx          — RSC, fetches all Supabase data, passes to HomeExperience
components/home/kinetic/
  HomeExperience.tsx           — 'use client' orchestrator: env detection, custom cursor, ScrollTrigger refresh
  Hero.tsx                     — WarpField + SplitText surname + ScrambleText meta + counters + parallax
  WarpField.tsx                — Three.js line-streaks (dynamic import, ssr:false)
  Ticker.tsx                   — Race-red infinite marquee, Archivo Black
  LastRaceChapter.tsx          — TrackDraw + podium stagger + fastest lap/pit data
  NextRaceChapter.tsx          — TrackDraw + countdown digits + lap record in red
  TheGrid.tsx                  — Top 10, velocity skew, ghost numerals, point bars, hover flood
  StreaksSection.tsx           — 2×2 grid cells, counters fire on enter
  KineticFooter.tsx            — PADDOCKINTEL wordmark at viewport width, SplitText on scroll
  TrackDraw.tsx                — Reusable DrawSVG component (ghost path + animated path)
  fitText.ts                   — fitToWidth() + observeFit()
  teamColors.ts                — TEAM_COLORS map + teamColor() helper
```

**Section numbering convention:**
```
01 · HERO
02 · TICKER
03 · LAST RACE
04 · NEXT RACE
05 · THE GRID
06 · STREAKS
07 · FOOTER (no section number shown)
```

**motionOk / isMobile pattern:**
```tsx
// SSR renders static editorial layout (env = null → motionOk=false, isMobile=true)
const [env, setEnv] = useState<{ motionOk: boolean; isMobile: boolean } | null>(null);
useEffect(() => {
  const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  setEnv({ motionOk, isMobile });
}, []);
const motionOk = env?.motionOk ?? false;  // false = static fallback
const isMobile = env?.isMobile ?? true;
```

---

## 11 · INNER PAGES GRAMMAR (Circuits, Drivers, Constructors, Compare)

**Page Header — `h-12` (48px):**
```
[mono 10px text-2] NN · SECTION TITLE · [count]    [loading… ml-auto mono text-3]
bottom: border-b border-border  bg: bg-bg
```
Title: Archivo Black `clamp(1.4rem, 2vw, 1.8rem)` uppercase ls -0.03em, wrapped in `.kinetic-mask` + SplitText.

**Filter Bar — `h-9` (36px):**
- Mono 11px uppercase tracking-[0.1em] buttons, no border, no bg
- Active = `var(--red)`, inactive = `var(--text-1)`, transition 150ms
- `border-b border-border`

**Split Layout (desktop):**
- Intelligence Panel: `width: 0% → 42%`, `transition-[width] duration-300 ease-out`, `border-r border-border overflow-y-auto`
- Map/WebGL: `flex-1`
- Mobile: panel replaces map (BottomSheet)

**Panel anatomy:**
- Header: Archivo Black `clamp(1.1rem, 1.6vw, 1.4rem)` + mono meta below + `×` close button `w-7 h-7`
- Section headers: `"NN ·" label` — mono 10px text-2, py-2.5, border-b
- Data rows: `h-9 px-5`, 1px borders, value text-1, label mono text-3 ml-auto
- Hero numbers: Archivo Black `text-[2rem]` tabular-nums
- Timing / fastest lap values: `font-mono text-[13px]` **always** `color: var(--red)`
- CTA: mt-auto, red link, font-mono 11px uppercase tracking-[0.08em]

All panel/card edges: zero border-radius (DESIGN.md hard rule) — flag and fix any `rounded-*` other than
`rounded-none` found in these components.

---

## 12 · TYPOGRAPHY SCALE (display type)

| Context | Size | Letter-spacing | Line-height |
|---|---|---|---|
| Hero surname | `clamp(64px, 17vw, 250px)` + fitToWidth | -0.04em | 0.85 |
| Section title (home) | `clamp(34px, 6.5vw, 92px)` | -0.03em | 0.9 |
| Kinetic footer wordmark | `clamp(38px, 9.2vw, 150px)` + fitToWidth | -0.04em | 0.85 |
| Streak numbers | `clamp(48px, 8vw, 110px)` | -0.04em | none |
| Ghost numerals (grid) | `clamp(56px, 9vw, 130px)` | -0.05em | none |
| Points / stats hero | `clamp(40px, 7vw, 88px)` | -0.03em | none |
| Panel hero number | `text-[2rem]` | default | none |
| Ticker | `clamp(14px, 2vw, 20px)` | -0.01em | none |

Mono labels: always `uppercase`, `tracking-[0.1em]–[0.2em]`, `text-[8px]–[11px]`.

---

## 13 · MOTION TIMING RULES

| Type | Duration | Ease |
|---|---|---|
| SplitText entrance | 0.8–1.0s | power4.out |
| Fade/rise (rows, cells) | 0.6–0.8s | power3.out / power4.out |
| Counters | 1.4–1.8s | expo.out |
| Hover transitions | 150–300ms | power2.out / ease-out (CSS) |
| Skew recovery | 0.8s | power3 |
| Ticker loop | 36s | none (linear) |
| Custom cursor dot | 0.08s | power2.out |
| Custom cursor ring | 0.45s | power3.out |

Stagger range: 0.02–0.08s. ScrollTrigger start: `'top 82%'–'top 92%'`. Always `once: true` for entrance reveals.

---

## 14 · SUPABASE QUERY CONVENTIONS

- Server-side only: `createClient()` from `@/lib/supabase/server` in `app/api/` routes and RSC pages
- Aggregated stats: always prefer `driver_stats` / `constructor_stats` over joins
- Current season: `year = 2026`
- Fastest lap text field: parse carefully (`rank = 1`, exclude `'\\N'` and `''`)
- Position filters: `position_text = 'R'` for retirements, `position IN (1,2,3)` for podiums
- Never mock data — always query Supabase

---

## 15 · RESPONSIVE & SHARING RULES (every surface)

**Responsive — mobile/tablet-first, non-negotiable.** Every new surface gets checked at minimum 375px
(phone), 768px (tablet), 1280px (desktop) before it's considered done:
- Bento grid (Hub home, Digest cards) collapses to single column on phone, 2-col on tablet
- Headline sizes use `clamp()` for fluid scaling — fixed `rem` breaks Archivo Black hero size at 375px
- Blog/Book max-width (680-720px) only applies above tablet breakpoint; full-width with side padding on phone
- Data tables (JetBrains Mono) get horizontal scroll or a stacked/card fallback on phone — never
  shrink-to-fit a 10-column table
- Nav collapses to a menu below tablet breakpoint

**Sharing — every card needs a share action.** Digest item cards and Blog article preview cards both get
a share button: square, zero border-radius, icon-only, consistent position across all card types.
- Mobile/tablet: native Web Share API (`navigator.share`) — opens the OS share sheet directly
- Desktop fallback (no Web Share API support): small flyout menu — copy link, X, Facebook, WhatsApp
  (`wa.me/?text=` link, no SDK) — WhatsApp gets priority placement given the ES/PT LatAm/Brazil audience
- Color: near-black by default, accent red only on hover/active — same restraint rule as everywhere else

---

## 16 · CRITIQUE GATE (before shipping any component)

Score 1–5. Minimum 4 on all six to ship.

| # | Dimension | Question |
|---|---|---|
| 1 | Philosophy | Editorial, not SaaS? Would it run in a racing magazine? |
| 2 | Hierarchy | Primary info readable in 3 seconds? |
| 3 | Execution | No layout shift, no jank, no hardcoded values? |
| 4 | Specificity | Unmistakably F1 intel, not generic sports? |
| 5 | Restraint | Every element earns its place? Nothing decorative? |
| 6 | Motion | Does each animation encode an F1 concept? Static fallback flawless? |

---

## 18 · POST-RACE DATA PIPELINE

Run `scripts/load_race.py` after every race weekend to push FastF1 data into Supabase.
This is the **only** way race results enter the DB — the web app never calls FastF1 directly.

### Tables updated
`results` · `qualifying` · `pit_stops` · `driver_standings` · `constructor_standings`

After running, manually refresh aggregated stats in the Supabase SQL Editor:
```sql
REFRESH MATERIALIZED VIEW driver_stats;
REFRESH MATERIALIZED VIEW constructor_stats;
```
(If they are plain tables, a separate `scripts/refresh_stats.sql` is needed — check first.)

### Setup (one-time)
```bash
pip install -r scripts/requirements-data.txt
```
Reads credentials from `.env.local` — no extra config needed.
FastF1 caches session data in `.fastf1_cache/` (gitignored).

### Running
```bash
# Full weekend (qualifying + race + standings) — most common
python scripts/load_race.py --year 2026 --round 11

# Dry-run first to verify mappings without writing anything
python scripts/load_race.py --year 2026 --round 11 --dry-run

# Race only (if qualifying already loaded)
python scripts/load_race.py --year 2026 --round 11 --skip-quali

# Qualifying only
python scripts/load_race.py --year 2026 --round 11 --skip-race
```

### Finding the round number
The `races` table has `year`, `round`, `name`. Query it or check the calendar:
```bash
# Quick lookup via Supabase MCP or SQL Editor:
SELECT round, name FROM races WHERE year = 2026 ORDER BY round;
```

### If a constructor is unknown
Add it to `TEAM_TO_CONSTRUCTOR_REF` at the top of `scripts/load_race.py`.
FastF1 sometimes changes team name strings mid-season.

### Dashboard update
The home page uses `revalidate = 3600`. After a successful load, the new results
appear within 1 hour automatically — or force a redeploy to show them immediately:
```bash
git commit --allow-empty -m "chore: trigger redeploy post-race" && git push
```

---

## 17 · DO NOT LIST (project-wide)

- No dark page backgrounds — ever. `#F4F4F0` minimum.
- No border-radius anywhere, on any surface. No exceptions.
- No motion without F1 meaning (no floating blobs, aimless drift, decorative pulse).
- No scroll-jacking — scrub ScrollTrigger, never override `window.scrollY`.
- No layout shift from animation — SplitText containers must reserve height.
- No pie charts, no glassmorphism, no gradients on data surfaces.
- No `any` TypeScript type.
- No hardcoded F1 data that exists in Supabase.
- No Leaflet imported at top level — always `dynamic(() => import(...), { ssr: false })`.
- No inline styles with raw hex — use CSS vars.
- No GSAP/Three.js adopted on Blog/Digest/Book without a specific effect justifying it — never a global
  dependency on new surfaces (existing Hub usage is documented in §06–07, not a precedent to extend by default).
- No WebGL on the critical render path — hero text paints before canvas.
- No new npm dependencies without asking.
- No invented data, URLs, IDs, or quotes — verify with search before including external information.
