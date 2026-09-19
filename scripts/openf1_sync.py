#!/usr/bin/env python3
"""
OpenF1 + FastF1 telemetry enrichment: adds tire stints, weather, race control
messages, on-track overtakes, and stationary pit-stop time — fields our
Ergast/jolpica-lineage tables never had.

Weather, race control messages, and tire stints all come from FastF1 (already
a project dependency, already used by load_race.py) — no raw OpenF1 call
needed for those. Stationary pit time and overtakes are OpenF1-exclusive
(jolpica/Ergast only ever gives total pit-lane duration), so those two hit
the OpenF1 REST API directly.

OpenF1 coverage starts 2023. `stop_duration` specifically is only populated
from the 2024 US GP onward — a NULL stop_duration_ms for an earlier session
is expected, not a bug.

Usage:
  python scripts/openf1_sync.py --year 2026 --round 14
  python scripts/openf1_sync.py --year 2026 --round 14 --dry-run
  python scripts/openf1_sync.py --year 2026 --round 14 --session-key 9999   # skip auto-match
  python scripts/openf1_sync.py --year 2026 --round 14 --skip-openf1        # FastF1 fields only
  python scripts/openf1_sync.py --year 2026 --round 14 --skip-fastf1        # OpenF1 fields only
"""

import argparse
import os
import sys
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
import fastf1
import pandas as pd
import requests
from supabase import create_client, Client

# Load env from .env.local (repo root)
load_dotenv(Path(__file__).parent.parent / ".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

OPENF1_BASE = "https://api.openf1.org/v1"


# ── Helpers ──────────────────────────────────────────────────────────

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


def safe_float(val):
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
    parser = argparse.ArgumentParser(description="Enrich a race with OpenF1/FastF1 telemetry")
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--round", type=int, required=True, dest="round_num")
    parser.add_argument("--session-key", type=int, default=None,
                         help="OpenF1 session_key override — skips auto-match against circuits")
    parser.add_argument("--skip-openf1", action="store_true",
                         help="skip OpenF1 REST calls (stop_duration, overtakes)")
    parser.add_argument("--skip-fastf1", action="store_true",
                         help="skip FastF1 fields (weather, race control, tire stints)")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be written, write nothing")
    args = parser.parse_args()
    dry_run = args.dry_run
    year, round_num = args.year, args.round_num

    print(f"{'[DRY RUN] ' if dry_run else ''}PaddockIntel OpenF1 sync — {year} Round {round_num}\n")

    # ── Supabase connection ──────────────────────────────────────────
    sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    race_res = (
        sb.table("races")
        .select("id, name, circuit_id")
        .eq("year", year)
        .eq("round", round_num)
        .single()
        .execute()
    )
    if not race_res.data:
        print(f"ERROR: No race found in Supabase for {year} round {round_num}")
        sys.exit(1)
    race_id: int = race_res.data["id"]
    race_name: str = race_res.data["name"]
    circuit_id: int = race_res.data["circuit_id"]
    print(f"Race: {race_name} (id={race_id})\n")

    circuit_res = sb.table("circuits").select("name, location, country").eq("id", circuit_id).single().execute()
    circuit = circuit_res.data or {}

    drivers_res = sb.table("drivers").select("id, code, number, driver_ref").execute()
    drivers_by_code: dict[str, dict] = {r["code"]: r for r in drivers_res.data if r.get("code")}
    drivers_by_number: dict[str, dict] = {str(r["number"]): r for r in drivers_res.data if r.get("number")}

    def resolve_driver(code: str | None = None, number=None) -> dict | None:
        if code and code in drivers_by_code:
            return drivers_by_code[code]
        if number is not None and str(number) in drivers_by_number:
            return drivers_by_number[str(number)]
        return None

    # ── FastF1: weather, race control, tire stints ─────────────────────
    if not args.skip_fastf1:
        print("── FastF1: weather / race control / tire stints ─────")
        try:
            cache_dir = Path(__file__).parent.parent / ".fastf1_cache"
            cache_dir.mkdir(exist_ok=True)
            fastf1.Cache.enable_cache(str(cache_dir))

            session = fastf1.get_session(year, round_num, "R")
            session.load(telemetry=False, weather=True, messages=True)
            t0 = session.t0_date  # absolute UTC reference; Time columns below are offsets from it

            # Weather (measured, not forecast — session.weather_data is real sampled conditions)
            weather_rows: list[dict] = []
            try:
                for _, row in session.weather_data.iterrows():
                    t = row.get("Time")
                    if t0 is None or not isinstance(t, (timedelta, pd.Timedelta)):
                        continue
                    weather_rows.append({
                        "race_id": race_id,
                        "recorded_at": (t0 + t).isoformat(),
                        "air_temperature": safe_float(row.get("AirTemp")),
                        "track_temperature": safe_float(row.get("TrackTemp")),
                        "humidity": safe_float(row.get("Humidity")),
                        "rainfall": bool(row.get("Rainfall")) if row.get("Rainfall") is not None else None,
                        "wind_speed": safe_float(row.get("WindSpeed")),
                        "wind_direction": safe_int(row.get("WindDirection"), None),
                    })
                print(f"  {len(weather_rows)} weather readings")
            except Exception as exc:
                print(f"  WARN: weather extraction failed — {exc}")
                weather_rows = []

            # Race control messages (flags, SC/VSC, incidents — the real steward timeline)
            rc_rows: list[dict] = []
            try:
                for _, row in session.race_control_messages.iterrows():
                    t = row.get("Time")
                    if isinstance(t, pd.Timestamp):
                        recorded_at = t
                    elif t0 is not None and isinstance(t, (timedelta, pd.Timedelta)):
                        recorded_at = t0 + t
                    else:
                        recorded_at = None
                    msg = row.get("Message")
                    if not msg:
                        continue
                    driver = resolve_driver(number=row.get("RacingNumber"))
                    rc_rows.append({
                        "race_id": race_id,
                        "lap_number": safe_int(row.get("Lap"), None),
                        "category": str(row.get("Category")) if row.get("Category") is not None else None,
                        "flag": str(row.get("Flag")) if row.get("Flag") is not None else None,
                        "message": str(msg),
                        "driver_id": driver["id"] if driver else None,
                        "recorded_at": recorded_at.isoformat() if recorded_at is not None else None,
                    })
                print(f"  {len(rc_rows)} race control messages")
            except Exception as exc:
                print(f"  WARN: race control extraction failed — {exc}")
                rc_rows = []

            # Tire stints — group each driver's laps by FastF1's Stint number
            stint_rows: list[dict] = []
            try:
                laps = session.laps
                for drv_code in laps["Driver"].unique():
                    driver = resolve_driver(code=drv_code)
                    if not driver:
                        continue
                    drv_laps = laps.pick_drivers(drv_code).sort_values("LapNumber")
                    for stint_num, stint_laps in drv_laps.groupby("Stint"):
                        if pd.isna(stint_num):
                            continue
                        first = stint_laps.iloc[0]
                        stint_rows.append({
                            "race_id": race_id,
                            "driver_id": driver["id"],
                            "stint_number": safe_int(stint_num),
                            "compound": str(first.get("Compound")) if first.get("Compound") else None,
                            "tyre_age_at_start": safe_int(first.get("TyreLife"), None),
                            "lap_start": safe_int(stint_laps["LapNumber"].min(), None),
                            "lap_end": safe_int(stint_laps["LapNumber"].max(), None),
                        })
                print(f"  {len(stint_rows)} tire stint rows")
            except Exception as exc:
                print(f"  WARN: tire stint extraction failed — {exc}")
                stint_rows = []

            if not dry_run:
                if weather_rows:
                    sb.table("weather_readings").delete().eq("race_id", race_id).execute()
                    sb.table("weather_readings").insert(weather_rows).execute()
                    print(f"  ✓ {len(weather_rows)} weather rows inserted")
                if rc_rows:
                    sb.table("race_control_messages").delete().eq("race_id", race_id).execute()
                    sb.table("race_control_messages").insert(rc_rows).execute()
                    print(f"  ✓ {len(rc_rows)} race control rows inserted")
                if stint_rows:
                    sb.table("tire_stints").delete().eq("race_id", race_id).execute()
                    sb.table("tire_stints").insert(stint_rows).execute()
                    print(f"  ✓ {len(stint_rows)} tire stint rows inserted")
            else:
                print(f"  [dry-run] would insert {len(weather_rows)} weather, {len(rc_rows)} race control, "
                      f"{len(stint_rows)} stint rows")

        except Exception as exc:
            print(f"  ERROR: FastF1 section failed — {exc}")

    # ── OpenF1: stationary pit time + overtakes ─────────────────────────
    if not args.skip_openf1:
        print("\n── OpenF1: stationary pit time / overtakes ───────────")
        try:
            session_key = args.session_key
            if session_key is None:
                resp = requests.get(f"{OPENF1_BASE}/sessions",
                                     params={"year": year, "session_name": "Race"}, timeout=30)
                resp.raise_for_status()
                candidates = resp.json()
                circuit_name = (circuit.get("name") or "").lower()
                circuit_location = (circuit.get("location") or "").lower()
                circuit_country = (circuit.get("country") or "").lower()
                matches = []
                for c in candidates:
                    loc = str(c.get("location", "")).lower()
                    country = str(c.get("country_name", "")).lower()
                    circ = str(c.get("circuit_short_name", "")).lower()
                    if (loc and circuit_location and (loc in circuit_location or circuit_location in loc)) or \
                       (country and country == circuit_country) or \
                       (circ and circuit_name and (circ in circuit_name or circuit_name in circ)):
                        matches.append(c)
                if len(matches) == 1:
                    session_key = matches[0]["session_key"]
                    print(f"  matched OpenF1 session_key={session_key} "
                          f"({matches[0].get('location')}, {matches[0].get('country_name')})")
                elif len(matches) == 0:
                    print(f"  WARN: no OpenF1 session match for {race_name} {year} — "
                          f"skipping OpenF1 section (pass --session-key to override)")
                else:
                    print(f"  WARN: {len(matches)} ambiguous OpenF1 session matches — "
                          f"pass --session-key to disambiguate:")
                    for c in matches:
                        print(f"    session_key={c['session_key']}  {c.get('location')}  "
                              f"{c.get('country_name')}  {c.get('date_start')}")

            if session_key is not None:
                # ── Pit stops → stationary time ─────────────────────────
                pit_resp = requests.get(f"{OPENF1_BASE}/pit", params={"session_key": session_key}, timeout=30)
                pit_resp.raise_for_status()
                pit_data = pit_resp.json()

                existing_pits_res = (
                    sb.table("pit_stops").select("id, driver_id, lap, stop").eq("race_id", race_id).execute()
                )
                existing_by_driver: dict[int, list[dict]] = {}
                for r in existing_pits_res.data or []:
                    existing_by_driver.setdefault(r["driver_id"], []).append(r)
                for rows in existing_by_driver.values():
                    rows.sort(key=lambda r: r["lap"])

                # Only stops with a real stop_duration (pre-2024-US-GP sessions report null here)
                per_driver_openf1: dict[int, list[dict]] = {}
                for p in pit_data:
                    if p.get("stop_duration") is None:
                        continue
                    per_driver_openf1.setdefault(p["driver_number"], []).append(p)

                # Match chronologically: nth OpenF1 stop (by lap) -> nth of our own pit_stops rows
                # (already ordered by lap in load_race.py). Lap numbering conventions between
                # OpenF1 and FastF1 can differ by one, so this matches by stop order, not lap number.
                updates: list[dict] = []
                for driver_number, stops in per_driver_openf1.items():
                    driver = resolve_driver(number=driver_number)
                    if not driver:
                        continue
                    stops.sort(key=lambda p: p.get("lap_number") or 0)
                    ours = existing_by_driver.get(driver["id"], [])
                    for i, p in enumerate(stops):
                        if i >= len(ours):
                            break
                        stop_ms = int(round(float(p["stop_duration"]) * 1000))
                        updates.append({"id": ours[i]["id"], "stop_duration_ms": stop_ms})

                print(f"  {len(updates)} pit stops matched with stationary time")
                if not dry_run:
                    for u in updates:
                        sb.table("pit_stops").update(
                            {"stop_duration_ms": u["stop_duration_ms"]}
                        ).eq("id", u["id"]).execute()
                    if updates:
                        print(f"  ✓ {len(updates)} pit_stops.stop_duration_ms updated")
                else:
                    print(f"  [dry-run] would update {len(updates)} pit_stops rows")

                # ── Overtakes ─────────────────────────────────────────
                ot_resp = requests.get(f"{OPENF1_BASE}/overtakes", params={"session_key": session_key}, timeout=30)
                ot_resp.raise_for_status()
                ot_data = ot_resp.json()
                overtake_rows: list[dict] = []
                for o in ot_data:
                    overtaking = resolve_driver(number=o.get("overtaking_driver_number"))
                    overtaken = resolve_driver(number=o.get("overtaken_driver_number"))
                    if not overtaking or not overtaken:
                        continue
                    overtake_rows.append({
                        "race_id": race_id,
                        "lap_number": safe_int(o.get("lap_number"), None),
                        "overtaking_driver_id": overtaking["id"],
                        "overtaken_driver_id": overtaken["id"],
                        "position": safe_int(o.get("position"), None),
                        "recorded_at": o.get("date"),
                    })
                print(f"  {len(overtake_rows)} overtakes")
                if not dry_run and overtake_rows:
                    sb.table("overtakes").delete().eq("race_id", race_id).execute()
                    sb.table("overtakes").insert(overtake_rows).execute()
                    print(f"  ✓ {len(overtake_rows)} overtakes inserted")
                elif dry_run:
                    print(f"  [dry-run] would insert {len(overtake_rows)} overtakes")

        except requests.exceptions.RequestException as exc:
            print(f"  ERROR: OpenF1 request failed — {exc}")
        except Exception as exc:
            print(f"  ERROR: OpenF1 section failed — {exc}")

    print("\nDone.")


if __name__ == "__main__":
    main()
