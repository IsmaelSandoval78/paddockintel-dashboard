# Track Dominance Map — standard

A two-part chart pair (used together, always) illustrating a head-to-head
lap comparison between two drivers in a session: a track outline colored by
who was faster through each stretch, plus a companion "Gap Over Distance"
line showing the cumulative time swing across the lap. First built for
`madrid-gp-2026-fp2-norris-gearbox-lindblad-crash` (Antonelli vs Leclerc,
FP2, Madring). Manual/one-off process — not an automated pipeline.

## Data

Always FastF1 telemetry for the two drivers' fastest laps in a session.
Never OpenF1/jolpica directly from a request path (CLAUDE.md) — this is
offline, one-off research/production work, run from a disposable venv:

```
python3 -m venv .venv && .venv/bin/pip install fastf1 numpy scipy
.venv/bin/python3 extract-telemetry.py 2026 "Spanish Grand Prix" FP2 ANT LEC
node render-svg.js ANT LEC Antonelli Leclerc 90 flipX
```

`extract-telemetry.py` writes three JSON files; `render-svg.js` reads them
and writes `track-map.svg` + `gap-chart.svg`, **plus a PNG rasterization of
each** (`track-map.png`, `gap-chart.png` — via `sharp`, resolved from the
repo root's `node_modules`, not a dependency added for this script). Copy
the SVGs into `public/charts/<slug>-track-dominance.svg` and
`<slug>-gap-over-distance.svg` for the in-article embed (crisp, scalable,
tiny). Copy `track-map.png` (usually the more visually distinctive of the
two) into the same folder and set it as the article's `cover_image_url`
frontmatter field — schema.org's `image`/`publisher.logo` and social
previews want JPEG/PNG/WebP, not SVG, so the SVG alone won't satisfy
Google's Article structured-data image requirement (Top Stories/Discover
eligibility) even though it renders fine embedded in the page body.
Without this, the article's schema `image` silently falls back to the
site-wide generic card (`app/opengraph-image.tsx`) instead of the real,
unique chart — a real piece with real data deserves its own image there,
not the brand placeholder.

## Two real bugs found building the first one — read before reusing this

**1. Track shape must come from ONE driver's line, never both.**
Coloring each minisector by drawing *that* driver's own X/Y for it (switching
between the two drivers segment to segment) produces visible gaps at every
boundary — the two cars don't share a racing line. Fix: always draw the
shape from a single reference driver's telemetry; only the *color* changes
per segment based on who had the lower elapsed time there.

**2. Never diff two drivers' raw `Distance` channels directly.**
Each car's `Distance` is independently integrated and isn't calibrated to
agree at "the same physical point on track" — in the case that surfaced
this, two cars' reported total lap distance for the same physical lap
differed by ~80m. Interpolating both onto a shared distance grid and
subtracting `Time` gave a gap that was wrong by over a second. Fix: use
`fastf1.utils.delta_time(lap_a, lap_b)`, which matches by track position,
not raw distance. It's flagged deprecated upstream for edge-case
inaccuracy — **always** sanity-check its endpoint against the real lap-time
difference before trusting it (`extract-telemetry.py` prints this check;
don't skip reading it).

**3. Sign convention on the gap chart — verify this every time, don't trust it by memory.**
`delta_time(A, B)` returns *B's elapsed time minus A's* at each matched
point: positive means B took longer to get there, i.e. **A is ahead**;
negative means **B is ahead**. This is easy to get backwards (an earlier
version of this exact script did, and it shipped to a live article before
being caught) — always confirm the sign against raw elapsed time at one
sample point, the way `extract-telemetry.py`'s own diagnostic does, before
writing a caption that says who was ahead.

## Corner numbers

Detected from telemetry, not sourced from FastF1's `circuit_info` (which
has no data yet for a debut circuit — `session.get_circuit_info()` raises
on one). Method: local speed minima (`scipy.signal.find_peaks` on
`-Speed`, `distance=15`, `prominence=3`), numbered in lap order. These are
**real braking zones, not official FIA turn numbers** — say so in every
caption. If a circuit's official corner names/numbers are later confirmed
(check GPFans' or Formula1.com's own circuit-guide pages — some corners do
get real names even at a debut track, e.g. Madring's Turn 3 "Hortaleza"),
cross-reference before claiming a specific number matches a named corner.

## Orientation

FastF1's X/Y has no fixed real-world orientation. Check
`session.get_circuit_info().rotation` first — if it exists, use it. If it
raises (new circuit), rotate/flip by eye against a real published circuit
diagram (Wikipedia, Formula1.com's circuit guide) until it reads the same
way. Record the angle/flip used (`render-svg.js`'s CLI args) and reuse the
exact same values for any future chart on that circuit.

## Visual style (fixed — do not vary per chart)

- Bicolor "road": thick stroke (170) in the driver's/team's color + thin
  white centerline (34) stroke, **same path drawn twice** — never two
  separate elements, or they drift apart on curves.
- Kraft palette: `#EDE3D0` background, `#2B2620` ink, `#C9BC9F` subtle
  gridlines — the real site tokens (`--bg`, `--border`, `--border-subtle`),
  not re-derived per chart.
- Archivo Black for any title text, JetBrains Mono for all data/labels,
  Lora for prose captions — matches DESIGN.md.
- Pure SVG. No charting library, no client JS.
- Footer/caption always discloses: exact FastF1 session, minisector count,
  that corner numbers are detected braking zones (not official), and the
  orientation caveat if `circuit_info.rotation` wasn't available.

## Embedding in an article

The site's markdown renderer (`lib/markdown.ts`) is a deliberately minimal,
hand-rolled parser — it escapes raw HTML and, until this chart needed it,
had no image support at all. `![alt](src)` on its own line now renders as
`<figure><img loading="lazy" ...></figure>` (src must start with `/` or
`https://`). Put a real caption as a separate italic (`*text*`) paragraph
right after the image — the parser doesn't do image captions natively.
Save charts as static files under `public/charts/`; this is manual
production, not a live-rendered component, so a plain SVG asset is correct
for now (revisit only if/when this becomes an automated per-race pipeline).

## Reusable prompt

```
Track Dominance Map — <Session> <Year>, <Circuit>: <Driver A> vs <Driver B>

1. FastF1 (disposable venv): load the session, each driver's fastest lap
2. extract-telemetry.py <year> "<event>" <session> <codeA> <codeB>
   — sanity-check the printed delta_time-vs-real-lap-time-gap line before continuing
3. render-svg.js <codeA> <codeB> <NameA> <NameB> <rotation> [flipX] [flipY]
   — verify the sign convention against raw elapsed time at one point (see bug #3)
   before writing any caption about who was ahead
4. Copy track-map.svg / gap-chart.svg into public/charts/<slug>-*.svg
5. Embed via ![alt](/charts/...) + an italic caption paragraph, in both
   locale .md files
6. Copy track-map.png into public/charts/<slug>-track-dominance.png, set it
   as `cover_image_url: "/charts/<slug>-track-dominance.png"` in each
   locale's frontmatter
7. Re-ingest, verify on the live page (chart renders) AND in the page's
   NewsArticle JSON-LD (`image` points at the PNG, not the generic
   opengraph-image fallback) before calling it done
```
