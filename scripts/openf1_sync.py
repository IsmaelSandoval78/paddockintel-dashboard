#!/usr/bin/env python3
"""
OpenF1 + FastF1 telemetry enrichment: adds tire stints, weather, race control
messages, on-track overtakes, and stationary pit-stop time — fields our
Ergast/jolpica-lineage tables never had.

Weather, race control messages, stationary pit time, and overtakes all come
from the OpenF1 REST API (session.load(weather=True, messages=True) in
FastF1 hits F1's live-timing backend directly, which — unlike OpenF1 —
reliably fails to respond from a GitHub Actions runner; OpenF1's REST API
does not have that problem). Tire stints come from FastF1's laps dataframe
(Stint/Compound/TyreLife), loaded the same way load_race.py already does
(telemetry=False, weather=False, messages=False), which is the call
signature proven to work in this environment.

OpenF1 coverage starts 2023. `stop_duration` specifically is only populated
from the 2024 US GP onward — a NULL stop_duration_ms for an earlier session
is expected, not a bug.

Usage:
  python scripts/openf1_sync.py --year 2026 --round 14
  python scripts/openf1_sync.py --year 2026 --round 14 --dry-run
  python scripts/openf1_sync.py --year 2026 --round 14 --session-key 9999   # skip auto-match
  python scripts/openf1_sync.py --year 2026 --round 14 --skip-openf1        # tire stints only
  python scripts/openf1_sync.py --year 2026 --round 14 --skip-fastf1        # skip tire stints
"""

import argparse
import os
import sys
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


def find_openf1_session(year: int, circuit: dict, session_name: str = "Race") -> tuple[int | None, list[dict]]:
    """Match our race's circuit to an OpenF1 session_key. Returns (session_key or
    None, candidates) — candidates is non-empty only when the match was ambiguous."""
    resp = requests.get(f"{OPENF1_BASE}/sessions", params={"year": year, "session_name": session_name}, timeout=30)
    resp.raise_for_status()
    sessions = resp.json()

    circuit_name = (circuit.get("name") or "").lower()
    circuit_location = (circuit.get("location") or "").lower()

    # Location/circuit-name match first — specific and rarely ambiguous.
    matches = []
    for s in sessions:
        loc = str(s.get("location", "")).lower()
        circ = str(s.get("circuit_short_name", "")).lower()
        if (loc and circuit_location and (loc in circuit_location or circuit_location in loc)) or \
           (circ and circuit_name and (circ in circuit_name or circuit_name in circ)):
            matches.append(s)

    # Fall back to country only if location gave nothing — country alone is too
    # loose when a country hosts more than one round in a season (e.g. Spain).
    if not matches:
        circuit_country = (circuit.get("country") or "").lower()
        matches = [s for s in sessions if str(s.get("country_name", "")).lower() == circuit_country]

    if len(matches) == 1:
        return matches[0]["session_key"], []
    return None, matches


# ── Main ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Enrich a race with OpenF1/FastF1 telemetry")
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--round", type=int, required=True, dest="round_num")
    parser.add_argument("--session-key", type=int, default=None,
                         help="OpenF1 session_key override — skips auto-match against circuits")
    parser.add_argument("--session-name", default="Race",
                         help="OpenF1 session_name to auto-match against (Race, Qualifying, Practice 1, "
                              "Sprint, ...) — only used when --session-key is not given")
    parser.add_argument("--skip-openf1", action="store_true",
                         help="skip OpenF1 REST calls (weather, race control, stop_duration, overtakes)")
    parser.add_argument("--skip-fastf1", action="store_true",
                         help="skip FastF1 tire stint extraction")
    parser.add_argument("--quali-session-key", type=int, default=None,
                         help="OpenF1 session_key override for the Qualifying mini-sector ingest — "
                              "skips auto-match. Independent of --session-key/--session-name.")
    parser.add_argument("--skip-quali-sectors", action="store_true",
                         help="skip qualifying_sectors ingestion (mini-sector pace/color data)")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be written, write nothing")
    parser.add_argument("--diagnose-laps", action="store_true",
                         help="Fetch OpenF1 /laps for the matched session and report sector-data "
                              "coverage (duration_sector_1/2/3, segments_sector_1/2/3), then exit. "
                              "Read-only — writes nothing to Supabase.")
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

    # ── FastF1: tire stints ─────────────────────────────────────────────
    if not args.skip_fastf1:
        print("── FastF1: tire stints ───────────────────────────────")
        try:
            cache_dir = Path(__file__).parent.parent / ".fastf1_cache"
            cache_dir.mkdir(exist_ok=True)
            fastf1.Cache.enable_cache(str(cache_dir))

            session = fastf1.get_session(year, round_num, "R")
            session.load(telemetry=False, weather=False, messages=False)

            stint_rows: list[dict] = []
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

            if not dry_run and stint_rows:
                sb.table("tire_stints").delete().eq("race_id", race_id).execute()
                sb.table("tire_stints").insert(stint_rows).execute()
                print(f"  ✓ {len(stint_rows)} tire stint rows inserted")
            elif dry_run:
                print(f"  [dry-run] would insert {len(stint_rows)} tire stint rows")

        except Exception as exc:
            print(f"  ERROR: tire stint extraction failed — {exc}")

    # ── OpenF1: weather / race control / stationary pit time / overtakes ──
    if not args.skip_openf1:
        print("\n── OpenF1: weather / race control / pit / overtakes ─")
        try:
            session_key = args.session_key
            if session_key is None:
                session_key, ambiguous = find_openf1_session(year, circuit, args.session_name)
                if session_key is not None:
                    print(f"  matched OpenF1 session_key={session_key} ({args.session_name})")
                elif ambiguous:
                    print(f"  WARN: {len(ambiguous)} ambiguous OpenF1 session matches — "
                          f"pass --session-key to disambiguate:")
                    for c in ambiguous:
                        print(f"    session_key={c['session_key']}  {c.get('location')}  "
                              f"{c.get('country_name')}  {c.get('date_start')}")
                else:
                    print(f"  WARN: no OpenF1 session match for {race_name} {year} — "
                          f"skipping (pass --session-key to override)")

            if args.diagnose_laps:
                if session_key is None:
                    print("  ERROR: no session_key to diagnose")
                    return
                laps_resp = requests.get(f"{OPENF1_BASE}/laps", params={"session_key": session_key}, timeout=30)
                laps_resp.raise_for_status()
                laps_data = laps_resp.json()
                n = len(laps_data)
                has_d1 = sum(1 for l in laps_data if l.get("duration_sector_1") is not None)
                has_d2 = sum(1 for l in laps_data if l.get("duration_sector_2") is not None)
                has_d3 = sum(1 for l in laps_data if l.get("duration_sector_3") is not None)
                has_seg1 = sum(1 for l in laps_data if l.get("segments_sector_1") is not None)
                print(f"\n  /laps rows for session_key={session_key}: {n}")
                print(f"  duration_sector_1 populated: {has_d1}/{n}")
                print(f"  duration_sector_2 populated: {has_d2}/{n}")
                print(f"  duration_sector_3 populated: {has_d3}/{n}")
                print(f"  segments_sector_1 populated: {has_seg1}/{n}")
                # Decode per OpenF1's own docs (documentation/includes/_api_endpoints.md):
                # 0=n/a, 2048=yellow, 2049=green, 2051=purple, 2064=pitlane, else=unknown.
                CODE = {0: "n/a", 2048: "yellow", 2049: "green", 2050: "?", 2051: "purple",
                        2052: "?", 2064: "pit", 2068: "?"}
                def decode(seg): return [CODE.get(v, f"?{v}") for v in seg] if seg else None

                sample = next((l for l in laps_data if l.get("segments_sector_1") is not None), None)
                if sample:
                    print(f"\n  sample lap: driver_number={sample.get('driver_number')} "
                          f"lap_number={sample.get('lap_number')}")
                    print(f"    duration_sector_1/2/3 = {sample.get('duration_sector_1')}, "
                          f"{sample.get('duration_sector_2')}, {sample.get('duration_sector_3')}")
                    print(f"    segments_sector_1 decoded = {decode(sample.get('segments_sector_1'))}")
                    print(f"    segments_sector_2 decoded = {decode(sample.get('segments_sector_2'))}")
                    print(f"    segments_sector_3 decoded = {decode(sample.get('segments_sector_3'))}")

                # Sanity check: does the fastest lap of the session read mostly green/purple,
                # and a clearly slow lap read mostly yellow? If not, the segments are unreliable here.
                timed = [l for l in laps_data if l.get("lap_duration") and l.get("segments_sector_1")
                         and not l.get("is_pit_out_lap")]
                if timed:
                    fastest = min(timed, key=lambda l: l["lap_duration"])
                    slowest = max(timed, key=lambda l: l["lap_duration"])
                    for label, lap in [("FASTEST", fastest), ("SLOWEST", slowest)]:
                        all_seg = (lap.get("segments_sector_1") or []) + (lap.get("segments_sector_2") or []) \
                            + (lap.get("segments_sector_3") or [])
                        counts = {}
                        for v in all_seg:
                            c = CODE.get(v, f"?{v}")
                            counts[c] = counts.get(c, 0) + 1
                        print(f"\n  {label} lap: driver={lap.get('driver_number')} lap={lap.get('lap_number')} "
                              f"duration={lap['lap_duration']}s — segment color counts: {counts}")
                return

            if session_key is not None:
                # ── Weather ───────────────────────────────────────────
                weather_resp = requests.get(f"{OPENF1_BASE}/weather", params={"session_key": session_key}, timeout=30)
                weather_resp.raise_for_status()
                weather_rows = []
                for w in weather_resp.json():
                    if not w.get("date"):
                        continue
                    weather_rows.append({
                        "race_id": race_id,
                        "recorded_at": w["date"],
                        "air_temperature": safe_float(w.get("air_temperature")),
                        "track_temperature": safe_float(w.get("track_temperature")),
                        "humidity": safe_float(w.get("humidity")),
                        "rainfall": bool(w.get("rainfall")) if w.get("rainfall") is not None else None,
                        "wind_speed": safe_float(w.get("wind_speed")),
                        "wind_direction": safe_int(w.get("wind_direction"), None),
                    })
                print(f"  {len(weather_rows)} weather readings")
                if not dry_run and weather_rows:
                    sb.table("weather_readings").delete().eq("race_id", race_id).execute()
                    sb.table("weather_readings").insert(weather_rows).execute()
                    print(f"  ✓ {len(weather_rows)} weather rows inserted")
                elif dry_run:
                    print(f"  [dry-run] would insert {len(weather_rows)} weather rows")

                # ── Race control messages ────────────────────────────
                rc_resp = requests.get(f"{OPENF1_BASE}/race_control", params={"session_key": session_key}, timeout=30)
                rc_resp.raise_for_status()
                rc_rows = []
                for r in rc_resp.json():
                    msg = r.get("message")
                    if not msg:
                        continue
                    driver = resolve_driver(number=r.get("driver_number"))
                    rc_rows.append({
                        "race_id": race_id,
                        "lap_number": safe_int(r.get("lap_number"), None),
                        "category": r.get("category"),
                        "flag": r.get("flag"),
                        "message": str(msg),
                        "driver_id": driver["id"] if driver else None,
                        "recorded_at": r.get("date"),
                    })
                print(f"  {len(rc_rows)} race control messages")
                if not dry_run and rc_rows:
                    sb.table("race_control_messages").delete().eq("race_id", race_id).execute()
                    sb.table("race_control_messages").insert(rc_rows).execute()
                    print(f"  ✓ {len(rc_rows)} race control rows inserted")
                elif dry_run:
                    print(f"  [dry-run] would insert {len(rc_rows)} race control rows")

                # ── Pit stops → stationary time ──────────────────────
                pit_resp = requests.get(f"{OPENF1_BASE}/pit", params={"session_key": session_key}, timeout=30)
                pit_resp.raise_for_status()
                pit_data = pit_resp.json()

                # pit_stops has no id column (see load_race.py's insert) — match/update by
                # the (race_id, driver_id, lap) composite instead.
                existing_pits_res = (
                    sb.table("pit_stops").select("driver_id, lap, stop").eq("race_id", race_id).execute()
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
                # (already ordered by lap). Lap numbering conventions between OpenF1 and FastF1 can
                # differ by one, so this matches by stop order, not lap number.
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
                        updates.append({
                            "driver_id": driver["id"],
                            "lap": ours[i]["lap"],
                            "stop_duration_ms": stop_ms,
                        })

                print(f"  {len(updates)} pit stops matched with stationary time")
                if not dry_run:
                    for u in updates:
                        sb.table("pit_stops").update(
                            {"stop_duration_ms": u["stop_duration_ms"]}
                        ).eq("race_id", race_id).eq("driver_id", u["driver_id"]).eq("lap", u["lap"]).execute()
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

    # ── OpenF1 Qualifying: mini-sector pace/color data ──────────────────
    # Always targets a Qualifying session regardless of --session-name above: the mini-sector
    # segments field was verified reliable only for Qualifying (fastest lap reads mostly
    # green/purple, slowest mostly yellow) — the same field on a Race session does not behave
    # this way (OpenF1's own docs: "segments are not available during races"), so this section
    # never reads from the Race session matched above.
    if not args.skip_quali_sectors:
        print("\n── OpenF1: qualifying mini-sectors ───────────────────")
        try:
            quali_session_key = args.quali_session_key
            if quali_session_key is None:
                quali_session_key, ambiguous = find_openf1_session(year, circuit, "Qualifying")
                if quali_session_key is not None:
                    print(f"  matched OpenF1 session_key={quali_session_key} (Qualifying)")
                elif ambiguous:
                    print(f"  WARN: {len(ambiguous)} ambiguous OpenF1 Qualifying matches — "
                          f"pass --quali-session-key to disambiguate:")
                    for c in ambiguous:
                        print(f"    session_key={c['session_key']}  {c.get('location')}  "
                              f"{c.get('country_name')}  {c.get('date_start')}")
                else:
                    print(f"  WARN: no OpenF1 Qualifying session match for {race_name} {year} — "
                          f"skipping (pass --quali-session-key to override)")

            if quali_session_key is not None:
                laps_resp = requests.get(f"{OPENF1_BASE}/laps", params={"session_key": quali_session_key}, timeout=30)
                laps_resp.raise_for_status()
                laps_data = laps_resp.json()

                sector_rows: list[dict] = []
                for lap in laps_data:
                    driver = resolve_driver(number=lap.get("driver_number"))
                    lap_number = safe_int(lap.get("lap_number"), None)
                    if not driver or lap_number is None:
                        continue
                    for sec in (1, 2, 3):
                        duration = lap.get(f"duration_sector_{sec}")
                        segments = lap.get(f"segments_sector_{sec}")
                        if duration is None and not segments:
                            continue
                        sector_rows.append({
                            "race_id": race_id,
                            "driver_id": driver["id"],
                            "lap_number": lap_number,
                            "sector": sec,
                            "duration_seconds": safe_float(duration),
                            "segments": segments,
                        })

                print(f"  {len(sector_rows)} sector rows from {len(laps_data)} qualifying laps")
                if not dry_run and sector_rows:
                    sb.table("qualifying_sectors").delete().eq("race_id", race_id).execute()
                    for i in range(0, len(sector_rows), 500):
                        sb.table("qualifying_sectors").insert(sector_rows[i:i + 500]).execute()
                    print(f"  ✓ {len(sector_rows)} qualifying_sectors rows inserted")
                elif dry_run:
                    print(f"  [dry-run] would insert {len(sector_rows)} qualifying_sectors rows")

        except requests.exceptions.RequestException as exc:
            print(f"  ERROR: OpenF1 Qualifying request failed — {exc}")
        except Exception as exc:
            print(f"  ERROR: Qualifying sector section failed — {exc}")

    print("\nDone.")


if __name__ == "__main__":
    main()
