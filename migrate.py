"""
PaddockIntel — CSV to Supabase Migration
Run: python migrate.py
"""

import pandas as pd
import numpy as np
from supabase import create_client
import sys, time

SUPABASE_URL = "https://ozcmecoaofolbrzhlhum.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96Y21lY29hb2ZvbGJyemhsaHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMTAxNjUsImV4cCI6MjA5NTU4NjE2NX0.p4kaSuGnkOwJzZ-6eolAFP7QyX8nTtuyoyjSSg07qC8"

# ── EDIT THIS PATH to where your CSVs are ─────────────────────
CSV_DIR = "./data/raw"   # or wherever you have the CSVs locally
# ──────────────────────────────────────────────────────────────

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean(df):
    """Replace NaN and \\N sentinel with None for Supabase."""
    df = df.replace({np.nan: None, '\\N': None, r'\N': None})
    return df

def insert_batch(table, records, batch_size=500):
    """Insert records in batches, print progress."""
    total = len(records)
    if total == 0:
        print(f"  {table}: no records")
        return
    for i in range(0, total, batch_size):
        batch = records[i:i+batch_size]
        supabase.table(table).upsert(batch).execute()
        pct = min(i+batch_size, total)
        print(f"  {table}: {pct}/{total}", end='\r')
        time.sleep(0.1)  # avoid rate limit
    print(f"  {table}: {total} rows ✓          ")

def migrate():
    print("=== PaddockIntel CSV → Supabase ===\n")

    # 1. STATUS
    print("Loading status...")
    df = clean(pd.read_csv(f"{CSV_DIR}/status.csv"))
    insert_batch("status", [
        {"id": int(r.statusId), "status": r.status}
        for _, r in df.iterrows()
    ])

    # 2. CIRCUITS
    print("Loading circuits...")
    df = clean(pd.read_csv(f"{CSV_DIR}/circuits.csv"))
    insert_batch("circuits", [
        {
            "id": int(r.circuitId),
            "circuit_ref": r.circuitRef,
            "name": r.name,
            "location": r.location,
            "country": r.country,
            "lat": float(r.lat) if r.lat else None,
            "lng": float(r.lng) if r.lng else None,
            "alt": int(r.alt) if r.alt else None,
            "url": r.url
        }
        for _, r in df.iterrows()
    ])

    # 3. DRIVERS
    print("Loading drivers...")
    df = clean(pd.read_csv(f"{CSV_DIR}/drivers.csv"))
    insert_batch("drivers", [
        {
            "id": int(r.driverId),
            "driver_ref": r.driverRef,
            "number": int(r.number) if r.number else None,
            "code": r.code,
            "forename": r.forename,
            "surname": r.surname,
            "dob": str(r.dob) if r.dob else None,
            "nationality": r.nationality,
            "url": r.url
        }
        for _, r in df.iterrows()
    ])

    # 4. CONSTRUCTORS
    print("Loading constructors...")
    df = clean(pd.read_csv(f"{CSV_DIR}/constructors.csv"))
    insert_batch("constructors", [
        {
            "id": int(r.constructorId),
            "constructor_ref": r.constructorRef,
            "name": r.name,
            "nationality": r.nationality,
            "url": r.url
        }
        for _, r in df.iterrows()
    ])

    # 5. SEASONS
    print("Loading seasons...")
    df = clean(pd.read_csv(f"{CSV_DIR}/seasons.csv"))
    insert_batch("seasons", [
        {"year": int(r.year), "series_id": 1, "url": r.url}
        for _, r in df.iterrows()
    ])

    # 6. RACES
    print("Loading races...")
    df = clean(pd.read_csv(f"{CSV_DIR}/races.csv"))
    insert_batch("races", [
        {
            "id": int(r.raceId),
            "year": int(r.year),
            "series_id": 1,
            "round": int(r.round),
            "circuit_id": int(r.circuitId),
            "name": r.name,
            "date": str(r.date) if r.date else None,
            "time": r.time,
            "url": r.url,
            "fp1_date":   str(r.fp1_date)   if r.fp1_date   else None,
            "fp1_time":   r.fp1_time,
            "fp2_date":   str(r.fp2_date)   if r.fp2_date   else None,
            "fp2_time":   r.fp2_time,
            "fp3_date":   str(r.fp3_date)   if r.fp3_date   else None,
            "fp3_time":   r.fp3_time,
            "quali_date": str(r.quali_date) if r.quali_date else None,
            "quali_time": r.quali_time,
            "sprint_date":str(r.sprint_date)if r.sprint_date else None,
            "sprint_time":r.sprint_time
        }
        for _, r in df.iterrows()
    ])

    # 7. RESULTS
    print("Loading results (27k rows, takes ~1 min)...")
    df = clean(pd.read_csv(f"{CSV_DIR}/results.csv"))
    insert_batch("results", [
        {
            "id": int(r.resultId),
            "race_id": int(r.raceId),
            "driver_id": int(r.driverId),
            "constructor_id": int(r.constructorId),
            "number": int(r.number) if r.number else None,
            "grid": int(r.grid) if r.grid else None,
            "position": int(r.position) if r.position else None,
            "position_text": r.positionText,
            "position_order": int(r.positionOrder) if r.positionOrder else None,
            "points": float(r.points) if r.points else None,
            "laps": int(r.laps) if r.laps else None,
            "time": r.time,
            "milliseconds": int(r.milliseconds) if r.milliseconds else None,
            "fastest_lap": int(r.fastestLap) if r.fastestLap else None,
            "rank": int(r.rank) if r.rank else None,
            "fastest_lap_time": r.fastestLapTime,
            "fastest_lap_speed": r.fastestLapSpeed,
            "status_id": int(r.statusId) if r.statusId else None
        }
        for _, r in df.iterrows()
    ], batch_size=300)

    # 8. QUALIFYING
    print("Loading qualifying...")
    df = clean(pd.read_csv(f"{CSV_DIR}/qualifying.csv"))
    insert_batch("qualifying", [
        {
            "id": int(r.qualifyId),
            "race_id": int(r.raceId),
            "driver_id": int(r.driverId),
            "constructor_id": int(r.constructorId),
            "number": int(r.number) if r.number else None,
            "position": int(r.position) if r.position else None,
            "q1": r.q1, "q2": r.q2, "q3": r.q3
        }
        for _, r in df.iterrows()
    ])

    # 9. DRIVER STANDINGS
    print("Loading driver standings...")
    df = clean(pd.read_csv(f"{CSV_DIR}/driver_standings.csv"))
    insert_batch("driver_standings", [
        {
            "id": int(r.driverStandingsId),
            "race_id": int(r.raceId),
            "driver_id": int(r.driverId),
            "points": float(r.points) if r.points else None,
            "position": int(r.position) if r.position else None,
            "position_text": r.positionText,
            "wins": int(r.wins) if r.wins else None
        }
        for _, r in df.iterrows()
    ], batch_size=300)

    # 10. CONSTRUCTOR STANDINGS
    print("Loading constructor standings...")
    df = clean(pd.read_csv(f"{CSV_DIR}/constructor_standings.csv"))
    insert_batch("constructor_standings", [
        {
            "id": int(r.constructorStandingsId),
            "race_id": int(r.raceId),
            "constructor_id": int(r.constructorId),
            "points": float(r.points) if r.points else None,
            "position": int(r.position) if r.position else None,
            "position_text": r.positionText,
            "wins": int(r.wins) if r.wins else None
        }
        for _, r in df.iterrows()
    ], batch_size=300)

    # 11. CONSTRUCTOR RESULTS
    print("Loading constructor results...")
    df = clean(pd.read_csv(f"{CSV_DIR}/constructor_results.csv"))
    insert_batch("constructor_results", [
        {
            "id": int(r.constructorResultsId),
            "race_id": int(r.raceId),
            "constructor_id": int(r.constructorId),
            "points": float(r.points) if r.points else None,
            "status": r.status
        }
        for _, r in df.iterrows()
    ], batch_size=300)

    # 12. PIT STOPS
    print("Loading pit stops...")
    df = clean(pd.read_csv(f"{CSV_DIR}/pit_stops.csv"))
    insert_batch("pit_stops", [
        {
            "race_id": int(r.raceId),
            "driver_id": int(r.driverId),
            "stop": int(r.stop),
            "lap": int(r.lap) if r.lap else None,
            "time": r.time,
            "duration": r.duration,
            "milliseconds": int(r.milliseconds) if r.milliseconds else None
        }
        for _, r in df.iterrows()
    ], batch_size=300)

    # 13. SPRINT RESULTS
    print("Loading sprint results...")
    df = clean(pd.read_csv(f"{CSV_DIR}/sprint_results.csv"))
    insert_batch("sprint_results", [
        {
            "id": int(r.resultId),
            "race_id": int(r.raceId),
            "driver_id": int(r.driverId),
            "constructor_id": int(r.constructorId),
            "number": int(r.number) if r.number else None,
            "grid": int(r.grid) if r.grid else None,
            "position": int(r.position) if r.position else None,
            "position_text": r.positionText,
            "position_order": int(r.positionOrder) if r.positionOrder else None,
            "points": float(r.points) if r.points else None,
            "laps": int(r.laps) if r.laps else None,
            "time": r.time,
            "milliseconds": int(r.milliseconds) if r.milliseconds else None,
            "fastest_lap": int(r.fastestLap) if r.fastestLap else None,
            "fastest_lap_time": r.fastestLapTime,
            "status_id": int(r.statusId) if r.statusId else None
        }
        for _, r in df.iterrows()
    ])

    # 14. LAP TIMES (large — ~870k rows, optional)
    print("Loading lap times (870k rows, takes ~5 min)...")
    print("  TIP: skip with Ctrl+C if you want to do this later")
    try:
        df = clean(pd.read_csv(f"{CSV_DIR}/lap_times.csv"))
        insert_batch("lap_times", [
            {
                "race_id": int(r.raceId),
                "driver_id": int(r.driverId),
                "lap": int(r.lap),
                "position": int(r.position) if r.position else None,
                "time": r.time,
                "milliseconds": int(r.milliseconds) if r.milliseconds else None
            }
            for _, r in df.iterrows()
        ], batch_size=500)
    except KeyboardInterrupt:
        print("\n  Skipped lap times.")

    print("\n=== Migration complete! ===")
    print("Check your Supabase Table Editor to verify.")

if __name__ == "__main__":
    migrate()
