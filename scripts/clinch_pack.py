#!/usr/bin/env python3
"""
Clinch pack: for the next Grand Prix, which championship positions can be settled and what each
rival needs to keep a fight alive. Reads standings and results from Supabase; read-only.

For every pair of drivers (and of constructors) still in reach of each other, it enumerates the
next race's finishing positions for both and reports the margin at which the one ahead clinches:
  "A clinches over B unless B outscores A by N or more"
A tie on points after the last race goes to countback (most wins, then most second places, and so
on), counting Grand Prix results only.

Assumes the remaining rounds are Grands Prix without sprints and the 2026 points scale; check both
before using it in another season.

Usage:
  python3 scripts/clinch_pack.py --year 2026 --after-round 21
  python3 scripts/clinch_pack.py --year 2026 --after-round 21 --top 6
"""

import argparse
import itertools
import os
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent / ".env.local")

POINTS = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}
POSITIONS = list(range(1, 11)) + [0]  # 0 = outside the points, or not classified
MAX_POS = 22


def pts(p):
    return POINTS.get(p, 0)


def countback_ahead(a, b):
    """True if countback vector a beats b (more wins, then more seconds, ...)."""
    for pos in range(1, MAX_POS + 1):
        if a[pos] != b[pos]:
            return a[pos] > b[pos]
    return False  # identical: treat as not clinched


def clinches(gap_after, remaining_max, cb_lead, cb_rival, rival_best):
    """Leader clinches over rival after the next race?

    gap_after: leader minus rival after the next race. remaining_max: the most the rival can still
    score afterwards. rival_best: the positions the rival would take to score remaining_max."""
    if gap_after > remaining_max:
        return True
    if gap_after < remaining_max:
        return False
    rival = cb_rival.copy()
    rival.update(rival_best)
    return countback_ahead(cb_lead, rival)


def analyse(name_a, name_b, gap, cb_a, cb_b, entries, remaining_gps, team):
    """entries: possible next-race results for one entrant (tuples of positions)."""
    per_gp_max = pts(1) + (pts(2) if team else 0)
    remaining_max = per_gp_max * remaining_gps
    rival_best = Counter({1: remaining_gps, **({2: remaining_gps} if team else {})})
    alive, settled = {}, {}
    for ea, eb in itertools.product(entries, repeat=2):
        used = [p for p in ea + eb if p]
        if len(used) != len(set(used)):
            continue
        d = sum(pts(p) for p in eb) - sum(pts(p) for p in ea)
        ca, cb = cb_a.copy(), cb_b.copy()
        ca.update(p for p in ea if p)
        cb.update(p for p in eb if p)
        bucket = settled if clinches(gap - d, remaining_max, ca, cb, rival_best) else alive
        bucket.setdefault(d, set()).add(eb)
    if not alive or min(alive) > per_gp_max:
        return f"{name_a} clinches ahead of {name_b} whatever happens"
    need = min(alive)
    if need <= 0:
        return f"{name_a} cannot clinch ahead of {name_b} in this race"
    if need not in settled:
        return f"{name_a} clinches ahead of {name_b} unless {name_b} outscores {name_a} by {need} or more"
    # At exactly `need` the outcome depends on countback: say which of the rival's results keep it alive.
    fmt = lambda e: "+".join(f"P{p}" for p in e if p) or "no points"
    keep = sorted({fmt(e) for e in alive[need]} - {fmt(e) for e in settled[need]})
    cond = f" (only if {name_b} finishes {' or '.join(keep)})" if keep else " (depending on countback)"
    return (f"{name_a} clinches ahead of {name_b} unless {name_b} outscores {name_a} by {need + 1} or more, "
            f"or by exactly {need}{cond}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--year", type=int, required=True)
    ap.add_argument("--after-round", type=int, required=True)
    ap.add_argument("--top", type=int, default=8, help="championship positions to analyse")
    args = ap.parse_args()

    db = create_client(os.environ["NEXT_PUBLIC_SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    races = db.table("races").select("id,round,name").eq("year", args.year).order("round").execute().data
    done = [r for r in races if r["round"] <= args.after_round]
    left = [r for r in races if r["round"] > args.after_round]
    if not left:
        print("No races left.")
        return
    last_id = done[-1]["id"]
    remaining_after_next = len(left) - 1
    print(f"{args.year} after round {args.after_round} ({done[-1]['name']}); next: {left[0]['name']}; "
          f"{remaining_after_next} Grand Prix after it\n")

    race_ids = [r["id"] for r in done]
    results = db.table("results").select("driver_id,constructor_id,position").in_("race_id", race_ids).execute().data
    cb_driver, cb_team = {}, {}
    for r in results:
        if r["position"]:
            cb_driver.setdefault(r["driver_id"], Counter())[r["position"]] += 1
            cb_team.setdefault(r["constructor_id"], Counter())[r["position"]] += 1

    names = {d["id"]: f"{d['forename']} {d['surname']}" for d in db.table("drivers").select("id,forename,surname").execute().data}
    tnames = {c["id"]: c["name"] for c in db.table("constructors").select("id,name").execute().data}

    for label, table, key, cbs, nm, team in (
        ("DRIVERS", "driver_standings", "driver_id", cb_driver, names, False),
        ("CONSTRUCTORS", "constructor_standings", "constructor_id", cb_team, tnames, True),
    ):
        rows = db.table(table).select(f"{key},points,position").eq("race_id", last_id).order("position").execute().data
        rows = rows[: args.top + 1]
        entries = [tuple(sorted(c, key=lambda p: p or 99)) for c in itertools.combinations_with_replacement(POSITIONS, 2)
                   if c.count(0) == 2 or len({p for p in c if p}) == len([p for p in c if p])] if team else [(p,) for p in POSITIONS]
        per_race = pts(1) + (pts(2) if team else 0)
        reach = per_race * len(left)
        print(f"== {label}")
        for r in rows:
            print(f"  P{r['position']:>2} {nm[r[key]]:<24} {float(r['points']):>6.0f}")
        print()
        for a, b in itertools.combinations(rows, 2):
            gap = float(a["points"]) - float(b["points"])
            if gap > reach:
                continue
            print("  " + analyse(nm[a[key]], nm[b[key]], gap, cbs.get(a[key], Counter()), cbs.get(b[key], Counter()),
                                 entries, remaining_after_next, team))
        print()


if __name__ == "__main__":
    main()
