#!/usr/bin/env python3
"""
Per-race highlights for the home page ("Telemetry at Dusk"): FastF1 -> content/race-highlights/<year>-<round>.json

Usage:
  python3 scripts/highlights/race_highlights.py --year 2026 --round 17
  python3 scripts/highlights/race_highlights.py --year 2026 --round 17 --dry-run

Writes only facts FastF1 can reproduce from the official F1 timing API, each with its own `source`:
  - poleLap:  the pole lap's speed trace (140 samples, evenly spaced by distance) + top/min speed
  - trackMap: the pole lap's own X/Y positions (official circuit rotation), speed per point, and where
              the top/min speed happened -- the circuit map is drawn from the car's line, not a stock outline
  - poleDuel: official sector times of the pole lap and P2's best lap (cumulative gap per sector)
  - lapsLed:  laps led by the race winner, counted from the leader at the end of every lap
  - qualiDominance: pole lap vs P2's best lap, corner section by corner section (sections split at the
              top speed of each straight; both laps aligned on their official sector times, so the
              sector-1, sector-2 and lap gaps match the timing sheet exactly), with official corner numbers
  - raceTrace: winner-vs-P2 gap at the end of every lap (kept only if the last lap matches the official
              classification interval), running order of the top 8 lap by lap, VSC/SC laps and pit laps

Anything FastF1 can't provide for a session is left out of the file, and the home hides that module.
Never hand-edit numbers in the output; re-run this script instead.
"""

import argparse
import json
from pathlib import Path

import fastf1
import numpy as np

SAMPLES = 140
MAP_SAMPLES = 260
MAP_SIZE = 1000  # longest side of the normalised map box
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


def track_map(quali, lap, pole_abbr: str, year: int, event: str) -> dict | None:
    tel = lap.get_telemetry()
    if tel.empty or tel[["X", "Y", "Speed", "Distance"]].isna().any().any():
        return None
    rotation = float(quali.get_circuit_info().rotation)
    a = np.radians(rotation)
    x, y = tel["X"].to_numpy(), tel["Y"].to_numpy()
    # Same rotation FastF1 applies for its official-orientation plots; y flipped for SVG (y grows down).
    rx = x * np.cos(a) - y * np.sin(a)
    ry = -(x * np.sin(a) + y * np.cos(a))
    dist, speed = tel["Distance"].to_numpy(), tel["Speed"].to_numpy()

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
        "source": f"FastF1 position + car telemetry (official F1 timing API), {year} {event} Qualifying, "
                  f"{pole_abbr} pole lap; {MAP_SAMPLES} points evenly spaced by distance, "
                  f"rotated {rotation:g} degrees (FastF1 circuit info)",
    }


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


def quali_dominance(quali, year: int, event: str) -> dict | None:
    """Track dominance for the front row. Not fastf1.utils.delta_time: on Singapore 2026 it missed the
    official sector-1 gap by 0.07s and spiked by up to 0.8s in braking zones. Instead each driver's own
    distance is mapped onto the pole-sitter's at the official sector boundaries, and sections are
    split where speed peaks (where a small distance misalignment costs almost no time)."""
    from scipy.signal import find_peaks

    ordered = quali.results.sort_values("Position")
    if len(ordered) < 2:
        return None
    a, b = str(ordered.iloc[0]["Abbreviation"]), str(ordered.iloc[1]["Abbreviation"])
    laps = {d: quali.laps.pick_drivers(d).pick_fastest() for d in (a, b)}
    if any(l is None for l in laps.values()):
        return None
    tel = {d: laps[d].get_telemetry() for d in (a, b)}

    anchors = {}
    for d in (a, b):
        lap = laps[d]
        s = [secs(lap["Sector1Time"]), secs(lap["Sector2Time"]), secs(lap["LapTime"])]
        if any(v is None for v in s):
            return None
        t = tel[d]["Time"].dt.total_seconds().to_numpy()
        dist = tel[d]["Distance"].to_numpy()
        marks = [0.0, s[0], s[0] + s[1], s[2]]
        anchors[d] = (t, dist, [float(np.interp(m, t, dist)) for m in marks])
    ref = anchors[a][2]
    lap_len = ref[-1]

    def time_at(d, ref_dist):
        t, dist, own = anchors[d]
        return np.interp(np.interp(ref_dist, ref, own), dist, t)

    speed = tel[a]["Speed"].to_numpy()
    dist_a = tel[a]["Distance"].to_numpy()
    peaks, _ = find_peaks(speed, prominence=15, distance=20)
    candidates = sorted(set([0.0, lap_len, ref[1], ref[2]] + [float(dist_a[p]) for p in peaks if 50 < dist_a[p] < lap_len - 50]))
    fixed = {0.0, ref[1], ref[2], lap_len}
    bounds: list[float] = []
    for c in candidates:  # drop boundaries closer than 120 m, never a sector anchor
        if bounds and c - bounds[-1] < 120:
            if c in fixed and bounds[-1] not in fixed:
                bounds[-1] = c
            continue
        bounds.append(c)

    t_a, t_b = time_at(a, np.array(bounds)), time_at(b, np.array(bounds))
    gaps = [round(float(v), 3) for v in (t_b - t_a)]
    official = secs(laps[b]["LapTime"]) - secs(laps[a]["LapTime"])
    if abs(gaps[-1] - official) > 0.002:
        return None

    info = quali.get_circuit_info()
    rot = np.radians(float(info.rotation))
    x, y = tel[a]["X"].to_numpy(), tel[a]["Y"].to_numpy()
    rx, ry = x * np.cos(rot) - y * np.sin(rot), -(x * np.sin(rot) + y * np.cos(rot))
    minx, miny = rx.min(), ry.min()
    scale = MAP_SIZE / max(rx.max() - minx, ry.max() - miny)
    norm = lambda px, py: [round(float((px - minx) * scale), 1), round(float((py - miny) * scale), 1)]

    corners = []
    for _, c in info.corners.iterrows():
        cx = c["X"] * np.cos(rot) - c["Y"] * np.sin(rot)
        cy = -(c["X"] * np.sin(rot) + c["Y"] * np.cos(rot))
        corners.append({"number": f"{int(c['Number'])}{c['Letter'] or ''}", "at": norm(cx, cy), "distance": round(float(c["Distance"]))})

    sections = []
    for k in range(len(bounds) - 1):
        lo, hi = bounds[k], bounds[k + 1]
        da, db = t_a[k + 1] - t_a[k], t_b[k + 1] - t_b[k]
        mask = (dist_a >= lo - 1) & (dist_a <= hi + 1)
        sections.append({
            "faster": a if da < db else b,
            "gain": round(float(abs(db - da)), 3),
            "corners": [c["number"] for c in corners if lo <= c["distance"] < hi],
            "path": [norm(px, py) for px, py in zip(rx[mask], ry[mask])],
        })

    return {
        "pole": {"driver": a, "lapTime": lap_time_str(laps[a]["LapTime"]), "teamColour": team_colour(quali, a)},
        "challenger": {"driver": b, "lapTime": lap_time_str(laps[b]["LapTime"]), "teamColour": team_colour(quali, b)},
        "width": int(round((rx.max() - minx) * scale)),
        "height": int(round((ry.max() - miny) * scale)),
        "lapLength": round(float(lap_len)),
        "sectorEnds": [round(ref[1]), round(ref[2])],
        "boundaries": [round(v) for v in bounds],
        "gapAtBoundaries": gaps,
        "sections": sections,
        "corners": corners,
        "source": (f"FastF1 telemetry (official F1 timing API), {year} {event} Qualifying, {a} and {b} fastest laps; "
                   "laps aligned on official sector times; sections split at straight-line speed peaks; "
                   "official corner numbers"),
    }


TRACE_DRIVERS = 8


def race_trace(race, year: int, event: str) -> dict | None:
    laps = race.laps
    if laps.empty:
        return None
    total = int(laps["LapNumber"].max())
    ordered = race.results.sort_values("Position")
    top = [str(a) for a in ordered["Abbreviation"][:TRACE_DRIVERS]]
    if len(top) < 2:
        return None

    def lap_end(code: str) -> dict[int, float]:
        rows = laps.pick_drivers(code)
        return {int(n): t.total_seconds() for n, t in zip(rows["LapNumber"], rows["Time"]) if t == t}

    def position(code: str) -> list[int | None]:
        by_lap = {int(n): (int(p) if p == p else None) for n, p in zip(laps.pick_drivers(code)["LapNumber"], laps.pick_drivers(code)["Position"])}
        return [by_lap.get(n) for n in range(1, total + 1)]

    out: dict = {"totalLaps": total, "drivers": []}
    for code in top:
        out["drivers"].append({
            "driver": code,
            "team": str(ordered[ordered["Abbreviation"] == code].iloc[0]["TeamName"]),
            "teamColour": team_colour(race, code),
            "positions": position(code),
            "pitLaps": [int(n) for n in laps.pick_drivers(code)[laps.pick_drivers(code)["PitInTime"].notna()]["LapNumber"]],
        })

    winner, second = top[0], top[1]
    w, s = lap_end(winner), lap_end(second)
    if all(n in w and n in s for n in range(1, total + 1)):
        gaps = [round(s[n] - w[n], 3) for n in range(1, total + 1)]
        official = secs(ordered.iloc[1]["Time"])
        # Lap-end timing gaps are only published if the flag lap reproduces the official interval.
        if official is not None and abs(gaps[-1] - official) <= 0.05:
            out["gap"] = {"leader": winner, "chaser": second, "seconds": gaps}

    status = laps.pick_drivers(winner).sort_values("LapNumber")
    out["vscLaps"] = [int(n) for n, st in zip(status["LapNumber"], status["TrackStatus"]) if isinstance(st, str) and ("6" in st or "7" in st)]
    out["scLaps"] = [int(n) for n, st in zip(status["LapNumber"], status["TrackStatus"]) if isinstance(st, str) and "4" in st]
    out["source"] = (f"FastF1 lap timing (official F1 timing API), {year} {event} Race: lap-end times, positions, "
                     f"track status and pit-in laps of the top {TRACE_DRIVERS} finishers")
    return out


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
        track = track_map(quali, pole_lap_obj, pole_abbr, args.year, event)
        if track:
            out["trackMap"] = track
        duel = pole_duel(quali, pole_lap_obj, pole_abbr, args.year, event)
        if duel:
            out["poleDuel"] = duel
        dominance = quali_dominance(quali, args.year, event)
        if dominance:
            out["qualiDominance"] = dominance

    try:
        race = fastf1.get_session(args.year, args.round_num, "R")
        race.load(laps=True, telemetry=False, weather=False, messages=False)
        led = laps_led(race, args.year, event)
        if led:
            out["lapsLed"] = led
        trace = race_trace(race, args.year, event)
        if trace:
            out["raceTrace"] = trace
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
