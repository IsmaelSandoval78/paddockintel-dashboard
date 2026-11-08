# Copy the race tables the Hub views read (public.*) and the F1DB staging tables the candidate
# needs (f1db.*) from production into the local sandbox Postgres, read-only on production.
import csv, io, json, subprocess, sys
sys.path.insert(0, "scripts/f1db/step4")
from mq import sql
PSQL = ["psql", "-h", "127.0.0.1", "-p", "54330", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-q"]
TABLES = [("public", t) for t in ["constructor_results", "constructor_standings", "constructors", "pit_stops", "qualifying",
                                   "races", "results", "driver_standings", "drivers", "status", "sprint_results", "circuits"]]
TABLES += [("f1db", t) for t in ["race", "race_data", "race_driver_standing", "race_constructor_standing"]]

def psql(cmd, stdin=None):
    r = subprocess.run(PSQL + ["-c", cmd] if stdin is None else PSQL + ["-c", cmd], input=stdin, capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr)

psql("create schema if not exists f1db;")
for schema, t in TABLES:
    cols = sql(f"select column_name, format_type(a.atttypid, a.atttypmod) as typ from information_schema.columns c "
               f"join pg_attribute a on a.attname=c.column_name and a.attrelid='{schema}.{t}'::regclass "
               f"where table_schema='{schema}' and table_name='{t}' order by ordinal_position")
    names = [c["column_name"] for c in cols]
    psql(f'drop table if exists {schema}."{t}" cascade; create table {schema}."{t}" (' + ", ".join(f'"{c["column_name"]}" {c["typ"]}' for c in cols) + ");")
    where = " where type in ('RACE_RESULT','QUALIFYING_RESULT','SPRINT_RACE_RESULT','PIT_STOP','FASTEST_LAP')" if t == "race_data" else ""
    total = sql(f"select count(*) as n from {schema}.\"{t}\"{where}")[0]["n"]
    page, off, buf = 20000, 0, io.StringIO()
    w = csv.writer(buf)
    while off < total:
        rows = sql(f'select * from {schema}."{t}"{where} order by 1,2 limit {page} offset {off}')
        for r in rows:
            w.writerow([("\\N" if r[c] is None else (json.dumps(r[c]) if isinstance(r[c], (dict, list)) else ("t" if r[c] is True else "f" if r[c] is False else r[c]))) for c in names])
        off += page
    r = subprocess.run(PSQL + ["-c", f"\\copy {schema}.\"{t}\" from stdin with (format csv, null '\\N')"], input=buf.getvalue(), capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"{t}: {r.stderr[:500]}")
    got = subprocess.run(PSQL + ["-Atc", f'select count(*) from {schema}."{t}"'], capture_output=True, text=True).stdout.strip()
    print(f"{schema}.{t}: {got}/{total}", flush=True)
