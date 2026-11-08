# PaddockIntel recorder — live timing on the OptiPlex

Records F1 live timing during each session, then turns the recording into the JSON our
templates use. Tested against FastF1 3.8 (new `signalrcore` feed). The live
connection itself must be tested on a real session: do a dry run in a Free Practice first.

All data (recordings, exports, FastF1 cache) is written OUTSIDE the repo, under
`$PI_DATA_DIR` (default `~/PaddockIntel-Data`). Tokens stay in the home folder
(`~/.f1tv_token`, `~/.local/share/fastf1/f1auth.json`) — never in the repo.

## 1. Install (once)
```bash
cd media/recorder
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## 2. F1 TV login (once, and again if it expires)
Without it the feed may be empty or partial. FastF1 opens a login page that sends the token
back to a small local server on the same machine, so on a headless server use one of these:

**A. Log in on your PC and copy the token (simplest)**
```bash
# on your PC (with a browser)
pip install fastf1
python -m fastf1 auth f1tv --authenticate
python -c "import platformdirs; print(platformdirs.user_data_dir('fastf1'))"   # folder with f1auth.json
# copy that f1auth.json to the OptiPlex, into:  ~/.local/share/fastf1/f1auth.json
```
**B. Log in through SSH:** run `python -m fastf1 auth f1tv --authenticate` on the OptiPlex, note the
port in the URL it prints, then from your PC `ssh -L PORT:127.0.0.1:PORT you@optiplex` and open the URL.

Check: `.venv/bin/python -m fastf1 auth f1tv --status`

## 3. Record
One session, by hand (start a few minutes before):
```bash
.venv/bin/python record_session.py --label singapore-2026-race --minutes 150
```
Whole weekend, automatically (reads the official calendar):
```bash
.venv/bin/python race_weekend.py --dry-run   # shows what it will record and when
.venv/bin/python race_weekend.py             # waits and records every session
```
Recordings go to `$PI_DATA_DIR/recordings/`. If the connection drops it reconnects and keeps
appending to the same file. A file under ~50 KB at the end usually means the login is missing.

## 4. Leave it running (systemd)
Edit `CHANGE_ME` in `paddock-recorder.service`, then:
```bash
sudo cp paddock-recorder.service paddock-recorder.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now paddock-recorder.timer   # starts every Monday for the next event
sudo systemctl start paddock-recorder.service        # start now for this weekend
journalctl -u paddock-recorder -f                     # watch the log
```

## 5. Recording -> template data -> video
See `docs/MEDIA-PIPELINE.md` (repo root) for the full weekend flow. In short:
- 3D template: `media/pipeline/decode_recording.py` + `build_session.py` → `media/3d/data/session.json` (see `media/pipeline/README.md`)

**`legacy/recording_to_json.py`** is not part of any current flow: it fed the old
`paddock-remotion` project (which no longer exists on this machine) and imports
`parse_results.py` from it, so it cannot run as-is. Kept for reference only — if
Remotion templates come back, either restore that project or port `TEAM_COLORS`/`SHORT`
into the script.

Codes: `R` race, `S` sprint, `Q` qualifying, `SQ` sprint qualifying.

The F1 timing feed is unofficial and belongs to Formula 1: fine for personal analysis and editorial
use, but check F1's terms before building paid products on it.
