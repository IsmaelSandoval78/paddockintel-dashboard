"""Turn a live-timing recording into the same CSVs as export_session.py.
Usage: python3.13 export_live.py <recording.txt> <year> <event> <session>
Writes $PI_DATA_DIR/sessions/<year>-<event>-<session>-live/ (+ .zip)."""
import os, sys, pathlib, shutil
import pandas as pd, fastf1
from fastf1.livetiming.data import LiveTimingData

PI_DATA = pathlib.Path(os.environ.get("PI_DATA_DIR", "~/PaddockIntel-Data")).expanduser()

rec, year, event, sess = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
s = fastf1.get_session(year, event, sess)
s.load(livedata=LiveTimingData(rec), laps=True, telemetry=True, weather=True, messages=True)
out = PI_DATA / "sessions" / f"{year}-{event.lower().replace(' ', '-')}-{sess}-live"
out.mkdir(parents=True, exist_ok=True)

def secs(df):
    df = df.copy()
    for c in df.columns:
        if pd.api.types.is_timedelta64_dtype(df[c]):
            df[c] = df[c].dt.total_seconds()
    return df

secs(s.laps).to_csv(out / "laps.csv", index=False)
secs(s.results).to_csv(out / "results.csv", index=False)
secs(s.weather_data).to_csv(out / "weather.csv", index=False)
s.race_control_messages.to_csv(out / "race_control.csv", index=False)
try:
    s.get_circuit_info().corners.to_csv(out / "corners.csv", index=False)
except Exception as e:
    print("corners not available:", e)

rows = []
for drv in s.laps["Driver"].dropna().unique():
    try:
        lap = s.laps.pick_drivers(drv).pick_fastest()
        if lap is None or pd.isna(lap["LapTime"]):
            continue
        tel = lap.get_telemetry().add_distance()
        tel["Driver"], tel["LapNumber"] = drv, lap["LapNumber"]
        rows.append(tel[["Driver", "LapNumber", "Distance", "Speed", "Throttle", "Brake", "nGear", "RPM", "DRS", "X", "Y", "Z"]])
    except Exception as e:
        print("telemetry skipped for", drv, e)
if rows:
    pd.concat(rows).round(2).to_csv(out / "fastest_lap_telemetry.csv", index=False)

zip_path = shutil.make_archive(str(out), "zip", out)
print("Listo:", zip_path)
