# Snapshot every Hub view as {view: sorted rows}; source = 'prod' (Management API) or 'local' (sandbox).
import json, subprocess, sys
sys.path.insert(0, "scripts/f1db/step4")
from mq import sql
VIEWS = ["driver_stats", "constructor_stats", "driver_win_streaks", "constructor_win_streaks", "driver_circuit_wins",
         "driver_qualifying_pace", "race_winner_ages", "oldest_race_winners", "youngest_race_winners", "season_title_fights"]

def local(q):
    r = subprocess.run(["psql", "-h", "127.0.0.1", "-p", "54330", "-U", "postgres", "-At", "-c", f"select coalesce(json_agg(x), '[]') from ({q}) x"], capture_output=True, text=True)
    if r.returncode: sys.exit(r.stderr)
    return json.loads(r.stdout)

def norm(v):
    if isinstance(v, float): return int(v) if v == int(v) else round(v, 4)
    if isinstance(v, str):
        try:
            f = float(v)
            return int(f) if f == int(f) else round(f, 4)
        except ValueError:
            return v
    return v

src, out = sys.argv[1], sys.argv[2]
snap = {}
for v in VIEWS:
    rows = (sql if src == "prod" else local)(f"select * from public.{v}")
    rows = [{k: norm(x) for k, x in r.items()} for r in rows]
    snap[v] = sorted(rows, key=lambda r: json.dumps(r, sort_keys=True, default=str))
    print(v, len(rows), flush=True)
json.dump(snap, open(out, "w"), default=str)
