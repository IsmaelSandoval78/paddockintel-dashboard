# F1DB migration — step 4: published-figure check (2026-10-26)

Step 4 of `docs/PLAN-2026-10-26-f1db-migration.md`. **Result: published figures change, so the
migration stops here until the founder decides** (plan: "Any published figure that changes:
stop and report"). Nothing was written to production.

## How it was checked

- `scripts/f1db/step4/copy_prod.py` copies the 12 race tables the Hub reads, plus the F1DB staging
  tables, from production into a local sandbox Postgres. The read is through the Management API;
  all counts and keys were verified.
- `create_views.py` recreates the 10 Hub views (`driver_stats`, `constructor_stats`, win streaks,
  circuit wins, qualifying pace, winner ages, title fights) from their production definitions.
  On the unmodified copy, all 10 reproduce production exactly.
- `candidate.py` applies F1DB's values to the copy with the step 3 rule: official values for
  paired rows; our conventions kept (zero-point rows, tie numbering, non-starters, constructor
  identity).
- `views_snap.py` snapshots the views before and after, and the diff is below.

## What does not change

- Wins, podiums, drivers' and constructors' titles, win streaks, wins per circuit, youngest and
  oldest winners, and the title-fight table: identical.
- **The four data cards are unchanged.** Every input they read is identical in the candidate:
  2026 results (positions, points, teams), COTA winners, and the 2026 standings after Austin.
- No published article or Feed item quotes a figure that changes. The articles were searched for
  career fastest laps, career points, pole counts and the 1995/2000/2007 seasons, and all 360
  Feed items' summaries and notes were checked.

## What changes (needs a decision)

1. **Career fastest laps: our Hub undercounts badly today.**
   - Ours only know the fastest-lap holder from 2004, when Ergast's `rank` starts. The Hub shows
     Michael Schumacher with 21 fastest laps (F1DB: 77), Prost 0 (41), Mansell 0 (30), Clark 0
     (27), Senna 0 (19).
   - Changes for 105 drivers and 43 constructors (Ferrari 103 → 268, McLaren 74 → 185, Williams
     8 → 134).
   - **Proposal: take F1DB.** This is a correction, not a change of convention.
2. **Pole positions** (counted as starts from grid 1):
   - Piastri 5 → 6: ours has no grid for the 2025 Qatar GP, where he started from pole.
   - Moss 17 → 16: ours give him grid 1 at the 1952 Italian GP; F1DB says 9th.
   - **Proposal: take F1DB.**
3. **Driver career points:** Moss 186.5 → 186.64 and Behra 51 → 51.14 (1954 British GP shared
   fastest lap, 1/7 point each). **Proposal: take F1DB.**
4. **Constructor career points** (`constructor_stats.total_points`, from `constructor_results`):
   - Official penalties:
     - McLaren −218 (2007 exclusion) and −10 (2000);
     - Benetton −10 and Williams −6 (1995);
     - Racing Point −15 (2020).
   - Counting rules 1958–1977: only a team's best-placed car scored, and only its best results
     counted. Ferrari −74, BRM −54, McLaren −19 (1972–76), Vanwall −10, Lotus −10, Brabham −4,
     Tyrrell −4, Porsche −1.
   - Totals: McLaren 8,244.5 → 8,007.5; Ferrari 11,223 → 11,149.
   - **Proposal: take F1DB (official championship points)** for constructors.
   - Not included: Force India 2018. Our one constructor holds both 2018 entries, while F1DB
     splits Force India (59) and Racing Point Force India (52), so its −59 is a mapping artifact.
     That season stays as ours.
5. **Hub tables, smaller changes:**
   - Pit-lane starters shown as "PL" instead of a grid slot.
   - The order of zero-point drivers and of teams tied on points in mid-season standings.
   - Historical classification fixes, e.g. the 2013 US GP positions 12–16 (no points involved),
     and the step 3 kinds (classification, laps, times).
   - **Proposal: take F1DB.**

## Next

With the founder's decision on points 1–5, step 5 is:
- back up the affected tables;
- apply in one transaction with a documented rollback;
- re-run this check on production afterwards.

Mexico is on 2026-11-01. If the decision comes after Wednesday 28, the switch waits until after
the Mexico post-race load.
