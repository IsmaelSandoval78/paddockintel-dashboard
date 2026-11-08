# F1DB migration — step 5: applied to production (2026-10-26)

Step 5 of `docs/PLAN-2026-10-26-f1db-migration.md`. The founder approved all five proposals in
`STEP4-PUBLISHED-FIGURES.md` on 2026-10-26, and they were applied to production at
2026-10-26 ~23:40 UTC, in one transaction, before the Mexico City GP (2026-11-01).

## What ran

`scripts/f1db/step5/apply.py`, through the Supabase Management API (same one-off route as step 2;
the CLI can't reach Postgres from cloud sessions). It is the step 4 candidate, plus two things:

- **`results.time`** follows `results.milliseconds` wherever F1DB's race time replaces ours: the
  winner's race time, everyone else's gap, in F1DB's text (e.g. `+14.33` becomes `+14.330`).
- **`constructor_results`**, which feeds `constructor_stats.total_points`. In the 32 seasons from
  1958 on where our sum differed from F1DB's final constructors' standings, each race's points are
  now what that race added to F1DB's cumulative standings, so every season sums to its official
  total. Force India 2018 is left as it was (step 4).
  - Dropped scores and the best-placed-car rule land on the race where the official table applied
    them.
  - The 1995 Brazil (Benetton, Williams) and 2000 Austria (McLaren) deductions land on those races.
  - McLaren 2007 is 0 in every race; the rows keep their `D` status.
  - One row is negative: Racing Point, 2020 round 5, −1 (14 scored, −15 penalty). That is where
    F1DB's cumulative table applies the deduction.

Nothing is inserted or deleted, and ids, keys and row counts are unchanged. Before the
transaction ends it checks the approved figures and fails (writing nothing) if any differ:

- 32 seasons, −425 points in total;
- every adjusted season sums to its official total;
- McLaren 8,007.5 and Ferrari 11,149;
- Schumacher 77 fastest laps; Piastri 6 poles; Moss 16 poles and 186.64 points; Behra 51.14;
- no driver's or constructor's wins, podiums or titles change.

## Rows changed (`step5-changes.json`)

| Table | Rows | Columns |
|---|---|---|
| results | 2,285 | rank 718, grid 695, milliseconds 377, position_text 318, laps 281, time 259, position 239, points 2 |
| driver_standings | 221 | position 207, points 20 |
| constructor_standings | 205 | position 139, points 76 |
| constructor_results | 71 | points 71 |

In 2026:

- pit-lane starters' grid goes to 0 (11 rows);
- two `R` become `N`;
- two time penalties are included in round 4's gaps (+5 s and +20 s);
- three 1 ms rounding differences;
- tie order in rounds 1–8 standings changes.

No 2026 position, points total or winner changes.

## Checks after applying

- **Rehearsal first.** A fresh copy of production in the local sandbox got the same SQL, its
  rollback, and the SQL again. The production backup taken just before the run was row-for-row
  identical to that copy.
- **Hub views.** All 10 production views equal the rehearsal's. Only `driver_stats` and
  `constructor_stats` differ from before:
  - `driver_stats` equals the step 4 candidate;
  - `constructor_stats` differs from the step 4 candidate only in `total_points` of the 11 teams
    listed in step 4: McLaren 8,007.5, Ferrari 11,149, BRM 385, Williams 3,786, Benetton 851.5,
    Racing Point 268, Vanwall 48, Team Lotus 908, Brabham 591, Tyrrell 617, Porsche 47.
- **Data cards.** No row they read changed. The 2026 results keep their positions, points and
  teams. The COTA results changed only in the 2013 positions 12–16. The standings after rounds 17
  and 18 are identical.
  - Regenerating them now would also move them from "after round 17" to "after round 18", which
    is unrelated to this step, so they were not regenerated.
- **Live Hub** (hub.paddockintel.com, 2026-10-26 ~23:45 UTC):
  - Schumacher: 77 fastest laps; Piastri: 6 poles; Moss: 16 poles;
  - `records/constructors-most-points`: Ferrari 11,149, McLaren 8,007.5, Williams 3,786;
  - `records/most-fastest-laps`: Schumacher 77, Hamilton 69.

## Rollback

`docs/f1db/step5-rollback.sql.gz` (sha256 `1b572861…`) holds every changed row with its values
from the backup taken just before the run, as one `update … from json_populate_recordset(…)`
per table. Before it was committed, it was run on the sandbox copy, which it returned
row-for-row to the production backup.

To roll back, run it in one transaction through the Management API, e.g.
`python3 scripts/f1db/step4/mq.py < <(gunzip -c docs/f1db/step5-rollback.sql.gz)`. Only do this
before step 6 has written anything newer to these rows.

## Found on the way (not changed here)

- The constructor page (`app/[locale]/(hub)/constructors/[slug]/page.tsx`) counts every result row
  with a `fastest_lap` lap number as a fastest lap, so McLaren shows 848. It should count fastest
  laps of the race (`rank = 1`), as `constructor_stats.fastest_laps` does (185). This bug predates
  this step; it is left for its own PR.

## Next

Step 6: the Mexico post-race load is the first race on the new baseline. Reconcile it against
F1DB's next release (pit-lane grid, fastest-lap rank, classification text, standings tie order).
