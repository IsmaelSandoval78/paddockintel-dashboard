# Qualifying fill from F1DB (2026-10-27)

Approved by the founder on 2026-10-27. Done through the Supabase Management API, like the other
F1DB writes; nothing was pasted into the dashboard.

## Why

`public.qualifying` (from Ergast) had no rows for 631 races that have results: every race before
1994, and 83 races from 1994 to 2002. Every page that reads it showed 0 or nothing for those
years. For example, the qualifying section of Senna's or Prost's driver page had no front rows and
no average position, and circuits had no pole laps before 1994.

## What ran

`scripts/f1db/qualifying.py --target prod` (F1DB `v2026.18.0`, crosswalk
`docs/f1db/crosswalk-v2026.18.0.json`), in one transaction. It was rehearsed first on the sandbox
copy, with the same counts.

- **Inserted:** 15,682 rows into the 631 races. The ids run from **11512 to 27193**. Existing
  rows were not touched, which a check verified before commit.
- **Left out:**
  - 5 rows of drivers we don't have, because they never started a race;
  - 15 rows whose constructor isn't exactly one of ours that season: all Formula 2 entries in the
    1966 and 1969 German GPs (Lotus-Ford, Brabham-Ford, Matra, BMW, Tecno).
- **Conventions:**
  - The time goes in `q1`, as Ergast does for single-session qualifying.
  - Sub-minute times (Dijon 1974) are written as `0:59.590`, so every time reads as m:ss.fff.
  - Excluded and not-classified entries have no position.
- **Checks before commit:**
  - every target race has rows;
  - no driver appears twice in a race;
  - every inserted time matches m:ss.fff;
  - `driver_qualifying_pace` is unchanged from 2003 on (the Hub record uses 2026 only).

Known F1DB quirk: in the 1959 German GP (AVUS), its qualifying classification puts Allison first
(2:05.8) although the official pole was Brooks's (2:05.9). We loaded it as F1DB has it. The pole
counts use `results.pole`, so they are not affected.

## Rollback

```sql
delete from public.qualifying where id between 11512 and 27193;
```

This is safe as long as nothing has re-used those ids. The post-race loader allocates new ids
above the maximum, so it never re-uses them.

## Circuit layouts (same day)

`supabase/migrations/20261027150000_races_circuit_layout.sql` adds `races.circuit_layout`. It is
filled for all 1172 races (160 layouts) from F1DB's `circuit_layout_id` by
`scripts/f1db/layouts.py`, in the same transaction as the migration, and recorded in
`schema_migrations`.

The circuit page's pole record now compares only laps on the layout of the circuit's latest race:

- Silverstone: Hamilton 1:24.303 (2020). It was Räikkönen's 1:18.233, set in 2004 on the
  1997-2009 layout.
- Bahrain: Hamilton 1:27.264 (2020). It was Bottas's 0:53.377 from the 2020 outer loop.

Rollback: `alter table public.races drop column circuit_layout;`, after reverting the page.
