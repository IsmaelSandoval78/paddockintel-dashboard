# Turn the 3D project into a reusable QUALIFYING template

Context: the current project tells the Mexico race story from data/race.json. Now we need a second template, for qualifying, that is driven 100% by a data file, so every Saturday the owner only swaps the file.

## Data
- `data/session.json` (schema below). The sample file is Mexico 2026 qualifying. Never hard-code names, times or circuits: everything comes from this file, including the track shape (track: normalised [x, y, z] points) and the chapter titles/texts.
- Keys: type ("Q"), event, circuit, date, track, corners [[n, fraction, min speed]], sector_lines [f1, f2] (fractions of the lap where sectors 1 and 2 end),
  top3 [{code, number, name, team, color, lap, lap_text, sectors[3], t[401], speed[401]}] where t[i] is that driver's elapsed time at lap fraction i/400 (exact at each sector line),
  gap_p1_p2, gap_after_two_sectors, sector_best [{sector, code, time}], knockout {out_q1[], out_q2[], q3[]}, grid [{pos, code, number, color, gap}], weather {}, colors {}, chapters [{id, kind, title, text}].

## Behaviour
- Add `?session=q` (or a `mode` switch) to load the qualifying template; keep the race template working as it is.
- Reuse the same world, look and camera style (ribbon track, cream background, riso titles, particle trails, clean mode `?clean=1`, `?vertical=1`, `?autoplay=1`).
- Chapters by `kind`:
  - pole: wide establishing orbit, title + text; the pole driver's colour glows on the ribbon.
  - knockout: three columns of small coloured markers (Q1 field → Q2 → Q3) floating above the track; eliminated drivers drop and fade.
  - three_laps: the three trails race their fastest laps simultaneously using the `t` arrays (real timing); camera tracks the leader; mark the two sector lines on the ribbon; show a live gap readout.
  - sectors: the ribbon splits into its three sectors (colour each sector with the colour of `sector_best` driver), with the sector times as labels.
  - margin: chase cam on P1 and P2 at the sector-2 line; a big number scrambles to `gap_p1_p2`.
  - grid: pull back to top-down; build the starting grid (10 slots on the main straight) with car markers in team colours and their gaps.
- Text never overlaps the track or other graphics (safe zones), lots of empty space.
- After building it, also write `scripts/README` lines explaining how to refresh `data/session.json`.
