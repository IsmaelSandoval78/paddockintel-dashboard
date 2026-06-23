# PaddockIntel · Project Skill v1.0
# Read this before every task. It is the source of truth for patterns, tokens, and conventions.

---

## 00 · IDENTITY

**hub.paddockintel.com** — F1 economic and performance intelligence hub.
Design language: **VELOCITY — Kinetic Editorial System** (DESIGN.md Vol.02, adopted 2026-06-12).
Style category: Swiss Motion Editorial — International Typographic Style + interactive motion journalism.
Stack: Next.js 16 · TypeScript · Tailwind v4 · Supabase · GSAP 3.13+ · Three.js · next-intl (EN/ES/PT).

**Brand position:** The only light F1 property. Darkness is everyone else's crutch.

**Locale routing — `localePrefix: 'as-needed'` (decided 2026-06-23, Phase 1):**
Default locale (`en`) carries no path prefix anywhere on the site — Hub is `/`, `/circuits`, etc. (not `/en/...`). `es`/`pt` keep their prefix (`/es/...`, `/pt/...`). This is **site-wide**, not a blog-only quirk: it exists so the 106 historical Ghost blog slugs (root-level, no locale prefix) land at the exact same path with zero redirect mapping. Route groups `(hub)` `(blog)` `(digest)` `(book)` all sit under `app/[locale]/` and inherit this. Configured once in `lib/i18n/routing.ts` — `Link`/`useRouter`/`usePathname` from `lib/i18n/navigation.ts` already handle it transparently, no per-component changes needed.

---

## 01 · CSS TOKENS (globals.css — never hardcode these values)

```css
/* Substrate */
--bg              #FAFAF7   /* page base — paper white */
--surface         #FAFAF7
--surface-raised  #F1F0EC   /* section alternates, cells */

/* Borders */
--border          #0A0A0A   /* 1px divider — full weight */
--border-subtle   #B5B4AE   /* ghost hairlines */

/* Text hierarchy */
--text-1          #0A0A0A   /* primary — near black */
--text-2          #6B6B6B   /* secondary — metadata, section labels */
--text-3          #B5B4AE   /* tertiary — ghosts, placeholders */

/* Accent */
--red             #E10600   /* official F1 race red */
--red-dim         #FBE9E8   /* red wash for hover states */
--gold            #C9A84C
--gold-dim        #F5E8CC
--green           #22C55E
--green-dim       #E8F5EE

/* Motion */
--ease            cubic-bezier(0.16, 1, 0.3, 1)
--fast            100ms
--base            150ms
```

**Tailwind usage:** `bg-bg`, `text-text-1`, `text-text-2`, `text-text-3`, `text-red`, `border-border`, `border-border-subtle`, `bg-surface-raised`.

---

## 02 · FONTS

| Role | CSS var | Tailwind class | Usage |
|---|---|---|---|
| Kinetic display | `var(--pi-display)` | `font-display` | Archivo Black — all display type, numbers |
| Body | `var(--pi-sans)` | `font-sans` | Inter — rare, labels only |
| Mono / data | `var(--pi-mono)` | `font-mono` | JetBrains Mono — meta, timing, labels |

**Always** use `style={{ fontFamily: 'var(--pi-display)' }}` for display type — Tailwind's `font-display` alias works too.
**Always** `tabular-nums` on any numeric column — body has `font-variant-numeric: tabular-nums` globally.
**Never** DM Serif Display (old system). Archivo Black only.

---

## 03 · GLOBAL CSS UTILITIES (globals.css)

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

## 04 · GSAP PATTERNS (the vocabulary — every pattern has an F1 meaning)

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

## 05 · THREE.JS WARPFIELD (Hero background)

`components/home/kinetic/WarpField.tsx` — dynamically imported `{ ssr: false }`.

Pattern: N line-segments (head + tail) travel toward camera along z-axis.
- Tail length = `0.6 + velocity * 9` — streak encodes speed
- Color split: 78% ink (#0a0a0a) · 14% team color · 8% race red
- Scroll → `boost` multiplier (decays at 0.94/frame)
- Mouse → camera parallax (cam.x lerp 0.035)
- `renderer.setClearColor(0x000000, 0)` — transparent, floats on paper substrate
- `devicePixelRatio` capped at 2
- Always dispose: geometry, material, renderer on unmount

Desktop density: 320. Mobile: 100.

---

## 06 · fitToWidth (kinetic display type — never wraps)

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

## 07 · TEAM COLORS

`components/home/kinetic/teamColors.ts` — darkened for light substrate.

```ts
import { teamColor } from '@/components/home/kinetic/teamColors';
const color = teamColor(driver.constructor_ref); // returns hex or #B5B4AE fallback
```

Keys: `mercedes`, `mclaren`, `red_bull`, `ferrari`, `alpine`, `aston_martin`, `haas`, `williams`, `sauber` / `kick_sauber`, `rb` / `alphatauri`, `cadillac`, `audi`.

CSS vars also available: `--team-mercedes`, `--team-mclaren`, `--team-redbull`, `--team-ferrari`, `--team-alpine`, `--team-aston`, `--team-haas`, `--team-williams`, `--team-sauber`, `--team-rb`.

Team color usage:
- `border-left` or `border-top` hairlines on cards/rows
- Hover flood: `background: color; opacity: 0.07` — `origin-left scale-x-0 group-hover:scale-x-100`
- Point bars in TheGrid
- P1 badge background
- Ghost dot tint in WarpField

---

## 08 · HOME PAGE ARCHITECTURE

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

## 09 · INNER PAGES GRAMMAR (Circuits, Drivers, Constructors, Compare)

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

---

## 10 · TYPOGRAPHY SCALE (display type)

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

## 11 · MOTION TIMING RULES

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

## 12 · SUPABASE QUERY CONVENTIONS

- Server-side only: `createClient()` from `@/lib/supabase/server` in `app/api/` routes and RSC pages
- Aggregated stats: always prefer `driver_stats` / `constructor_stats` over joins
- Current season: `year = 2026`
- Fastest lap text field: parse carefully (`rank = 1`, exclude `'\\N'` and `''`)
- Position filters: `position_text = 'R'` for retirements, `position IN (1,2,3)` for podiums
- Never mock data — always query Supabase

---

## 13 · CRITIQUE GATE (before shipping any component)

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

## 14 · DO NOT LIST (project-wide)

- No dark page backgrounds — ever. `#FAFAF7` minimum.
- No motion without F1 meaning (no floating blobs, aimless drift, decorative pulse).
- No scroll-jacking — scrub ScrollTrigger, never override `window.scrollY`.
- No layout shift from animation — SplitText containers must reserve height.
- No pie charts, no glassmorphism, no `rounded-3xl`, no gradients on data surfaces.
- No `any` TypeScript type.
- No hardcoded F1 data that exists in Supabase.
- No Leaflet imported at top level — always `dynamic(() => import(...), { ssr: false })`.
- No `inline styles` with raw hex — use CSS vars.
- No GSAP plugins beyond the registered set without asking.
- No WebGL on the critical render path — hero text paints before canvas.
- No pie charts. Ranked lists only.
- No new npm dependencies without asking.
