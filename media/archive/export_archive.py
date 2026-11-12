"""Exporta una sesión PASADA del archivo de F1 (requiere login F1 TV desde el
15-oct-2026) usando el entorno aislado media/archive/.venv (fastf1==3.9.0a0).

    .venv/bin/python export_archive.py 2025 "Las Vegas" R
    .venv/bin/python export_archive.py 2025 "Las Vegas" Q --timeout 600

Mismos CSVs y zip que media/recorder/export_session.py, en
$PI_DATA_DIR/sessions/<año>-<lugar>-<código>/ (PI_DATA_DIR = ~/PaddockIntel-Data).

Cada descarga corre en un subproceso con límite de tiempo (la alfa a veces se
cuelga). El token de F1 TV vive en el home (lo gestiona `fastf1 auth f1tv`),
nunca en el repo. Si falta o caducó:
    .venv/bin/python -m fastf1 auth f1tv --authenticate
"""
import os
import subprocess
import sys
import zipfile
from pathlib import Path

AUTH_MSG = ("No se pudieron descargar los datos: renueva el inicio de sesión de F1 TV\n"
            "  cd media/archive && .venv/bin/python -m fastf1 auth f1tv --authenticate")
PI_DATA = Path(os.environ.get("PI_DATA_DIR", "~/PaddockIntel-Data")).expanduser()
CODES = {"R": "Race", "S": "Sprint", "Q": "Qualifying", "SQ": "Sprint Qualifying",
         "FP1": "Practice 1", "FP2": "Practice 2", "FP3": "Practice 3"}


def child(year, event, code):
    """Proceso hijo: la descarga real (el padre lo mata si excede el límite)."""
    import pandas as pd
    import fastf1

    def secs(df):
        out = df.copy()
        for c in out.columns:
            if pd.api.types.is_timedelta64_dtype(out[c]):
                out[c] = out[c].dt.total_seconds().round(3)
        return out

    cache = PI_DATA / "cache-archive"          # caché propia: no mezclar con la del grabador
    cache.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(str(cache))
    s = fastf1.get_session(year, event, CODES[code])
    try:
        s.load(laps=True, telemetry=True, weather=True, messages=True)
    except Exception as exc:
        if "401" in str(exc) or "Unauthorized" in str(exc) or "403" in str(exc):
            sys.exit(AUTH_MSG)
        raise
    if s.laps is None or len(s.laps) == 0:
        sys.exit("Descarga vacía (0 vueltas). " + AUTH_MSG)

    name = f"{year}-{str(s.event['Location']).lower().replace(' ', '-')}-{code}"
    folder = PI_DATA / "sessions" / name
    folder.mkdir(parents=True, exist_ok=True)

    secs(s.results.drop(columns=["HeadshotUrl"], errors="ignore")).to_csv(folder / "results.csv", index=False)
    secs(s.laps).to_csv(folder / "laps.csv", index=False)
    secs(s.weather_data).to_csv(folder / "weather.csv", index=False)
    secs(s.race_control_messages).to_csv(folder / "race_control.csv", index=False)
    secs(s.track_status).to_csv(folder / "track_status.csv", index=False)

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
            print(f"  sin telemetría de {drv}: {exc}")
    if tel:
        pd.concat(tel).round(2).to_csv(folder / "fastest_lap_telemetry.csv", index=False)

    try:
        ci = s.get_circuit_info()
        ci.corners.to_csv(folder / "corners.csv", index=False)
        (folder / "circuit_rotation.txt").write_text(str(ci.rotation))
    except Exception as exc:
        print(f"  sin circuit info: {exc}")

    zpath = PI_DATA / "sessions" / f"{name}.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for f in folder.iterdir():
            z.write(f, f.name)
    print(f"OK: {zpath}  ({zpath.stat().st_size / 1e6:.1f} MB) · "
          f"{len(s.laps)} vueltas · {s.laps['Driver'].nunique()} pilotos")


def main():
    args = [a for a in sys.argv[1:] if a != "--child"]
    if len(args) < 3:
        print(__doc__)
        sys.exit(1)
    timeout = 600
    if "--timeout" in args:
        i = args.index("--timeout")
        timeout = int(args[i + 1])
        del args[i:i + 2]
    year, event, code = int(args[0]), args[1], args[2].upper()
    event = int(event) if str(event).isdigit() else event

    if "--child" in sys.argv:
        child(year, event, code)
        return

    # comprobación previa del login (mensaje claro antes de esperar una descarga)
    st = subprocess.run([sys.executable, "-m", "fastf1", "auth", "f1tv", "--status"],
                        capture_output=True, text=True)
    out = (st.stdout + st.stderr).lower()
    if "not" in out and ("logged" in out or "authenticated" in out) or "expired" in out:
        sys.exit(AUTH_MSG)

    try:
        r = subprocess.run([sys.executable, __file__, str(year), str(event), code, "--child"],
                           timeout=timeout)
    except subprocess.TimeoutExpired:
        sys.exit(f"Descarga cancelada: superó el límite de {timeout}s "
                 f"(la alfa a veces se cuelga — reintenta, o usa el plan B de OpenF1).")
    sys.exit(r.returncode)


if __name__ == "__main__":
    main()
