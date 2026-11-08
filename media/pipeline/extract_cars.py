"""
Turns a raw F1 live-timing recording into data/cars.json: how far round the
race every car is, once per second, from the start to the chequered flag.

    python3 scripts/extract_cars.py <recording.txt> [data/cars.json]

It also writes data/telemetry.json next to it: speed, gear, throttle and
brake of the drivers in TELEMETRY, four times a second.

The feed snaps every car onto one centre line, so there is no usable
sideways position; only progress round the lap is kept.

Progress is in laps: 12.5 means half-way round lap 13. The integer part
follows the official lap count (so the extra formation lap after the red
flag does not count); the fraction comes from the car's real X/Y position,
measured along one clean reference lap from the timing line.
"""
import ast
import base64
import bisect
import json
import math
import re
import sys
import zlib
from datetime import datetime

SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else 'data/cars.json'
HZ = 1  # samples per second in the output
TELEMETRY = ['VER']  # drivers whose car telemetry is kept
TEL_HZ = 4


def ts(s):
    return datetime.fromisoformat(s.rstrip('Z')[:26]).timestamp()


def load(p):
    if isinstance(p, str):
        p = json.loads(p)
    return p


def inflate(p):
    if isinstance(p, str) and p.startswith('"'):
        p = json.loads(p)
    return json.loads(zlib.decompress(base64.b64decode(p), -zlib.MAX_WBITS))


drivers = {}
pos = {}        # num -> list of (t, x, y)
lapdone = {}    # num -> list of (t, laps completed)
retired = {}    # num -> t
status = []     # (t, track status code)
stints = {}     # num -> {index: stint fields}
start_t = flag_t = None
rc = {}         # (utc, text) -> race-control message, deduplicated
tel = {}        # num -> list of (t, speed, gear, throttle, brake)
weather = []    # (t, air, track, humidity, pressure, wind speed, wind dir, rain)

for line in open(SRC):
    topic = line[2:line.find("'", 2)]
    if topic not in ('DriverList', 'Position.z', 'TimingData', 'RaceControlMessages',
                     'TrackStatus', 'TimingAppData', 'CarData.z', 'WeatherData'):
        continue
    try:
        _, payload, stamp = ast.literal_eval(line)
    except Exception:
        continue
    if topic == 'Position.z':
        for frame in inflate(payload)['Position']:
            t = ts(frame['Timestamp'])
            for num, e in frame['Entries'].items():
                pos.setdefault(num, []).append((t, e['X'], e['Y']))
        continue
    if topic == 'CarData.z':
        for frame in inflate(payload)['Entries']:
            t = ts(frame['Utc'])
            for num, c in frame['Cars'].items():
                ch = c.get('Channels', {})
                tel.setdefault(num, []).append(
                    (t, ch.get('2', 0), ch.get('3', 0), ch.get('4', 0), ch.get('5', 0)))
        continue
    d = load(payload)
    if topic == 'TimingAppData':
        for num, v in (d.get('Lines') or {}).items():
            s = v.get('Stints') if isinstance(v, dict) else None
            if s is None:
                continue
            items = enumerate(s) if isinstance(s, list) else s.items()
            for k, x in items:
                stints.setdefault(num, {}).setdefault(int(k), {}).update(x)
        continue
    if topic == 'WeatherData':
        if stamp:
            weather.append((ts(stamp), float(d['AirTemp']), float(d['TrackTemp']),
                            float(d['Humidity']), float(d['Pressure']),
                            float(d['WindSpeed']), int(float(d['WindDirection'])),
                            int(float(d['Rainfall']))))
        continue
    if topic == 'TrackStatus':
        if stamp:
            status.append((ts(stamp), int(d['Status'])))
        continue
    if topic == 'DriverList':
        for num, v in d.items():
            if isinstance(v, dict):
                drivers.setdefault(num, {}).update(
                    {k: v[k] for k in ('Tla', 'TeamName', 'TeamColour') if k in v})
    elif topic == 'TimingData':
        if not stamp:  # snapshot sent on connect, no time attached
            continue
        for num, v in (d.get('Lines') or {}).items():
            if not isinstance(v, dict):
                continue
            if 'NumberOfLaps' in v:
                lapdone.setdefault(num, []).append((ts(stamp), v['NumberOfLaps']))
            if v.get('Retired') or v.get('Stopped'):
                retired.setdefault(num, ts(stamp))
    elif topic == 'RaceControlMessages':
        msgs = d.get('Messages')
        msgs = msgs.values() if isinstance(msgs, dict) else (msgs or [])
        for m in msgs:
            if m.get('Utc') and m.get('Message'):
                rc[(m['Utc'], m['Message'])] = m
            if m.get('Message') == 'RACE START' and start_t is None:
                start_t = ts(m['Utc'] + 'Z')
            if m.get('Flag') == 'CHEQUERED':
                flag_t = ts(m['Utc'] + 'Z')

# The race winner: first to complete the final lap.
final = max(n for v in lapdone.values() for _, n in v)
leader = min((t, num) for num, v in lapdone.items() for t, n in v if n == final)[1]


def xy_at(num, t):
    s = pos[num]
    i = bisect.bisect_left(s, (t,))
    a, b = s[max(0, i - 1)], s[min(len(s) - 1, i)]
    if b[0] == a[0]:
        return a[1], a[2]
    f = (t - a[0]) / (b[0] - a[0])
    return a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f


# Reference lap: the leader's lap 15, which ran under green.
l15 = dict((n, t) for t, n in lapdone[leader])
t0, t1 = l15[14], l15[15]
ref = [xy_at(leader, t0)] + [(x, y) for t, x, y in pos[leader] if t0 < t < t1] + [xy_at(leader, t1)]
cum = [0.0]
for (ax, ay), (bx, by) in zip(ref, ref[1:]):
    cum.append(cum[-1] + math.hypot(bx - ax, by - ay))
LAP = cum[-1]


def frac(x, y, hint=None):
    """0-1 distance along the reference lap of the point nearest (x, y)."""
    best, bestd, side = 0.0, 1e18, 1
    n = len(ref) - 1
    rng = range(n) if hint is None else [(hint + k) % n for k in range(-12, 40)]
    for i in rng:
        (ax, ay), (bx, by) = ref[i], ref[i + 1]
        dx, dy = bx - ax, by - ay
        L2 = dx * dx + dy * dy or 1
        u = max(0, min(1, ((x - ax) * dx + (y - ay) * dy) / L2))
        px, py = ax + dx * u, ay + dy * u
        d = (x - px) ** 2 + (y - py) ** 2
        if d < bestd:
            bestd, best = d, i + u
            side = 1 if dx * (y - ay) - dy * (x - ax) > 0 else -1
    i = int(best)
    f = (cum[i] + (cum[min(i + 1, n)] - cum[i]) * (best - i)) / LAP
    return f, i, bestd, side * math.sqrt(bestd)


def tyre_stints(num):
    """[[compound, first lap, last lap, fresh?], ...]; TotalLaps is the tyre's
    age at the end of the stint, StartLaps its age when fitted."""
    out, lap = [], 1
    for _, x in sorted(stints.get(num, {}).items()):
        n = int(x.get('TotalLaps', 0)) - int(x.get('StartLaps', 0))
        if n <= 0:
            continue
        out.append([x.get('Compound', 'UNKNOWN'), lap, lap + n - 1, x.get('New') == 'true'])
        lap += n
    return out


T0 = start_t - 2
T1 = flag_t + 30
times = [T0 + k / HZ for k in range(int((T1 - T0) * HZ) + 1)]

out = {}
for num, info in drivers.items():
    if num not in pos or num not in lapdone:
        continue
    # 1. unwrap the fraction into continuous laps travelled
    raw, hint, last, turns = [], None, None, 0
    for t in times:
        x, y = xy_at(num, t)
        f, i, d, off = frac(x, y, hint)
        if d > 40000:  # lost the line (pit garage); search the whole lap again
            f, i, d, off = frac(x, y)
        hint = i
        if last is not None:
            if f - last < -0.5:
                turns += 1
            elif f - last > 0.5:
                turns -= 1
        last = f
        raw.append(turns + f)
    # 2. pin the integer part to the official lap count: when the timing says
    #    lap N is done, progress is N exactly.
    offsets = []
    for t, n in lapdone[num]:
        if T0 <= t <= T1:
            k = min(len(times) - 1, max(0, round((t - T0) * HZ)))
            offsets.append((t, round(n - raw[k])))
    first = offsets[0][1] if offsets else 0
    prog = []
    j = 0
    for k, t in enumerate(times):
        while j < len(offsets) and offsets[j][0] <= t:
            j += 1
        off = offsets[j - 1][1] if j else first
        v = raw[k] + off
        # Cars never drive backwards; dips are the pit lane projecting badly.
        if prog and v < prog[-1]:
            v = prog[-1]
        # A retired car stays where it stopped, even if it is craned away.
        if num in retired and t > retired[num]:
            v = prog[-1]
        prog.append(round(v, 4))
    out[info['Tla']] = {
        'number': num,
        'team': info.get('TeamName', ''),
        'colour': '#' + info.get('TeamColour', '888888'),
        'retired_at': round(retired[num] - T0, 1) if num in retired else None,
        'progress': prog,
        'tyres': tyre_stints(num),
    }

# Race time (seconds after the first sample) at which the leader completed
# each lap, lap 0 being the start signal.
first_done = {}
for v in lapdone.values():
    for t, n in v:
        if T0 <= t <= T1:
            first_done[n] = min(first_done.get(n, t), t)
lap_times = [round(start_t - T0, 2)] + [round(first_done[n] - T0, 2) for n in range(1, final + 1)]

# Track status: 1 green, 2 yellow (local), 4 safety car, 5 red flag,
# 6 virtual safety car, 7 VSC ending. The feed briefly reports "all clear"
# while the cars sit in the pit lane under the red flag; keep it red until
# the safety car leads them out again.
flags, red = [], False
for t, code in status:
    if code == 5:
        red = True
    elif red and code not in (4, 6):
        continue
    else:
        red = False
    if not flags or flags[-1][1] != code:
        flags.append([round(max(t - T0, 0), 1), code])


# Stewards' decisions: time penalties (and when they were served) plus
# incidents reviewed with no further action. The clock time in brackets at
# the end of each message identifies the incident it belongs to.
CAR = r'CAR \d+ \((\w+)\)'
INC = r'\((\d\d:\d\d:\d\d)\)$'
stewards, by_incident = [], {}
for (utc, text), m in sorted(rc.items()):
    t = round(ts(utc + 'Z') - T0, 1)
    if not (0 <= t <= T1 - T0):
        continue
    inc = re.search(INC, text)
    inc = inc.group(1) if inc else None
    served = re.search(r'PENALTY SERVED - (\d+) SECOND TIME PENALTY FOR ' + CAR, text)
    pen = re.search(r'FIA STEWARDS: (\d+) SECOND TIME PENALTY FOR ' + CAR + r'(?: - (.+?))? \(', text)
    if served:
        e = by_incident.get((served.group(2), inc))
        if e:
            e['served'] = t
    elif pen:
        e = {'t': t, 'lap': m.get('Lap'), 'kind': 'penalty', 'cars': [pen.group(2)],
             'seconds': int(pen.group(1)), 'reason': pen.group(3) or '', 'served': None}
        stewards.append(e)
        by_incident[(pen.group(2), inc)] = e
    elif 'NO FURTHER' in text and text.startswith('FIA STEWARDS'):
        reason = text.split(' - ', 1)[1] if ' - ' in text else ''
        reason = re.sub(r'\s*' + INC, '', reason)
        turn = re.search(r'TURN (\d+)', text)
        stewards.append({'t': t, 'lap': m.get('Lap'), 'kind': 'clear',
                         'cars': re.findall(r'\d+ \((\w+)\)', text.split(' - ')[0]),
                         'reason': reason or ('TURN %s INCIDENT' % turn.group(1) if turn else 'INCIDENT')})

# Weather station, about once a minute: the last reading before the start
# is pinned to t=0 so there is always a value.
wx = []
for w in sorted(weather):
    t = round(w[0] - T0, 1)
    if t > T1 - T0:
        break
    if w[1] <= 0 or w[2] <= 0:  # sensor dropout
        continue
    row = [max(t, 0)] + list(w[1:])
    if t <= 0 and wx:
        wx[0] = row
    else:
        wx.append(row)

json.dump({
    'note': 'Progress of every car in laps, sampled %d per second from 2 s before the start. '
            'Generated by scripts/extract_cars.py from the live-timing recording.' % HZ,
    'hz': HZ,
    'lap_length_m': round(LAP / 10, 1),
    'leader_lap_times': lap_times,
    'track_status': flags,
    'stewards': stewards,
    'weather': {'fields': ['t', 'air', 'track', 'humidity', 'pressure', 'wind', 'wind_dir', 'rain'],
                'rows': wx},
    'cars': out,
}, open(OUT, 'w'), separators=(',', ':'))
print('wrote', OUT, len(out), 'cars,', len(times), 'samples, lap length', round(LAP), 'units,',
      len(lap_times) - 1, 'laps')

# Car telemetry, resampled onto the same clock as cars.json.
tel_out = {}
for num, info in drivers.items():
    if info.get('Tla') not in TELEMETRY or num not in tel:
        continue
    s = sorted(tel[num])
    cols = {'speed': [], 'gear': [], 'throttle': [], 'brake': []}
    j = 0
    for k in range(int((T1 - T0) * TEL_HZ) + 1):
        t = T0 + k / TEL_HZ
        while j + 1 < len(s) and s[j + 1][0] <= t:
            j += 1
        a, b = s[j], s[min(j + 1, len(s) - 1)]
        f = 0 if b[0] == a[0] else max(0, min(1, (t - a[0]) / (b[0] - a[0])))
        cols['speed'].append(round(a[1] + (b[1] - a[1]) * f))
        cols['throttle'].append(round(a[3] + (b[3] - a[3]) * f))
        near = a if f < 0.5 else b
        cols['gear'].append(near[2])
        cols['brake'].append(1 if near[4] else 0)
    tel_out[info['Tla']] = cols
TEL_PATH = OUT.rsplit('/', 1)[0] + '/telemetry.json' if '/' in OUT else 'telemetry.json'
json.dump({'note': 'Car telemetry sampled %d per second on the cars.json clock. '
                   'Generated by scripts/extract_cars.py.' % TEL_HZ,
           'hz': TEL_HZ, 'cars': tel_out}, open(TEL_PATH, 'w'), separators=(',', ':'))
print('wrote', TEL_PATH, list(tel_out))
