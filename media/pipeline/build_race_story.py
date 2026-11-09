"""Extract the key moments of a race from decoded CSVs (decode_recording.py output).
Usage: python3 build_race_story.py <csv_dir> [out.json]
Prints a human-readable summary and writes a JSON with: winner, podium, biggest
climber (grid vs. finish), lead changes, fastest lap, retirements, tyre strategies,
safety cars / red flags, weather — every figure straight from the recording.
Anything pending the stewards (post-race investigations/penalties in race control)
is listed under "provisional". Classification is always provisional until the FIA
publishes the final one (DATA-EXPERT.md rule)."""
import json, os, re, sys
import numpy as np, pandas as pd

d = sys.argv[1]
outp = sys.argv[2] if len(sys.argv) > 2 else None
L = pd.read_csv(f'{d}/laps.csv')
R = pd.read_csv(f'{d}/results.csv')
C = pd.read_csv(f'{d}/race_control.csv') if os.path.exists(f'{d}/race_control.csv') else pd.DataFrame(columns=['Time', 'Category', 'Message'])
T = pd.read_csv(f'{d}/track_status.csv') if os.path.exists(f'{d}/track_status.csv') else pd.DataFrame(columns=['Time', 'Status', 'Message'])
W = pd.read_csv(f'{d}/weather.csv') if os.path.exists(f'{d}/weather.csv') else pd.DataFrame()

R = R[R.Abbreviation.notna() & R.Position.notna()].sort_values('Position')
name = dict(zip(R.Abbreviation, R.FullName)); team = dict(zip(R.Abbreviation, R.TeamName))
total_laps = int(R.NumberOfLaps.max())
fmt = lambda s: f"{int(s // 60)}:{s % 60:06.3f}"

# Winner + podium (gap = official race time delta where the recording has it)
podium = [{'pos': int(r.Position), 'code': r.Abbreviation, 'name': r.FullName, 'team': r.TeamName,
           'grid': int(r.GridPosition), 'gap': None if pd.isna(r.Time) else round(float(r.Time), 3)}
          for r in R.head(3).itertuples()]
winner = podium[0]

# Biggest climber among classified finishers (grid 0 = pit-lane start, counted from the back)
F = R[R.Status == 'Finished'].copy()
F['grid_eff'] = F.GridPosition.replace(0, len(R))
F['gain'] = F.grid_eff - F.Position
b = F.sort_values(['gain', 'Position'], ascending=[False, True]).iloc[0]
climber = {'code': b.Abbreviation, 'name': b.FullName, 'team': b.TeamName,
           'grid': int(b.GridPosition), 'finish': int(b.Position), 'gain': int(b.gain)}

# Lead changes: who is P1 as each lap is completed
lead = L[(L.Position == 1) & L.LapNumber.notna()].sort_values('LapNumber')
leaders, changes = [], []
for r in lead.itertuples():
    if not leaders or leaders[-1] != r.Driver:
        if leaders: changes.append({'lap': int(r.LapNumber), 'to': r.Driver})
        leaders.append(r.Driver)
laps_led = lead.groupby('Driver').size().sort_values(ascending=False)
laps_led = [{'code': k, 'laps': int(v)} for k, v in laps_led.items()]

# Fastest lap (deleted laps excluded)
ok = L[L.LapTime.notna() & (L.Deleted != True)]
fl = ok.sort_values('LapTime').iloc[0]
fastest = {'code': fl.Driver, 'name': name.get(fl.Driver, fl.Driver), 'time': fmt(fl.LapTime),
           'lap': int(fl.LapNumber)}

# Retirements, with the last completed lap and any race-control evidence near it.
# DATA-EXPERT.md: Status "Retired" does NOT say why — never present a cause the
# messages don't support (verified case: Zandvoort 2026).
rcm_txt = C.Message.fillna('').str.upper() if len(C) else pd.Series(dtype=str)
retirements = []
for r in R[~R.Status.isin(['Finished'])].itertuples():
    last = L[L.Driver == r.Abbreviation].LapNumber.max()
    ev = C[rcm_txt.str.contains(fr'\b(?:CAR {int(r.DriverNumber)}|{r.Abbreviation})\b', regex=True)].Message.tolist() if len(C) else []
    retirements.append({'code': r.Abbreviation, 'name': r.FullName, 'team': r.TeamName,
                        'status': r.Status, 'last_lap': None if pd.isna(last) else int(last),
                        'race_control': ev[-3:], 'cause': 'unverified — not in race control messages' if not ev else None})

# Tyre strategies: compound sequence per driver, podium highlighted
stints = (L[L.Compound.notna()].groupby(['Driver', 'Stint']).Compound.first().reset_index()
          .sort_values(['Driver', 'Stint']))
strategy = {drv: [c for c in g.Compound] for drv, g in stints.groupby('Driver')}
stops = {drv: max(0, len(s) - 1) for drv, s in strategy.items()}
tyres = {'podium': {p['code']: strategy.get(p['code'], []) for p in podium},
         'most_common': pd.Series(['→'.join(s) for s in strategy.values()]).mode().tolist(),
         'stops_winner': stops.get(winner['code'])}

# Safety cars / VSC / red flags: track_status codes + race control messages
codes = {'4': 'SAFETY CAR', '5': 'RED FLAG', '6': 'VSC'}
interruptions = [{'status': codes[str(int(r.Status))], 'message': r.Message}
                 for r in T.itertuples() if str(int(r.Status)) in codes] if len(T) else []
rc_flags = C[rcm_txt.str.contains('SAFETY CAR|RED FLAG|VIRTUAL SAFETY', regex=True)].Message.drop_duplicates().tolist() if len(C) else []

# Weather: rain and track-temperature range over the race
weather = None
if len(W):
    weather = {'rain': bool(W.Rainfall.any()) if 'Rainfall' in W else None,
               'track_temp': [round(float(W.TrackTemp.min()), 1), round(float(W.TrackTemp.max()), 1)] if 'TrackTemp' in W else None,
               'air_temp': [round(float(W.AirTemp.min()), 1), round(float(W.AirTemp.max()), 1)] if 'AirTemp' in W else None}

# Provisional: the recording ends at the flag — stewards' decisions after it are not
# in it. List open investigations/penalties mentioned in race control, and always
# flag the classification itself as provisional until the FIA confirms it.
pending = C[rcm_txt.str.contains('INVESTIGATION|PENALTY|DELETED|NOTED', regex=True)].Message.drop_duplicates().tolist() if len(C) else []
provisional = {'classification': 'PROVISIONAL until FIA final classification — post-race stewards decisions are not in the recording',
               'race_control_notes': pending[-15:]}

story = {'total_laps': total_laps, 'winner': winner, 'podium': podium, 'biggest_climber': climber,
         'lead_changes': changes, 'laps_led': laps_led, 'fastest_lap': fastest,
         'retirements': retirements, 'tyres': tyres,
         'interruptions': {'track_status': interruptions, 'race_control': rc_flags},
         'weather': weather, 'provisional': provisional}

print(f"winner {winner['code']} (grid {winner['grid']}) · {total_laps} laps | climber {climber['code']} "
      f"P{climber['grid']}→P{climber['finish']} (+{climber['gain']}) | lead changes {len(changes)} "
      f"| fastest {fastest['code']} {fastest['time']} (lap {fastest['lap']}) | retirements "
      f"{[r['code'] for r in retirements]} | interruptions {len(interruptions)} | provisional notes {len(pending)}")
out = json.dumps(story, indent=2, ensure_ascii=False)
if outp: open(outp, 'w').write(out); print('wrote', outp)
else: print(out)
