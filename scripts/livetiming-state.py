#!/usr/bin/env python3
"""
Rebuilds the live timing state from scripts/livetiming-record.py's JSONL (snapshot + deltas) and
prints the classification, latest race control messages and weather. Car telemetry (CarData.z,
Position.z: base64 raw-deflate JSON) is decoded by decode_z() when the recording has it.

Usage:
  python3 scripts/livetiming-state.py FILE.jsonl [--rcm N]
"""
import base64, json, sys, zlib

def decode_z(s):
    return json.loads(zlib.decompress(base64.b64decode(s), -zlib.MAX_WBITS))
def merge(a, b):
    if isinstance(a, dict) and isinstance(b, dict):
        for k, v in b.items():
            a[k] = merge(a.get(k), v) if k in a else v
        return a
    if isinstance(a, list) and isinstance(b, dict):  # list patched by index
        for k, v in b.items():
            i = int(k)
            while len(a) <= i: a.append(None)
            a[i] = merge(a[i], v) if a[i] is not None else v
        return a
    return b
S = {}
for line in open(sys.argv[1]):
    m = json.loads(line)["m"]
    if m.get("type") == 3 and m.get("result"):
        S = {k: v for k, v in m["result"].items()}
    elif m.get("type") == 1 and m.get("target") == "feed":
        topic, data = m["arguments"][0], m["arguments"][1]
        S[topic] = merge(S.get(topic, {}), data) if topic in S else data
info = S.get("SessionInfo", {}); st = S.get("SessionStatus", {}); tr = S.get("TrackStatus", {})
print(f"{info.get('Name')} (key {info.get('Key')}) · status {st.get('Status')} · track {tr.get('Message')} · part {S.get('TimingData',{}).get('SessionPart')}")
dl = S.get("DriverList", {}); lines = S.get("TimingData", {}).get("Lines", {}); app = S.get("TimingAppData", {}).get("Lines", {})
rows = []
for num, L in lines.items():
    if not isinstance(L, dict): continue
    d = dl.get(num, {}); bl = L.get("BestLapTimes")
    bests = [x.get("Value", "") if isinstance(x, dict) else "" for x in (bl.values() if isinstance(bl, dict) else bl or [])] if bl else [L.get("BestLapTime", {}).get("Value", "")]
    stints = app.get(num, {}).get("Stints", {})
    stints = list(stints.values()) if isinstance(stints, dict) else stints or []
    tyre = stints[-1].get("Compound", "") if stints else ""
    gap = L.get("GapToLeader") or (L.get("Stats") or [{}])[-1].get("TimeDiffToFastest", "") if isinstance(L.get("Stats"), list) else L.get("TimeDiffToFastest", "")
    pos = int(L.get("Position") or 99)
    rows.append((pos, d.get("Tla", num), d.get("TeamName", ""), bests, tyre, L.get("NumberOfLaps", ""), "OUT" if L.get("KnockedOut") else "", "PIT" if L.get("InPit") else ""))
for r in sorted(rows):
    print(f"P{r[0]:<3}{r[1]:<4} {r[2][:16]:<17} " + "  ".join(f"{b:>9}" for b in r[3]) + f"  {r[4]:<7} laps {r[5]!s:<3} {r[6]} {r[7]}")
n = int(sys.argv[sys.argv.index("--rcm") + 1]) if "--rcm" in sys.argv else 5
msgs = S.get("RaceControlMessages", {}).get("Messages", [])
msgs = list(msgs.values()) if isinstance(msgs, dict) else msgs
print("\nRace control (latest):")
for x in msgs[-n:]: print(" ", x.get("Utc", "")[11:19], x.get("Message", ""))
cars = S.get("CarData.z")
print(f"\nTelemetry: {'CarData yes, ' + str(len(decode_z(cars).get('Entries', []))) + ' entries in latest packet' if isinstance(cars, str) else 'no CarData (needs the F1TV token)'}")
w = S.get("WeatherData", {}); print(f"\nWeather: air {w.get('AirTemp')}°C track {w.get('TrackTemp')}°C hum {w.get('Humidity')}% wind {w.get('WindSpeed')} m/s rain {w.get('Rainfall')}")
