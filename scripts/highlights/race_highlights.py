#!/usr/bin/env python3
"""
Per-race highlights for the home page ("Telemetry at Dusk"): FastF1 -> content/race-highlights/<year>-<round>.json

Usage:
  python3 scripts/highlights/race_highlights.py --year 2026 --round 17
  python3 scripts/highlights/race_highlights.py --year 2026 --round 17 --dry-run

Writes only facts FastF1 can reproduce from the official F1 timing API, each with its own `source`:
  - poleLap:  the pole lap's speed trace (140 samples, evenly spaced by distance) + top/min speed
  - poleDuel: official sector times of the pole lap and P2's best lap (cumulative gap per sector)
  - lapsLed:  laps led by the race winner, counted from the leader at the end of every lap

Anything FastF1 can't provide for a session is left out of the file, and the home hides that module.
Never hand-edit numbers in the output; re-run this script instead.
"""

import argparse
import json
from pathlib import Path

import fastf1
import numpy as np

SAMPLES = 140
REPO = Path(__file__).resolve().parents[2]
OUT_DIR = REPO / "content" / "race-highlights"


def secs(td) -> float | None:
    try:
        v = td.total_seconds()
    except AttributeError:
        return None
    return None if np.isnan(v) else round(v, 3)


def lap_time_str(td) -> str:
    total = td.total_seconds()
    minutes = int(total // 60)
    return f"{minutes}:{total - minutes * 60:06.3f}"


def team_colour(session, abbr: str) -> str | None:
    row = session.results[session.results["Abbreviation"] == abbr]
    if row.empty:
        return None
    colour = str(row.iloc[0].get("TeamColor") or "").strip().lstrip("#")
    return f"#{colour.upper()}" if len(colour) == 6 else None


def pole_lap(quali, year: int, event: str) -> tuple[dict, object, str] | None:
    pole_abbr = quali.results.sort_values("Position").iloc[0]["Abbreviation"]
    lap = quali.laps.pick_drivers(pole_abbr).pick_fastest()
    if lap is None:
        return None
    tel = lap.get_car_data().add_distance()
    dist = tel["Distance"].to_numpy()
    speed = tel["Speed"].to_numpy()
    grid = np.linspace(dist.min(), dist.max(), SAMPLES)
    trace = [int(round(v)) for v in np.interp(grid, dist, speed)]
    data = {
        "driver": pole_abbr,
        "lapTime": lap_time_str(lap["LapTime"]),
        "speedKmh": trace,
        "topSpeedKmh": int(round(float(speed.max()))),
        "minSpeedKmh": int(round(float(speed.min()))),
        "source": f"FastF1 car telemetry (official F1 timing API), {year} {event} Qualifying, {pole_abbr} pole lap; "
                  f"{SAMPLES} samples evenly spaced by distance, top/min speed from the unresampled telemetry",
    }
    return data, lap, pole_abbr


def pole_duel(quali, pole_lap_obj, pole_abbr: str, year: int, event: str) -> dict | None:
    ordered = quali.results.sort_values("Position")
    if len(ordered) < 2:
        return None
    p2_abbr = ordered.iloc[1]["Abbreviation"]
    p2_lap = quali.laps.pick_drivers(p2_abbr).pick_fastest()
    if p2_lap is None:
        return None

    def sectors(lap):
        s = [secs(lap["Sector1Time"]), secs(lap["Sector2Time"]), secs(lap["Sector3Time"])]
        return s if all(v is not None for v in s) else None

    a, b = sectors(pole_lap_obj), sectors(p2_lap)
    if not a or not b:
        return None
    return {
        "pole": {"driver": pole_abbr, "lapTime": lap_time_str(pole_lap_obj["LapTime"]), "sectors": a,
                 "teamColour": team_colour(quali, pole_abbr)},
        "challenger": {"driver": p2_abbr, "lapTime": lap_time_str(p2_lap["LapTime"]), "sectors": b,
                       "teamColour": team_colour(quali, p2_abbr)},
        "source": f"FastF1 official sector times, {year} {event} Qualifying, best laps of P1 and P2",
    }


def laps_led(race, year: int, event: str) -> dict | None:
    laps = race.laps
    if laps.empty:
        return None
    total = int(laps["LapNumber"].max())
    leaders = laps[laps["Position"] == 1]
    if leaders["LapNumber"].nunique() != total:
        # A lap without a recorded leader means the count would be a guess — leave it out.
        return None
    winner = race.results.sort_values("Position").iloc[0]["Abbreviation"]
    led = int((leaders["Driver"] == winner).sum())
    return {
        "driver": winner,
        "laps": led,
        "totalLaps": total,
        "source": f"FastF1 lap positions (official F1 timing API), {year} {event} Race, leader at the end of every lap",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--round", type=int, required=True, dest="round_num")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    cache = REPO / ".fastf1_cache"
    cache.mkdir(exist_ok=True)
    fastf1.Cache.enable_cache(str(cache))

    quali = fastf1.get_session(args.year, args.round_num, "Q")
    quali.load(laps=True, telemetry=True, weather=False, messages=False)
    event = quali.event["EventName"]

    out: dict = {"year": args.year, "round": args.round_num, "event": event}

    pole = pole_lap(quali, args.year, event)
    if pole:
        pole_data, pole_lap_obj, pole_abbr = pole
        out["poleLap"] = pole_data
        duel = pole_duel(quali, pole_lap_obj, pole_abbr, args.year, event)
        if duel:
            out["poleDuel"] = duel

    try:
        race = fastf1.get_session(args.year, args.round_num, "R")
        race.load(laps=True, telemetry=False, weather=False, messages=False)
        led = laps_led(race, args.year, event)
        if led:
            out["lapsLed"] = led
    except Exception as exc:  # race not run yet, or no lap data yet
        print(f"race laps unavailable: {exc}")

    text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
    if args.dry_run:
        print(text)
        return
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"{args.year}-{args.round_num}.json"
    path.write_text(text, encoding="utf-8")
    print(f"wrote {path.relative_to(REPO)} ({', '.join(k for k in out if k not in ('year', 'round', 'event'))})")


if __name__ == "__main__":
    main()
