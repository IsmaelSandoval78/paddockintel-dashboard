#!/usr/bin/env python3
"""
Practice-session highlights for the home page, from a FastF1 CSV export of one session:
  -> content/race-highlights/<year>-<round>-<session>.json   (e.g. 2026-18-fp2.json)

Usage:
  python3 scripts/highlights/practice_from_export.py --year 2026 --round 18 --session FP2 \
      --event "United States Grand Prix" --dir path/to/export [--dry-run]

The export is the set of CSVs FastF1 writes for a loaded session (laps.csv, results.csv,
fastest_lap_telemetry.csv, circuit_rotation.txt, ...). It is used when the session's data is
exported on a machine with FastF1 access; the numbers are the same FastF1 reads from the official
F1 timing API. Writes only:
  - fastestLap: the session's fastest valid lap, speed trace (140 samples evenly spaced by distance)
                and top/min speed from the unresampled telemetry
  - trackMap:   that lap's own X/Y positions (circuit rotation from the export), speed per point
  - elevation:  that lap's height profile from the Z position (only when the export has a Z column),
                in metres above the lap's lowest point, with the corners placed by distance
  - longRuns:   every long run in the session (method below), one row per run

Long runs, descriptive only (fuel loads are not published, so these are not race-pace predictions):
  - a run is one tyre stint; laps counted are green-flag (track status 1), flagged accurate by
    FastF1, and neither an in-lap nor an out-lap
  - laps deleted for track limits are kept: the deletion is a sporting sanction, not a change in the
    pace being measured (each row says how many of its laps were deleted); the fastest lap, like
    the official classification, ignores deleted laps
  - laps more than 3% slower than the stint's median are dropped (cool-down and traffic laps)
  - a stint needs at least 5 laps left to count; the row gives the mean lap, the laps used, the
    tyre-life range and the degradation (least-squares slope of lap time on tyre life)
Never hand-edit numbers in the output; re-run this script instead.
"""

import argparse
import csv
import json
import statistics
from pathlib import Path

import numpy as np

SAMPLES = 140
MAP_SAMPLES = 260
MAP_SIZE = 1000
ELEVATION_SAMPLES = 200
MIN_RUN_LAPS = 5
SLOW_LAP_FACTOR = 1.03
REPO = Path(__file__).resolve().parents[2]
OUT_DIR = REPO / "content" / "race-highlights"


def num(value: str) -> float | None:
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    return None if np.isnan(v) else v


def lap_time_str(seconds: float) -> str:
    minutes = int(seconds // 60)
    return f"{minutes}:{seconds - minutes * 60:06.3f}"


def read(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def team_colours(results: list[dict]) -> dict[str, str | None]:
    out: dict[str, str | None] = {}
    for r in results:
        c = (r.get("TeamColor") or "").strip().lstrip("#")
        out[r["Abbreviation"]] = f"#{c.upper()}" if len(c) == 6 else None
    return out


def fastest(laps: list[dict]) -> dict | None:
    valid = [l for l in laps if num(l["LapTime"]) and l["Deleted"] != "True"]
    return min(valid, key=lambda l: num(l["LapTime"])) if valid else None


def fastest_lap(lap: dict, tel: list[dict], label: str) -> dict:
    dist = np.array([num(r["Distance"]) for r in tel])
    speed = np.array([num(r["Speed"]) for r in tel])
    grid = np.linspace(dist.min(), dist.max(), SAMPLES)
    return {
        "driver": lap["Driver"],
        "team": lap["Team"],
        "lapTime": lap_time_str(num(lap["LapTime"])),
        "compound": lap["Compound"],
        "speedKmh": [int(round(v)) for v in np.interp(grid, dist, speed)],
        "topSpeedKmh": int(round(float(speed.max()))),
        "minSpeedKmh": int(round(float(speed.min()))),
        "source": f"FastF1 car telemetry (official F1 timing API), {label}, {lap['Driver']} fastest lap; "
                  f"{SAMPLES} samples evenly spaced by distance, top/min speed from the unresampled telemetry",
    }


def track_map(lap: dict, tel: list[dict], rotation: float, label: str) -> dict | None:
    rows = [r for r in tel if all(num(r[k]) is not None for k in ("X", "Y", "Speed", "Distance"))]
    if len(rows) < len(tel) * 0.95:
        return None
    a = np.radians(rotation)
    x = np.array([num(r["X"]) for r in rows])
    y = np.array([num(r["Y"]) for r in rows])
    rx = x * np.cos(a) - y * np.sin(a)
    ry = -(x * np.sin(a) + y * np.cos(a))
    dist = np.array([num(r["Distance"]) for r in rows])
    speed = np.array([num(r["Speed"]) for r in rows])
    minx, miny = rx.min(), ry.min()
    scale = MAP_SIZE / max(rx.max() - minx, ry.max() - miny)

    def norm(px, py):
        return [int(round((px - minx) * scale)), int(round((py - miny) * scale))]

    grid = np.linspace(dist.min(), dist.max(), MAP_SAMPLES)
    gx, gy, gs = np.interp(grid, dist, rx), np.interp(grid, dist, ry), np.interp(grid, dist, speed)
    i_max, i_min = int(np.argmax(speed)), int(np.argmin(speed))
    return {
        "width": int(round((rx.max() - minx) * scale)),
        "height": int(round((ry.max() - miny) * scale)),
        "points": [norm(px, py) + [int(round(v))] for px, py, v in zip(gx, gy, gs)],
        "topSpeedAt": norm(rx[i_max], ry[i_max]),
        "minSpeedAt": norm(rx[i_min], ry[i_min]),
        "source": f"FastF1 position + car telemetry (official F1 timing API), {label}, {lap['Driver']} fastest lap; "
                  f"{MAP_SAMPLES} points evenly spaced by distance, rotated {rotation:g} degrees (FastF1 circuit info)",
    }


def elevation(lap: dict, tel: list[dict], corners: list[dict], label: str) -> dict | None:
    if not tel or "Z" not in tel[0]:
        return None
    rows = [r for r in tel if num(r["Z"]) is not None and num(r["Distance"]) is not None]
    if len(rows) < len(tel) * 0.95:
        return None
    dist = np.array([num(r["Distance"]) for r in rows])
    # FastF1 positions are in 1/10 m; the absolute Z has no published datum, so heights are relative.
    z = np.array([num(r["Z"]) for r in rows]) / 10
    grid = np.linspace(dist.min(), dist.max(), ELEVATION_SAMPLES)
    height = np.interp(grid, dist, z) - z.min()
    length = float(dist.max())
    return {
        "driver": lap["Driver"],
        "lapLength": int(round(length)),
        "heightM": [round(float(v), 1) for v in height],
        "corners": [
            {"number": f"{c['Number']}{c.get('Letter') or ''}", "distance": int(round(num(c["Distance"])))}
            for c in corners
            if num(c.get("Distance")) is not None and 0 <= num(c["Distance"]) <= length
        ],
        "source": f"FastF1 position data (official F1 timing API), {label}, {lap['Driver']} fastest lap; Z in metres above "
                  f"the lap's lowest point, {ELEVATION_SAMPLES} samples evenly spaced by distance; corners from FastF1 "
                  f"circuit info",
    }


def long_runs(laps: list[dict], colours: dict[str, str | None], label: str) -> dict:
    stints: dict[tuple[str, str], list[dict]] = {}
    for l in laps:
        stints.setdefault((l["Driver"], l["Stint"]), []).append(l)
    rows = []
    for (driver, _), ls in stints.items():
        ok = [
            l for l in ls
            if num(l["LapTime"]) and not l["PitInTime"] and not l["PitOutTime"]
            and l["TrackStatus"] == "1" and l["IsAccurate"] == "True"
        ]
        if len(ok) < MIN_RUN_LAPS:
            continue
        median = statistics.median(num(l["LapTime"]) for l in ok)
        clean = [l for l in ok if num(l["LapTime"]) <= median * SLOW_LAP_FACTOR]
        if len(clean) < MIN_RUN_LAPS:
            continue
        times = np.array([num(l["LapTime"]) for l in clean])
        life = np.array([num(l["TyreLife"]) for l in clean])
        slope = float(np.polyfit(life, times, 1)[0]) if np.ptp(life) > 0 else 0.0
        rows.append({
            "driver": driver,
            "team": clean[0]["Team"],
            "teamColour": colours.get(driver),
            "compound": clean[0]["Compound"],
            "laps": len(clean),
            "deletedLaps": sum(1 for l in clean if l["Deleted"] == "True"),
            "meanSeconds": round(float(times.mean()), 3),
            "degPerLap": round(slope, 3),
            "tyreLife": [int(life.min()), int(life.max())],
        })
    rows.sort(key=lambda r: r["meanSeconds"])
    return {
        "runs": rows,
        "minLaps": MIN_RUN_LAPS,
        "slowLapPct": round((SLOW_LAP_FACTOR - 1) * 100),
        "source": f"FastF1 lap timing (official F1 timing API), {label}; green-flag, accurate laps (track-limits "
                  f"deletions kept), "
                  f"in- and out-laps excluded, laps over {round((SLOW_LAP_FACTOR - 1) * 100)}% slower than the stint "
                  f"median dropped, stints of at least {MIN_RUN_LAPS} laps; fuel loads unknown, descriptive only",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--round", type=int, required=True, dest="round_num")
    parser.add_argument("--session", required=True, help="FP1, FP2 or FP3")
    parser.add_argument("--event", required=True)
    parser.add_argument("--dir", required=True, type=Path)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    label = f"{args.year} {args.event} {args.session}"
    laps = read(args.dir / "laps.csv")
    results = read(args.dir / "results.csv")
    tel_all = read(args.dir / "fastest_lap_telemetry.csv")
    rotation = float((args.dir / "circuit_rotation.txt").read_text().strip() or 0)
    corners = read(args.dir / "corners.csv") if (args.dir / "corners.csv").exists() else []

    out: dict = {"year": args.year, "round": args.round_num, "event": args.event, "session": args.session}
    best = fastest(laps)
    if best:
        tel = [r for r in tel_all if r["Driver"] == best["Driver"] and num(r["LapNumber"]) == num(best["LapNumber"])]
        if tel:
            out["fastestLap"] = fastest_lap(best, tel, label)
            track = track_map(best, tel, rotation, label)
            if track:
                out["trackMap"] = track
            profile = elevation(best, tel, corners, label)
            if profile:
                out["elevation"] = profile
    runs = long_runs(laps, team_colours(results), label)
    if runs["runs"]:
        out["longRuns"] = runs

    text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
    if args.dry_run:
        print(text[:3000])
        return
    path = OUT_DIR / f"{args.year}-{args.round_num}-{args.session.lower()}.json"
    path.write_text(text, encoding="utf-8")
    print(f"wrote {path.relative_to(REPO)} ({', '.join(k for k in out if k not in ('year', 'round', 'event', 'session'))})")


if __name__ == "__main__":
    main()
