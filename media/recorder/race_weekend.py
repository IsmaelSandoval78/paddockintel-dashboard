"""
Autopilot for a race weekend: reads the official calendar and records every session automatically.

    python race_weekend.py            # records all sessions of the next event, then exits
    python race_weekend.py --dry-run  # just prints what it would record and when

Meant to run on the home server as a service (see README.md). Starts each recording
LEAD_MIN minutes before the session and keeps it open for the session's typical length + margin.

Data (recordings, FastF1 cache) lives OUTSIDE the repo, under $PI_DATA_DIR
(default ~/PaddockIntel-Data). Recordings go to $PI_DATA_DIR/recordings.
"""
import argparse
import datetime as dt
import logging
import os
import re
import time
from pathlib import Path

import fastf1

from record_session import record

PI_DATA = Path(os.environ.get("PI_DATA_DIR", "~/PaddockIntel-Data")).expanduser()

LEAD_MIN = 10
LENGTH_MIN = {"Practice": 75, "Sprint Qualifying": 60, "Sprint Shootout": 60, "Qualifying": 75, "Sprint": 60, "Race": 150}
MARGIN_MIN = 30  # red flags, delays, post-session messages

log = logging.getLogger("weekend")


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def upcoming_sessions(now_utc: dt.datetime):
    sched = fastf1.get_event_schedule(now_utc.year, include_testing=False)
    for _, ev in sched.iterrows():
        sessions = []
        for k in range(1, 6):
            name, start = ev.get(f"Session{k}"), ev.get(f"Session{k}DateUtc")
            if not name or start is None or str(start) == "NaT":
                continue
            start = start.to_pydatetime().replace(tzinfo=dt.timezone.utc)
            kind = next((key for key in LENGTH_MIN if name.startswith(key)), "Race")
            end = start + dt.timedelta(minutes=LENGTH_MIN[kind] + MARGIN_MIN)
            if end > now_utc:
                sessions.append((start, end, name))
        if sessions:  # the next event that still has sessions ahead
            return ev["EventName"], sessions
    return None, []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--out", type=Path, default=PI_DATA / "recordings")
    ap.add_argument("--no-auth", action="store_true")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    cache = PI_DATA / "cache"
    cache.mkdir(parents=True, exist_ok=True)  # FastF1 needs the folder to exist
    fastf1.Cache.enable_cache(str(cache))

    now = dt.datetime.now(dt.timezone.utc)
    event, sessions = upcoming_sessions(now)
    if not event:
        log.info("No upcoming sessions found this season.")
        return
    year = now.year
    for start, end, name in sessions:
        log.info("%s · %s  start %s UTC", event, name, start.strftime("%a %d %b %H:%M"))
    if args.dry_run:
        return

    for start, end, name in sessions:
        begin = start - dt.timedelta(minutes=LEAD_MIN)
        wait = (begin - dt.datetime.now(dt.timezone.utc)).total_seconds()
        if wait > 0:
            log.info("Waiting %.1f h for %s", wait / 3600, name)
            time.sleep(wait)
        minutes = int((end - dt.datetime.now(dt.timezone.utc)).total_seconds() // 60)
        if minutes <= 0:
            continue
        record(f"{slug(event)}-{year}-{slug(name)}", minutes, args.out, args.no_auth, idle_timeout=45)


if __name__ == "__main__":
    main()
