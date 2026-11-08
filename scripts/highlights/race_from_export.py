#!/usr/bin/env python3
"""
Race highlights from FastF1 CSV exports of a race weekend's qualifying and race sessions:
  -> content/race-highlights/<year>-<round>.json   (same file race_highlights.py writes)

Usage:
  python3 scripts/highlights/race_from_export.py --year 2026 --round 18 \
      --event "United States Grand Prix" --q-dir path/to/Q-export --r-dir path/to/R-export [--dry-run]

For weekends whose data is exported on a machine with FastF1 access (the export format of
practice_from_export.py: laps.csv, results.csv, fastest_lap_telemetry.csv, circuit_rotation.txt).
The numbers are the ones FastF1 reads from the official F1 timing API. Writes the blocks
race_highlights.py writes, with the same rules:
  - poleLap, trackMap: the pole lap's speed trace and line (from the qualifying export)
  - poleDuel: official sector times of the pole lap and P2's best lap
  - lapsLed: laps led by the winner, from the leader at the end of every lap (left out if a lap has
             no recorded leader)
  - raceTrace: running order of the top 8 lap by lap, pit-in laps, VSC/SC laps, and the winner-vs-P2
               gap at the end of every lap (kept only if the flag lap matches the official interval)
qualiDominance needs per-sample telemetry time, which the export doesn't carry, so it is left out
and the home hides that module.
Never hand-edit numbers in the output; re-run this script instead.
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from practice_from_export import OUT_DIR, REPO, fastest, fastest_lap, lap_time_str, num, read, team_colours, track_map  # noqa: E402

TRACE_DRIVERS = 8


def by_position(results: list[dict]) -> list[dict]:
    return sorted((r for r in results if num(r["Position"]) is not None), key=lambda r: num(r["Position"]))


def pole_blocks(qdir: Path, label: str) -> dict:
    laps = read(qdir / "laps.csv")
    results = by_position(read(qdir / "results.csv"))
    tel_all = read(qdir / "fastest_lap_telemetry.csv")
    rotation = float((qdir / "circuit_rotation.txt").read_text().strip() or 0)
    colours = team_colours(results)
    out: dict = {}
    if len(results) < 1:
        return out

    def best_of(code: str) -> dict | None:
        return fastest([l for l in laps if l["Driver"] == code])

    pole_code = results[0]["Abbreviation"]
    pole = best_of(pole_code)
    if not pole:
        return out
    tel = [r for r in tel_all if r["Driver"] == pole_code and num(r["LapNumber"]) == num(pole["LapNumber"])]
    if tel:
        lap = fastest_lap(pole, tel, f"{label} Qualifying")
        out["poleLap"] = {k: lap[k] for k in ("driver", "lapTime", "speedKmh", "topSpeedKmh", "minSpeedKmh", "source")}
        out["poleLap"]["source"] = out["poleLap"]["source"].replace(" fastest lap;", " pole lap;")
        track = track_map(pole, tel, rotation, f"{label} Qualifying")
        if track:
            track["source"] = track["source"].replace(" fastest lap;", " pole lap;")
            out["trackMap"] = track

    if len(results) >= 2:
        p2_code = results[1]["Abbreviation"]
        p2 = best_of(p2_code)

        def sectors(lap: dict) -> list[float] | None:
            s = [num(lap[f"Sector{i}Time"]) for i in (1, 2, 3)]
            return [round(v, 3) for v in s] if all(v is not None for v in s) else None

        a, b = sectors(pole), sectors(p2) if p2 else None
        if a and b:
            out["poleDuel"] = {
                "pole": {"driver": pole_code, "lapTime": lap_time_str(num(pole["LapTime"])), "sectors": a, "teamColour": colours.get(pole_code)},
                "challenger": {"driver": p2_code, "lapTime": lap_time_str(num(p2["LapTime"])), "sectors": b, "teamColour": colours.get(p2_code)},
                "source": f"FastF1 official sector times, {label} Qualifying, best laps of P1 and P2",
            }
    return out


def race_blocks(rdir: Path, label: str) -> dict:
    laps = read(rdir / "laps.csv")
    results = by_position(read(rdir / "results.csv"))
    colours = team_colours(results)
    out: dict = {}
    if not laps or len(results) < 2:
        return out
    total = int(max(num(l["LapNumber"]) for l in laps))

    def rows(code: str) -> list[dict]:
        return sorted((l for l in laps if l["Driver"] == code), key=lambda l: num(l["LapNumber"]))

    leaders = {int(num(l["LapNumber"])): l["Driver"] for l in laps if num(l["Position"]) == 1}
    winner = results[0]["Abbreviation"]
    if len(leaders) == total:
        out["lapsLed"] = {
            "driver": winner,
            "laps": sum(1 for d in leaders.values() if d == winner),
            "totalLaps": total,
            "source": f"FastF1 lap positions (official F1 timing API), {label} Race, leader at the end of every lap",
        }

    top = [r["Abbreviation"] for r in results[:TRACE_DRIVERS]]
    trace: dict = {"totalLaps": total, "drivers": []}
    for code in top:
        rs = rows(code)
        pos = {int(num(l["LapNumber"])): (int(num(l["Position"])) if num(l["Position"]) is not None else None) for l in rs}
        trace["drivers"].append({
            "driver": code,
            "team": next(r["TeamName"] for r in results if r["Abbreviation"] == code),
            "teamColour": colours.get(code),
            "positions": [pos.get(n) for n in range(1, total + 1)],
            "pitLaps": [int(num(l["LapNumber"])) for l in rs if l["PitInTime"]],
        })

    def lap_end(code: str) -> dict[int, float]:
        return {int(num(l["LapNumber"])): num(l["Time"]) for l in rows(code) if num(l["Time"]) is not None}

    second = top[1]
    w, s = lap_end(winner), lap_end(second)
    if all(n in w and n in s for n in range(1, total + 1)):
        gaps = [round(s[n] - w[n], 3) for n in range(1, total + 1)]
        official = num(results[1]["Time"])
        # Lap-end timing gaps are only published if the flag lap reproduces the official interval.
        if official is not None and abs(gaps[-1] - official) <= 0.05:
            trace["gap"] = {"leader": winner, "chaser": second, "seconds": gaps}

    status = rows(winner)
    trace["vscLaps"] = [int(num(l["LapNumber"])) for l in status if "6" in l["TrackStatus"] or "7" in l["TrackStatus"]]
    trace["scLaps"] = [int(num(l["LapNumber"])) for l in status if "4" in l["TrackStatus"]]
    trace["source"] = (f"FastF1 lap timing (official F1 timing API), {label} Race: lap-end times, positions, "
                       f"track status and pit-in laps of the top {TRACE_DRIVERS} finishers")
    out["raceTrace"] = trace
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--round", type=int, required=True, dest="round_num")
    parser.add_argument("--event", required=True)
    parser.add_argument("--q-dir", required=True, type=Path)
    parser.add_argument("--r-dir", required=True, type=Path)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    label = f"{args.year} {args.event}"
    out: dict = {"year": args.year, "round": args.round_num, "event": args.event}
    out.update(pole_blocks(args.q_dir, label))
    out.update(race_blocks(args.r_dir, label))

    text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
    if args.dry_run:
        print(text[:3000])
        return
    path = OUT_DIR / f"{args.year}-{args.round_num}.json"
    path.write_text(text, encoding="utf-8")
    print(f"wrote {path.relative_to(REPO)} ({', '.join(k for k in out if k not in ('year', 'round', 'event'))})")


if __name__ == "__main__":
    main()
