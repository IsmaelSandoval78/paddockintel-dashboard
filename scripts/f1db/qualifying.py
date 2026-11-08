#!/usr/bin/env python3
"""
Fill the races our qualifying table has no rows for (every race before 1994 and 83 from 1994 to
2002, 631 in all) from F1DB's qualifying results, in one transaction.

  python3 scripts/f1db/qualifying.py --target prod
  python3 scripts/f1db/qualifying.py --target local   # rehearsal on the sandbox copy (port 54330)

Needs the F1DB staging schema (step 2) and the step 1 crosswalk (docs/f1db/crosswalk-v2026.18.0.json).
Approved by the founder on 2026-10-27. Through the Supabase Management API (SUPABASE_ACCESS_TOKEN).

Only inserts, into races with no qualifying rows at all; nothing existing is changed. The new ids
run from max(id) + 1, so the rollback is one delete of that range (printed at the end, and in
docs/f1db/QUALIFYING-FILL.md).

Each F1DB row becomes one of ours with the Ergast conventions the table already uses:
  - position: F1DB's classified position (empty for excluded or not-classified entries);
  - q1: the qualifying time (single-session eras keep it in q1, as Ergast does); sub-minute times
    (Dijon 1974) get a 0: prefix so every time reads as m:ss.fff;
  - constructor: the one this driver raced for in that race; for a non-starter, our constructor
    for F1DB's constructor and engine that season (Cooper + Maserati is cooper-maserati), and the
    row is left out when that is not exactly one of ours;
  - a driver we don't have (never started a race) is left out.
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
        cons += [f"({lit(ref)},{year},{lit(i)})" for i in ids]
    return f"""
create temp table xw_driver(driver_ref text, f1db_id text) on commit drop;
create temp table xw_race(race_id int, f1db_id int) on commit drop;
create temp table xw_cons_season(constructor_ref text, year int, f1db_id text) on commit drop;
insert into xw_driver values {",".join(drv)};
insert into xw_race values {",".join(races)};
insert into xw_cons_season values {",".join(cons)};
analyze xw_driver, xw_race, xw_cons_season;
"""


BODY = """
create temp table pace_before on commit drop as select * from public.driver_qualifying_pace where year >= 2003;
create temp table qmax on commit drop as select max(id) as mx, count(*) as n from public.qualifying;

-- Our races with results and no qualifying rows.
create temp table tr on commit drop as
select ra.id as race_id, ra.year, xr.f1db_id as frace
from public.races ra join xw_race xr on xr.race_id = ra.id
where exists (select 1 from public.results r where r.race_id = ra.id)
  and not exists (select 1 from public.qualifying q where q.race_id = ra.id);

create temp table src on commit drop as
select tr.race_id, tr.year, d.position_display_order, d.position_number, d.driver_number::int as number,
       d.constructor_id as fcons, d.engine_manufacturer_id as feng, d.qualifying_time,
       (select dr.id from xw_driver x join public.drivers dr on dr.driver_ref = x.driver_ref where x.f1db_id = d.driver_id) as driver_id
from tr join f1db.race_data d on d.race_id = tr.frace and d.type = 'QUALIFYING_RESULT';

create temp table m on commit drop as
select s.*, coalesce(
  -- the constructor this driver raced for in this race
  (select min(r.constructor_id) from public.results r where r.race_id = s.race_id and r.driver_id = s.driver_id
     having count(distinct r.constructor_id) = 1),
  -- else ours for F1DB's constructor that season, if there is one
  (select min(c.id) from xw_cons_season cs join public.constructors c on c.constructor_ref = cs.constructor_ref
     where cs.f1db_id = s.fcons and cs.year = s.year having count(distinct c.id) = 1),
  -- else the one whose name is F1DB's constructor and engine (cooper + maserati = cooper-maserati)
  (select min(c.id) from xw_cons_season cs join public.constructors c on c.constructor_ref = cs.constructor_ref
     where cs.f1db_id = s.fcons and cs.year = s.year
       and (replace(c.constructor_ref, '_', '-') = s.fcons || '-' || s.feng
            or (replace(c.constructor_ref, '_', '-') like s.fcons || '-%'
                and s.feng like substr(replace(c.constructor_ref, '_', '-'), length(s.fcons) + 2) || '%'))
     having count(distinct c.id) = 1),
  -- else the one named exactly as F1DB's constructor (kurtis_kraft for kurtis-kraft)
  (select min(c.id) from xw_cons_season cs join public.constructors c on c.constructor_ref = cs.constructor_ref
     where cs.f1db_id = s.fcons and cs.year = s.year and replace(c.constructor_ref, '_', '-') = s.fcons
     having count(distinct c.id) = 1)
  ) as constructor_id
from src s;

insert into public.qualifying (id, race_id, driver_id, constructor_id, number, position, q1, q2, q3)
select (select mx from qmax) + row_number() over (order by race_id, position_display_order),
       race_id, driver_id, constructor_id, number, position_number,
       case when qualifying_time ~ '^[0-9]+\\.[0-9]+$' then '0:' || qualifying_time else qualifying_time end,
       null, null
from m where driver_id is not null and constructor_id is not null;

do $$
declare n int;
begin
  select count(*) into n from tr where not exists (select 1 from public.qualifying q where q.race_id = tr.race_id);
  if n <> 0 then raise exception '% target races still have no qualifying rows', n; end if;
  select count(*) into n from (select race_id, driver_id from public.qualifying group by 1, 2 having count(*) > 1) z;
  if n <> 0 then raise exception '% duplicate (race, driver) qualifying rows', n; end if;
  select count(*) into n from public.qualifying where id > (select mx from qmax) and q1 is not null and q1 !~ '^[0-9]+:[0-9]{2}\\.[0-9]+$';
  if n <> 0 then raise exception '% inserted times not in m:ss.fff', n; end if;
  select count(*) into n from public.qualifying where id <= (select mx from qmax);
  if n <> (select qmax.n from qmax) then raise exception 'existing qualifying rows changed'; end if;
  select count(*) into n from (select * from public.driver_qualifying_pace where year >= 2003 except select * from pace_before) z;
  if n <> 0 then raise exception 'driver_qualifying_pace changed for 2003 on'; end if;
end $$;

select (select count(*) from tr) as races,
       (select count(*) from m) as f1db_rows,
       (select count(*) from public.qualifying where id > (select mx from qmax)) as inserted,
       (select count(*) from m where driver_id is null) as skipped_no_driver,
       (select count(*) from m where driver_id is not null and constructor_id is null) as skipped_no_constructor,
       (select mx + 1 from qmax) as first_id,
       (select max(id) from public.qualifying) as last_id;
"""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", choices=["local", "prod"], required=True)
    ap.add_argument("--crosswalk", type=Path, default=Path("docs/f1db/crosswalk-v2026.18.0.json"))
    args = ap.parse_args()
    q = crosswalk_sql(args.crosswalk) + BODY
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
