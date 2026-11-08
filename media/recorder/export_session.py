import f1tv_auth  # F1 TV token for the livetiming archive
"""
Download a finished session with FastF1 and pack everything into one zip to share.
No F1 TV login needed for sessions that have already ended.

    python3.13 export_session.py 2026 16 R      # Sepang 2026 race (round 16)
    python3.13 export_session.py 2026 Singapore Q

Session codes: R race, S sprint, Q qualifying, SQ sprint qualifying, FP1/FP2/FP3.
Creates $PI_DATA_DIR/sessions/<year>-<event>-<session>.zip with CSV files (times in
seconds). PI_DATA_DIR defaults to ~/PaddockIntel-Data.
"""
import os
import sys
import zipfile
from pathlib import Path

import pandas as pd
import fastf1

PI_DATA = Path(os.environ.get("PI_DATA_DIR", "~/PaddockIntel-Data")).expanduser()

CODES = {"R": "Race", "S": "Sprint", "Q": "Qualifying", "SQ": "Sprint Qualifying", "FP1": "Practice 1", "FP2": "Practice 2", "FP3": "Practice 3"}


def secs(df):
    """timedelta columns -> seconds, so the CSVs are easy to read anywhere"""
    out = df.copy()
    for c in out.columns:
        if pd.api.types.is_timedelta64_dtype(out[c]):
            out[c] = out[c].dt.total_seconds().round(3)
    return out


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    year, event, code = int(sys.argv[1]), sys.argv[2], sys.argv[3].upper()
    event = int(event) if event.isdigit() else event
    cache = PI_DATA / "cache"
    cache.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(str(cache))
    s = fastf1.get_session(year, event, CODES[code])
    s.load(laps=True, telemetry=True, weather=True, messages=True)

    name = f"{year}-{str(s.event['Location']).lower().replace(' ', '-')}-{code}"
    folder = PI_DATA / "sessions" / name
    folder.mkdir(parents=True, exist_ok=True)

    secs(s.results.drop(columns=["HeadshotUrl"], errors="ignore")).to_csv(folder / "results.csv", index=False)
    secs(s.laps).to_csv(folder / "laps.csv", index=False)
    secs(s.weather_data).to_csv(folder / "weather.csv", index=False)
    secs(s.race_control_messages).to_csv(folder / "race_control.csv", index=False)
    secs(s.track_status).to_csv(folder / "track_status.csv", index=False)

    # Telemetry of each driver's fastest lap (speed, throttle, brake, gear, DRS, position on track,
    # elevation). X, Y and Z come from pos_data, merged with car_data by time inside get_telemetry().
    tel = []
    for drv in s.laps["Driver"].dropna().unique():
        try:
            lap = s.laps.pick_drivers(drv).pick_fastest()
            if lap is None or pd.isna(lap["LapTime"]):
                continue
            t = lap.get_telemetry().add_distance()
            t = t[["Distance", "Speed", "Throttle", "Brake", "nGear", "RPM", "DRS", "X", "Y", "Z"]].copy()
            t.insert(0, "Driver", drv)
            t.insert(1, "LapNumber", int(lap["LapNumber"]))
            tel.append(t)
        except Exception as exc:
            print(f"  no telemetry for {drv}: {exc}")
    if tel:
        pd.concat(tel).round(2).to_csv(folder / "fastest_lap_telemetry.csv", index=False)

    try:
        ci = s.get_circuit_info()
        ci.corners.to_csv(folder / "corners.csv", index=False)
        (folder / "circuit_rotation.txt").write_text(str(ci.rotation))
    except Exception as exc:
        print(f"  no circuit info: {exc}")

    zpath = PI_DATA / "sessions" / f"{name}.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for f in folder.iterdir():
            z.write(f, f.name)
    print(f"\nDone: {zpath.resolve()}  ({zpath.stat().st_size / 1e6:.1f} MB)")
    print(f"{len(s.laps)} laps · {s.laps['Driver'].nunique()} drivers · {len(s.race_control_messages)} race control messages")


if __name__ == "__main__":
    main()
