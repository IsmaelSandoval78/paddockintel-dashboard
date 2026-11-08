# F1DB migration — step 3: field-by-field diff (2026-10-26)

Step 3 of `docs/PLAN-2026-10-26-f1db-migration.md`. Read-only for `public.*`.

## Step 2, for the record

- Schema `f1db` was created from `supabase/migrations/20261026140000_f1db_staging_schema.sql`
  (31 tables, 17 views; `anon`/`authenticated` have no access). The migration is recorded in
  `supabase_migrations.schema_migrations` under version `20261026140000`.
- It was applied through the Supabase Management API rather than `supabase db push`. The CLI's
  `db push` and `db query --linked` both open a direct Postgres connection on port 5432, which
  cloud sessions can't reach. The founder approved this one-off on 2026-10-26; nothing was pasted
  into the dashboard.
- `scripts/f1db/staging.py load` loaded F1DB `v2026.18.0` (dump sha256 `ce37b728…`) through the
  same API: 247,795 rows, all 31 tables matching the dump's counts. No production table was
  touched.
- Side note: the remote migration history no longer matches the local file names. For example,
  remote `20261002000911` is local `20261002150000`, and `20260926150000` and `20261013160000`
  are not in the remote history. Older migrations were applied by other routes. A
  `supabase migration repair` pass is needed before `db push` can be used again; that is out of
  scope here.

## How the diff works

`scripts/f1db/diff.py --crosswalk docs/f1db/crosswalk-v2026.18.0.json --out docs/f1db/diff-v2026.18.0.json`

- Rows are paired with the step 1 crosswalk (race + driver; constructor standings by position).
- Every difference is counted by table, kind and era, with up to 25 samples per kind, in the JSON.

| Table | Rows compared |
|---|---|
| results | 27,541 |
| qualifying | 11,351 |
| pit_stops | 22,615 |
| driver_standings | 21,605 |
| constructor_standings | 10,427 |
| sprint_results | 612 |

## Differences by kind

### Conventions, not data disagreements (proposal: keep ours)

| Where | Count | What |
|---|---|---|
| driver_standings | 14,159 | Drivers on 0 points. Ours list every driver who raced; F1DB lists only drivers who scored. |
| constructor_standings | 3,140 | Same, for teams. |
| driver_standings | 1,938 | Tie order: drivers level on points are ordered differently. In final standings, F1DB gives tied drivers the same position (e.g. three drivers "18th"); ours number them in sequence. |
| results | 119 | F1DB non-starter rows (DNS/DNQ/DNPQ/EX) we don't carry (step 1). |

### Official penalties F1DB applies and we don't (proposal: take F1DB)

These change season totals, so they go to step 4 as published-figure checks.

| Season | Ours | F1DB (official) | Why |
|---|---|---|---|
| 1995 constructors | Benetton 147, Williams 118 | 137, 112 | Brazil 1995 points removed from the constructors' table (fuel irregularity) |
| 2000 constructors | McLaren 162 | 152 | 10 points removed after Austria 2000 |
| 2007 constructors | McLaren 218, 11th | excluded | McLaren excluded from the 2007 constructors' championship |
| 1997 drivers | Michael Schumacher 78, 26th | excluded | Disqualified from the 1997 championship |
| 1961 constructors | Ferrari 45, Lotus 35 | 40, 32 | Only a team's best results counted (dropped scores) |
| 1954 British GP | 0 for the fastest lap | 1/7 point to each of 7 drivers | Shared fastest lap; Ascari 1.14 and Moss 4.14 final points |
| 1956 | Fangio's points from Monaco (1.5) | none for that row | Shared drive: Fangio finished in Collins's car |

### Constructor identity (proposal: keep ours; no figure changes)

- In 1982 F1DB scores Brabham-BMW and Brabham-Ford as two entries, where ours combine them
  (41 points). There are similar splits for Williams (1983) and others, so 239
  position-by-position mismatches in constructor standings.
- Titles are unaffected. A few result rows credit a different chassis (4).

### Real disagreements to settle against the official classification

| Table | Kind | Count | Notes |
|---|---|---|---|
| results | classification | 652 | Mostly ours `R` (retired) where F1DB has the car classified (e.g. 2003 R1 Fisichella 12th), or `W`/`F` vs DNQ/DNPQ |
| results | position | 353 | Mostly the same cases as classification |
| results | grid | 524 | Grid slots off by one or two (penalties, pit-lane starters coded as a slot) |
| results | grid, pit lane | 174 | Ours give a pit-lane starter the slot number, F1DB says "PL" (the Austin 2026 case, historically) |
| results | time | 368 | Race times differ, mostly by an exact minute or a few tenths: transcription errors on one side |
| results | laps | 286 | Laps completed by retirements |
| results | points | 4 | All 1950s (shared fastest lap, shared drives) |
| results | fastest lap | 2 | **2026 United States GP: ours has no fastest-lap holder (the scheduled loader couldn't read lap data); F1DB has Leclerc.** 2024 Monaco: Hamilton. |
| qualifying | position | 360 | 2007-2026 |
| qualifying | lap times | 209 | Digit-level differences (e.g. 1:46.302 vs 1:46.032) |
| pit_stops | duration | 404 | 2023-2026: ours computed from FastF1 timing, F1DB from the official pit-stop summary; tenths to a second apart |
| pit_stops | lap / only one side | 72 / 160 | Stop numbering and missing stops |
| sprint_results | position | 25 | **Ours give non-classified sprint drivers a finishing position (FastF1's running order); F1DB leaves it empty.** One real reorder: Qatar 2023 sprint, Stroll/Magnussen/Zhou. |

## Proposed rule for step 5

Take F1DB's value wherever it reflects the official classification after penalties; keep ours
where the difference is a convention (zero-point rows, tie numbering, non-starter rows,
constructor identity).

- **Where a published figure moves, step 4 stops and asks the founder.** The 1995, 2000 and 2007
  constructors' totals and Schumacher 1997 are the obvious candidates: any career-points or
  constructor-points figure on the Hub that includes them.
- The other kinds are checked against formula1.com / FIA classifications on a sample before the
  rule is applied to the whole kind.

## Next (step 4, Wednesday 28)

On a copy with these values applied:
- the four data cards must regenerate `unchanged`;
- `driver_stats`/`constructor_stats` and the Hub records are diffed against the current values;
- published articles and Feed items that quote database figures are rechecked.
