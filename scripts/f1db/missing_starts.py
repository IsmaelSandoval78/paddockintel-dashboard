#!/usr/bin/env python3
"""
Insert the race starts F1DB has and our results table doesn't (2026-10-27, founder-approved): the
Formula 2 cars that ran inside the 1966, 1967 and 1969 German GPs, plus four single entries
(Gerard 1953 British GP, Taruffi 1956 French GP, Galli 1971 Dutch GP, Regazzoni 1977 German GP).

  python3 scripts/f1db/missing_starts.py --target local --dry-run   # rehearse, roll back
  python3 scripts/f1db/missing_starts.py --target prod

Needs the F1DB staging schema (step 2) and the step 1 crosswalk (docs/f1db/crosswalk-v2026.18.0.json).
Through the Supabase Management API, in one transaction.

Each row keeps F1DB's values: classified position (F2 cars were classified overall, and our F1
rows already leave those positions empty), laps, grid, number, retirement reason. Points are 0:
F2 cars could not score. The constructor is one of ours, never a new one:
  1. the one our results use that season for the same F1DB constructor and engine (90% of rows);
  2. else the one named exactly after F1DB's constructor and engine (brabham-ford);
  3. else the row is left out (Hahne's 1966 Matra-BRM, Cevert's 1969 Tecno-Ford: our "matra" and
     "tecno" are the works cars with their own engines).
In the races that get a row, each inserted car goes right after the last of our rows that F1DB
classifies ahead of it, and position_order is renumbered; our rows keep their relative order. The previous position_order values and the new ids
are printed for the rollback (docs/f1db/MISSING-STARTS.md).
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from qualifying import crosswalk_sql  # noqa: E402

PROJECT_REF = "ozcmecoaofolbrzhlhum"
PSQL = ["psql", "-h", "127.0.0.1", "-p", "54330", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-q", "-At"]

BODY = """
create temp table before_stats on commit drop as
select driver_id, wins, podiums, poles, total_points, championships from public.driver_stats;
create temp table rmax on commit drop as select max(id) as mx from public.results;

-- F1DB starts with no row of ours for that (race, driver).
create temp table ms on commit drop as
select ra.id as race_id, ra.year, dr.id as driver_id, d.position_display_order, d.position_number, d.position_text,
       d.driver_number, d.constructor_id, d.engine_manufacturer_id, d.race_grid_position_number, d.race_laps,
       d.race_time_millis, d.race_gap, d.race_gap_laps, d.race_reason_retired
from f1db.race_data d
join xw_race xr on xr.f1db_id = d.race_id
join public.races ra on ra.id = xr.race_id
join xw_driver x on x.f1db_id = d.driver_id
join public.drivers dr on dr.driver_ref = x.driver_ref
where d.type = 'RACE_RESULT' and coalesce(d.position_text, '') not in ('DNS', 'DNQ', 'DNPQ', 'EX', 'DNP')
  and not exists (select 1 from public.results r where r.race_id = ra.id and r.driver_id = dr.id);

-- Which of our constructors each F1DB constructor + engine maps to, per season, from paired rows.
create temp table ev on commit drop as
select ra.year, d.constructor_id as fcons, d.engine_manufacturer_id as feng, r.constructor_id, count(*) as n
from public.results r join public.races ra on ra.id = r.race_id
join public.drivers dr on dr.id = r.driver_id join xw_driver x on x.driver_ref = dr.driver_ref
join xw_race xr on xr.race_id = r.race_id
join f1db.race_data d on d.race_id = xr.f1db_id and d.type = 'RACE_RESULT' and d.driver_id = x.f1db_id
group by 1, 2, 3, 4;

create temp table mc on commit drop as
select ms.*, coalesce(
  (select e.constructor_id from ev e where e.year = ms.year and e.fcons = ms.constructor_id and e.feng = ms.engine_manufacturer_id
     and e.n >= 0.9 * (select sum(e2.n) from ev e2 where e2.year = e.year and e2.fcons = e.fcons and e2.feng = e.feng)),
  (select min(c.id) from public.constructors c
     where replace(c.constructor_ref, '_', '-') = ms.constructor_id || '-' || ms.engine_manufacturer_id
     having count(*) = 1)
  ) as our_constructor
from ms;

create temp table st on commit drop as select id, status from public.status;
create temp table ins on commit drop as
select (select mx from rmax) + row_number() over (order by mc.race_id, mc.position_display_order) as id,
       mc.race_id, mc.driver_id, mc.our_constructor as constructor_id, mc.driver_number::int as number,
       coalesce(mc.race_grid_position_number, 0) as grid, mc.position_number as position,
       coalesce(mc.position_number::text, case when mc.position_text = 'DNF' then 'R' when mc.position_text = 'NC' then 'N' else mc.position_text end) as position_text,
       mc.position_display_order as position_order, 0::numeric as points, coalesce(mc.race_laps, 0) as laps,
       case when mc.position_number is not null and coalesce(mc.race_gap_laps, 0) = 0 then mc.race_gap end as time,
       mc.race_time_millis as milliseconds,
       (select st.id from st where st.status = case
          when mc.position_number is not null and coalesce(mc.race_gap_laps, 0) = 0 then 'Finished'
          when mc.position_number is not null and mc.race_gap_laps = 1 then '+1 Lap'
          when mc.position_number is not null then '+' || mc.race_gap_laps || ' Laps'
          else mc.race_reason_retired end) as status_id
from mc where mc.our_constructor is not null;

-- Where the inserted cars finished. Our rows keep their relative order; each inserted car goes
-- right after the last of our rows that F1DB classifies ahead of it, and the race is renumbered.
create temp table pair on commit drop as
select r.id, r.race_id, r.position_order, d.position_display_order as f1db_order
from public.results r
join public.drivers dr on dr.id = r.driver_id join xw_driver x on x.driver_ref = dr.driver_ref
join xw_race xr on xr.race_id = r.race_id
join f1db.race_data d on d.race_id = xr.f1db_id and d.type = 'RACE_RESULT' and d.driver_id = x.f1db_id
where r.race_id in (select race_id from ins)
  -- a shared drive (Moss and Schell, 1956 French GP) is two rows on both sides: pair them by position
  and ((select count(*) from public.results r2 where r2.race_id = r.race_id and r2.driver_id = r.driver_id) = 1
       or r.position is not distinct from d.position_number);
create temp table po on commit drop as
with keyed as (
  select r.id, r.race_id, r.position_order as old_order, r.position_order::numeric as k
  from public.results r where r.race_id in (select race_id from ins)
  union all
  select i.id, i.race_id, null, coalesce((select max(p.position_order) from pair p
           where p.race_id = i.race_id and p.f1db_order < i.position_order), 0) + 0.5 + i.position_order / 10000.0
  from ins i)
select id, race_id, old_order, row_number() over (partition by race_id order by k) as new_order from keyed;

do $$
declare n int;
begin
  select count(*) into n from ins where status_id is null;
  if n <> 0 then raise exception '% rows with no matching status', n; end if;
  select count(*) into n from (select id from pair group by 1 having count(*) > 1) z;
  if n <> 0 then raise exception '% rows paired twice', n; end if;
  -- our rows keep their relative order
  select count(*) into n from po a join po b on a.race_id = b.race_id and a.old_order < b.old_order and a.new_order > b.new_order;
  if n <> 0 then raise exception 'existing rows reordered (% pairs)', n; end if;
  select count(*) into n from ins i join public.results r on r.race_id = i.race_id and r.position = i.position;
  if n <> 0 then raise exception '% inserted positions already taken', n; end if;
end $$;

update public.results r set position_order = po.new_order from po where r.id = po.id;
update ins set position_order = po.new_order from po where ins.id = po.id;
insert into public.results (id, race_id, driver_id, constructor_id, number, grid, position, position_text, position_order,
                            points, laps, time, milliseconds, fastest_lap, rank, fastest_lap_time, fastest_lap_speed, status_id, pole)
select id, race_id, driver_id, constructor_id, number, grid, position, position_text, position_order,
       points, laps, time, milliseconds, null, null, null, null, status_id, false
from ins;

do $$
declare n int;
begin
  select count(*) into n from (select race_id, position_order from public.results where race_id in (select race_id from ins)
    group by 1, 2 having count(*) > 1) z;
  if n <> 0 then raise exception '% duplicate position_order values', n; end if;
  select count(*) into n from (select * from public.driver_stats s join before_stats b using (driver_id)
    where (s.wins, s.podiums, s.poles, s.total_points, s.championships) is distinct from (b.wins, b.podiums, b.poles, b.total_points, b.championships)) z;
  if n <> 0 then raise exception '% drivers changed wins, podiums, poles, points or titles', n; end if;
end $$;

select json_build_object(
  'missing', (select count(*) from ms),
  'inserted', (select count(*) from ins),
  'left_out', (select json_agg(json_build_object('year', year, 'driver', driver_id, 'car', constructor_id || '-' || engine_manufacturer_id)) from mc where our_constructor is null),
  'ids', (select json_build_array(min(id), max(id)) from ins),
  'position_order_changed', (select json_agg(json_build_array(id, old_order)) from po where old_order is not null and old_order <> new_order)
) as result;
"""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", choices=["local", "prod"], required=True)
    ap.add_argument("--crosswalk", type=Path, default=Path("docs/f1db/crosswalk-v2026.18.0.json"))
    ap.add_argument("--dry-run", action="store_true", help="local only: run everything, then roll back")
    args = ap.parse_args()
    q = crosswalk_sql(args.crosswalk) + BODY
    if args.target == "local":
        if args.dry_run:
            q = "begin;" + q.replace(" on commit drop", "") + "rollback;"
        r = subprocess.run(PSQL + ["-c", q], capture_output=True, text=True)
        if r.returncode:
            sys.exit(r.stderr[:3000])
        print([l for l in r.stdout.strip().splitlines() if l.startswith("{")][-1])
        return
    if args.dry_run:
        sys.exit("--dry-run is local only")
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
