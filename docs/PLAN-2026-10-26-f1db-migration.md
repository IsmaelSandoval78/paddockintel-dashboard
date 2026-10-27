# Plan — migrate the race database to F1DB (week of 2026-10-26)

Approved by the founder on 2026-10-21. Work starts Monday 2026-10-26, after the United States GP
(round 18, 2026-10-25). Nothing changes in production until step 4 passes.

## Why

The race tables in Supabase come from the Ergast dataset (history to 2024), jolpica-f1, FastF1
(2026 results from official timing) and OpenF1 (telemetry). Their licences, checked 2026-10-21:

| Source | Used for | Licence |
|---|---|---|
| Ergast | history 1950–2024 | Terms page offline; secondary sources disagree ("non-commercial" vs. dumps redistributed CC BY-SA 4.0). Unconfirmed. |
| jolpica-f1 (Ergast successor) | recent data | Data CC BY-NC-SA 4.0; commercial use by request (admin@jolpi.ca). |
| FastF1 | 2026 results, timing | Library MIT; the data is Formula 1's, FastF1 states it is not associated with F1. |
| OpenF1 | telemetry (Delta Ribbon) | CC BY-NC-SA 4.0, "non-commercial". |
| **F1DB** | not used yet | **CC BY 4.0**: commercial use with attribution. |

`docs/archive/CONCEPT-V2.md` already called the OpenF1/jolpica licensing "the most serious open
legal risk of the project" (emails sent 2026-08-23, no recorded answer). Moving the race tables to
F1DB settles it for everything F1DB covers and makes "PaddockIntel database (built on F1DB)" a
true attribution line. The legal reading itself is for a lawyer, not this plan.

## Goal and success criteria

- The race tables listed below take their values from F1DB, pinned to one release.
- Schema, primary keys, `*_ref` slugs and every Hub/magazine URL stay the same.
- **No published figure changes.** Any change found in step 4 stops the migration and goes to the
  founder before anything is written.
- Rollback ready: full backup of every touched table, taken right before the switch.

## Scope

| Migrated from F1DB | Not in F1DB — stays on its current source |
|---|---|
| circuits, drivers, constructors, seasons, races, results, sprint_results, qualifying, driver_standings, constructor_standings, constructor_results, pit_stops, status | lap_times (Ergast/FastF1), qualifying_sectors, tire_stints, weather_readings, race_control_messages, overtakes (FastF1), delta_ribbon_* (OpenF1), circuit_corners |

The right-hand tables keep their licence question (OpenF1 above all). Data cards built on them
cannot say "built on F1DB".

## Spot check already done (2026-10-21, F1DB `main`, commit e2147b8e)

F1DB matches Supabase exactly on:

- the 13 US GP winners at COTA, 2012–2025;
- the drivers' standings after Singapore 2026: Antonelli 340, Russell 238, Hamilton 229, Verstappen 221, Leclerc 215, Norris 201;
- the constructors' standings after Singapore 2026: Mercedes 578, Ferrari 444, McLaren 339, Red Bull 332.

F1DB also includes 2026 through round 17 and the 1950–1960 Indianapolis 500s (as Ergast does).

## Steps

1. **Mon 26 — inventory and crosswalk.**
   - Map F1DB ids (`max-verstappen`, `red-bull`, race folders like `16-bahrain`) to our ids and refs (`max_verstappen`, `red_bull`, `americas`), by name and dates.
   - Coverage must be 100%.
   - Review the ambiguous ones by hand: drivers with the same name, team renames (RB/Racing Bulls, Sauber/Audi), and the 2026 "Bahrain GP" raced at Sepang.
2. **Mon–Tue — staging load.**
   - Create a `f1db` schema in Supabase **with the CLI** (`supabase/migrations`), never the dashboard.
   - Load the pinned F1DB release (the first one after Austin) from its PostgreSQL dump with a script.
   - Production tables are not touched.
3. **Tue — field-by-field diff.**
   - Compare every row of every migrated table.
   - Write a report of the differences grouped by kind: positions, points (including half points), times, retirement reasons and `status_id`, fastest laps, dates, shared drives.
   - Each difference is settled against the official classification (formula1.com / FIA) and the decision is logged.
4. **Wed — published-figure check, on a copy of production with the settled differences applied.**
   - `scripts/data-cards/generate.ts` must report all four cards `unchanged`.
   - Recompute `driver_stats` / `constructor_stats` and the Hub records, and diff them against the current values.
   - Snapshot the Hub pages (circuits, drivers, constructors, records, season) before and after on the preview, and diff the figures.
   - Recheck the database-sourced figures in published articles and Feed items.
   - Any published figure that changes: stop and report.
5. **Wed/Thu — switch.**
   - Back up the affected tables.
   - Apply the F1DB values, keeping our ids, in one transaction with a documented rollback.
6. **Post-race pipeline.**
   - F1DB publishes "as soon as possible after every race", typically a day or two later.
   - Proposal: keep FastF1 for the Sunday result, reconcile with the F1DB release when it lands, and have the post-race loader flag any difference.
   - The reconciliation also covers three columns added on 2026-10-27 (#139, #141):
     - `races.circuit_layout`. A race added to the calendar (e.g. the 2027 season) has no layout until it is set from F1DB's `circuit_layout_id`. Until then, the circuit page leaves that circuit's pole record out. Set it as soon as F1DB lists the race, and flag any calendar race still without one.
     - `results.pole`. The loader sets it on the grid-1 starter. Check it against F1DB's `race_pole_position`, which differs on sprint-set grids.
     - `qualifying`. Compare the loader's rows (FastF1) with F1DB's qualifying results for the race.
7. **Attribution.**
   - The data card source line becomes "Source: PaddockIntel database (built on F1DB)".
   - Add the F1DB credit with a link to CC BY 4.0 on `/about` and the methodology page, as its licence requires.
   - The founder can then reconsider an open licence for cards built only on F1DB data.
8. **Docs.** Update CLAUDE.md, the source hierarchy in `docs/advisors/DATA-EXPERT.md`, the README and a decision note.

## Calendar risk

The Mexico City GP is 2026-11-01. If step 4 isn't clean by Wednesday 28, the switch moves to the
following week and the Mexico post-race load runs as today. The scheduled Oct 28 check-in (CTR, URL
Inspection, Web Analytics) runs the same day and doesn't touch these tables.
