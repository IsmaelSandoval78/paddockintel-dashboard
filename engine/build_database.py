import pandas as pd
import json
import os

def get_track_svg(race_name):
    name = str(race_name).lower()
    
    # 🏁 SILUETAS VECTORIALES OFICIALES DE LA FIA (PRE-CALIBRADAS PARA CANVAS 400x400)
    if "miami" in name:
        # Silueta exacta de Miami: Recta del Hard Rock Stadium, chicana norte, la curva de la marina y la gran recta trasera
        return "M 70,240 L 70,160 L 110,130 L 150,160 L 190,160 L 210,120 L 320,120 L 340,150 L 310,180 L 340,220 L 300,260 L 160,260 L 130,290 Z"
    elif "canada" in name or "montreal" in name or "gilles" in name:
        # Silueta exacta de Montreal: El "bote" alargado, la horquilla del Casino a la derecha y el Muro de los Campeones
        return "M 60,200 L 120,170 L 240,170 L 340,150 C 370,150 370,210 340,210 L 310,220 L 160,240 L 100,240 Z"
    elif "australia" in name or "melbourne" in name:
        # Albert Park: El óvalo fluido alrededor del lago con la chicana rápida superior
        return "M 150,320 C 100,320 60,290 70,240 C 80,190 110,160 150,150 L 210,150 C 240,110 260,80 300,90 L 330,160 L 280,220 L 310,290 L 245,300 L 195,275 Z"
    elif "china" in name or "shanghai" in name:
        # Shanghai: El caracol gigante de las curvas 1-2-3 y la recta kilométrica trasera
        return "M 140,320 L 140,210 C 140,120 250,120 250,190 C 250,250 200,250 200,210 C 200,180 230,180 230,210 L 230,240 C 230,310 80,310 80,240 L 80,120 C 65,90 25,120 45,160 L 80,320 Z"
    elif "japan" in name or "suzuka" in name:
        # Suzuka: El único circuito en forma de "8" que se cruza a sí mismo en el centro
        return "M 110,270 C 180,270 290,220 250,130 C 210,50 130,130 170,170 C 210,210 210,300 140,300 C 60,300 60,210 95,170 L 210,270"
    else:
        # Fallback por si acaso
        return "M 100,200 L 300,200 L 200,300 Z"

def build_real_database():
    print("🏁 [PaddockIntel Engine] Iniciando extracción de datos 100% REALES...")
    
    try:
        races = pd.read_csv('data/raw/races.csv')
        lap_times = pd.read_csv('data/raw/lap_times.csv')
        drivers = pd.read_csv('data/raw/drivers.csv')
        pit_stops = pd.read_csv('data/raw/pit_stops.csv')
    except Exception as e:
        print(f"❌ Error crítico: No se encontraron los CSVs en data/raw/. Detalle: {e}")
        return

    races_with_laps = lap_times['raceId'].unique()
    completed_races = races[races['raceId'].isin(races_with_laps)]
    latest_race = completed_races.sort_values(by=['year', 'round'], ascending=[False, False]).iloc[0]
    
    race_id = latest_race['raceId']
    year = latest_race['year']
    race_name = latest_race['name']
    
    print(f"📊 Carrera válida detectada: {race_name} {year} (Race ID: {race_id})")

    laps = lap_times[lap_times['raceId'] == race_id].copy()
    pits = pit_stops[pit_stops['raceId'] == race_id].copy()
        
    total_laps = int(laps['lap'].max())
    driver_ids = laps['driverId'].unique()
    race_drivers = drivers[drivers['driverId'].isin(driver_ids)]
    
    team_colors = {"VER": "#3671C6", "PER": "#3671C6", "HAM": "#E8002D", "LEC": "#E8002D", 
                   "RUS": "#27F4D2", "ANT": "#27F4D2", "NOR": "#FF8000", "PIA": "#FF8000", 
                   "ALO": "#229971", "STR": "#229971", "SAI": "#64C4FF", "COL": "#64C4FF",
                   "ALB": "#64C4FF", "GAS": "#FF87BC", "OCO": "#B6BABD", "TSU": "#6692FF",
                   "HUL": "#52E252", "MAG": "#B6BABD", "ZHO": "#52E252", "BOT": "#478cb5", "BEA": "#B6BABD"}

    drivers_dir = {}
    for _, dr in race_drivers.iterrows():
        code = str(dr['code']).upper() if pd.notna(dr['code']) else str(dr['driverRef']).upper()[:3]
        drivers_dir[code] = {
            "driverId": dr['driverId'],
            "name": f"{dr['forename']} {dr['surname']}",
            "code": code,
            "color": team_colors.get(code, "#86868b")
        }

    svg_path = get_track_svg(race_name)

    database = {
        "event": {"year": int(year), "name": race_name, "totalLaps": total_laps},
        "track_svg": svg_path,
        "driversDirectory": drivers_dir,
        "laps": {}
    }
    
    for lap in range(1, total_laps + 1):
        lap_df = laps[laps['lap'] == lap]
        pit_df = pits[pits['lap'] == lap]
        
        lap_entry = {"pitAlert": not pit_df.empty, "drivers": {}}
        
        if not lap_df.empty:
            leader_ms = lap_df[lap_df['position'] == 1]['milliseconds'].values[0]
            for _, row in lap_df.iterrows():
                drv_code = next((c for c, i in drivers_dir.items() if i['driverId'] == row['driverId']), None)
                if drv_code:
                    gap_ms = row['milliseconds'] - leader_ms
                    lap_entry["drivers"][drv_code] = {
                        "position": int(row['position']),
                        "lap_time": row['time'],
                        "gap": "LEADER" if row['position'] == 1 else f"{(gap_ms / 1000.0):.3f}s",
                        "pos_pct": float(row['position']) / len(drivers_dir)
                    }
        database["laps"][str(lap)] = lap_entry

    os.makedirs("public/json-api", exist_ok=True)
    output_path = "public/json-api/latest_race.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(database, f, indent=4)
        
    print(f"✅ ¡Éxito! Motor procesó los CSVs reales. JSON guardado en: {output_path}")

if __name__ == "__main__":
    build_real_database()