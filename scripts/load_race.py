#!/usr/bin/env python3
"""
Post-race data loader: FastF1 → Supabase
Run after each race weekend to update results, qualifying, sprint, standings.

Usage:
  python scripts/load_race.py --year 2026 --round 11
  python scripts/load_race.py --year 2026 --round 11 --dry-run
  python scripts/load_race.py --year 2026 --round 11 --skip-quali
  python scripts/load_race.py --year 2026 --round 11 --skip-race
  python scripts/load_race.py --auto              # oldest past race with no results yet
  python scripts/load_race.py --auto --dry-run

After running, refresh driver_stats / constructor_stats via the Supabase SQL Editor:
  REFRESH MATERIALIZED VIEW driver_stats;
  REFRESH MATERIALIZED VIEW constructor_stats;
(If they are plain tables, run scripts/refresh_stats.sql instead.)
"""

import argparse
import os
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv
import fastf1
import pandas as pd
from supabase import create_client, Client

# Load env from .env.local (repo root)
load_dotenv(Path(__file__).parent.parent / ".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# FastF1 team name → Supabase constructor_ref
TEAM_TO_CONSTRUCTOR_REF: dict[str, str] = {
    "Red Bull Racing": "red_bull",
    "Oracle Red Bull Racing": "red_bull",
    "Red Bull": "red_bull",
    "McLaren": "mclaren",
    "Ferrari": "ferrari",
    "Mercedes": "mercedes",
    "Aston Martin": "aston_martin",
    "Aston Martin Aramco": "aston_martin",
    "Alpine": "alpine",
    "Alpine F1 Team": "alpine",
    "Williams": "williams",
    "Williams Racing": "williams",
    "Racing Bulls": "rb",
    "RB": "rb",
    "Haas F1 Team": "haas",
    "HAAS F1 Team": "haas",
    "Kick Sauber": "sauber",
    "Kick Sauber ORLEN": "sauber",
    "Cadillac": "cadillac",
    "Cadillac F1 Team": "cadillac",
    "Audi": "audi",
}


# ── Helpers ──────────────────────────────────────────────────────────

def td_to_ms(td) -> int | None:
    if td is None or (isinstance(td, float) and pd.isna(td)):
        return None
    try:
        if pd.isna(td):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(td, (timedelta, pd.Timedelta)):
        return int(td.total_seconds() * 1000)
    return None


def td_to_str(td) -> str | None:
    """Convert lap time timedelta to m:ss.sss string (Ergast format)."""
    ms = td_to_ms(td)
    if ms is None:
        return None
    total_s = ms / 1000
    minutes = int(total_s // 60)
    seconds = total_s % 60
    return f"{minutes}:{seconds:06.3f}"


def safe_int(val, default=0) -> int:
    try:
        if pd.isna(val):
            return default
    except (TypeError, ValueError):
        pass
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


def classification(row, winner_laps: int, winner_ms: int | None, status_map: dict[str, int]) -> dict:
    """position / position_text / laps / time / milliseconds / status_id for one race or sprint
    result row, in the Ergast convention the historical rows use:
    - position from ClassifiedPosition (Position is only the finishing order): unclassified
      cars get position NULL and position_text "R" (or "D", "W", ... as FastF1 reports it);
    - FastF1's "Lapped" becomes "+N Lap(s)" from the lap count, like every pre-2026 row;
    - time is the winner's total ("1:42:00.785") or the gap to the winner ("+7.335") for cars on
      the lead lap, NULL otherwise (FastF1's Time for a lapped car is not a gap to the winner);
      milliseconds is the total race time, NULL where time is.
    An unknown status stops the load instead of being written as "Finished"."""
    classified = str(row.get("ClassifiedPosition", "") or "").strip()
    position = int(classified) if classified.isdigit() else None
    position_text = classified if classified else "R"
    laps = safe_int(row.get("Laps"))

    status_text = str(row.get("Status") or "Finished")
    if status_text == "Lapped":
        down = max(1, winner_laps - laps)
        status_text = f"+{down} Lap{'s' if down > 1 else ''}"
    status_id = status_map.get(status_text)
    if status_id is None:
        sys.exit(f"ERROR: unknown status '{status_text}' for {row.get('Abbreviation')} -- add it to the status table and re-run")

    time_str: str | None = None
    ms: int | None = None
    t_ms = td_to_ms(row.get("Time"))
    if position == 1 and t_ms is not None:
        ms = t_ms
        h, rem = divmod(t_ms, 3_600_000)
        m, rem = divmod(rem, 60_000)
        time_str = f"{h}:{m:02d}:{rem / 1000:06.3f}" if h else f"{m}:{rem / 1000:06.3f}"
    elif status_text == "Finished" and laps == winner_laps and t_ms is not None and winner_ms is not None:
        ms = winner_ms + t_ms
        time_str = f"+{t_ms / 1000:.3f}"

    return {
        "position": position,
        "position_text": position_text,
        "laps": laps,
        "time": time_str,
        "milliseconds": ms,
        "status_id": status_id,
        "status_text": status_text,
    }


def winner_of(results) -> tuple[int, int | None]:
    """(laps, total race ms) of the classified winner."""
    for _, row in results.iterrows():
        if str(row.get("ClassifiedPosition", "")).strip() == "1":
            return safe_int(row.get("Laps")), td_to_ms(row.get("Time"))
    sys.exit("ERROR: no classified winner in the FastF1 results -- classification not final yet? Use --skip-results")


def safe_float(val) -> float | None:
    try:
        if pd.isna(val):
            return None
    except (TypeError, ValueError):
        pass
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


# ── Main ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Load race weekend data into Supabase")
    parser.add_argument("--year", type=int, dest="year")
    parser.add_argument("--round", type=int, dest="round_num")
    parser.add_argument("--auto", action="store_true", help="Auto-detect the oldest past race with no results loaded yet, ignoring --year/--round")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be inserted, write nothing")
    parser.add_argument("--skip-quali", action="store_true")
    parser.add_argument("--skip-race", action="store_true")
    parser.add_argument("--skip-sprint", action="store_true")
    parser.add_argument("--skip-results", action="store_true",
                         help="still extract/write pit_stops and lap_times, but skip the results "
                              "table and standings recompute — for when points/status haven't "
                              "synced yet right after a race (classification pending review)")
    args = parser.parse_args()

    if not args.auto and (args.year is None or args.round_num is None):
        parser.error("--year and --round are required unless --auto is set")

    dry_run = args.dry_run

    # ── Supabase connection ──────────────────────────────────────────
    sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # ── Auto-detect pending race (for scheduled/cron runs) ─────────────
    if args.auto:
        today = date.today().isoformat()
        # PostgREST caps rows per request (default 1000) regardless of
        # .limit(), so a single query silently truncates to the oldest
        # races — page through with .range() to see every past race.
        candidates: list[dict] = []
        page_size = 1000
        offset = 0
        while True:
            page = (
                sb.table("races")
                .select("id, year, round, name, date")
                .lte("date", today)
                .order("date")
                .range(offset, offset + page_size - 1)
                .execute()
            )
            candidates.extend(page.data)
            if len(page.data) < page_size:
                break
            offset += page_size
        target = None
        for race in candidates:
            has_results = sb.table("results").select("id").eq("race_id", race["id"]).limit(1).execute()
            if not has_results.data:
                target = race
                break
        if target is None:
            print("[AUTO] No pending races — everything up to date. Nothing to do.")
            sys.exit(0)
        year, round_num = target["year"], target["round"]
        print(f"[AUTO] Detected pending race: {target['name']} ({year} round {round_num})\n")
    else:
        year, round_num = args.year, args.round_num

    print(f"{'[DRY RUN] ' if dry_run else ''}PaddockIntel loader — {year} Round {round_num}\n")

    # ── Fetch lookup tables ──────────────────────────────────────────
    drivers_res = sb.table("drivers").select("id, code, number, driver_ref, forename, surname").execute()
    drivers_by_code: dict[str, dict] = {r["code"]: r for r in drivers_res.data if r.get("code")}
    drivers_by_number: dict[str, dict] = {str(r["number"]): r for r in drivers_res.data if r.get("number")}

    constructors_res = sb.table("constructors").select("id, name, constructor_ref").execute()
    constructors_by_ref: dict[str, dict] = {r["constructor_ref"]: r for r in constructors_res.data}

    status_res = sb.table("status").select("id, status").execute()
    status_map: dict[str, int] = {r["status"]: r["id"] for r in status_res.data}

    def resolve_driver(code: str | None = None, number=None) -> dict | None:
        if code and code in drivers_by_code:
            return drivers_by_code[code]
        if number is not None and str(number) in drivers_by_number:
            return drivers_by_number[str(number)]
        return None

    constructors_by_name: dict[str, dict] = {r["name"].lower(): r for r in constructors_res.data}

    def resolve_constructor(team_name: str) -> dict:
        ref = TEAM_TO_CONSTRUCTOR_REF.get(team_name)
        if ref and ref in constructors_by_ref:
            return constructors_by_ref[ref]
        # Exact (case-insensitive) name match only. The old substring fallback matched any team
        # containing "re" to constructor 93 ("RE", a 1965 entrant) -- Red Bull's 2026 Singapore
        # results and four qualifying sessions were written to it. Unknown team = stop the load,
        # never a guess.
        c = constructors_by_name.get(team_name.strip().lower())
        if c:
            return c
        sys.exit(f"ERROR: unknown constructor '{team_name}' -- add it to TEAM_TO_CONSTRUCTOR_REF and re-run")

    # ── Find race in Supabase ────────────────────────────────────────
    race_res = (
        sb.table("races")
        .select("id, name, circuit_id, sprint_date")
        .eq("year", year)
        .eq("round", round_num)
        .single()
        .execute()
    )
    if not race_res.data:
        print(f"ERROR: No race found in Supabase for {year} round {round_num}")
        print("The race may not be in the calendar yet. Add it manually first.")
        sys.exit(1)

    race_id: int = race_res.data["id"]
    race_name: str = race_res.data["name"]
    has_sprint: bool = bool(race_res.data.get("sprint_date"))
    print(f"Race: {race_name} (id={race_id}){' [sprint weekend]' if has_sprint else ''}\n")

    # ── Fetch next available IDs (tables use serial PKs, not auto-increment) ──
    max_result_id_res  = sb.table("results").select("id").order("id", desc=True).limit(1).execute()
    max_quali_id_res   = sb.table("qualifying").select("id").order("id", desc=True).limit(1).execute()
    max_sprint_id_res  = sb.table("sprint_results").select("id").order("id", desc=True).limit(1).execute()
    max_dstand_id_res  = sb.table("driver_standings").select("id").order("id", desc=True).limit(1).execute()
    max_cstand_id_res  = sb.table("constructor_standings").select("id").order("id", desc=True).limit(1).execute()
    next_result_id = (max_result_id_res.data[0]["id"]  if max_result_id_res.data  else 0) + 1
    next_quali_id  = (max_quali_id_res.data[0]["id"]   if max_quali_id_res.data   else 0) + 1
    next_sprint_id = (max_sprint_id_res.data[0]["id"]  if max_sprint_id_res.data  else 0) + 1
    next_dstand_id = (max_dstand_id_res.data[0]["id"]  if max_dstand_id_res.data  else 0) + 1
    next_cstand_id = (max_cstand_id_res.data[0]["id"]  if max_cstand_id_res.data  else 0) + 1

    # ── FastF1 cache ─────────────────────────────────────────────────
    cache_dir = Path(__file__).parent.parent / ".fastf1_cache"
    cache_dir.mkdir(exist_ok=True)
    fastf1.Cache.enable_cache(str(cache_dir))

    # ── QUALIFYING ───────────────────────────────────────────────────
    if not args.skip_quali:
        print("── Qualifying ──────────────────────────────────────")
        try:
            quali = fastf1.get_session(year, round_num, "Q")
            quali.load(telemetry=False, weather=False, messages=False)

            quali_rows: list[dict] = []
            for _, row in quali.results.iterrows():
                driver = resolve_driver(code=row.get("Abbreviation"), number=row.get("DriverNumber"))
                constructor = resolve_constructor(str(row.get("TeamName", "")))
                if not driver or not constructor:
                    continue

                position = safe_int(row.get("Position"), 0) or None
                quali_rows.append({
                    "id": next_quali_id + len(quali_rows),
                    "race_id": race_id,
                    "driver_id": driver["id"],
                    "constructor_id": constructor["id"],
                    "number": safe_int(row.get("DriverNumber")),
                    "position": position,
                    "q1": td_to_str(row.get("Q1")),
                    "q2": td_to_str(row.get("Q2")),
                    "q3": td_to_str(row.get("Q3")),
                })
                q_time = td_to_str(row.get("Q3") or row.get("Q2") or row.get("Q1"))
                print(f"  P{str(position or '?'):>2}  {row.get('Abbreviation')}  {q_time or '—'}")

            if not dry_run and quali_rows:
                sb.table("qualifying").delete().eq("race_id", race_id).execute()
                sb.table("qualifying").insert(quali_rows).execute()
                print(f"\n  ✓ {len(quali_rows)} qualifying rows inserted")
            elif dry_run:
                print(f"\n  [dry-run] would insert {len(quali_rows)} qualifying rows")
        except Exception as exc:
            print(f"  ERROR: {exc}")

    # ── RACE ─────────────────────────────────────────────────────────
    if not args.skip_race:
        print("\n── Race ────────────────────────────────────────────")
        try:
            race_session = fastf1.get_session(year, round_num, "R")
            race_session.load(telemetry=False, weather=False, messages=False)

            # Fastest lap holder + per-driver best lap (FastestLapTime is NOT a
            # column of session.results — it must come from the laps dataframe)
            fastest_lap_code: str | None = None
            best_lap_by_code: dict[str, object] = {}
            try:
                fl = race_session.laps.pick_fastest()
                if fl is not None:
                    fastest_lap_code = fl["Driver"]
                for drv_code in race_session.laps["Driver"].unique():
                    best = race_session.laps.pick_drivers(drv_code)["LapTime"].min()
                    if td_to_ms(best):
                        best_lap_by_code[drv_code] = best
            except Exception:
                pass

            # Pit-lane starters: FastF1's GridPosition can carry the slot the car left empty
            # (Austin 2026: Stroll came through as 22), while results keep the Ergast convention
            # of grid 0. A pit-lane starter's first lap is an out-lap, so lap 1 has a PitOutTime.
            pit_lane_starters: set[str] = set()
            try:
                first_laps = race_session.laps[race_session.laps["LapNumber"] == 1]
                pit_lane_starters = {str(d) for d in first_laps[first_laps["PitOutTime"].notna()]["Driver"]}
                for code in sorted(pit_lane_starters):
                    print(f"  {code} started from the pit lane (grid 0)")
            except Exception:
                print("  WARN: lap data unavailable, pit-lane starters not checked (grid = FastF1 GridPosition)")

            result_rows: list[dict] = []
            if args.skip_results:
                print("  (--skip-results: classification/points not synced yet, skipping results table)")
            else:
                winner_laps, winner_ms = winner_of(race_session.results)
                for pos_order, (_, row) in enumerate(race_session.results.iterrows(), 1):
                    driver = resolve_driver(code=row.get("Abbreviation"), number=row.get("DriverNumber"))
                    constructor = resolve_constructor(str(row.get("TeamName", "")))
                    if not driver or not constructor:
                        continue

                    c = classification(row, winner_laps, winner_ms, status_map)
                    grid = 0 if row.get("Abbreviation") in pit_lane_starters else safe_int(row.get("GridPosition"))

                    fl_time = td_to_str(best_lap_by_code.get(row.get("Abbreviation")))
                    fl_speed_f = safe_float(row.get("FastestLapSpeed"))
                    is_fastest = (row.get("Abbreviation") == fastest_lap_code)

                    result_rows.append({
                        "id": next_result_id + len(result_rows),
                        "race_id": race_id,
                        "driver_id": driver["id"],
                        "constructor_id": constructor["id"],
                        "grid": grid,
                        # Pole as the official records count it: the car that starts from the front
                        # of the grid, after grid penalties (supabase/migrations/20261027130000_*).
                        "pole": grid == 1,
                        "position": c["position"],
                        "position_text": c["position_text"],
                        "position_order": pos_order,
                        "points": safe_float(row.get("Points")) or 0.0,
                        "laps": c["laps"],
                        "time": c["time"],
                        "milliseconds": c["milliseconds"],
                        "fastest_lap_time": fl_time,
                        "fastest_lap_speed": str(round(fl_speed_f, 3)) if fl_speed_f else None,
                        "rank": 1 if is_fastest else None,
                        "status_id": c["status_id"],
                    })
                    print(f"  P{c['position_text']:>3}  {row.get('Abbreviation')}  {c['laps']:>3} laps  {c['status_text']:<9} {c['time'] or '':>12}  {safe_float(row.get('Points')) or 0:.0f}pts")

            # ── Pit stops ────────────────────────────────────────────
            # FastF1 semantics: PitInTime is stamped on the in-lap (lap N) and
            # PitOutTime on the out-lap (lap N+1) — they are session-clock
            # timestamps, never both on the same lap row. Duration is
            # PitOutTime(N+1) - PitInTime(N) = total pit-lane time (Ergast
            # convention, ~20s+), not the ~2s stationary time.
            print("\n── Pit stops ───────────────────────────────────────")
            pit_rows: list[dict] = []
            try:
                laps = race_session.laps
                for drv_code in laps["Driver"].unique():
                    driver = resolve_driver(code=drv_code)
                    if not driver:
                        continue
                    drv_laps = laps.pick_drivers(drv_code).sort_values("LapNumber")
                    pit_ins: dict[int, int] = {}
                    pit_outs: dict[int, int] = {}
                    for _, lap in drv_laps.iterrows():
                        n = safe_int(lap.get("LapNumber"))
                        in_ms = td_to_ms(lap.get("PitInTime"))
                        out_ms = td_to_ms(lap.get("PitOutTime"))
                        if in_ms:
                            pit_ins[n] = in_ms
                        if out_ms:
                            pit_outs[n] = out_ms
                    stop_num = 0
                    for n, in_ms in sorted(pit_ins.items()):
                        out_ms = pit_outs.get(n + 1) or pit_outs.get(n)
                        if out_ms and out_ms > in_ms:
                            dur_ms = out_ms - in_ms
                            if 1500 < dur_ms < 180000:  # sanity: 1.5s–180s (red flags run long)
                                stop_num += 1
                                pit_rows.append({
                                    "race_id": race_id,
                                    "driver_id": driver["id"],
                                    "stop": stop_num,
                                    "lap": n,
                                    "duration": f"{dur_ms / 1000:.3f}",
                                    "milliseconds": dur_ms,
                                })
                print(f"  {len(pit_rows)} pit stop rows extracted")
            except Exception as exc:
                print(f"  WARN: pit stop extraction failed — {exc}")

            # ── Lap times ────────────────────────────────────────────
            print("\n── Lap times ───────────────────────────────────────")
            lap_rows: list[dict] = []
            try:
                for _, lap in race_session.laps.iterrows():
                    driver = resolve_driver(code=lap.get("Driver"))
                    ms = td_to_ms(lap.get("LapTime"))
                    if not driver or not ms:
                        continue
                    lap_rows.append({
                        "race_id": race_id,
                        "driver_id": driver["id"],
                        "lap": safe_int(lap.get("LapNumber")),
                        "position": safe_int(lap.get("Position")) or None,
                        "time": td_to_str(lap.get("LapTime")),
                        "milliseconds": ms,
                    })
                print(f"  {len(lap_rows)} lap time rows extracted")
            except Exception as exc:
                print(f"  WARN: lap time extraction failed — {exc}")

            if result_rows and sum(1 for r in result_rows if r["pole"]) != 1:
                for r in result_rows:
                    r["pole"] = False
                print("  WARN: no single grid-1 starter, pole not set; set results.pole by hand from the official grid")

            if not dry_run:
                if result_rows:
                    sb.table("results").delete().eq("race_id", race_id).execute()
                    sb.table("results").insert(result_rows).execute()
                    print(f"  ✓ {len(result_rows)} result rows inserted")
                if pit_rows:
                    sb.table("pit_stops").delete().eq("race_id", race_id).execute()
                    sb.table("pit_stops").insert(pit_rows).execute()
                    print(f"  ✓ {len(pit_rows)} pit stop rows inserted")
                if lap_rows:
                    sb.table("lap_times").delete().eq("race_id", race_id).execute()
                    for i in range(0, len(lap_rows), 500):
                        sb.table("lap_times").insert(lap_rows[i : i + 500]).execute()
                    print(f"  ✓ {len(lap_rows)} lap time rows inserted")
            else:
                print(f"  [dry-run] would insert {len(result_rows)} results, {len(pit_rows)} pit stops, {len(lap_rows)} lap times")

        except Exception as exc:
            print(f"  ERROR: {exc}")
            raise

    # ── SPRINT ───────────────────────────────────────────────────────
    if has_sprint and not args.skip_sprint:
        print("\n── Sprint ──────────────────────────────────────────")
        try:
            sprint_session = fastf1.get_session(year, round_num, "S")
            sprint_session.load(telemetry=False, weather=False, messages=False, laps=False)

            sprint_rows: list[dict] = []
            winner_laps, winner_ms = winner_of(sprint_session.results)
            for pos_order, (_, row) in enumerate(sprint_session.results.iterrows(), 1):
                driver = resolve_driver(code=row.get("Abbreviation"), number=row.get("DriverNumber"))
                constructor = resolve_constructor(str(row.get("TeamName", "")))
                if not driver or not constructor:
                    continue

                c = classification(row, winner_laps, winner_ms, status_map)

                sprint_rows.append({
                    "id": next_sprint_id + len(sprint_rows),
                    "race_id": race_id,
                    "driver_id": driver["id"],
                    "constructor_id": constructor["id"],
                    "grid": safe_int(row.get("GridPosition")),
                    "position": c["position"],
                    "position_text": c["position_text"],
                    "position_order": pos_order,
                    "points": safe_float(row.get("Points")) or 0.0,
                    "laps": c["laps"],
                    "time": c["time"],
                    "milliseconds": c["milliseconds"],
                    "status_id": c["status_id"],
                })
                print(f"  P{c['position_text']:>3}  {row.get('Abbreviation')}  {c['laps']:>3} laps  {c['status_text']:<9} {c['time'] or '':>12}  {safe_float(row.get('Points')) or 0:.0f}pts")

            if not dry_run and sprint_rows:
                sb.table("sprint_results").delete().eq("race_id", race_id).execute()
                sb.table("sprint_results").insert(sprint_rows).execute()
                print(f"\n  ✓ {len(sprint_rows)} sprint result rows inserted")
            elif dry_run:
                print(f"\n  [dry-run] would insert {len(sprint_rows)} sprint result rows")
        except Exception as exc:
            print(f"  ERROR: {exc}")

    # ── STANDINGS ────────────────────────────────────────────────────
    print("\n── Standings ───────────────────────────────────────")
    if args.skip_results:
        print("  (--skip-results: this race has no results yet — standings left untouched)")
    else:
        try:
            season_races = (
                sb.table("races")
                .select("id")
                .eq("year", year)
                .lte("round", round_num)
                .execute()
            )
            season_race_ids = [r["id"] for r in season_races.data]

            all_results = (
                sb.table("results")
                .select("race_id, driver_id, constructor_id, points, position")
                .in_("race_id", season_race_ids)
                .execute()
            )

            # Sprint results — included in championship standings
            all_sprint = (
                sb.table("sprint_results")
                .select("race_id, driver_id, constructor_id, points, position")
                .in_("race_id", season_race_ids)
                .execute()
            )

            # Aggregate
            driver_pts: dict[int, float] = defaultdict(float)
            driver_wins: dict[int, int] = defaultdict(int)
            driver_constr: dict[int, int] = {}
            constr_pts: dict[int, float] = defaultdict(float)
            constr_wins: dict[int, int] = defaultdict(int)

            for r in all_results.data:
                did, cid = r["driver_id"], r["constructor_id"]
                pts = r["points"] or 0
                driver_pts[did] += pts
                constr_pts[cid] += pts
                if r["position"] == 1:
                    driver_wins[did] += 1
                    constr_wins[cid] += 1
                driver_constr[did] = cid

            # Add sprint points (sprint wins don't count toward wins tally)
            for r in (all_sprint.data or []):
                did, cid = r["driver_id"], r["constructor_id"]
                pts = r["points"] or 0
                driver_pts[did] += pts
                constr_pts[cid] += pts

            # Ties on points are broken by countback, as in the FIA Sporting Regulations: most
            # Grand Prix wins, then most second places, and so on (sprints only add points).
            # Sorting on points alone left tied drivers in whatever order the rows came back.
            driver_finishes: dict[int, list[int]] = defaultdict(list)
            constr_finishes: dict[int, list[int]] = defaultdict(list)
            for r in all_results.data:
                if r["position"]:
                    driver_finishes[r["driver_id"]].append(r["position"])
                    constr_finishes[r["constructor_id"]].append(r["position"])

            def countback(points: float, finishes: list[int], tie_id: int) -> tuple:
                return (-points, *(-finishes.count(p) for p in range(1, 31)), tie_id)

            sorted_drivers = sorted(driver_pts.items(), key=lambda x: countback(x[1], driver_finishes[x[0]], x[0]))
            sorted_constrs = sorted(constr_pts.items(), key=lambda x: countback(x[1], constr_finishes[x[0]], x[0]))

            driver_standing_rows = [
                {"id": next_dstand_id + i, "race_id": race_id, "driver_id": did, "points": pts, "position": i + 1, "wins": driver_wins[did]}
                for i, (did, pts) in enumerate(sorted_drivers)
            ]
            constructor_standing_rows = [
                {"id": next_cstand_id + i, "race_id": race_id, "constructor_id": cid, "points": pts, "position": i + 1, "wins": constr_wins[cid]}
                for i, (cid, pts) in enumerate(sorted_constrs)
            ]

            if not dry_run:
                sb.table("driver_standings").delete().eq("race_id", race_id).execute()
                sb.table("driver_standings").insert(driver_standing_rows).execute()
                sb.table("constructor_standings").delete().eq("race_id", race_id).execute()
                sb.table("constructor_standings").insert(constructor_standing_rows).execute()
                print(f"  ✓ {len(driver_standing_rows)} driver standing rows")
                print(f"  ✓ {len(constructor_standing_rows)} constructor standing rows")

            # Per-race constructor points (Grand Prix + Sprint of this weekend), the convention
            # constructor_results follows for 2021-2024 and that constructor_stats.total_points sums.
            # This loader never wrote the table before, which left 2026 rounds 7-17 empty.
            race_constr_pts: dict[int, float] = defaultdict(float)
            for r in all_results.data + (all_sprint.data or []):
                if r["race_id"] == race_id:
                    race_constr_pts[r["constructor_id"]] += r["points"] or 0
            if not dry_run and race_constr_pts:
                sb.table("constructor_results").delete().eq("race_id", race_id).execute()
                max_cres = sb.table("constructor_results").select("id").order("id", desc=True).limit(1).execute()
                next_cres_id = (max_cres.data[0]["id"] if max_cres.data else 0) + 1
                sb.table("constructor_results").insert([
                    {"id": next_cres_id + i, "race_id": race_id, "constructor_id": cid, "points": pts, "status": None}
                    for i, (cid, pts) in enumerate(sorted(race_constr_pts.items()))
                ]).execute()
                print(f"  ✓ {len(race_constr_pts)} constructor result rows")

            print("\n  Top 5 drivers:")
            for i, (did, pts) in enumerate(sorted_drivers[:5], 1):
                drv = next((d for d in drivers_res.data if d["id"] == did), None)
                name = drv["surname"] if drv else str(did)
                print(f"    P{i}  {name:<20} {pts:.0f} pts  ({driver_wins[did]} W)")

        except Exception as exc:
            print(f"  ERROR: {exc}")

    # ── Done ─────────────────────────────────────────────────────────
    if not dry_run:
        try:
            sb.rpc("refresh_stats", {}).execute()
            print("\n  ✓ driver_stats / constructor_stats refreshed via RPC")
        except Exception as exc:
            print(f"\n  WARN: refresh_stats RPC failed ({exc}) — run it manually in the SQL Editor")
    print(f"\n{'[DRY RUN — nothing written] ' if dry_run else ''}Done.")


if __name__ == "__main__":
    main()
