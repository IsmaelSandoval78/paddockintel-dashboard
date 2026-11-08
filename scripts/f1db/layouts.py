#!/usr/bin/env python3
"""
Apply supabase/migrations/20261027150000_races_circuit_layout.sql and fill races.circuit_layout
from F1DB (circuit_layout_id), in one transaction.

  python3 scripts/f1db/layouts.py --target prod
  python3 scripts/f1db/layouts.py --target local   # rehearsal on the sandbox copy (port 54330)

Needs the F1DB staging schema (step 2) and the step 1 crosswalk (docs/f1db/crosswalk-v2026.18.0.json).
Through the Supabase Management API, approved by the founder on 2026-10-27 as for the pole flag;
recorded in supabase_migrations.schema_migrations like `db push` would. Before the transaction ends
it checks that every race in the table got a layout and that each layout belongs to one of our
circuits only; if not, nothing is written.
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

PROJECT_REF = "ozcmecoaofolbrzhlhum"
MIGRATION = Path("supabase/migrations/20261027150000_races_circuit_layout.sql")
PSQL = ["psql", "-h", "127.0.0.1", "-p", "54330", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-At"]


def lit(s: str) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def crosswalk_sql(path: Path) -> str:
    xw = json.loads(path.read_text())
    races = [f"({k},{v['f1db_id']})" for k, v in xw["races"].items()]
    return f"""
create temp table xw_race(race_id int, f1db_id int) on commit drop;
insert into xw_race values {",".join(races)};
"""


def body(migration: str) -> str:
    version, name = MIGRATION.stem.split("_", 1)
    return f"""
{migration}

update public.races ra set circuit_layout = f.circuit_layout_id
from xw_race xr join f1db.race f on f.id = xr.f1db_id
where xr.race_id = ra.id;

do $$
declare n int;
begin
  select count(*) into n from public.races where circuit_layout is null;
  if n <> 0 then raise exception '% races without a layout', n; end if;
  select count(*) into n from (select circuit_layout from public.races group by 1 having count(distinct circuit_id) > 1) z;
  if n <> 0 then raise exception '% layouts shared by two of our circuits', n; end if;
end $$;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ({lit(version)}, {lit(name)}, array[$migration${migration}$migration$]);

select (select count(*) from public.races where circuit_layout is not null) as races_with_layout,
       (select count(distinct circuit_layout) from public.races) as layouts,
       (select circuit_layout from public.races ra join public.circuits c on c.id = ra.circuit_id
         where c.circuit_ref = 'silverstone' order by ra.year desc limit 1) as silverstone_now;
"""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", choices=["local", "prod"], required=True)
    ap.add_argument("--crosswalk", type=Path, default=Path("docs/f1db/crosswalk-v2026.18.0.json"))
    args = ap.parse_args()
    q = crosswalk_sql(args.crosswalk) + body(MIGRATION.read_text())
    if args.target == "local":
        r = subprocess.run(PSQL + ["-c", q], capture_output=True, text=True)
        if r.returncode:
            sys.exit(r.stderr[:3000])
        print(r.stdout.strip().splitlines()[-1])
        return
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": q}).encode(),
        headers={"Authorization": f"Bearer {os.environ['SUPABASE_ACCESS_TOKEN']}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            print(json.dumps(json.loads(resp.read() or b"[]"), indent=1))
    except urllib.error.HTTPError as exc:
        sys.exit(f"Management API query failed: HTTP {exc.code}\n{exc.read()[:2000].decode(errors='replace')}")


if __name__ == "__main__":
    main()
