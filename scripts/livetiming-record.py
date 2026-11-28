#!/usr/bin/env python3
"""
Live timing recorder: saves F1's live timing feed (livetiming.formula1.com, SignalR Core over
Server-Sent Events) to a JSONL file, one line per message with the time it arrived. Reconnects on
drops; every reconnect writes a fresh snapshot, so the file can be replayed from any point with
scripts/livetiming-state.py.

Anonymous access gets timing, tyres, race control, weather, pit lane and team radio links. Car
telemetry (CarData.z) and track position (Position.z) need an F1TV subscription token, set as the
F1TV_TOKEN environment variable in the environment's settings (never in this repo). A network
secret alone (header only) was not enough on 2026-11-28: the server did not return telemetry.

Stdlib only. Read-only. The feed belongs to F1: publish figures derived from it, never the raw feed
(LEGAL-COMPLIANCE-EXPERT.md).

Usage:
  python3 scripts/livetiming-record.py OUT.jsonl                       # until stopped
  python3 scripts/livetiming-record.py OUT.jsonl --until 2026-11-29T18:30:00Z
"""
import base64, json, os, sys, threading, time, urllib.parse, urllib.request, http.cookiejar
from datetime import datetime, timezone
RS = "\x1e"; B = "https://livetiming.formula1.com/signalrcore"
TOPICS = ["Heartbeat","CarData.z","Position.z","ExtrapolatedClock","TopThree","TimingStats","TimingAppData",
          "WeatherData","TrackStatus","SessionStatus","DriverList","RaceControlMessages","SessionInfo",
          "SessionData","LapCount","TimingData","TeamRadio","PitLaneTimeCollection","ChampionshipPrediction",
          "TyreStintSeries","PitStopSeries","PitStop","DriverRaceInfo","OvertakeSeries","LapSeries"]
out = open(sys.argv[1], "a", buffering=1)
# Optional: the F1TV subscriptionToken in the F1TV_TOKEN environment variable. Sent as a Bearer
# header and as the access_token query parameter (browser SignalR clients send it in the URL).
# Never printed; only its expiry and claim names are logged, to diagnose a rejected token.
TOKEN = os.environ.get("F1TV_TOKEN", "").strip().removeprefix("Bearer ").strip()
if TOKEN:
    try:
        pad = TOKEN.split(".")[1]; claims = json.loads(base64.urlsafe_b64decode(pad + "=" * (-len(pad) % 4)))
        exp = claims.get("exp")
        print("token: exp", datetime.fromtimestamp(exp, timezone.utc).isoformat() if exp else None,
              "| claim names:", sorted(claims), "| SubscriptionStatus:", claims.get("SubscriptionStatus") or claims.get("subscriptionStatus"), flush=True)
    except Exception as e:
        print("token: not a readable JWT", type(e).__name__, flush=True)
UNTIL = datetime.fromisoformat(sys.argv[sys.argv.index("--until") + 1].replace("Z", "+00:00")) if "--until" in sys.argv else None
def now(): return datetime.now(timezone.utc).isoformat()
def run_once():
    cj = http.cookiejar.CookieJar(); op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    auth = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}
    neg = json.load(op.open(urllib.request.Request(B + "/negotiate?negotiateVersion=1", method="POST", headers=auth), timeout=20))
    url = f"{B}?id={neg['connectionToken']}" + (f"&access_token={urllib.parse.quote(TOKEN)}" if TOKEN else "")
    def post(body):
        op.open(urllib.request.Request(url, data=body.encode(), method="POST", headers={"Content-Type": "text/plain", **auth}), timeout=20)
    resp = op.open(urllib.request.Request(url, headers={"Accept": "text/event-stream", **auth}), timeout=90)
    def subscribe():
        time.sleep(1.5)
        post(json.dumps({"protocol": "json", "version": 1}) + RS)
        post(json.dumps({"type": 1, "target": "Subscribe", "arguments": [TOPICS], "invocationId": "1"}) + RS)
    threading.Thread(target=subscribe, daemon=True).start()
    print(now(), "connected", flush=True)
    for line in resp:
        line = line.decode("utf-8", errors="replace").rstrip("\r\n")
        if not line.startswith("data:"): continue
        for part in line[5:].strip().split(RS):
            if not part or part == "{}": continue
            try: msg = json.loads(part)
            except ValueError: msg = {"raw": part}
            if msg.get("type") == 6: continue  # ping
            if msg.get("type") == 7: print(now(), "server close", part[:200], flush=True); return
            out.write(json.dumps({"t": now(), "m": msg}, ensure_ascii=False) + "\n")
            if UNTIL and datetime.now(timezone.utc) >= UNTIL: sys.exit(0)
while not UNTIL or datetime.now(timezone.utc) < UNTIL:
    try: run_once()
    except Exception as e: print(now(), "error", repr(e)[:200], flush=True)
    time.sleep(3)
