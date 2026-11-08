"""Turn decoded qualifying CSVs into data/session.json for the PaddockIntel 3D template.
Usage: python3 build_session.py <csv_dir> <out.json> "<Event name>" "<Circuit name>" "<Date>" ["<optional note for the last chapter>"]"""
import sys, json, numpy as np, pandas as pd
# Optional --penalties "RUS=5,LEC=10,HAM=back": grid drops published by the FIA after qualifying.
args = [a for a in sys.argv[1:] if not a.startswith('--penalties')]
pen_arg = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--penalties=')), '')
d, outp, event, circuit, date = args[:5]; note = args[5] if len(args) > 5 else ""
penalties = {k.strip(): v.strip() for k, v in (x.split('=') for x in pen_arg.split(',') if '=' in x)}
L = pd.read_csv(f'{d}/laps.csv'); R = pd.read_csv(f'{d}/results.csv'); T = pd.read_csv(f'{d}/fastest_lap_telemetry.csv')
W = pd.read_csv(f'{d}/weather.csv') if __import__('os').path.exists(f'{d}/weather.csv') else pd.DataFrame()
R = R[R.Abbreviation.notna() & R.Position.notna()].sort_values('Position')
col = lambda c: '#' + str(c).replace('#', '').zfill(6) if pd.notna(c) else '#888888'
ok = L[L.LapTime.notna() & (L.Deleted != True)]
def best_lap(code):
    # The lap behind the classification time (Q3 for the top ten), not the day's fastest:
    # in changing weather a driver can be quicker in Q1/Q2 than on the lap that set the grid.
    g = ok[ok.Driver == code]
    if not len(g): return None
    r = R[R.Abbreviation == code]; cls = r.BestLapTime.iloc[0] if len(r) else np.nan
    m = g[(g.LapTime - cls).abs() < 0.0015] if pd.notna(cls) else g.iloc[:0]
    return (m if len(m) else g).sort_values('LapTime').iloc[0]
fmt = lambda s: f"{int(s // 60)}:{s % 60:06.3f}"
top = R.head(3).Abbreviation.tolist(); pole = top[0]
grid = np.linspace(0, 1, 401)
def lap_profile(code):
    g = T[T.Driver == code].sort_values('Distance').drop_duplicates('Distance'); Dm = g.Distance.max()
    v = np.interp(grid * Dm, g.Distance, g.Speed); t = np.concatenate([[0], np.cumsum(np.diff(grid * Dm) / np.maximum(1, (v[1:] + v[:-1]) / 2 / 3.6))])
    return g, t, v
# track shape from the pole lap
g0, t0, _ = lap_profile(pole); Dm = g0.Distance.max()
X, Y, Z = (np.interp(grid * Dm, g0.Distance, g0[k]) for k in ('X', 'Y', 'Z'))
k = 5; sm = lambda a: np.convolve(np.r_[a[-k:], a, a[:k]], np.ones(2 * k + 1) / (2 * k + 1), 'valid')
X, Y, Z = sm(X), sm(Y), sm(Z); w = np.ptp(X)
track = [[round((x - X.min()) / w, 4), round((Y.max() - y) / w, 4), round((z - Z.min()) / w, 5)] for x, y, z in zip(X, Y, Z)]
# corners: clear speed minima on the pole lap
_, _, vp = lap_profile(pole); corners = []
for i in range(3, len(vp) - 3):
    if vp[i] == min(vp[i - 3:i + 4]) and vp[i] < 230 and (not corners or grid[i] - corners[-1][1] > 0.02): corners.append([len(corners) + 1, round(float(grid[i]), 4), round(float(vp[i]))])
# sector-anchored times for the top three (exact at each official sector line, smooth in between)
bp = best_lap(pole); S0 = [bp.Sector1Time, bp.Sector2Time, bp.Sector3Time]; tp = t0 * bp.LapTime / t0[-1]
f1 = float(np.interp(S0[0], tp, grid)); f2 = float(np.interp(S0[0] + S0[1], tp, grid))
top3 = []
for code in top:
    b = best_lap(code); r = R[R.Abbreviation == code].iloc[0]; S = [b.Sector1Time, b.Sector2Time, b.Sector3Time]
    _, _, v = lap_profile(code)
    cum = [0, S[0], S[0] + S[1], sum(S)]; rc = [0, S0[0], S0[0] + S0[1], sum(S0)]
    t = tp + np.interp(grid, [0, f1, f2, 1], [a - c for a, c in zip(cum, rc)])
    top3.append(dict(code=code, number=str(r.DriverNumber), name=str(r.FullName).title(), team=r.TeamName, color=col(r.TeamColor),
                     lap=round(float(b.LapTime), 3), lap_text=fmt(b.LapTime), sectors=[round(float(s), 3) for s in S],
                     t=[round(float(x), 3) for x in t], speed=[round(float(x), 1) for x in v]))
gap12 = top3[1]['lap'] - top3[0]['lap']
after2 = (top3[1]['sectors'][0] + top3[1]['sectors'][1]) - (top3[0]['sectors'][0] + top3[0]['sectors'][1])
# fastest sectors among the laps that set the top ten (the same laps the grid comes from)
cls_laps = pd.DataFrame([best_lap(c) for c in R.head(10).Abbreviation if best_lap(c) is not None])
sector_best = []
for i in (1, 2, 3):
    s = cls_laps.dropna(subset=[f'Sector{i}Time']).sort_values(f'Sector{i}Time').iloc[0]; sector_best.append(dict(sector=i, code=s.Driver, time=round(float(s[f'Sector{i}Time']), 3)))
# Who reached each part comes from the classification position, not from having
# a lap time: a driver can go through and then not run (e.g. VER, São Paulo 2026,
# P3 in Q1, sat out Q2 with an engine penalty already sending him to the back).
n_cls = len(R); per_part = max((n_cls - 10) // 2, 0)
q2 = R[R.Position <= n_cls - per_part].Abbreviation.tolist(); q3 = R[R.Position <= 10].Abbreviation.tolist()
out_q1 = [c for c in R.Abbreviation if c not in q2]; out_q2 = [c for c in q2 if c not in q3]
# Drivers who went through but set no time in the next part get a short note.
q1_rank = {c: i + 1 for i, c in enumerate(R.dropna(subset=['Q1']).sort_values('Q1').Abbreviation)}
q2_rank = {c: i + 1 for i, c in enumerate(R.dropna(subset=['Q2']).sort_values('Q2').Abbreviation)}
notes = {}
for c in R.Abbreviation:
    r = R[R.Abbreviation == c].iloc[0]
    if c in out_q2 and pd.isna(r.Q2) and c in q1_rank: notes[c] = dict(part='Q2', text=f"P{q1_rank[c]} IN Q1 · NO Q2 LAP")
    if c in q3 and pd.isna(r.Q3) and c in q2_rank: notes[c] = dict(part='Q3', text=f"P{q2_rank[c]} IN Q2 · NO Q3 LAP")
def note_text(c):
    n = notes[c]; why = ' with a grid penalty' if c in penalties else ''
    return f"{c} was P{n['text'].split()[0][1:]} in {n['text'].split()[2]} but skipped {n['part']}{why}."
knock_text = f"Out in Q1: {', '.join(out_q1)}. Out in Q2: {', '.join(out_q2)}." + ''.join(' ' + note_text(c) for c in notes)
# Starting grid: a driver with an N-place drop takes slot (qualifying + N), back-of-grid
# starters fill the last slots in qualifying order, everyone else fills the gaps in order.
quali = R.Abbreviation.tolist(); n_all = len(quali)
back = [c for c in quali if penalties.get(c, '').lower() == 'back']
slots = {}
for i, c in enumerate(quali):
    p_ = penalties.get(c, '')
    if p_.isdigit():
        k = min(i + 1 + int(p_), n_all - len(back))
        while k in slots: k += 1
        slots[k] = c
for j, c in enumerate(back): slots[n_all - len(back) + 1 + j] = c
rest = iter(c for c in quali if c not in slots.values())
start = [slots.get(k) or next(rest) for k in range(1, n_all + 1)]
grid10 = []
for k, c in enumerate(start[:10]):
    r = R[R.Abbreviation == c].iloc[0]
    grid10.append(dict(pos=k + 1, code=c, number=str(r.DriverNumber), color=col(r.TeamColor),
                       gap=None if c == pole or pd.isna(r.Q3) else round(float(r.Q3 - top3[0]['lap']), 3),
                       quali=int(r.Position), **({'penalty': penalties[c]} if c in penalties else {})))
# every classified driver, so the knockout columns can colour all 22
drivers = {r.Abbreviation: dict(number=str(r.DriverNumber), name=str(r.FullName).title(), team=r.TeamName, color=col(r.TeamColor), pos=int(r.Position),
                                q1=None if pd.isna(r.Q1) else round(float(r.Q1), 3), q2=None if pd.isna(r.Q2) else round(float(r.Q2), 3),
                                q3=None if pd.isna(r.Q3) else round(float(r.Q3), 3)) for r in R.itertuples()}
weather = {}
if len(W):
    for k_ in ('AirTemp', 'TrackTemp', 'Humidity', 'Pressure', 'WindSpeed'):
        if k_ in W: weather[k_] = round(float(pd.to_numeric(W[k_], errors='coerce').mean()), 1)
lead_after2 = top3[0]['code'] if after2 > 0 else top3[1]['code']
chapters = [
    dict(id=1, kind='pole', title='POLE.', text=f"{top3[0]['name']} · {top3[0]['lap_text']}"),
    dict(id=2, kind='knockout', title='Q1 → Q2 → Q3.', text=knock_text,
         short=' '.join(note_text(c) for c in notes)),  # vertical: the board already lists who went out
    dict(id=3, kind='three_laps', title='THREE LAPS AT ONCE.', text=f"{top3[0]['code']}, {top3[1]['code']} and {top3[2]['code']}, each on their fastest lap."),
    dict(id=4, kind='sectors', title='SECTOR BY SECTOR.', short='', text=' · '.join(f"S{s['sector']} {s['code']} {s['time']:.3f}" for s in sector_best)),
    dict(id=5, kind='margin', title=f"{gap12:.3f}s.", text=f"After two sectors: {lead_after2} ahead by {abs(after2):.3f}s." ),
    dict(id=6, kind='grid', title="TOMORROW'S GRID.", text=note or "Top ten. Grid penalties may still change the order."),
]
# Track look per Grand Prix (matched in the event name). Anything not listed
# keeps the house style: blue ribbon, red/white kerbs.
THEMES = {
    ('são paulo', 'sao paulo', 'brazil', 'brasil'): dict(track='#1d1f24', kerbs=['#009C3B', '#FFDF00']),
}
theme = next((t for keys, t in THEMES.items() if any(k in event.lower() for k in keys)), None)
json.dump(dict(type='Q', event=event, circuit=circuit, date=date, track=track, corners=corners, sector_lines=[round(f1, 4), round(f2, 4)],
               top3=top3, gap_p1_p2=round(gap12, 3), gap_after_two_sectors=round(after2, 3), sector_best=sector_best,
               knockout=dict(out_q1=out_q1, out_q2=out_q2, q3=q3, **({'notes': notes} if notes else {})), grid=grid10, drivers=drivers, weather=weather,
               colors=dict(cream='#F3ECDD', blue='#2B4AA0', red='#E23A3A', navy='#16244F', yellow='#F5C518'), chapters=chapters, **({'theme': theme} if theme else {})), open(outp, 'w'), indent=1)
print('pole', top3[0]['code'], top3[0]['lap_text'], '| gap', f"{gap12:.3f}", '| after S2', f"{after2:+.3f}", '| corners', len(corners), '| out Q1', out_q1, '| out Q2', out_q2)
for c in chapters: print(' ', c['id'], c['title'], '—', c['text'])
