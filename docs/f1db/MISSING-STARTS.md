# Missing race starts from F1DB (2026-10-27)

Approved by the founder on 2026-10-27. Done through the Supabase Management API, in one
transaction, rehearsed first on the sandbox copy with the same result.

## Why

After career races began counting starts (#143), 20 drivers had one start fewer than F1DB's
`total_race_starts`. Our results (from Ergast) don't carry 21 starts that F1DB has:

- the Formula 2 cars that ran inside the 1966, 1967 and 1969 German GPs (17 starts);
- Gérard (1953 British GP), Taruffi (1956 French GP), Galli (1971 Dutch GP) and Regazzoni
  (1977 German GP).

## What ran

`scripts/f1db/missing_starts.py --target prod`

- **Inserted:** 19 results rows, ids **28190 to 28208**. They take F1DB's classified position
  (F2 cars were classified overall, and our F1 rows already left those positions empty), laps,
  grid, number and status (finished, laps behind, or the retirement reason). Points are 0,
  because F2 cars could not score.
- **Left out:** 2 rows, because no constructor of ours matches:
  - Hahne, 1966: Matra-BRM;
  - Cevert, 1969: Tecno-Ford.

  Our `matra` and `tecno` are the works cars with their own engines.
- **Constructor:** one of ours, never a new one. It is the constructor our results use that season
  for the same F1DB constructor and engine; failing that, the one named exactly after F1DB's
  constructor and engine.
- **`position_order`:** each inserted car goes right after the last of our rows that F1DB
  classifies ahead of it. 53 existing rows in those 7 races were renumbered; their relative
  order is unchanged, which a check verified.
- **Checks before commit:**
  - every row maps to a status;
  - no inserted position was already taken;
  - no `position_order` is duplicated in those races;
  - no driver's wins, podiums, poles, points or titles changed.

Result: every driver now matches F1DB's `total_race_starts`, except Hahne and Cevert (one short
each, the two rows left out).

## Rollback

`docs/f1db/missing-starts-rollback.sql`: one transaction that deletes ids 28190-28208 and restores
the 53 previous `position_order` values. It was tested on the sandbox copy and returns those
races to their previous state. That includes two duplicate `position_order` values that Ergast
had in the 1956 French GP (shared drives), which this change had resolved.
