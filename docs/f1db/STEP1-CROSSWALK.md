# F1DB migration — step 1: inventory and crosswalk (2026-10-26)

Step 1 of `docs/PLAN-2026-10-26-f1db-migration.md`. Read-only: nothing was written to Supabase.

## Pinned release

**F1DB `v2026.18.0`**, tag commit `16edd584`, released 2026-10-26 06:47 UTC: the first release
after the United States GP (round 18). Every comparison in steps 2-4 uses this release.

Austin in this release matches what the post-race load wrote yesterday, row for row: 22 results
(positions, points, laps, grid, with Stroll's pit-lane start as grid 0), standings
(Antonelli 365, Russell 242, Hamilton 241; Mercedes 607, Ferrari 474, Red Bull and McLaren 355)
and 32 pit stops.

## How the crosswalk is built

`scripts/f1db/crosswalk.py --f1db <checkout> --out docs/f1db/crosswalk-v2026.18.0.json`

- Seasons and races: year + round, dates compared.
- Circuits: by the races held on them.
- Drivers and constructors: every one of our result rows is paired with one F1DB row of the same
  race (surname + car number, then surname, then car number, then finishing order; the surname
  comes first because of the 1950s shared drives). Each pair is a vote; each of our ids takes the
  F1DB id with the most votes. Drivers are then checked on date of birth.
- Rows no result can anchor fall back to name + date of birth.

## Coverage

| Entity | Mapped | Notes |
|---|---|---|
| Seasons | 77/77 | Same 77 years on both sides |
| Races | 1172/1172 | Including 2026 rounds 19-23 (scheduled). 2 date differences, below |
| Circuits | 78/78 | One F1DB circuit per circuit, no splits. 2026 "Bahrain GP" maps to Sepang on both sides |
| Drivers | 852/865 | 13 have no F1DB counterpart, below |
| Constructors | 212/214 | 2 have no F1DB counterpart; identity differs by era, below |
| Result rows | 27,542 of 27,634 paired | 92 of ours and 145 of F1DB's have no partner, below |

**Everything F1DB covers is mapped.** The gaps are rows that exist on one side only, not
ambiguous matches.

## What needs a decision (steps 3-4)

1. **13 drivers and 87 result rows exist only in our data.**
   - They are entries Ergast lists as "Withdrew" (`W`), mostly 1961-1963: Ray Reed, David Clapham,
     Alex Blignaut, Carlo Abate, Ernie de Vos, Thomas Monarch, Rob Slotemaker, Gary Hocking, Syd van
     der Vyver, Peter Monteverdi, Menato Boffa, Ken Miles and Geoff Duke.
   - F1DB doesn't list them as drivers, since they never took part.
   - Proposal: keep them as they are, outside the migration. Removing them would remove Hub URLs.
2. **F1DB has 145 result rows we don't.** 117 of them are non-starters (89 DNS, 19 DNQ, 4 DNP,
   3 EX, 2 DNPQ), which our results table doesn't carry.
   - Proposal: don't import them. That keeps "races" counts as they are.
3. **F2 cars in the German GP.**
   - F1DB includes the Formula 2 class in the 1966 (round 6), 1967 (round 7) and 1969 (round 7)
     German GPs, with finishing positions (1969: Pescarolo 5th, Attwood 6th, ...).
   - Ergast lists only the F1 cars, so classified positions can differ for F1 drivers in those
     three races.
   - To settle in step 3 against the official classification. Any change to a published figure
     goes to the founder first.
4. **4 result rows credit a different driver.**
   - 1982 R1, Guerrero vs Teo Fabi; 1977, Hayje vs Lunger; Barth vs May; da Silva Ramos vs Taruffi.
   - These are disagreements between the sources, to settle in step 3.
5. **2 race dates differ.**
   - 2021 Turkish GP: ours 2021-10-10, F1DB 2021-10-03. The race was run on 10 October.
   - 2024 Las Vegas: ours 2024-11-23 (local), F1DB 2024-11-24 (UTC).
   - Proposal: keep ours in both cases.
6. **13 driver dates of birth differ.**
   - All drivers who raced before 1970, except Sospiri (2 days apart) and Langes (a year apart), who raced in the 1990s.
   - Most are Indianapolis 500 drivers, where the sources disagree by exactly one or two years.
   - Not shown on any data card. To settle in step 3.
7. **Constructor identity changes with the era.**
   - Ergast splits chassis-engine combinations (`lotus-climax`, `cooper-maserati`, 14 groups),
     where F1DB has one constructor plus an engine.
   - Some of our constructors span two F1DB ones: `rb` is F1DB's `rb` in 2024 and `racing-bulls`
     from 2025; `sauber`/`kick-sauber`; `manor`/`marussia`; `larrousse`/`venturi`;
     `williams`/`frank-williams-racing-cars`.
   - The map is therefore kept per season (`constructor_seasons` in the JSON).
   - Since step 5 keeps our ids and only updates values, this changes no figure by itself.
   - But 20 season keys credit a few rows to a different constructor (e.g. 1972 March vs
     Eifelland, 8 rows), which step 3 has to settle.
8. **2 constructors have no results and no F1DB match:** `re` and `mbm`, entrants that never
   raced. Same proposal as point 1.

## Next

- Step 2 (staging load into a `f1db` schema, created with the Supabase CLI) starts from this
  release.
- The calendar check stands: if step 4 isn't clean by Wednesday 28, the switch moves past Mexico.
