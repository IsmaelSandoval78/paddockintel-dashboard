#!/usr/bin/env python3
"""
F1DB vs Supabase, field by field (step 3 of docs/PLAN-2026-10-26-f1db-migration.md). Read-only.

Usage:
  python3 scripts/f1db/diff.py --crosswalk docs/f1db/crosswalk-v2026.18.0.json --out docs/f1db/diff-v2026.18.0.json

Reads our race tables (public.*) and the staging copy of the pinned F1DB release (f1db.*, loaded
by staging.py) through the Supabase Management API (SUPABASE_ACCESS_TOKEN), pairs rows with the
step 1 crosswalk, and writes every difference grouped by table and kind. Nothing is written to
the database. Rows that exist on one side only are counted, not listed one by one: step 1
already explains them (withdrawn entries we keep, non-starters F1DB keeps).
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

PROJECT_REF = "ozcmecoaofolbrzhlhum"
SAMPLES = 25

# Ergast's position_text letters -> F1DB's non-numeric position texts.
TEXT_CLASS = {"R": "DNF", "D": "DSQ", "W": "DNS", "F": "DNQ", "N": "NC", "E": "EX"}


def sql(query: str) -> list[dict]:
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": query}).encode(),
        headers={"Authorization": f"Bearer {os.environ['SUPABASE_ACCESS_TOKEN']}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            return json.loads(resp.read() or b"[]")
    except urllib.error.HTTPError as exc:
        sys.exit(f"query failed: HTTP {exc.code} {exc.read()[:500]!r}")


def num(v):
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def era(year: int) -> str:
    return "1950-1979" if year < 1980 else "1980-2009" if year < 2010 else "2010-2026"


class Report:
    def __init__(self):
        self.counts: dict[str, Counter] = defaultdict(Counter)
        self.by_era: dict[str, Counter] = defaultdict(Counter)
        self.samples: dict[str, list] = defaultdict(list)
        self.compared: Counter = Counter()

    def add(self, table: str, kind: str, year: int, sample: dict) -> None:
        key = f"{table}.{kind}"
        self.counts[table][kind] += 1
        self.by_era[key][era(year)] += 1
        if len(self.samples[key]) < SAMPLES:
            self.samples[key].append(sample)


def pair_rows(ours: list[dict], theirs: list[dict], our_key, their_key) -> tuple[list, list, list]:
    """Pair rows of one race on a key; repeated keys (shared drives) pair in order."""
    bucket = defaultdict(list)
    for t in theirs:
        bucket[their_key(t)].append(t)
    pairs, only_ours = [], []
    for o in ours:
        lst = bucket.get(our_key(o))
        if lst:
            pairs.append((o, lst.pop(0)))
        else:
            only_ours.append(o)
    only_theirs = [t for lst in bucket.values() for t in lst]
    return pairs, only_ours, only_theirs


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--crosswalk", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    xw = json.loads(args.crosswalk.read_text(encoding="utf-8"))

    race_map = {int(k): v for k, v in xw["races"].items()}  # our race id -> {f1db_id, year, ...}
    f2o_race = {v["f1db_id"]: k for k, v in race_map.items()}
    drivers = sql("select id, driver_ref from public.drivers")
    d_ref = {d["id"]: d["driver_ref"] for d in drivers}
    d_map = {d["id"]: (xw["drivers"].get(d["driver_ref"]) or {}).get("f1db_id") for d in drivers}
    cons = sql("select id, constructor_ref from public.constructors")
    c_ref = {c["id"]: c["constructor_ref"] for c in cons}
    c_seasons = {k: set(v) for k, v in xw["constructor_seasons"].items()}
    year_of = {rid: m["year"] for rid, m in race_map.items()}
    rep = Report()

    # ── Race results ─────────────────────────────────────────────────
    ours = sql("select race_id, driver_id, constructor_id, grid, position, position_text, position_order, points, laps, milliseconds, rank from public.results")
    theirs = sql("""select race_id, position_display_order, position_number, position_text, driver_id, constructor_id,
                           race_laps, race_time_millis, race_points, race_grid_position_number, race_grid_position_text,
                           race_fastest_lap, race_shared_car
                    from f1db.race_data where type = 'RACE_RESULT'""")
    by_race_o, by_race_t = defaultdict(list), defaultdict(list)
    for o in ours:
        by_race_o[o["race_id"]].append(o)
    for t in theirs:
        by_race_t[t["race_id"]].append(t)
    for rid, rows in by_race_o.items():
        if rid not in race_map:
            continue
        y = year_of[rid]
        rows.sort(key=lambda r: r["position_order"])
        trows = sorted(by_race_t.get(race_map[rid]["f1db_id"], []), key=lambda r: r["position_display_order"])
        pairs, only_o, only_t = pair_rows(rows, trows, lambda o: d_map.get(o["driver_id"]), lambda t: t["driver_id"])
        rep.compared["results"] += len(pairs)
        for o in only_o:
            rep.add("results", "only-ours", y, {"year": y, "round": race_map[rid]["round"], "driver": d_ref[o["driver_id"]], "position_text": o["position_text"]})
        for t in only_t:
            if t["position_number"] is None and t["position_text"] in ("DNS", "DNQ", "DNPQ", "DNP", "EX"):
                rep.counts["results"]["only-f1db-non-starter"] += 1
            else:
                rep.add("results", "only-f1db", y, {"year": y, "round": race_map[rid]["round"], "driver": t["driver_id"], "position_text": t["position_text"]})
        for o, t in pairs:
            base = {"year": y, "round": race_map[rid]["round"], "driver": d_ref[o["driver_id"]]}
            if (o["position"] or None) != (t["position_number"] or None):
                rep.add("results", "position", y, {**base, "ours": o["position"], "f1db": t["position_number"]})
            ot = o["position_text"]
            ocls = TEXT_CLASS.get(ot, "NUM" if (ot or "").isdigit() else ot)
            tcls = "NUM" if (t["position_text"] or "").isdigit() else t["position_text"]
            if ocls != tcls:
                rep.add("results", "classification", y, {**base, "ours": ot, "f1db": t["position_text"]})
            if abs((num(o["points"]) or 0) - (num(t["race_points"]) or 0)) > 1e-6:
                rep.add("results", "points", y, {**base, "ours": num(o["points"]), "f1db": num(t["race_points"])})
            if o["laps"] is not None and t["race_laps"] is not None and int(o["laps"]) != int(t["race_laps"]):
                rep.add("results", "laps", y, {**base, "ours": o["laps"], "f1db": t["race_laps"]})
            tgrid = t["race_grid_position_number"]
            if tgrid is None and t["race_grid_position_text"] == "PL":
                tgrid = 0
            if tgrid is not None and (o["grid"] or 0) != tgrid:
                kind = "grid-pit-lane" if t["race_grid_position_text"] == "PL" else "grid"
                rep.add("results", kind, y, {**base, "ours": o["grid"], "f1db": t["race_grid_position_text"]})
            if o["milliseconds"] and t["race_time_millis"] and int(o["milliseconds"]) != int(t["race_time_millis"]):
                rep.add("results", "time", y, {**base, "ours": o["milliseconds"], "f1db": t["race_time_millis"]})
            if (o["rank"] == 1) != bool(t["race_fastest_lap"]) and y >= 2004:
                # Ergast's `rank` (fastest-lap rank) only exists from 2004.
                rep.add("results", "fastest-lap", y, {**base, "ours_rank": o["rank"], "f1db": t["race_fastest_lap"]})
            seasons = c_seasons.get(f"{c_ref[o['constructor_id']]}:{y}", set())
            if seasons and t["constructor_id"] not in seasons:
                rep.add("results", "constructor", y, {**base, "ours": c_ref[o["constructor_id"]], "f1db": t["constructor_id"]})

    # ── Sprint results ───────────────────────────────────────────────
    ours = sql("select race_id, driver_id, position, position_text, position_order, points, laps, grid from public.sprint_results")
    theirs = sql("""select race_id, position_number, position_text, driver_id, race_laps, race_points, race_grid_position_number, race_grid_position_text
                    from f1db.race_data where type = 'SPRINT_RACE_RESULT'""")
    by_t = defaultdict(list)
    for t in theirs:
        by_t[t["race_id"]].append(t)
    by_o = defaultdict(list)
    for o in ours:
        by_o[o["race_id"]].append(o)
    for rid, rows in by_o.items():
        if rid not in race_map:
            continue
        y = year_of[rid]
        pairs, only_o, only_t = pair_rows(rows, by_t.get(race_map[rid]["f1db_id"], []), lambda o: d_map.get(o["driver_id"]), lambda t: t["driver_id"])
        rep.compared["sprint_results"] += len(pairs)
        for o in only_o:
            rep.add("sprint_results", "only-ours", y, {"year": y, "round": race_map[rid]["round"], "driver": d_ref[o["driver_id"]]})
        for t in only_t:
            rep.add("sprint_results", "only-f1db", y, {"year": y, "round": race_map[rid]["round"], "driver": t["driver_id"], "position_text": t["position_text"]})
        for o, t in pairs:
            base = {"year": y, "round": race_map[rid]["round"], "driver": d_ref[o["driver_id"]]}
            if (o["position"] or None) != (t["position_number"] or None):
                rep.add("sprint_results", "position", y, {**base, "ours": o["position"], "f1db": t["position_number"]})
            if abs((num(o["points"]) or 0) - (num(t["race_points"]) or 0)) > 1e-6:
                rep.add("sprint_results", "points", y, {**base, "ours": num(o["points"]), "f1db": num(t["race_points"])})
            if o["laps"] is not None and t["race_laps"] is not None and int(o["laps"]) != int(t["race_laps"]):
                rep.add("sprint_results", "laps", y, {**base, "ours": o["laps"], "f1db": t["race_laps"]})

    # ── Qualifying ───────────────────────────────────────────────────
    ours = sql("select race_id, driver_id, position, q1, q2, q3 from public.qualifying")
    theirs = sql("""select race_id, position_number, position_text, driver_id, qualifying_time, qualifying_q1, qualifying_q2, qualifying_q3
                    from f1db.race_data where type = 'QUALIFYING_RESULT'""")
    by_t = defaultdict(list)
    for t in theirs:
        by_t[t["race_id"]].append(t)
    by_o = defaultdict(list)
    for o in ours:
        by_o[o["race_id"]].append(o)
    for rid, rows in by_o.items():
        if rid not in race_map:
            continue
        y = year_of[rid]
        pairs, only_o, only_t = pair_rows(rows, by_t.get(race_map[rid]["f1db_id"], []), lambda o: d_map.get(o["driver_id"]), lambda t: t["driver_id"])
        rep.compared["qualifying"] += len(pairs)
        for o in only_o:
            rep.add("qualifying", "only-ours", y, {"year": y, "round": race_map[rid]["round"], "driver": d_ref[o["driver_id"]]})
        rep.counts["qualifying"]["only-f1db"] += len(only_t)
        for o, t in pairs:
            base = {"year": y, "round": race_map[rid]["round"], "driver": d_ref[o["driver_id"]]}
            if (o["position"] or None) != (t["position_number"] or None):
                rep.add("qualifying", "position", y, {**base, "ours": o["position"], "f1db": t["position_number"]})
            for k in ("q1", "q2", "q3"):
                ov = (o[k] or "").strip() or None
                tv = (t[f"qualifying_{k}"] or "").strip() or None
                if k == "q1" and tv is None and t["qualifying_time"] and not (t["qualifying_q2"] or t["qualifying_q3"]):
                    tv = t["qualifying_time"]  # single-session formats: F1DB keeps the time, Ergast puts it in q1
                if ov and tv and ov != tv:
                    rep.add("qualifying", f"{k}-time", y, {**base, "ours": ov, "f1db": tv})

    # ── Pit stops ────────────────────────────────────────────────────
    ours = sql("select race_id, driver_id, stop, lap, milliseconds from public.pit_stops")
    theirs = sql("select race_id, driver_id, pit_stop_stop, pit_stop_lap, pit_stop_time_millis from f1db.race_data where type = 'PIT_STOP'")
    tkey = {(t["race_id"], t["driver_id"], t["pit_stop_stop"]): t for t in theirs}
    seen = set()
    for o in ours:
        if o["race_id"] not in race_map:
            continue
        y = year_of[o["race_id"]]
        k = (race_map[o["race_id"]]["f1db_id"], d_map.get(o["driver_id"]), o["stop"])
        t = tkey.get(k)
        if not t:
            rep.add("pit_stops", "only-ours", y, {"year": y, "round": race_map[o["race_id"]]["round"], "driver": d_ref[o["driver_id"]], "stop": o["stop"]})
            continue
        seen.add(k)
        rep.compared["pit_stops"] += 1
        base = {"year": y, "round": race_map[o["race_id"]]["round"], "driver": d_ref[o["driver_id"]], "stop": o["stop"]}
        if o["lap"] != t["pit_stop_lap"]:
            rep.add("pit_stops", "lap", y, {**base, "ours": o["lap"], "f1db": t["pit_stop_lap"]})
        if o["milliseconds"] and t["pit_stop_time_millis"] and int(o["milliseconds"]) != int(t["pit_stop_time_millis"]):
            rep.add("pit_stops", "duration", y, {**base, "ours": o["milliseconds"], "f1db": t["pit_stop_time_millis"]})
    for k, t in tkey.items():
        if k not in seen and k[0] in f2o_race:
            rep.add("pit_stops", "only-f1db", race_map[f2o_race[k[0]]]["year"], {"year": race_map[f2o_race[k[0]]]["year"], "round": race_map[f2o_race[k[0]]]["round"], "driver": k[1], "stop": k[2]})

    # ── Driver standings (after every race) ───────────────────────────
    ours = sql("select race_id, driver_id, points, position from public.driver_standings")
    theirs = sql("select race_id, driver_id, points, position_number from f1db.race_driver_standing")
    tkey = {(t["race_id"], t["driver_id"]): t for t in theirs}
    pts_count = Counter((o["race_id"], num(o["points"])) for o in ours)
    for o in ours:
        if o["race_id"] not in race_map:
            continue
        y = year_of[o["race_id"]]
        t = tkey.get((race_map[o["race_id"]]["f1db_id"], d_map.get(o["driver_id"])))
        base = {"year": y, "round": race_map[o["race_id"]]["round"], "driver": d_ref[o["driver_id"]]}
        if not t:
            # F1DB's standings list only drivers with points; ours list everyone who raced.
            rep.add("driver_standings", "only-ours" if num(o["points"]) else "only-ours-zero-points", y, base)
            continue
        rep.compared["driver_standings"] += 1
        if abs((num(o["points"]) or 0) - (num(t["points"]) or 0)) > 1e-6:
            rep.add("driver_standings", "points", y, {**base, "ours": num(o["points"]), "f1db": num(t["points"])})
        if num(o["points"]) and o["position"] != t["position_number"]:
            # Drivers level on points are ordered by countback; the two sources break some ties differently.
            tie = pts_count[(o["race_id"], num(o["points"]))] > 1 and abs((num(o["points"]) or 0) - (num(t["points"]) or 0)) < 1e-6
            rep.add("driver_standings", "position-tie-order" if tie else "position", y, {**base, "ours": o["position"], "f1db": t["position_number"]})

    # ── Constructor standings: paired on position (constructor identity differs by era) ──
    ours = sql("select race_id, constructor_id, points, position from public.constructor_standings")
    theirs = sql("select race_id, constructor_id, points, position_number from f1db.race_constructor_standing")
    t_by = defaultdict(dict)
    for t in theirs:
        t_by[t["race_id"]].setdefault(t["position_number"], t)
    for o in ours:
        if o["race_id"] not in race_map:
            continue
        y = year_of[o["race_id"]]
        t = t_by.get(race_map[o["race_id"]]["f1db_id"], {}).get(o["position"])
        base = {"year": y, "round": race_map[o["race_id"]]["round"], "constructor": c_ref[o["constructor_id"]], "position": o["position"]}
        if not t:
            rep.add("constructor_standings", "only-ours" if num(o["points"]) else "only-ours-zero-points", y, base)
            continue
        rep.compared["constructor_standings"] += 1
        if abs((num(o["points"]) or 0) - (num(t["points"]) or 0)) > 1e-6:
            rep.add("constructor_standings", "points", y, {**base, "ours": num(o["points"]), "f1db": num(t["points"]), "f1db_constructor": t["constructor_id"]})
        seasons = c_seasons.get(f"{c_ref[o['constructor_id']]}:{y}", set())
        if num(o["points"]) and seasons and t["constructor_id"] not in seasons:
            rep.add("constructor_standings", "constructor-at-position", y, {**base, "f1db": t["constructor_id"]})

    out = {
        "compared": dict(rep.compared),
        "counts": {k: dict(v) for k, v in rep.counts.items()},
        "by_era": {k: dict(v) for k, v in sorted(rep.by_era.items())},
        "samples": dict(rep.samples),
    }
    args.out.write_text(json.dumps(out, indent=1, ensure_ascii=False, default=str) + "\n", encoding="utf-8")
    print(json.dumps({"compared": out["compared"], "counts": out["counts"]}, indent=1))


if __name__ == "__main__":
    main()
