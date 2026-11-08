# Build the F1DB candidate in the local sandbox copy (never production), with the step 3 rule:
# take F1DB's official values for paired rows, keep our conventions (zero-point standings rows,
# sequential numbering of ties, non-starter rows, constructor identity).
import json, subprocess, sys
XW = json.load(open("docs/f1db/crosswalk-v2026.18.0.json"))
PSQL = ["psql", "-h", "127.0.0.1", "-p", "54330", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-q"]
def run(q):
    r = subprocess.run(PSQL + ["-c", q], capture_output=True, text=True)
    if r.returncode: sys.exit(r.stderr[:2000])
    return r.stdout

drv = {r: v["f1db_id"] for r, v in XW["drivers"].items() if v.get("f1db_id")}
run("drop table if exists xw_driver, xw_race, xw_cons_season; create table xw_driver(driver_ref text, f1db_id text); create table xw_race(race_id int, f1db_id int); create table xw_cons_season(constructor_ref text, year int, f1db_id text);")
vals = ",".join(f"('{k}','{v}')" for k, v in drv.items())
run(f"insert into xw_driver values {vals};")
run("insert into xw_race values " + ",".join(f"({k},{v['f1db_id']})" for k, v in XW["races"].items()) + ";")
rows = []
for key, ids in XW["constructor_seasons"].items():
    ref, year = key.rsplit(":", 1)
    rows += [f"('{ref}',{year},'{i}')" for i in ids]
run("insert into xw_cons_season values " + ",".join(rows) + ";")

run("""
-- Paired race results: one row per (race, driver) on both sides.
create temp table p as
select r.id as rid, d.*
from public.results r
join public.drivers dr on dr.id = r.driver_id
join xw_driver x on x.driver_ref = dr.driver_ref
join xw_race xr on xr.race_id = r.race_id
join f1db.race_data d on d.race_id = xr.f1db_id and d.type = 'RACE_RESULT' and d.driver_id = x.f1db_id
where (select count(*) from public.results r2 where r2.race_id = r.race_id and r2.driver_id = r.driver_id) = 1
  and (select count(*) from f1db.race_data d2 where d2.race_id = d.race_id and d2.type = 'RACE_RESULT' and d2.driver_id = d.driver_id) = 1;

update public.results r set
  position = p.position_number,
  position_text = case when p.position_text ~ '^[0-9]+$' then p.position_text
                       else case p.position_text when 'DNF' then 'R' when 'DSQ' then 'D' when 'DNS' then 'W'
                            when 'DNQ' then 'F' when 'DNPQ' then 'F' when 'NC' then 'N' when 'EX' then 'E' else r.position_text end end,
  points = coalesce(p.race_points, 0),
  laps = coalesce(p.race_laps, r.laps),
  grid = case when p.race_grid_position_text = 'PL' then 0 else coalesce(p.race_grid_position_number, r.grid) end,
  milliseconds = coalesce(p.race_time_millis, r.milliseconds),
  rank = case when p.race_fastest_lap then 1 when r.rank = 1 then null else r.rank end
from p where r.id = p.rid;

-- Driver standings: F1DB points; F1DB position only where it isn't a shared (tied) position.
update public.driver_standings s set
  points = f.points,
  position = case when (select count(*) from f1db.race_driver_standing f2 where f2.race_id = f.race_id and f2.position_number = f.position_number) = 1
                  then f.position_number else s.position end
from public.drivers dr, xw_driver x, xw_race xr, f1db.race_driver_standing f
where dr.id = s.driver_id and x.driver_ref = dr.driver_ref and xr.race_id = s.race_id
  and f.race_id = xr.f1db_id and f.driver_id = x.f1db_id;
-- Scorers F1DB excludes from a championship it tracks (Schumacher 1997): no position.
update public.driver_standings s set position = null
from public.drivers dr, xw_driver x, xw_race xr
where dr.id = s.driver_id and x.driver_ref = dr.driver_ref and xr.race_id = s.race_id and s.points > 0
  and exists (select 1 from f1db.race_driver_standing f where f.race_id = xr.f1db_id)
  and not exists (select 1 from f1db.race_driver_standing f where f.race_id = xr.f1db_id and f.driver_id = x.f1db_id);

-- Constructor standings: matched through the per-season constructor map; skipped where one of
-- ours is two F1DB entries (e.g. Brabham-BMW and Brabham-Ford in 1982).
create temp table cm as
select s.id as sid, f.race_id as frace, f.position_display_order as fpos, f.points, f.position_number,
       (select count(*) from f1db.race_constructor_standing f2 where f2.race_id = f.race_id and f2.position_number = f.position_number) as tied
from public.constructor_standings s
join public.constructors c on c.id = s.constructor_id
join public.races ra on ra.id = s.race_id
join xw_race xr on xr.race_id = s.race_id
join xw_cons_season cs on cs.constructor_ref = c.constructor_ref and cs.year = ra.year
join f1db.race_constructor_standing f on f.race_id = xr.f1db_id and f.constructor_id = cs.f1db_id;
delete from cm where sid in (select sid from cm group by sid having count(*) > 1);
-- ...and where several of ours map onto the same F1DB entry (Cooper-Climax, Cooper-Maserati, ... -> cooper).
delete from cm where (frace, fpos) in (select frace, fpos from cm group by frace, fpos having count(*) > 1);
update public.constructor_standings s set points = cm.points,
  position = case when cm.tied = 1 then cm.position_number else s.position end
from cm where s.id = cm.sid;
-- Teams F1DB excludes (McLaren 2007): no position, no points.
update public.constructor_standings s set position = null, points = 0
from public.constructors c, public.races ra, xw_race xr
where c.id = s.constructor_id and ra.id = s.race_id and xr.race_id = s.race_id and s.points > 0
  and s.id not in (select sid from cm)
  and exists (select 1 from f1db.race_constructor_standing f where f.race_id = xr.f1db_id)
  and not exists (select 1 from f1db.race_constructor_standing f join xw_cons_season cs on cs.f1db_id = f.constructor_id
                  where f.race_id = xr.f1db_id and cs.constructor_ref = c.constructor_ref and cs.year = ra.year);
""")
print(run("select (select count(*) from public.results) as results;"))
