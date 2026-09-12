"""
Track Dominance Map — telemetry extraction (reference implementation).

Requires a disposable venv (do not install into the project's own Python
env, if any): python3 -m venv .venv && .venv/bin/pip install fastf1 numpy scipy

Usage:
  .venv/bin/python3 extract-telemetry.py <year> "<Event Name>" <Session> <DRIVER_A> <DRIVER_B>
  e.g. .venv/bin/python3 extract-telemetry.py 2026 "Spanish Grand Prix" FP2 ANT LEC

Writes three files into the current directory, consumed by render-svg.js:
  dominance-data.json   — minisector segments (winner per segment, for the
                           colored track map)
  corners.json           — real braking-zone apexes (speed-minima detection)
  delta-curve.json        — cumulative gap vs distance (FastF1 delta_time)

Two real bugs this script fixes vs. a naive first attempt (kept here as
comments so the next session doesn't re-discover them the hard way):

1. Minisector segments must be drawn on ONE driver's own X/Y path, not by
   switching to whichever driver "won" that segment — the two drivers don't
   share a racing line, so alternating between them produces visible gaps
   at segment boundaries. Fix: always use REF_DRIVER's telemetry for (x, y);
   only the *comparison* (which driver had the lower elapsed time in that
   window) determines the stroke color.

2. Comparing two drivers' raw `Distance` channels directly (e.g. by
   interpolating both onto the same distance grid and subtracting `Time`)
   gives a WRONG total gap — each car's Distance is independently
   integrated and isn't calibrated to agree at "the same physical point on
   track" (in one real case, two cars' reported total lap distance differed
   by ~80m for the same physical lap). Fix: use fastf1.utils.delta_time(),
   which matches by track position, not raw distance value. It's flagged
   deprecated upstream for edge-case inaccuracy, but its endpoint should
   always be sanity-checked against the real lap-time difference before
   trusting the curve (see the print check in this script).
"""
import sys
import json
import numpy as np
import fastf1
import fastf1.utils
from scipy.ndimage import uniform_filter1d
from scipy.signal import find_peaks

year, event, session_name, driver_a, driver_b = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
REF_DRIVER = driver_a  # the track-map shape is drawn using this driver's line

session = fastf1.get_session(int(year), event, session_name)
session.load()

laps = {d: session.laps.pick_drivers(d).pick_fastest() for d in (driver_a, driver_b)}
tel = {d: laps[d].get_telemetry() for d in (driver_a, driver_b)}

# ---- 1. Minisector segments (colored track map) ----
N_POINTS = 500
N_SECTORS = 32
ref_t = tel[REF_DRIVER]
max_dist = min(tel[driver_a]['Distance'].max(), tel[driver_b]['Distance'].max())
grid = np.linspace(0, max_dist, N_POINTS)

interp = {}
for d in (driver_a, driver_b):
    t = tel[d]
    interp[d] = {
        'x': np.interp(grid, t['Distance'], t['X']),
        'y': np.interp(grid, t['Distance'], t['Y']),
        'time': np.interp(grid, t['Distance'], t['Time'].dt.total_seconds()),
    }

sector_edges = np.linspace(0, N_POINTS - 1, N_SECTORS + 1).astype(int)
segments = []
for i in range(N_SECTORS):
    i0, i1 = sector_edges[i], sector_edges[i + 1]
    dt = {d: interp[d]['time'][i1] - interp[d]['time'][i0] for d in (driver_a, driver_b)}
    winner = min(dt, key=dt.get)
    # shape always comes from REF_DRIVER — see bug (1) above
    xs = interp[REF_DRIVER]['x'][i0:i1 + 1].round(1).tolist()
    ys = interp[REF_DRIVER]['y'][i0:i1 + 1].round(1).tolist()
    segments.append({'winner': winner, 'x': xs, 'y': ys})

with open('dominance-data.json', 'w') as f:
    json.dump({'segments': segments}, f)
print(f'wrote dominance-data.json: {len(segments)} segments')

# ---- 2. Corner detection (real braking zones, not official FIA numbers —
#         verify separately if official corner coordinates are ever needed) ----
ref_tel_full = tel[REF_DRIVER]
speed = ref_tel_full['Speed'].to_numpy()
dist_full = ref_tel_full['Distance'].to_numpy()
x_full = ref_tel_full['X'].to_numpy()
y_full = ref_tel_full['Y'].to_numpy()

peaks, _ = find_peaks(-speed, distance=15, prominence=3)
corners = [
    {'dist': float(dist_full[p]), 'x': float(x_full[p]), 'y': float(y_full[p]), 'speed': float(speed[p])}
    for p in peaks
]
corners.sort(key=lambda c: c['dist'])
with open('corners.json', 'w') as f:
    json.dump(corners, f)
print(f'wrote corners.json: {len(corners)} braking zones detected')

# ---- 3. Gap-over-distance curve (fastf1.utils.delta_time — see bug (2)) ----
delta, ref_delta_tel, _ = fastf1.utils.delta_time(laps[driver_a], laps[driver_b])
delta_dist = ref_delta_tel['Distance'].to_numpy()
delta_arr = delta.to_numpy()

real_gap = (laps[driver_b]['LapTime'] - laps[driver_a]['LapTime']).total_seconds()
print(f'delta_time endpoint: {delta_arr[-1]:.3f}s vs real lap-time gap: {real_gap:.3f}s '
      f'({"OK" if abs(delta_arr[-1] - real_gap) < 0.01 else "MISMATCH — do not trust this curve"})')

delta_grid = np.linspace(delta_dist.min(), delta_dist.max(), 500)
delta_resampled = np.interp(delta_grid, delta_dist, delta_arr)
with open('delta-curve.json', 'w') as f:
    json.dump({'grid': delta_grid.tolist(), 'delta': delta_resampled.tolist()}, f)
print('wrote delta-curve.json')
