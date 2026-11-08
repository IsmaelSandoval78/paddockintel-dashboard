#!/usr/bin/env python3
"""
F1DB -> Supabase id crosswalk (step 1 of docs/PLAN-2026-10-26-f1db-migration.md). Read-only.

Usage:
  python3 scripts/f1db/crosswalk.py --f1db path/to/f1db-checkout --out path/to/crosswalk.json

Reads the F1DB source data (src/data, YAML) of a pinned release and the Supabase race tables,
and maps every F1DB id onto our ids:
  - seasons and races by year + round (dates compared)
  - circuits by the races held on them
  - drivers and constructors by the race results they share, row by row: each race's results
    are paired on car number, then on finishing order; every pair is a vote, and each of our
    ids takes the F1DB id with the most votes. Drivers are then checked on date of birth.
Rows that no race result can anchor (entrants with no result row) fall back to name + date of
birth, and every map is reported with its evidence so the ambiguous ones can be reviewed by hand.
Nothing is written to Supabase.
"""

import argparse
import json
import os
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import yaml
from dotenv import load_dotenv
from supabase import create_client

REPO = Path(__file__).resolve().parents[2]
load_dotenv(REPO / ".env.local")


def all_rows(query) -> list[dict]:
    out, i = [], 0
    while True:
        rows = query.range(i, i + 999).execute().data
        out += rows
        if len(rows) < 1000:
            return out
        i += 1000


def norm(s: str | None) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return "".join(ch for ch in s if ch.isalnum())


def load_yaml(path: Path):
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--f1db", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    data = args.f1db / "src" / "data"

    sb = create_client(os.environ["NEXT_PUBLIC_SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    sb_races = all_rows(sb.table("races").select("id,year,round,circuit_id,name,date,series_id"))
    sb_results = all_rows(sb.table("results").select("race_id,driver_id,constructor_id,number,position_order"))
    sb_drivers = {d["id"]: d for d in all_rows(sb.table("drivers").select("id,driver_ref,forename,surname,dob"))}
    sb_cons = {c["id"]: c for c in all_rows(sb.table("constructors").select("id,constructor_ref,name"))}
    sb_circuits = {c["id"]: c for c in all_rows(sb.table("circuits").select("id,circuit_ref,name"))}
    sb_seasons = [s["year"] for s in all_rows(sb.table("seasons").select("year,series_id"))]

    # ── F1DB races (only those with a result file are run) ───────────────
    f_races: dict[tuple[int, int], dict] = {}
    f_results: dict[tuple[int, int], list[dict]] = {}
    for season_dir in sorted((data / "seasons").iterdir()):
        for race_dir in sorted((season_dir / "races").iterdir()) if (season_dir / "races").exists() else []:
            race = load_yaml(race_dir / "race.yml")
            key = (int(season_dir.name), int(race["round"]))
            race["folder"] = race_dir.name
            f_races[key] = race
            rr = race_dir / "race-results.yml"
            if rr.exists():
                f_results[key] = load_yaml(rr) or []
    f_drivers = {d["id"]: d for d in (load_yaml(p) for p in (data / "drivers").glob("*.yml"))}
    f_cons = {c["id"]: c for c in (load_yaml(p) for p in (data / "constructors").glob("*.yml"))}
    f_circuits = {c["id"]: c for c in (load_yaml(p) for p in (data / "circuits").glob("*.yml"))}

    report: dict = {"f1db": str(args.f1db), "issues": []}

    # ── Races ─────────────────────────────────────────────────────────
    race_map: dict[int, dict] = {}
    for r in sb_races:
        f = f_races.get((r["year"], r["round"]))
        if not f:
            report["issues"].append({"kind": "race-unmatched", "race_id": r["id"], "year": r["year"], "round": r["round"], "name": r["name"]})
            continue
        entry = {"f1db_id": f["id"], "f1db_folder": f["folder"], "year": r["year"], "round": r["round"],
                 "name": r["name"], "grand_prix": f["grandPrixId"], "f1db_circuit": f["circuitId"]}
        if str(f["date"]) != str(r["date"]):
            entry["date_differs"] = {"supabase": r["date"], "f1db": str(f["date"])}
            report["issues"].append({"kind": "race-date", **entry})
        race_map[r["id"]] = entry
    sb_keys = {(r["year"], r["round"]) for r in sb_races}
    for key, f in f_races.items():
        if key not in sb_keys:
            report["issues"].append({"kind": "f1db-race-not-in-supabase", "year": key[0], "round": key[1], "folder": f["folder"]})

    # ── Circuits, by the races held on them ─────────────────────────────
    circ_votes: dict[int, Counter] = defaultdict(Counter)
    for r in sb_races:
        if r["id"] in race_map:
            circ_votes[r["circuit_id"]][race_map[r["id"]]["f1db_circuit"]] += 1
    circuit_map = {}
    for cid, c in sb_circuits.items():
        votes = circ_votes.get(cid)
        if not votes:
            report["issues"].append({"kind": "circuit-no-race", "circuit_ref": c["circuit_ref"]})
            continue
        best, n = votes.most_common(1)[0]
        circuit_map[c["circuit_ref"]] = {"id": cid, "f1db_id": best, "races": n, "f1db_name": f_circuits[best]["name"], "name": c["name"]}
        if len(votes) > 1:
            report["issues"].append({"kind": "circuit-split", "circuit_ref": c["circuit_ref"], "votes": dict(votes)})

    # ── Drivers and constructors, by shared result rows ───────────────────
    by_race: dict[int, list[dict]] = defaultdict(list)
    for row in sb_results:
        by_race[row["race_id"]].append(row)
    d_votes: dict[int, Counter] = defaultdict(Counter)
    c_votes: dict[int, Counter] = defaultdict(Counter)
    unpaired = 0
    pairs: list[tuple] = []
    for race_id, rows in by_race.items():
        m = race_map.get(race_id)
        if not m:
            continue
        frows = f_results.get((m["year"], m["round"]), [])
        for i, fr in enumerate(frows, 1):
            fr["_order"] = i
            fr["_last"] = norm(f_drivers[fr["driverId"]].get("lastName"))
        free = list(frows)

        def take(pred):
            hits = [fr for fr in free if pred(fr)]
            if len(hits) == 1:
                free.remove(hits[0])
                return hits[0]
            return None

        # Pair each of our rows with one F1DB row: surname + car number, then surname alone,
        # then car number alone, then finishing order. Shared drives (one car, several
        # drivers, common in the 1950s) are why the surname comes first.
        pending = sorted(rows, key=lambda r: r["position_order"])
        for row in pending:
            last = norm(sb_drivers[row["driver_id"]]["surname"])
            num = str(row.get("number"))
            fr = (take(lambda f: f["_last"] == last and str(f.get("driverNumber")) == num)
                  or take(lambda f: f["_last"] == last)
                  or take(lambda f: str(f.get("driverNumber")) == num)
                  or take(lambda f: f["_order"] == row["position_order"]))
            if not fr:
                unpaired += 1
                report["issues"].append({"kind": "result-unpaired", "year": m["year"], "round": m["round"],
                                         "driver_ref": sb_drivers[row["driver_id"]]["driver_ref"], "position_order": row["position_order"]})
                continue
            pairs.append((race_id, row["driver_id"], row["constructor_id"], fr["driverId"], fr["constructorId"], fr.get("engineManufacturerId")))
            d_votes[row["driver_id"]][fr["driverId"]] += 1
            c_votes[row["constructor_id"]][fr["constructorId"]] += 1
        for fr in free:
            report["issues"].append({"kind": "f1db-result-unpaired", "year": m["year"], "round": m["round"], "f1db_driver": fr["driverId"], "position": fr.get("position")})
    report["unpaired_result_rows"] = unpaired

    driver_map = {}
    for did, d in sb_drivers.items():
        votes = d_votes.get(did)
        entry = {"id": did, "name": f"{d['forename']} {d['surname']}", "dob": d["dob"]}
        if votes:
            best, n = votes.most_common(1)[0]
            entry.update({"f1db_id": best, "votes": n, "total": sum(votes.values()), "method": "results"})
            if len(votes) > 1:
                entry["other_votes"] = {k: v for k, v in votes.items() if k != best}
        else:
            hits = [f for f in f_drivers.values()
                    if str(f.get("dateOfBirth")) == str(d["dob"]) and norm(f.get("lastName")) == norm(d["surname"])]
            if len(hits) == 1:
                entry.update({"f1db_id": hits[0]["id"], "method": "name+dob"})
            else:
                entry.update({"f1db_id": None, "method": "unmatched", "candidates": [h["id"] for h in hits]})
                report["issues"].append({"kind": "driver-unmatched", "driver_ref": d["driver_ref"], **entry})
        if entry.get("f1db_id"):
            f = f_drivers[entry["f1db_id"]]
            entry["f1db_name"] = f["name"]
            if d["dob"] and str(f.get("dateOfBirth")) != str(d["dob"]):
                entry["dob_differs"] = str(f.get("dateOfBirth"))
                report["issues"].append({"kind": "driver-dob", "driver_ref": d["driver_ref"], "supabase": d["dob"], "f1db": str(f.get("dateOfBirth")), "f1db_id": f["id"]})
            if entry.get("other_votes"):
                report["issues"].append({"kind": "driver-split", "driver_ref": d["driver_ref"], "best": entry["f1db_id"], "other": entry["other_votes"]})
        driver_map[d["driver_ref"]] = entry
    used = Counter(e["f1db_id"] for e in driver_map.values() if e.get("f1db_id"))
    for fid, n in used.items():
        if n > 1:
            report["issues"].append({"kind": "driver-many-to-one", "f1db_id": fid, "refs": [k for k, e in driver_map.items() if e.get("f1db_id") == fid]})

    cons_map = {}
    for cid, c in sb_cons.items():
        votes = c_votes.get(cid)
        entry = {"id": cid, "name": c["name"]}
        if votes:
            best, n = votes.most_common(1)[0]
            entry.update({"f1db_id": best, "f1db_name": f_cons[best]["name"], "votes": n, "total": sum(votes.values()), "method": "results"})
            if len(votes) > 1:
                entry["other_votes"] = {k: v for k, v in votes.items() if k != best}
                report["issues"].append({"kind": "constructor-split", "constructor_ref": c["constructor_ref"], "best": best, "other": entry["other_votes"]})
        else:
            hits = [f for f in f_cons.values() if norm(f["name"]) == norm(c["name"])]
            entry.update({"f1db_id": hits[0]["id"] if len(hits) == 1 else None, "method": "name" if len(hits) == 1 else "unmatched"})
            if len(hits) != 1:
                report["issues"].append({"kind": "constructor-unmatched", "constructor_ref": c["constructor_ref"], "name": c["name"]})
        cons_map[c["constructor_ref"]] = entry
    used = Counter(e["f1db_id"] for e in cons_map.values() if e.get("f1db_id"))
    for fid, n in used.items():
        if n > 1:
            report["issues"].append({"kind": "constructor-many-to-one", "f1db_id": fid, "refs": [k for k, e in cons_map.items() if e.get("f1db_id") == fid]})

    # Constructor identity differs by era (Ergast "lotus-climax" vs F1DB lotus + Climax engine;
    # our "rb" is F1DB's rb in 2024 and racing-bulls from 2025), so the usable constructor map is
    # per season: our ref + year -> F1DB constructor ids seen in the paired result rows.
    race_year = {rid: m["year"] for rid, m in race_map.items()}
    seasons_map: dict[str, Counter] = defaultdict(Counter)
    for race_id, _, cid, _, f_cid, _ in pairs:
        seasons_map[f"{sb_cons[cid]['constructor_ref']}:{race_year[race_id]}"][f_cid] += 1
    constructor_seasons = {k: dict(v) for k, v in sorted(seasons_map.items())}
    for k, v in constructor_seasons.items():
        if len(v) > 1:
            report["issues"].append({"kind": "constructor-season-split", "key": k, "f1db": v})
    report["paired_result_rows"] = len(pairs)

    f_years = {int(p.name) for p in (data / "seasons").iterdir()}
    report["seasons"] = {"supabase": len(set(sb_seasons)), "f1db": len(f_years),
                         "missing_in_f1db": sorted(set(sb_seasons) - f_years), "missing_in_supabase": sorted(f_years - set(sb_seasons))}
    report["coverage"] = {
        "races": f"{len(race_map)}/{len(sb_races)}",
        "circuits": f"{len(circuit_map)}/{len(sb_circuits)}",
        "drivers": f"{sum(1 for e in driver_map.values() if e.get('f1db_id'))}/{len(sb_drivers)}",
        "constructors": f"{sum(1 for e in cons_map.values() if e.get('f1db_id'))}/{len(sb_cons)}",
    }
    out = {"report": report, "races": race_map, "circuits": circuit_map, "drivers": driver_map, "constructors": cons_map, "constructor_seasons": constructor_seasons}
    args.out.write_text(json.dumps(out, indent=1, ensure_ascii=False, default=str) + "\n", encoding="utf-8")
    print(json.dumps(report["coverage"]), "unpaired:", unpaired, "issues:", Counter(i["kind"] for i in report["issues"]))


if __name__ == "__main__":
    main()
