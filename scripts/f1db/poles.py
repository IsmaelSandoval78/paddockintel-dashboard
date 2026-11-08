#!/usr/bin/env python3
"""
Apply supabase/migrations/20261027130000_results_pole_flag.sql and fill results.pole from F1DB,
in one transaction, so the stats views never show a pole count from a half-filled column.

  python3 scripts/f1db/poles.py --target prod
  python3 scripts/f1db/poles.py --target local   # rehearsal on the sandbox copy (port 54330)

Needs the F1DB staging schema (step 2) and the step 1 crosswalk (docs/f1db/crosswalk-v2026.18.0.json).
Through the Supabase Management API (SUPABASE_ACCESS_TOKEN): the CLI's `db push` needs a direct
Postgres connection, which cloud sessions can't open; approved by the founder for this migration
on 2026-10-27, as for step 2. The migration is recorded in supabase_migrations.schema_migrations
like `db push` would.

Pole row per race: the row of the driver F1DB flags with race_pole_position. A driver with two
rows in one race (1950s shared cars) gets it on the car that started from grid 1. Before the
transaction ends it checks, and writes nothing if any check fails:
  - exactly one pole row in every race that has results;
  - every driver's poles equal F1DB's career total;
  - every constructor that is one F1DB entry, and the only one of ours mapped to it, matches
    F1DB's total (Ferrari 254, McLaren 180);
  - nothing else in driver_stats or constructor_stats changes.
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
MIGRATION = Path("supabase/migrations/20261027130000_results_pole_flag.sql")
PSQL = ["psql", "-h", "127.0.0.1", "-p", "54330", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-At"]


def lit(s: str) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def crosswalk_sql(path: Path) -> str:
    xw = json.loads(path.read_text())
    drv = [f"({lit(r)},{lit(v['f1db_id'])})" for r, v in xw["drivers"].items() if v.get("f1db_id")]
    races = [f"({k},{v['f1db_id']})" for k, v in xw["races"].items()]
    cons = []
    for key, ids in xw["constructor_seasons"].items():
        ref, year = key.rsplit(":", 1)
        cons += [f"({lit(ref)},{lit(i)})" for i in ids]
    return f"""
create temp table xw_driver(driver_ref text, f1db_id text) on commit drop;
create temp table xw_race(race_id int, f1db_id int) on commit drop;
create temp table xw_cons(constructor_ref text, f1db_id text) on commit drop;
insert into xw_driver values {",".join(drv)};
insert into xw_race values {",".join(races)};
insert into xw_cons select distinct * from (values {",".join(cons)}) v;
analyze xw_driver, xw_race, xw_cons;
"""


def body(migration: str) -> str:
    version, name = MIGRATION.stem.split("_", 1)
    return f"""
create temp table before_stats on commit drop as
select 'd' as k, driver_id as id, races, wins, podiums, fastest_laps, dnfs, total_points, championships from public.driver_stats
union all select 'c', constructor_id, races, wins, podiums, fastest_laps, 0, total_points, championships from public.constructor_stats;

{migration}

-- F1DB's pole sitter of each of our races, and the row of ours that gets the flag.
create temp table fp on commit drop as
select xr.race_id, dr.id as driver_id
from f1db.race_data d
join xw_race xr on xr.f1db_id = d.race_id
join xw_driver x on x.f1db_id = d.driver_id
join public.drivers dr on dr.driver_ref = x.driver_ref
where d.type = 'RACE_RESULT' and d.race_pole_position
group by 1, 2;
create temp table pr on commit drop as
select distinct on (r.race_id) r.id
from fp join public.results r on r.race_id = fp.race_id and r.driver_id = fp.driver_id
order by r.race_id, (r.grid = 1) desc, nullif(r.grid, 0) nulls last, r.id;
update public.results set pole = true where id in (select id from pr);

do $$
declare n int;
begin
  select count(*) into n from (select race_id from public.results where pole group by 1 having count(*) > 1) z;
  if n <> 0 then raise exception '% races with more than one pole row', n; end if;
  select count(*) into n from (select race_id from public.results group by 1 having not bool_or(pole)) z;
  if n <> 0 then raise exception '% races with results and no pole row', n; end if;

  select count(*) into n from public.driver_stats s join public.drivers d on d.id = s.driver_id
    join xw_driver x on x.driver_ref = d.driver_ref join f1db.driver f on f.id = x.f1db_id
    where s.poles <> f.total_pole_positions;
  if n <> 0 then raise exception '% drivers differ from the F1DB pole total', n; end if;

  select count(*) into n from public.constructor_stats s join public.constructors c on c.id = s.constructor_id
    join xw_cons x on x.constructor_ref = c.constructor_ref join f1db.constructor f on f.id = x.f1db_id
    where (select count(*) from xw_cons x2 where x2.constructor_ref = c.constructor_ref) = 1
      and (select count(*) from xw_cons x3 where x3.f1db_id = x.f1db_id) = 1
      and s.pole_positions <> f.total_pole_positions;
  if n <> 0 then raise exception '% one-to-one constructors differ from the F1DB pole total', n; end if;
  select count(*) into n from public.constructor_stats s join public.constructors c on c.id = s.constructor_id
    where (c.constructor_ref, s.pole_positions) in (('ferrari', 254), ('mclaren', 180));
  if n <> 2 then raise exception 'Ferrari/McLaren pole totals are not 254/180'; end if;

  select count(*) into n from (
    select 'd' as k, driver_id as id, races, wins, podiums, fastest_laps, dnfs, total_points, championships from public.driver_stats
    union all select 'c', constructor_id, races, wins, podiums, fastest_laps, 0, total_points, championships from public.constructor_stats
    except select * from before_stats) z;
  if n <> 0 then raise exception '% stats rows changed outside the pole columns', n; end if;
end $$;

insert into supabase_migrations.schema_migrations (version, name, statements)
values ({lit(version)}, {lit(name)}, array[$migration${migration}$migration$]);

select (select count(*) from public.results where pole) as pole_rows,
       (select pole_positions from public.constructor_stats s join public.constructors c on c.id = s.constructor_id where c.constructor_ref = 'ferrari') as ferrari,
       (select poles from public.driver_stats s join public.drivers d on d.id = s.driver_id where d.driver_ref = 'russell') as russell;
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
