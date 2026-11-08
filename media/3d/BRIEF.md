# PaddockIntel 3D — "Two Winners" scrollytelling prototype

You are building a scroll-driven 3D web page (Awwwards-style "scrollytelling") that tells the story of the 2026 Mexico City Grand Prix.
The owner is NOT a developer: do everything yourself (install, create files, run the dev server) and explain each step in one short sentence in Spanish.

## Tech
- Vite + vanilla JavaScript + Three.js (latest stable). No React.
- GSAP + ScrollTrigger for scroll choreography, Lenis for smooth scrolling.
- Three.js postprocessing (EffectComposer): subtle UnrealBloom, a film-grain pass, and a light halftone/riso-print pass (cream paper feel).
- Must run at 60 fps on a MacBook Pro. Use `npm run dev` and tell the owner to open the local URL.

## Data
`data/race.json` has everything: the track shape (normalised x, y, z), corners, lap-by-lap positions of VER, ANT and HAM, Hamilton's gap to the leader in the last laps, the grid, the lap-1 order, brand colours and 7 story chapters (title + text). Use only this data; do not invent facts.

## The scene (one continuous world, never cut)
- The circuit as a glossy floating RIBBON (not a tube): build a CatmullRomCurve3 from the track points (scale to ~100 units wide), extrude a flat ribbon about 2 units wide, MeshPhysicalMaterial in PaddockIntel blue #2B4AA0 with clearcoat, plus thin red/white kerb strips along both edges.
- Background: warm cream #F3ECDD gradient with soft fog. Soft lighting: HemisphereLight + one DirectionalLight with soft shadows; RoomEnvironment for gentle reflections.
- Cars are glowing PARTICLE TRAILS, not models: a bright head point plus a fading trail of ~200 points following the curve. Max = blue #2B4AA0, Kimi = teal #00A19B, Hamilton = red #E23A3A.
- A light ground plane with a very faint grid catches the shadows.

## Camera choreography (driven by scroll, smooth, like a drone)
1. Chapter 1 "TWO WINNERS." — wide establishing shot, slow orbit around the whole floating circuit.
2. Chapter 2 "LIGHTS OUT." — crane down onto the start straight; five red lights (small glowing spheres) switch off; Max's trail jumps from 5th to 2nd.
3. Chapter 3 "LAP 28. KIMI LEADS." — low tracking shot alongside Kimi's teal trail.
4. Chapter 4 "RED FLAG." — the whole scene tints red (fog, light and ribbon colour), the camera tilts (Dutch angle) and all trails stop.
5. Chapter 5 "LAP 48. P3." — pull back to a top-down view; draw the real position lines of VER/ANT/HAM as 3D lines rising off the ground.
6. Chapter 6 "0.799s" — chase cam behind Max's blue trail with Hamilton's red trail right behind; a big number scrambles until it lands on 0.799.
7. Chapter 7 "CAMPIONE." — pull out to the wide shot again, slow orbit, confetti particles in blue and red, final title.

## Typography and UI
- Titles: "Anton" (Google Fonts), large, slanted (skewX -10deg), blue with a red offset copy behind (riso misregistration look).
- Body text: "JetBrains Mono". Titles reveal with a letter-scramble effect; body text fades and slides in.
- Lots of empty space. Small header "PADDOCK·INTEL" top-left, chapter counter "01 / 07" top-right.

## Recording mode
- Add `?vertical=1`: a 1080x1920 portrait layout (centred 9:16 frame) for screen-recording the scroll as a vertical video.
- Add `?autoplay=1`: scrolls through all chapters automatically in about 45 seconds, so the owner can screen-record without touching the mouse.

## Working style
- Build it in small steps and show the result after each step (first the ribbon and lights, then the camera path, then the trails, then the text).
- After each step, tell the owner in Spanish what to look at in the browser.
