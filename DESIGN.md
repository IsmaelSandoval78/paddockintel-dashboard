# PADDOCKINTEL · DESIGN.md
# hub.paddockintel.com · Vol.02 · VELOCITY — Kinetic Editorial System
# Motion-first. Light substrate. The WOW is choreography, not decoration.

---

## 00 · PHILOSOPHY

VELOCITY is what happens when a Swiss editorial spread learns to move at 300 km/h.

- The substrate stays **light** — we are the only F1 property that isn't black.
  That is the brand. Darkness is everyone else's crutch.
- The spectacle is **motion**: scroll-driven storytelling, kinetic type,
  circuits that draw themselves, numbers that count, particles that react.
- Every animation must encode meaning: speed, position, time, momentum.
  If a motion doesn't map to an F1 concept, it doesn't ship.
- Data is still the hero. Motion is how the data makes its entrance.

**The test:** mute the motion (prefers-reduced-motion) and the page must still
be a flawless editorial layout. Motion is a layer, never a dependency.

---

## 01 · COLOR

```
Substrate            #FAFAF7   /* paper white — page base */
Substrate raised     #F1F0EC   /* section alternates, cells */
Ink                  #0A0A0A   /* near-black — text, borders */
Ink muted            #6B6B6B   /* secondary — metadata, labels */
Ink faint            #B5B4AE   /* tertiary — ghosts, placeholders */
Race red             #E10600   /* official F1 red — THE accent */
Race red dim         #FBE9E8   /* red wash for hover states */
Grid ink             #0A0A0A   /* 1px divider gap background */
```

### Reglas
- Race red earns: ticker strip, live dots, lap-record times, P1 markers,
  cursor, scroll indicator. Never as large surface fill except the ticker.
- Team colors: the only other chroma. Hairlines, border-lefts, particle
  tints. Use darkened variants on light substrate (see TEAM_COLORS map).
- Pure white #FFFFFF prohibited as page background. #FAFAF7 minimum warmth.
- Dark surfaces: ONLY exportable scorecards. The hub never goes dark.

---

## 02 · TYPOGRAPHY

| Role | Font | Spec |
|---|---|---|
| Kinetic display | Archivo Black | clamp(64px, 16vw, 240px) · lh 0.85 · ls -0.04em · uppercase |
| Section titles | Archivo Black | clamp(28px, 5vw, 64px) · lh 0.9 · ls -0.03em · uppercase |
| Data numbers | Archivo Black | tabular contexts · ls -0.03em |
| Micro UI / labels | JetBrains Mono | 8–11px fixed · tracking 0.12–0.18em · uppercase |
| Timing data | JetBrains Mono | tabular-nums always · lap times in race red |
| Body (rare) | Inter | 400/500 · the hub speaks in labels, not paragraphs |

Kinetic display type is *meant* to be cropped, to bleed off-canvas, to
overlap section borders. Scale discomfort = editorial confidence.

---

## 03 · MOTION SYSTEM (the core of VELOCITY)

### Library stack
- **GSAP 3.13+** (all plugins free): SplitText, ScrollTrigger, DrawSVGPlugin,
  ScrambleTextPlugin. Register once per client tree.
- **Three.js**: WebGL particle fields only. Dynamic import, `ssr: false`,
  devicePixelRatio capped at 2, dispose everything on unmount.

### Choreography vocabulary — every move maps to an F1 concept

| Effect | F1 meaning | Implementation |
|---|---|---|
| Chars rise with stagger | grid lights out, one by one | SplitText chars, y:110%, stagger 0.035, power4.out |
| Track draws itself | a flying lap | DrawSVGPlugin 0→100% scrubbed to scroll |
| Numbers count up | the gap closing | gsap.to(obj) + expo.out, trigger on enter |
| Scroll-velocity skew | g-force under braking | container skewY from ScrollTrigger velocity |
| Infinite ticker | timing screen / pit wall feed | xPercent -50 loop, duplicated content |
| Scramble text | timing monitor refresh | ScrambleTextPlugin on mono labels |
| Warp particles | speed itself | Three.js points streaming past camera, scroll-reactive |
| Parallax layers | depth of field at speed | data-depth transforms, deepest = fastest |

### Timing rules
- Entrances: 0.6–1.2s, power4.out / expo.out. Never linear, never bounce.
- Scrubbed effects: tied to scroll position (scrub: true or scrub: 1).
- Stagger range: 0.03–0.08s. More feels sluggish.
- Nothing animates on loop except the ticker and particle fields.

### Performance & accessibility gates (ship blockers)
- 60fps on mid-range hardware. Animate only transform/opacity in DOM.
- `prefers-reduced-motion: reduce` → kill ScrollTriggers, show final states,
  render static fallback instead of WebGL.
- Touch devices: no custom cursor, no mouse parallax, reduced particle count
  (≤ 1/3 of desktop), all scroll reveals still work.
- WebGL unavailable → static substrate. The page never breaks.
- Zero layout shift: SplitText containers reserve height; counters use
  tabular-nums; canvas is absolutely positioned.

---

## 04 · HOME PAGE — THE EXPERIENCE

One continuous scroll story. Each chapter = one data domain.

```
┌──────────────────────────────────────────────────┐
│ 01 WARP HERO (100svh)                            │
│    Three.js warp field · leader surname at 16vw  │
│    SplitText entrance · counters · mouse parallax│
│    scramble meta line · scroll cue               │
├──────────────────────────────────────────────────┤
│ 02 TICKER — race red strip, infinite marquee     │
│    standings feed in Archivo Black               │
├──────────────────────────────────────────────────┤
│ 03 LAST RACE — track SVG draws on scroll (scrub) │
│    podium rows stagger in, team-color borders    │
├──────────────────────────────────────────────────┤
│ 04 NEXT RACE — countdown in giant digits,        │
│    track draws itself, lap record in red         │
├──────────────────────────────────────────────────┤
│ 05 THE GRID — top 10, velocity skew on scroll,   │
│    ghost rank numerals, bars fill scrubbed,      │
│    row hover: surname slides, color floods left  │
├──────────────────────────────────────────────────┤
│ 06 STREAKS — counters fire on enter              │
├──────────────────────────────────────────────────┤
│ 07 FOOTER — wordmark at viewport width           │
└──────────────────────────────────────────────────┘
```

Custom cursor (desktop only): 6px race-red dot + 28px trailing ring,
ring expands over interactive elements. `cursor: none` on body via class.

---

## 05 · TEAM COLORS (darkened for light substrate)

| Team | On-light hex |
|---|---|
| Mercedes | #00A99D |
| Red Bull | #2A5DB0 |
| Ferrari | #D40000 |
| McLaren | #E57700 |
| Aston Martin | #2D7A65 |
| Alpine | #C04080 |
| Williams | #2A7CB0 |
| Haas | #6A6E70 |
| Kick Sauber | #259825 |
| Racing Bulls | #3A5EC4 |

---

## 06 · DO NOT

- No dark page backgrounds. The hub is light. Non-negotiable.
- No motion without F1 meaning (no floating blobs, no aimless drift).
- No scroll-jacking: native scroll position is sacred; we scrub, never hijack.
- No layout shift from animation. Reserve space first.
- No pie charts, no glassmorphism, no rounded-3xl, no gradients on data.
- No animation library beyond GSAP + Three.js without asking.
- No WebGL on the critical render path — hero text paints before canvas.
