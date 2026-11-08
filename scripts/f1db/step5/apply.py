#!/usr/bin/env python3
"""
F1DB migration, step 5 (docs/PLAN-2026-10-26-f1db-migration.md): apply the five changes the
founder approved after step 4 (docs/f1db/STEP4-PUBLISHED-FIGURES.md) to the race tables.

  # 1. Back up the four tables it writes (full rows, read-only on production):
  python3 scripts/f1db/step5/apply.py backup --out <dir>

  # 2. Rehearse on the local sandbox copy (scripts/f1db/step4/copy_prod.py), then on production:
  python3 scripts/f1db/step5/apply.py apply --target local
  python3 scripts/f1db/step5/apply.py apply --target prod

  # 3. Write the rollback: every row that changed, with its values from the backup:
  python3 scripts/f1db/step5/apply.py rollback --backup <dir> --out docs/f1db/step5-rollback.sql.gz

  # (print the SQL `apply` runs)
  python3 scripts/f1db/step5/apply.py sql

The SQL is the step 4 candidate (scripts/f1db/step4/candidate.py) plus two things it left out:
  - results.time follows results.milliseconds where F1DB's race time replaces ours;
  - constructor_results: in every season where our sum differs from F1DB's final constructors'
    standings (one-to-one constructor mapping; Force India 2018 excluded, see step 4), each race's
    points become what that race added to F1DB's official cumulative standings, so the season sums
    to the official total.
It only updates rows (ids, keys and row counts are kept), runs as one transaction, and checks
the approved figures before it ends: if any check fails, nothing is written.
"""

import argparse
import gzip
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "step4"))
from mq import sql as prod_sql  # noqa: E402

CROSSWALK = Path("docs/f1db/crosswalk-v2026.18.0.json")
PSQL = ["psql", "-h", "127.0.0.1", "-p", "54330", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-q"]
TABLES = ["results", "driver_standings", "constructor_standings", "constructor_results"]
PAGE = 20000


def lit(s: str) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def crosswalk_sql() -> str:
    xw = json.loads(CROSSWALK.read_text())
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
-- The production default (2 min) is per statement; the whole run takes longer on a cold cache.
set local statement_timeout = '10min';

-- Figures the changes must not move, to compare at the end.
create temp table before_stats on commit drop as
select 'd' as k, driver_id as id, wins, podiums, championships from public.driver_stats
union all select 'c', constructor_id, wins, podiums, championships from public.constructor_stats;

-- Paired race results: one row per (race, driver) on both sides.
create temp table p on commit drop as
select r.id as rid, d.*
from public.results r
join public.drivers dr on dr.id = r.driver_id
join xw_driver x on x.driver_ref = dr.driver_ref
join xw_race xr on xr.race_id = r.race_id
join f1db.race_data d on d.race_id = xr.f1db_id and d.type = 'RACE_RESULT' and d.driver_id = x.f1db_id
where (r.race_id, r.driver_id) in (select race_id, driver_id from public.results group by 1, 2 having count(*) = 1)
  and (d.race_id, d.driver_id) in (select race_id, driver_id from f1db.race_data where type = 'RACE_RESULT' group by 1, 2 having count(*) = 1);
-- Temp tables get no statistics on their own; without them the update below plans a nested loop.
analyze p;

update public.results r set
  position = p.position_number,
  position_text = case when p.position_text ~ '^[0-9]+$' then p.position_text
                       else case p.position_text when 'DNF' then 'R' when 'DSQ' then 'D' when 'DNS' then 'W'
                            when 'DNQ' then 'F' when 'DNPQ' then 'F' when 'NC' then 'N' when 'EX' then 'E' else r.position_text end end,
  points = coalesce(p.race_points, 0),
  laps = coalesce(p.race_laps, r.laps),
  grid = case when p.race_grid_position_text = 'PL' then 0 else coalesce(p.race_grid_position_number, r.grid) end,
  milliseconds = coalesce(p.race_time_millis, r.milliseconds),
  -- The text time follows the milliseconds: the winner's race time, everyone else's gap.
  time = case when p.race_time_millis is not null and p.race_time_millis is distinct from r.milliseconds
              then case when p.position_number = 1 then p.race_time else coalesce(p.race_gap, r.time) end
              else r.time end,
  rank = case when p.race_fastest_lap then 1 when r.rank = 1 then null else r.rank end
from p where r.id = p.rid;

-- Driver standings: F1DB points; F1DB position only where it isn't a shared (tied) position.
update public.driver_standings s set
  points = f.points,
  position = case when (f.race_id, f.position_number) in (select race_id, position_number from f1db.race_driver_standing group by 1, 2 having count(*) = 1)
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
create temp table cm on commit drop as
select s.id as sid, f.race_id as frace, f.position_display_order as fpos, f.points, f.position_number,
       coalesce(t.n, 0) as tied
from public.constructor_standings s
join public.constructors c on c.id = s.constructor_id
join public.races ra on ra.id = s.race_id
join xw_race xr on xr.race_id = s.race_id
join xw_cons_season cs on cs.constructor_ref = c.constructor_ref and cs.year = ra.year
join f1db.race_constructor_standing f on f.race_id = xr.f1db_id and f.constructor_id = cs.f1db_id
left join (select race_id, position_number, count(*) as n from f1db.race_constructor_standing group by 1, 2) t
  on t.race_id = f.race_id and t.position_number = f.position_number;
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

-- Constructor results: seasons (1958 on) whose sum differs from F1DB's final standings, where one
-- of ours is exactly one F1DB entry. Force India 2018 is two F1DB entries in one of ours (step 4).
create temp table crs on commit drop as
with ours as (
  select cr.constructor_id, c.constructor_ref, ra.year, sum(cr.points) as pts
  from public.constructor_results cr join public.races ra on ra.id = cr.race_id join public.constructors c on c.id = cr.constructor_id
  where ra.year >= 1958 group by 1, 2, 3),
lastrace as (
  select distinct on (ra.year) ra.year, xr.f1db_id as frace
  from public.races ra join xw_race xr on xr.race_id = ra.id
  where exists (select 1 from f1db.race_constructor_standing f where f.race_id = xr.f1db_id)
  order by ra.year, ra.round desc),
f1 as (
  select cs.constructor_ref, lr.year, f.constructor_id as fcons, f.points,
         count(*) over (partition by lr.year, f.position_display_order) as shared,
         count(*) over (partition by lr.year, cs.constructor_ref) as multi
  from lastrace lr join f1db.race_constructor_standing f on f.race_id = lr.frace
  join xw_cons_season cs on cs.f1db_id = f.constructor_id and cs.year = lr.year)
select o.constructor_id, o.constructor_ref, o.year, o.pts as ours, f1.points as official, f1.fcons
from ours o join f1 on f1.constructor_ref = o.constructor_ref and f1.year = o.year and f1.shared = 1 and f1.multi = 1
where f1.points <> o.pts and not (o.constructor_ref = 'force_india' and o.year = 2018);

-- Each race's points: what it added to F1DB's cumulative standings (dropped scores, the best-placed
-- car rule and penalties land on the race where the official table applied them).
create temp table crd on commit drop as
select crs.constructor_id, crs.year, ra.id as race_id,
       cum.c - coalesce(lag(cum.c) over (partition by crs.constructor_id, crs.year order by ra.round), 0) as delta
from crs
join public.races ra on ra.year = crs.year
join xw_race xr on xr.race_id = ra.id
cross join lateral (select coalesce(sum(f.points), 0) as c from f1db.race_constructor_standing f
                    where f.race_id = xr.f1db_id and f.constructor_id = crs.fcons) cum;
update public.constructor_results cr set points = crd.delta
from crd where cr.race_id = crd.race_id and cr.constructor_id = crd.constructor_id;

-- Checks: the approved figures, and nothing else moved. Any failure rolls the whole thing back.
do $$
declare n int; v numeric;
begin
  select count(*), sum(ours - official) into n, v from crs;
  if n <> 32 or v <> 425 then raise exception 'constructor seasons: % seasons, % points (expected 32, 425)', n, v; end if;
  select count(*) into n from crd left join public.constructor_results cr on cr.race_id = crd.race_id and cr.constructor_id = crd.constructor_id
    where crd.delta <> 0 and cr.id is null;
  if n <> 0 then raise exception '% races with official points but no constructor_results row', n; end if;
  select count(*) into n from crs where official <> (select sum(cr.points) from public.constructor_results cr
    join public.races ra on ra.id = cr.race_id where cr.constructor_id = crs.constructor_id and ra.year = crs.year);
  if n <> 0 then raise exception '% constructor seasons do not sum to the official total', n; end if;

  select total_points into v from public.constructor_stats s join public.constructors c on c.id = s.constructor_id where c.constructor_ref = 'mclaren';
  if v <> 8007.5 then raise exception 'McLaren total points %', v; end if;
  select total_points into v from public.constructor_stats s join public.constructors c on c.id = s.constructor_id where c.constructor_ref = 'ferrari';
  if v <> 11149 then raise exception 'Ferrari total points %', v; end if;
  select fastest_laps into n from public.driver_stats s join public.drivers d on d.id = s.driver_id where d.driver_ref = 'michael_schumacher';
  if n <> 77 then raise exception 'Schumacher fastest laps %', n; end if;
  select poles into n from public.driver_stats s join public.drivers d on d.id = s.driver_id where d.driver_ref = 'piastri';
  if n <> 6 then raise exception 'Piastri poles %', n; end if;
  select poles into n from public.driver_stats s join public.drivers d on d.id = s.driver_id where d.driver_ref = 'moss';
  if n <> 16 then raise exception 'Moss poles %', n; end if;
  select total_points into v from public.driver_stats s join public.drivers d on d.id = s.driver_id where d.driver_ref = 'moss';
  if v <> 186.64 then raise exception 'Moss points %', v; end if;
  select total_points into v from public.driver_stats s join public.drivers d on d.id = s.driver_id where d.driver_ref = 'behra';
  if v <> 51.14 then raise exception 'Behra points %', v; end if;

  select count(*) into n from (
    select 'd' as k, driver_id as id, wins, podiums, championships from public.driver_stats
    union all select 'c', constructor_id, wins, podiums, championships from public.constructor_stats
    except select * from before_stats) x;
  if n <> 0 then raise exception '% drivers/constructors changed wins, podiums or titles', n; end if;
end $$;

select (select count(*) from crs) as constructor_seasons,
       (select count(*) from crd where delta < 0) as negative_race_rows,
       (select total_points from public.constructor_stats s join public.constructors c on c.id = s.constructor_id where c.constructor_ref = 'mclaren') as mclaren_points;
"""


def full_sql() -> str:
    return crosswalk_sql() + BODY


def run(target: str, q: str) -> list:
    if target == "prod":
        return prod_sql(q)
    r = subprocess.run(PSQL + ["-At", "-c", f"select coalesce(json_agg(x), '[]') from ({q}) x"], capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[:3000])
    return json.loads(r.stdout)


def fetch_table(target: str, t: str) -> list[dict]:
    total = run(target, f"select count(*) as n from public.{t}")[0]["n"]
    rows: list[dict] = []
    for off in range(0, int(total), PAGE):
        rows += run(target, f"select * from public.{t} order by id limit {PAGE} offset {off}")
    if len(rows) != int(total) or len({r["id"] for r in rows}) != len(rows):
        sys.exit(f"{t}: read {len(rows)} rows of {total}")
    return rows


def cmd_backup(args) -> None:
    args.out.mkdir(parents=True, exist_ok=True)
    for t in TABLES:
        rows = fetch_table(args.target, t)
        with gzip.open(args.out / f"{t}.json.gz", "wt", encoding="utf-8") as fh:
            json.dump(rows, fh, default=str)
        print(f"{t}: {len(rows)} rows", flush=True)


def cmd_apply(args) -> None:
    q = full_sql()
    if args.target == "prod":
        print(json.dumps(prod_sql(q), indent=1))
    else:
        r = subprocess.run(PSQL + ["-c", q], capture_output=True, text=True)
        if r.returncode:
            sys.exit(r.stderr[:3000])
        print(r.stdout)


def norm(v):
    if v is None:
        return None
    try:
        f = float(v)
        return int(f) if f == int(f) else round(f, 6)
    except (TypeError, ValueError):
        return str(v)


def cmd_rollback(args) -> None:
    parts, summary = [], {}
    for t in TABLES:
        with gzip.open(args.backup / f"{t}.json.gz", "rt", encoding="utf-8") as fh:
            before = {r["id"]: r for r in json.load(fh)}
        after = {r["id"]: r for r in fetch_table(args.target, t)}
        if before.keys() != after.keys():
            sys.exit(f"{t}: row ids differ between the backup and now")
        changed = [before[i] for i in sorted(before) if any(norm(before[i][c]) != norm(after[i][c]) for c in before[i])]
        cols = [c for c in (changed[0] if changed else {}) if c != "id"]
        summary[t] = {"rows": len(changed), "by_column": {c: sum(1 for r in changed if norm(r[c]) != norm(after[r["id"]][c])) for c in cols}}
        if changed:
            parts.append(f"update public.{t} t set ({', '.join(cols)}) = ({', '.join('b.' + c for c in cols)})\n"
                         f"from json_populate_recordset(null::public.{t}, $json${json.dumps(changed, default=str)}$json$) b\n"
                         f"where t.id = b.id;")
    header = ("-- Rollback for F1DB migration step 5: puts back every row it changed, with the values from the\n"
              "-- backup taken just before (scripts/f1db/step5/apply.py rollback). One transaction.\n")
    with gzip.open(args.out, "wt", encoding="utf-8") as fh:
        fh.write(header + "\n\n".join(parts) + "\n")
    print(json.dumps(summary, indent=1))


def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("backup")
    b.add_argument("--out", required=True, type=Path)
    b.add_argument("--target", choices=["local", "prod"], default="prod")
    a = sub.add_parser("apply")
    a.add_argument("--target", choices=["local", "prod"], required=True)
    r = sub.add_parser("rollback")
    r.add_argument("--backup", required=True, type=Path)
    r.add_argument("--out", required=True, type=Path)
    r.add_argument("--target", choices=["local", "prod"], default="prod")
    sub.add_parser("sql")
    args = ap.parse_args()
    if args.cmd == "sql":
        print(full_sql())
        return
    {"backup": cmd_backup, "apply": cmd_apply, "rollback": cmd_rollback}[args.cmd](args)


if __name__ == "__main__":
    main()
