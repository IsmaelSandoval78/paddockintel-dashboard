#!/usr/bin/env python3
"""Pole lap + track map for one past race, from OpenF1 instead of FastF1.

The race-week home draws the next circuit from its last edition's pole lap. race_highlights.py
gets that from FastF1, whose official timing source answers 401 from some environments; this
script produces the same two blocks (`poleLap`, `trackMap`, same shapes) from OpenF1's car and
location data, so a circuit's last edition can be added without FastF1.

The pole-sitter and event name come from jolpica-f1 (Ergast successor); the fastest qualifying
lap of that car comes from OpenF1 `laps`, its speed from `car_data` and its X/Y from `location`.
Speeds are resampled by distance (distance integrated from speed over time). OpenF1 has no
circuit rotation, so the map keeps OpenF1's own orientation (stated in `source`).

Never hand-edit numbers in the output; re-run this script instead.

Usage: python3 scripts/highlights/openf1_pole_lap.py --year 2025 --round 19 [--dry-run]
Writes content/race-highlights/<year>-<round>.json (only if no file exists for that race).
"""
import argparse
import json
import sys
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

OPENF1 = "https://api.openf1.org/v1"
JOLPICA = "https://api.jolpi.ca/ergast/f1"
SPEED_SAMPLES = 140
MAP_POINTS = 260
MAP_WIDTH = 1000


def get(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "paddockintel-highlights"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def ts(s: str) -> float:
    return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()


def lap_time_str(seconds: float) -> str:
    m = int(seconds // 60)
    return f"{m}:{seconds - m * 60:06.3f}"


def resample(dist: list[float], values: list[float], n: int) -> list[float]:
    out, j, total = [], 0, dist[-1]
    for i in range(n):
        target = total * i / (n - 1)
        while j < len(dist) - 2 and dist[j + 1] < target:
            j += 1
        a, b = dist[j], dist[j + 1]
        f = (target - a) / (b - a) if b > a else 0.0
        out.append(values[j] + (values[j + 1] - values[j]) * f)
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--round", type=int, required=True, dest="round_num")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    race = get(f"{JOLPICA}/{args.year}/{args.round_num}/qualifying.json")["MRData"]["RaceTable"]["Races"][0]
    event = race["raceName"]
    pole = next(q for q in race["QualifyingResults"] if q["position"] == "1")
    car_number = int(pole["number"])
    code = pole["Driver"]["code"]
    race_day = datetime.fromisoformat(race["date"])

    sessions = get(f"{OPENF1}/sessions?year={args.year}&session_name=Qualifying")
    session = next(
        s for s in sessions
        if race_day - timedelta(days=3) <= datetime.fromisoformat(s["date_start"][:10]) <= race_day
    )
    key = session["session_key"]

    laps = [l for l in get(f"{OPENF1}/laps?session_key={key}&driver_number={car_number}") if l.get("lap_duration")]
    lap = min(laps, key=lambda l: l["lap_duration"])
    start = ts(lap["date_start"])
    end = start + lap["lap_duration"]
    window = f"session_key={key}&driver_number={car_number}&date>={lap['date_start'][:23]}"
    end_iso = datetime.utcfromtimestamp(end).strftime("%Y-%m-%dT%H:%M:%S.%f")[:23]
    car = sorted(get(f"{OPENF1}/car_data?{window}&date<={end_iso}"), key=lambda x: x["date"])
    loc = sorted(get(f"{OPENF1}/location?{window}&date<={end_iso}"), key=lambda x: x["date"])
    if len(car) < 50 or len(loc) < 50:
        sys.exit(f"Too few samples (car {len(car)}, location {len(loc)}) for {event} {args.year}")

    # Distance along the lap, integrated from speed (km/h -> m/s) over time.
    car_t = [ts(x["date"]) for x in car]
    car_v = [float(x["speed"]) for x in car]
    dist = [0.0]
    for i in range(1, len(car)):
        dist.append(dist[-1] + (car_v[i] + car_v[i - 1]) / 2 / 3.6 * (car_t[i] - car_t[i - 1]))

    speeds = [round(v) for v in resample(dist, car_v, SPEED_SAMPLES)]
    top = max(car_v)
    low = min(car_v)

    # Each location sample takes the distance and speed of the car sample nearest in time.
    def nearest(t: float) -> int:
        return min(range(len(car_t)), key=lambda i: abs(car_t[i] - t))

    loc_rows = []
    for p in loc:
        i = nearest(ts(p["date"]))
        loc_rows.append((dist[i], float(p["x"]), float(p["y"]), car_v[i]))
    loc_rows.sort(key=lambda r: r[0])
    ld = [r[0] for r in loc_rows]
    xs = resample(ld, [r[1] for r in loc_rows], MAP_POINTS)
    ys = resample(ld, [r[2] for r in loc_rows], MAP_POINTS)
    vs = resample(ld, [r[3] for r in loc_rows], MAP_POINTS)
    min_x, max_x, min_y, max_y = min(xs), max(xs), min(ys), max(ys)
    scale = MAP_WIDTH / (max_x - min_x)
    # Screen Y grows downward; OpenF1 Y grows upward.
    points = [[round((x - min_x) * scale), round((max_y - y) * scale), round(v)] for x, y, v in zip(xs, ys, vs)]
    top_pt = max(points, key=lambda p: p[2])
    low_pt = min(points, key=lambda p: p[2])

    label = f"{args.year} {event} Qualifying, {code} pole lap"
    out = {
        "year": args.year,
        "round": args.round_num,
        "event": event,
        "poleLap": {
            "driver": code,
            "lapTime": lap_time_str(lap["lap_duration"]),
            "speedKmh": speeds,
            "topSpeedKmh": round(top),
            "minSpeedKmh": round(low),
            "source": f"OpenF1 car telemetry, {label}; {SPEED_SAMPLES} samples evenly spaced by distance, top/min speed from the unresampled telemetry",
        },
        "trackMap": {
            "width": MAP_WIDTH,
            "height": round((max_y - min_y) * scale),
            "points": points,
            "topSpeedAt": top_pt[:2],
            "minSpeedAt": low_pt[:2],
            "source": f"OpenF1 location + car telemetry, {label}; {MAP_POINTS} points evenly spaced by distance, OpenF1 orientation (no circuit rotation)",
        },
    }
    text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
    if args.dry_run:
        print(text)
        return
    path = Path(__file__).resolve().parents[2] / "content" / "race-highlights" / f"{args.year}-{args.round_num}.json"
    if path.exists():
        sys.exit(f"{path.name} already exists (FastF1 output takes precedence); not overwriting.")
    path.write_text(text)
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
