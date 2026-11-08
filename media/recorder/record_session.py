"""
Record F1 live timing for one session with FastF1, reconnecting if the connection drops.

    python record_session.py --label "singapore-2026-sprint" --minutes 90

Writes $PI_DATA_DIR/recordings/<date>_<label>.txt (PI_DATA_DIR defaults to
~/PaddockIntel-Data). Start it a few minutes before the session.
Requires: pip install fastf1  (and, for full data, a one-time F1 TV login: see README.md)
"""
import argparse
import datetime as dt
import logging
import os
import time
from pathlib import Path

from fastf1.livetiming.client import SignalRClient

PI_DATA = Path(os.environ.get("PI_DATA_DIR", "~/PaddockIntel-Data")).expanduser()

log = logging.getLogger("recorder")


def record(label: str, minutes: int, out_dir: Path, no_auth: bool, idle_timeout: int) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{dt.date.today().isoformat()}_{label}.txt"
    end = dt.datetime.now() + dt.timedelta(minutes=minutes)
    first = True
    log.info("Recording to %s until %s", path, end.strftime("%H:%M"))

    # The client exits after `idle_timeout` seconds without data (before the session starts,
    # during long red flags, or if the connection drops). Until the recording window ends,
    # reconnect and keep appending to the same file so nothing is lost.
    while dt.datetime.now() < end:
        try:
            client = SignalRClient(str(path), filemode="w" if first else "a",
                                   timeout=idle_timeout, no_auth=no_auth)
            first = False
            client.start()  # blocks until the feed goes quiet or the connection closes
            log.info("Client stopped (no data for %ss or connection closed)", idle_timeout)
        except KeyboardInterrupt:
            log.info("Stopped by user")
            break
        except Exception as exc:  # network hiccups, auth refresh, server restarts
            log.warning("Connection error: %s", exc)
        if dt.datetime.now() < end:
            time.sleep(2)
            log.info("Reconnecting (appending to the same file)...")

    size = path.stat().st_size if path.exists() else 0
    log.info("Done. %s (%.1f MB)", path, size / 1e6)
    if size < 50_000:
        log.warning("Very small recording: the feed may have needed F1 TV auth, or the session had not started.")
    return path


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--label", required=True, help="e.g. singapore-2026-race")
    ap.add_argument("--minutes", type=int, default=150, help="recording window, from now")
    ap.add_argument("--out", type=Path, default=PI_DATA / "recordings")
    ap.add_argument("--no-auth", action="store_true", help="try without F1 TV (data may be partial)")
    ap.add_argument("--idle-timeout", type=int, default=45, help="seconds without data before reconnecting")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    record(args.label, args.minutes, args.out, args.no_auth, args.idle_timeout)


if __name__ == "__main__":
    main()
