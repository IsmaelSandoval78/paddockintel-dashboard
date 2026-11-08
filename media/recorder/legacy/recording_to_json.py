"""
Turn a live-timing recording into the JSON files our Remotion templates read.

    python recorder/recording_to_json.py 2026 "Singapore" S  recordings/2026-10-10_singapore-...-sprint.txt
    python recorder/recording_to_json.py 2026 17 Q recordings/...qualifying.txt

Session codes: R (race), S (sprint), Q (qualifying), SQ (sprint qualifying).
Writes into src/data/:
  race.json            (R, S)   -> RaceResult, Peloton, TeamPoints
  quali.json           (Q, SQ)  -> QualiGrid, MediumToSoft
  sectors.json         (all)    -> SectorMap  (best sectors + speed trap, from the laps)
  track-dominance.json (all)    -> TrackDominance (P1 vs P2 fastest laps, needs car data)
Run from the paddock-remotion folder.
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import fastf1
from fastf1.livetiming.data import LiveTimingData

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from parse_results import TEAM_COLORS, SHORT  # same colours as the pasted-table workflow

DATA = Path("src/data")
RACE_PTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
SPRINT_PTS = [8, 7, 6, 5, 4, 3, 2, 1]


def colour(row):
    return TEAM_COLORS.get(row["TeamName"]) or (f"#{row['TeamColor']}" if isinstance(row["TeamColor"], str) and row["TeamColor"] else "#888888")


def fmt_lap(td):
    if pd.isna(td):
        return None
    s = td.total_seconds()
    return f"{int(s // 60)}:{s % 60:06.3f}"


def fmt_total(td):
    s = td.total_seconds()
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{sec:06.3f}"


def tag_of(session):
    return f"{session.event['Location']} {session.event.year}"


def export_race(session, sprint):
    res = session.results.sort_values("Position")
    total = int(session.laps["LapNumber"].max())
    table = SPRINT_PTS if sprint else RACE_PTS
    rows = []
    for _, r in res.iterrows():
        pos = int(r["Position"]) if not pd.isna(r["Position"]) else None
        laps = int(r["Laps"]) if not pd.isna(r["Laps"]) else int(session.laps.pick_drivers(r["Abbreviation"])["LapNumber"].max() or 0)
        status = str(r["Status"] or "")
        lead_lap = laps == total
        if pos == 1:
            gap, time_s, st = 0.0, fmt_total(r["Time"]), "FIN"
        elif lead_lap and not pd.isna(r["Time"]):
            gap, time_s, st = round(r["Time"].total_seconds(), 3), f"+{r['Time'].total_seconds():.3f}s", "FIN"
        else:
            gap, time_s, st = None, (status or "DNF").upper(), "DNF" if laps < total * 0.9 else status.upper() or "LAPPED"
        pts = r["Points"] if not pd.isna(r["Points"]) else (table[pos - 1] if pos and pos <= len(table) else 0)
        rows.append({"pos": str(pos) if pos else "NC", "no": int(r["DriverNumber"]), "name": r["FullName"], "code": r["Abbreviation"],
                     "team": r["TeamName"], "teamShort": SHORT.get(r["TeamName"], r["TeamName"]), "color": colour(r),
                     "laps": laps, "time": time_s, "gap": gap, "status": st, "points": int(pts)})
    teams = {}
    for r in rows:
        t = teams.setdefault(r["team"], {"team": r["team"], "teamShort": r["teamShort"], "color": r["color"], "points": 0, "drivers": []})
        t["points"] += r["points"]
        t["drivers"].append({"code": r["code"], "points": r["points"], "pos": r["pos"], "status": r["status"]})
    out = {"race": f"{session.event['EventName']} {session.event.year}", "tag": tag_of(session), "dates": str(session.date.date()),
           "circuit": session.event["Location"], "totalLaps": total, "results": rows,
           "teams": sorted(teams.values(), key=lambda t: -t["points"])}
    json.dump(out, open(DATA / "race.json", "w"), indent=1)
    print(f"race.json: {rows[0]['code']} wins, {sum(r['status'] == 'FIN' for r in rows)} on the lead lap")


def export_quali(session, sprint):
    res = session.results.sort_values("Position")
    prefix = "SQ" if sprint else "Q"
    rows = []
    for _, r in res.iterrows():
        times = [fmt_lap(r[q]) for q in ("Q1", "Q2", "Q3")]
        # a stage was reached if the driver has a time there or a later one; no time in a reached stage = "NO TIME"
        reached = 3 if not pd.isna(r["Q3"]) else 2 if not pd.isna(r["Q2"]) else 1
        pos = int(r["Position"]) if not pd.isna(r["Position"]) else 99
        if pos <= 10 and pd.isna(r["Q3"]):
            reached, times[2] = 3, "NO TIME"
        elif 10 < pos <= 16 and pd.isna(r["Q2"]):
            reached, times[1] = 2, "NO TIME"
        rows.append({"pos": str(pos), "no": int(r["DriverNumber"]), "name": r["FullName"], "code": r["Abbreviation"],
                     "team": r["TeamName"], "teamShort": SHORT.get(r["TeamName"], r["TeamName"]), "color": colour(r),
                     "times": [t for t in times[:reached] if t], "stage": reached})
    final = [r for r in rows if r["stage"] == 3 and r["times"] and ":" in r["times"][-1]]
    secs = lambda t: int(t.split(":")[0]) * 60 + float(t.split(":")[1])
    pole = secs(final[0]["times"][-1])
    for r in rows:
        last = r["times"][-1] if r["times"] else None
        r["best"] = last if last and ":" in last else None
        r["note"] = None if r["best"] else last
        r["stageTimes"] = r["times"]
        r["gap"] = round(secs(r["best"]) - pole, 3) if r["stage"] == 3 and r["best"] else None
    out = {"tag": tag_of(session), "sprint": sprint, "prefix": prefix, "circuit": session.event["Location"], "stages": 3, "rows": rows,
           "knockouts": [{"stage": f"{prefix}{s}", "codes": [r["code"] for r in rows if r["stage"] == s]} for s in (1, 2)]}
    json.dump(out, open(DATA / "quali.json", "w"), indent=1)
    print(f"quali.json: pole {final[0]['code']} {final[0]['best']}")


def export_sectors(session):
    laps = session.laps
    rows, teams = [], {}
    order = session.results.sort_values("Position")
    for _, r in order.iterrows():
        dl = laps.pick_drivers(r["Abbreviation"])
        if dl.empty:
            continue
        best = dl["LapTime"].min()
        d = {"pos": str(int(r["Position"])) if not pd.isna(r["Position"]) else "NC", "code": r["Abbreviation"],
             "team": SHORT.get(r["TeamName"], r["TeamName"]), "color": colour(r),
             "s1": round(dl["Sector1Time"].min().total_seconds(), 3), "s2": round(dl["Sector2Time"].min().total_seconds(), 3),
             "s3": round(dl["Sector3Time"].min().total_seconds(), 3), "trap": int(np.nanmax(dl["SpeedST"])) if dl["SpeedST"].notna().any() else 0,
             "best": round(best.total_seconds(), 3) if not pd.isna(best) else None}
        if d["best"] is None:
            continue
        rows.append(d)
        t = teams.setdefault(d["team"], {"team": d["team"], "color": d["color"], "best": 9e9, "trap": 0})
        t["best"], t["trap"] = min(t["best"], d["best"]), max(t["trap"], d["trap"])
    json.dump({"tag": tag_of(session), "source": "F1 live timing via FastF1", "drivers": rows, "teams": list(teams.values())},
              open(DATA / "sectors.json", "w"), indent=1)
    print(f"sectors.json: {len(rows)} drivers")


def export_dominance(session, n_mini=25):
    order = session.results.sort_values("Position")["Abbreviation"].tolist()[:2]
    tel_all, drivers = [], []
    for code in order:
        lap = session.laps.pick_drivers(code).pick_fastest()
        tel = lap.get_telemetry().add_distance()
        tel_all.append(tel)
        drivers.append({"code": code, "team": lap["Team"], "color": TEAM_COLORS.get(lap["Team"], "#888888"), "lapTime": fmt_lap(lap["LapTime"])})
    ref = tel_all[0]
    rot = np.deg2rad(session.get_circuit_info().rotation)
    R = np.array([[np.cos(rot), -np.sin(rot)], [np.sin(rot), np.cos(rot)]])
    xy = np.column_stack([ref["X"], ref["Y"]]) @ R.T
    xy -= xy.min(axis=0)
    xy /= xy.max()
    edges = np.linspace(0, max(t["Distance"].max() for t in tel_all), n_mini + 1)
    winners, deltas = [], []
    for i in range(n_mini):
        sp = [float(t.loc[(t["Distance"] >= edges[i]) & (t["Distance"] < edges[i + 1]), "Speed"].mean()) for t in tel_all]
        winners.append(int(np.nanargmax(sp)))
        deltas.append(round(abs(sp[0] - sp[1]), 1))
    mini = np.clip(np.digitize(ref["Distance"].to_numpy(), edges) - 1, 0, n_mini - 1)
    step = max(1, len(xy) // 600)
    pts = [{"x": round(float(x), 4), "y": round(float(y), 4), "m": int(m)} for (x, y), m in zip(xy[::step], mini[::step])]
    json.dump({"demo": False, "title": f"{session.event['Location']} {session.event.year} · {session.name}", "drivers": drivers,
               "minisectors": winners, "speedDeltas": deltas, "points": pts}, open(DATA / "track-dominance.json", "w"))
    print(f"track-dominance.json: {drivers[0]['code']} vs {drivers[1]['code']}")


def main():
    if len(sys.argv) < 5:
        print(__doc__)
        sys.exit(1)
    year, event, code, files = int(sys.argv[1]), sys.argv[2], sys.argv[3].upper(), sys.argv[4:]
    event = int(event) if event.isdigit() else event
    ident = {"R": "Race", "S": "Sprint", "Q": "Qualifying", "SQ": "Sprint Qualifying"}[code]
    cache = Path(os.environ.get("PI_DATA_DIR", "~/PaddockIntel-Data")).expanduser() / "cache"
    cache.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(str(cache))
    session = fastf1.get_session(year, event, ident)
    session.load(livedata=LiveTimingData(*files), telemetry=True, weather=False, messages=False)
    DATA.mkdir(parents=True, exist_ok=True)

    if code in ("R", "S"):
        export_race(session, sprint=code == "S")
    else:
        export_quali(session, sprint=code == "SQ")
    for step in (export_sectors, export_dominance):  # each one is optional: a missing feed must not block the others
        try:
            step(session)
        except Exception as exc:
            print(f"skipped {step.__name__}: {exc}")


if __name__ == "__main__":
    main()
