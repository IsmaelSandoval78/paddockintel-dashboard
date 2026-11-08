"""Decode a FastF1 live-timing recording (.txt) into export-style CSVs.
Usage: python3 decode_recording.py <recording.txt> <out_dir>"""
import ast, json, base64, zlib, re, sys, os, shutil
from datetime import datetime
import numpy as np, pandas as pd

rec, out = sys.argv[1], sys.argv[2]
def ts(s): return datetime.fromisoformat(s.replace('Z', '')[:26]).timestamp()
def lt(s):
    if not s: return None
    m = re.match(r'(?:(\d+):)?(\d+\.\d+)', str(s)); return (int(m.group(1) or 0) * 60 + float(m.group(2))) if m else None
def merge(a, b):
    for k, v in b.items():
        if isinstance(a.get(k), list): a[k] = {str(i): x for i, x in enumerate(a[k])}
        if isinstance(v, list) and isinstance(a.get(k), dict): v = {str(i): x for i, x in enumerate(v)}
        if isinstance(v, dict) and isinstance(a.get(k), dict): merge(a[k], v)
        else: a[k] = v

drivers, timing, app, laps, cur, car, pos, rcm, wx, tstat = {}, {}, {}, [], {}, [], [], [], [], []
t_first = None
with open(rec, errors='ignore') as f:
    for line in f:
        try: t, p, stamp = ast.literal_eval(line.strip())
        except Exception: continue
        if stamp and t_first is None: t_first = ts(stamp)
        if isinstance(p, str) and not t.endswith('.z'):
            try: p = json.loads(p)
            except Exception: continue
        if t == 'DriverList':
            for n, v in p.items():
                if isinstance(v, dict): drivers.setdefault(n, {}).update(v)
        elif t == 'TimingAppData': merge(app, p)
        elif t == 'TimingData':
            merge(timing, p)
            for n, v in (p.get('Lines') or {}).items():
                if not isinstance(v, dict): continue
                c = cur.setdefault(n, {'sec': {}, 'pin': False, 'pout': False, 'nl': 0})
                if v.get('InPit') is True and not c.get('inpit'): c['pin'] = True
                if 'InPit' in v: c['inpit'] = bool(v.get('InPit'))
                if v.get('PitOut') is True: c['pout'] = True
                if isinstance(v.get('Sectors'), dict):
                    for i, sv in v['Sectors'].items():
                        if isinstance(sv, dict) and sv.get('Value'): c['sec'][int(i)] = lt(sv['Value'])
                ll = v.get('LastLapTime'); has_time = isinstance(ll, dict) and bool(ll.get('Value'))
                new_lap = None
                if 'NumberOfLaps' in v and int(v['NumberOfLaps']) > c['nl']: new_lap = int(v['NumberOfLaps'])
                if (has_time or new_lap) and stamp:
                    line_ = timing.get('Lines', {}).get(n, {})
                    iv = line_.get('IntervalToPositionAhead'); iv = iv.get('Value') if isinstance(iv, dict) else iv
                    lapno = new_lap or c['nl'] + 1
                    laps.append(dict(n=n, lapno=lapno, lap=lt(ll['Value']) if has_time else None, end=ts(stamp), sec=dict(c['sec']), pos=line_.get('Position'),
                                     pin=c['pin'], pout=c['pout'], gap=line_.get('GapToLeader'), interval=iv))
                    c['nl'] = lapno; c['sec'] = {}; c['pin'] = False; c['pout'] = False
        elif t == 'CarData.z':
            for e in json.loads(zlib.decompress(base64.b64decode(p), -zlib.MAX_WBITS))['Entries']: car.append((ts(e['Utc']), e['Cars']))
        elif t == 'Position.z':
            for e in json.loads(zlib.decompress(base64.b64decode(p), -zlib.MAX_WBITS))['Position']: pos.append((ts(e['Timestamp']), e['Entries']))
        elif t == 'RaceControlMessages':
            m = p.get('Messages'); items = m.values() if isinstance(m, dict) else (m or [])
            for x in items:
                if isinstance(x, dict) and x.get('Message'): rcm.append(dict(Time=x.get('Utc'), Category=x.get('Category'), Message=x['Message']))
        elif t == 'TrackStatus' and isinstance(p, dict) and stamp:
            tstat.append(dict(Time=ts(stamp), Status=str(p.get('Status')), Message=p.get('Message')))
        elif t == 'WeatherData' and isinstance(p, dict):
            wx.append({k: (float(v) if re.match(r'^-?\d+(\.\d+)?$', str(v)) else v) for k, v in p.items() if k != '_kf'})

os.makedirs(out, exist_ok=True)
tla = {n: v.get('Tla') for n, v in drivers.items()}
dels = set()
for m in rcm:
    g = re.search(r'CAR (\d+) \((\w+)\) TIME ([\d:.]+) DELETED', m['Message'])
    if g: dels.add((g.group(1), round(lt(g.group(3)), 3)))
rows, seen = [], set()
for L in laps:
    if (L['n'], L['lapno']) in seen: continue
    seen.add((L['n'], L['lapno'])); end = L['end'] - t_first
    rows.append(dict(Driver=tla.get(L['n']), DriverNumber=L['n'], LapNumber=L['lapno'], LapTime=L['lap'], Time=round(end, 3),
                     LapStartTime=round(end - L['lap'], 3) if L['lap'] else None, Sector1Time=L['sec'].get(0), Sector2Time=L['sec'].get(1), Sector3Time=L['sec'].get(2),
                     Position=L['pos'], GapToLeader=L['gap'], IntervalToPositionAhead=L['interval'], Deleted=(L['n'], round(L['lap'] or 0, 3)) in dels,
                     TrackStatus='1', Team=drivers.get(L['n'], {}).get('TeamName'),
                     PitInTime=round(end, 3) if L['pin'] else None, PitOutTime=round(end - (L['lap'] or 0), 3) if L['pout'] else None))
lapdf = pd.DataFrame(rows).sort_values(['DriverNumber', 'LapNumber'])
lapdf['LapStartTime'] = lapdf['LapStartTime'].fillna(lapdf.groupby('DriverNumber')['Time'].shift(1))
lapdf['Stint'] = None; lapdf['Compound'] = None; lapdf['TyreLife'] = None
for n in lapdf.DriverNumber.unique():
    st = app.get('Lines', {}).get(n, {}).get('Stints', {}) if isinstance(app.get('Lines'), dict) else {}
    seq = [st[k] for k in sorted(st, key=lambda z: int(z))] if isinstance(st, dict) else list(st or [])
    lap0 = 1; m = lapdf.DriverNumber == n
    for i, x in enumerate(seq):
        if not isinstance(x, dict): continue
        nl = int(x.get('TotalLaps', 0) or 0) - int(x.get('StartLaps', 0) or 0)
        if nl <= 0: continue
        sel = m & (lapdf.LapNumber >= lap0) & (lapdf.LapNumber < lap0 + nl)
        lapdf.loc[sel, 'Stint'] = i + 1; lapdf.loc[sel, 'Compound'] = x.get('Compound')
        lapdf.loc[sel, 'TyreLife'] = (lapdf.loc[sel, 'LapNumber'] - lap0 + 1 + int(x.get('StartLaps', 0) or 0)).values
        lap0 += nl
ts_df = pd.DataFrame(tstat)
if len(ts_df):
    ts_df['Time'] = ts_df['Time'] - t_first; ts_df = ts_df.sort_values('Time'); ts_df.to_csv(f'{out}/track_status.csv', index=False)
    tt, ss = ts_df['Time'].values, ts_df['Status'].values
    def lap_status(a, b):
        if pd.isna(a) or pd.isna(b): return '1'
        k0 = max(0, np.searchsorted(tt, a, side='right') - 1); codes = {ss[k0]}
        for k in range(k0 + 1, len(tt)):
            if tt[k] > b: break
            codes.add(ss[k])
        return ''.join(sorted(codes))
    lapdf['TrackStatus'] = [lap_status(a, b) for a, b in zip(lapdf.LapStartTime, lapdf.Time)]
lapdf.to_csv(f'{out}/laps.csv', index=False)
res = []
for n, v in timing.get('Lines', {}).items():
    if not isinstance(v, dict): continue
    bl = v.get('BestLapTimes') if isinstance(v.get('BestLapTimes'), dict) else {}
    d = drivers.get(n, {}); ap = app.get('Lines', {}).get(n, {}) if isinstance(app.get('Lines'), dict) else {}
    gap = v.get('GapToLeader'); retired = bool(v.get('Retired')) or bool(v.get('Stopped'))
    res.append(dict(DriverNumber=n, Abbreviation=d.get('Tla'), FullName=d.get('FullName'), TeamName=d.get('TeamName'), TeamColor=d.get('TeamColour'),
                    Position=int(v['Position']) if str(v.get('Position', '')).isdigit() else None,
                    GridPosition=int(ap['GridPos']) if str(ap.get('GridPos', '')).isdigit() else None,
                    Q1=lt((bl.get('0') or {}).get('Value')), Q2=lt((bl.get('1') or {}).get('Value')), Q3=lt((bl.get('2') or {}).get('Value')),
                    BestLapTime=lt((v.get('BestLapTime') or {}).get('Value')) if isinstance(v.get('BestLapTime'), dict) else None,
                    Time=lt(str(gap).lstrip('+')) if gap and str(gap).startswith('+') else None,
                    Status='Retired' if retired else ('Finished' if ap.get('GridPos') else ''), NumberOfLaps=v.get('NumberOfLaps')))
rdf = pd.DataFrame(res).sort_values('Position')
if (rdf.Status == 'Finished').any():
    pts = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}
    rdf['Points'] = [pts.get(int(p), 0) if pd.notna(p) and s != 'Retired' else 0 for p, s in zip(rdf.Position, rdf.Status)]
rdf.to_csv(f'{out}/results.csv', index=False)
pd.DataFrame(rcm).to_csv(f'{out}/race_control.csv', index=False)
pd.DataFrame(wx).to_csv(f'{out}/weather.csv', index=False)
# fastest-lap telemetry per driver (car data + position), lap window anchored on the official lap time
pt = np.array([q[0] for q in pos]); ct = np.array([c[0] for c in car])
ok = lapdf[(~lapdf.Deleted) & lapdf.LapTime.notna()]
tel = []
for n in ok.DriverNumber.unique():
    # The lap that set the driver's classification time (Q3 for the top ten), not
    # simply the fastest of the day: in changing weather an earlier part can be faster.
    g = ok[ok.DriverNumber == n]; cls = rdf.loc[rdf.DriverNumber.astype(str) == str(n), 'BestLapTime']
    m = g[(g.LapTime - cls.iloc[0]).abs() < 0.0015] if len(cls) and pd.notna(cls.iloc[0]) else g.iloc[:0]
    b = (m if len(m) else g).sort_values('LapTime').iloc[0]; te = b.Time + t_first; t0 = te - b.LapTime
    ci = [i for i in np.where((ct >= t0) & (ct <= te))[0] if n in car[i][1]]
    if len(ci) < 20: continue
    T = ct[ci]; ch = [car[i][1][n]['Channels'] for i in ci]; V = np.array([c.get('2', 0) for c in ch], float)
    Dd = np.concatenate([[0], np.cumsum(np.diff(T) * (V[1:] + V[:-1]) / 2 / 3.6)])
    idx = np.where((pt >= t0 - 1) & (pt <= te + 1))[0]
    P = np.array([[pt[i], pos[i][1][n]['X'], pos[i][1][n]['Y'], pos[i][1][n]['Z']] for i in idx if n in pos[i][1]])
    X, Y, Z = (np.interp(T, P[:, 0], P[:, k]) for k in (1, 2, 3)) if len(P) > 3 else (np.zeros(len(T)),) * 3
    tel.append(pd.DataFrame(dict(Driver=tla.get(n), LapNumber=int(b.LapNumber), Distance=Dd.round(2), Speed=V, Throttle=[c.get('4', 0) for c in ch],
                                 Brake=[c.get('5', 0) > 0 for c in ch], nGear=[c.get('3', 0) for c in ch], RPM=[c.get('0', 0) for c in ch],
                                 DRS=[c.get('45', 0) for c in ch], X=np.round(X, 1), Y=np.round(Y, 1), Z=np.round(Z, 1))))
pd.concat(tel).to_csv(f'{out}/fastest_lap_telemetry.csv', index=False)
shutil.make_archive(out, 'zip', out)
print('drivers', len(res), '| laps', len(lapdf), '| deleted', int(lapdf.Deleted.sum()), '| telemetry drivers', len(tel), '| race control', len(rcm))
