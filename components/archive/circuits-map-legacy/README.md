# circuits-map-legacy

Archived 2026-08-25. Retired, not deleted — kept for history and in case any of this
functionality needs to be revived later.

## What this was

The interactive `/circuits` index from before the Vintage Editorial redesign
(`app/[locale]/(hub)/circuits/page.tsx`). Three files, one cluster:

- **`CircuitsClient.tsx`** — the client-side page shell: region filter state, search,
  dynamic-imports the map, renders the quick-look panel on selection.
- **`CircuitMapSVG.tsx`** — a d3-geo (`geoNaturalEarth1`) world map rendered as SVG, with
  per-region projection presets (rotate/center/scale for Europe, Americas, Asia & Pacific,
  Africa & Middle East, Oceania) and country paths from `world-atlas` TopoJSON.
- **`CircuitLeftPanel.tsx`** — the slide-in / bottom-sheet quick-look panel (via
  `components/ui/BottomSheet.tsx`) that previewed a circuit's info without leaving the index.

## Why it was retired

Replaced by the Vintage Editorial `/circuits` index: a featured circuit + a compact
2026-calendar list, poster-style rather than a map-driven browser. Part of the DESIGN.md
v3.0.0 pivot away from per-surface interactive modes.

## Functionality the new index does not have

| Feature | Legacy (this folder) | Vintage Editorial index |
|---|---|---|
| World map (d3-geo) | Yes — Natural Earth projection, animated country paths | None |
| Region filter | Yes — All / Europe / Americas / Asia & Pacific / Africa & Middle East / Oceania | None |
| Live search | Yes (`CircuitsClient`) | None |
| Preview without navigating | Yes — `CircuitLeftPanel` slide-in/bottom-sheet | None (must open the circuit page) |
| GSAP animations | Yes — `SplitText` (headers), `DrawSVGPlugin` (panel) | Not used |

If "browse circuits on a map" or "preview without leaving the index" needs to come back,
start here and check `git log` on these files for how the interactivity was wired.
