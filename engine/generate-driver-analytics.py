import pandas as pd
import json
import os

def main():
    print("📊 Iniciando análisis avanzado e infográfico de pilotos (Versión Pro)...")
    
    csv_results = 'data/results.csv'
    csv_status = 'data/status.csv'
    csv_drivers = 'data/drivers.csv'
    csv_races = 'data/races.csv'
    csv_qualifying = 'data/qualifying.csv'
    output_json = 'src/data-outputs/driver-analytics.json'
    
    if not all(os.path.exists(f) for f in [csv_results, csv_status, csv_drivers, csv_races, csv_qualifying]):
        print("❌ Error: Faltan archivos CSV en la carpeta 'data/' (Asegúrate de incluir qualifying.csv)")
        return

    # Cargar datos
    df_results = pd.read_csv(csv_results)
    df_status = pd.read_csv(csv_status)
    df_drivers = pd.read_csv(csv_drivers)
    df_races = pd.read_csv(csv_races)
    df_qualifying = pd.read_csv(csv_qualifying)

    # Escudo de datos numéricos
    df_results['grid'] = pd.to_numeric(df_results['grid'], errors='coerce')
    df_results['positionOrder'] = pd.to_numeric(df_results['positionOrder'], errors='coerce')
    df_qualifying['position'] = pd.to_numeric(df_qualifying['position'], errors='coerce')

    # Obtener última temporada
    df_merged = df_results.merge(df_races, on='raceId')
    latest_season = int(df_merged['year'].max())
    print(f"🗓️ Extrayendo métricas de Clasificación y Carrera para la temporada: {latest_season}")
    
    df_season_results = df_merged[df_merged['year'] == latest_season].copy()
    
    # Filtrar clasificaciones de la temporada actual
    df_season_qualy = df_qualifying[df_qualifying['raceId'].isin(df_season_results['raceId'].unique())].copy()

    # --- CÁLCULO DEL DUELO DE COMPAÑEROS (HEAD-TO-HEAD QUALY) ---
    # Diccionario para guardar victorias en qualy: {(driverId, teammateId): victorias}
    qualy_duels = {} 
    
    # Agrupar las clasificaciones por carrera y por escudería para emparejar compañeros
    for (race_id, constructor_id), group in df_season_qualy.groupby(['raceId', 'constructorId']):
        if len(group) >= 2:
            # Tomar los dos primeros pilotos de la escudería en esa carrera
            p1 = group.iloc[0]
            p2 = group.iloc[1]
            
            d1_id, d1_pos = int(p1['driverId']), p1['position']
            d2_id, d2_pos = int(p2['driverId']), p2['position']
            
            if pd.notna(d1_pos) and pd.notna(d2_pos):
                if d1_id not in qualy_duels: qualy_duels[d1_id] = {}
                if d2_id not in qualy_duels: qualy_duels[d2_id] = {}
                
                # Registrar el duelo de esta carrera
                if d1_pos < d2_pos: # d1 clasificó mejor
                    qualy_duels[d1_id][d2_id] = qualy_duels[d1_id].get(d2_id, 0) + 1
                    qualy_duels[d2_id][d1_id] = qualy_duels[d2_id].get(d1_id, 0) # asegurar llave
                elif d2_pos < d1_pos: # d2 clasificó mejor
                    qualy_duels[d2_id][d1_id] = qualy_duels[d2_id].get(d1_id, 0) + 1
                    qualy_duels[d1_id][d2_id] = qualy_duels[d1_id].get(d2_id, 0)

    # Mapeo de estados de carrera
    status_map = dict(df_status[['statusId', 'status']].values)
    driver_errors_keywords = ['accident', 'collision', 'spun off', 'incident']
    mechanical_keywords = ['engine', 'gearbox', 'transmission', 'clutch', 'hydraulics', 'electrical', 'brakes', 'suspension', 'turbo', 'power unit', 'damage']

    analytics = {}

    for driver_id, group in df_season_results.groupby('driverId'):
        driver_row = df_drivers[df_drivers['driverId'] == driver_id]
        if driver_row.empty: continue
        driver_ref = driver_row['driverRef'].values[0]
        
        # 1. Sunday Progress Index
        valid_grid = group[(group['grid'] > 0) & (group['positionOrder'].notna())]
        if not valid_grid.empty:
            avg_start = float(valid_grid['grid'].mean())
            avg_finish = float(valid_grid['positionOrder'].mean())
            progress_index = float((valid_grid['grid'] - valid_grid['positionOrder']).mean())
        else:
            avg_start, avg_finish, progress_index = 0.0, 0.0, 0.0

        # 2. Posición promedio los sábados (Qualy)
        d_qualy = df_season_qualy[df_season_qualy['driverId'] == driver_id]
        avg_qualy_pos = float(d_qualy['position'].mean()) if not d_qualy.empty else avg_start

        # 3. Procesar el resultado final del duelo vs compañero
        duel_score = "0 - 0"
        teammate_code = "TM"
        if driver_id in qualy_duels and qualy_duels[driver_id]:
            # Encontrar el compañero con el que más corrió
            teammate_id = max(qualy_duels[driver_id], key=lambda k: qualy_duels[driver_id][k] + qualy_duels[k].get(driver_id, 0))
            wins = qualy_duels[driver_id][teammate_id]
            losses = qualy_duels[teammate_id].get(driver_id, 0)
            duel_score = f"{wins} - {losses}"
            
            tm_row = df_drivers[df_drivers['driverId'] == teammate_id]
            if not tm_row.empty:
                teammate_code = str(tm_row['code'].values[0]) if pd.notna(tm_row['code'].values[0]) else "TM"

        # 4. Damage & Reliability Report
        total_races = len(group)
        driver_errors, mechanical_failures, finished_clean = 0, 0, 0
        
        for _, row in group.iterrows():
            status_text = status_map.get(row['statusId'], '').lower()
            if 'finished' in status_text or 'lap' in status_text:
                finished_clean += 1
            elif any(k in status_text for k in driver_errors_keywords):
                driver_errors += 1
            elif any(k in status_text for k in mechanical_keywords):
                mechanical_failures += 1
            else:
                mechanical_failures += 1

        completion_rate = (finished_clean / total_races) * 100 if total_races > 0 else 100.0
        error_rate = (driver_errors / total_races) * 100 if total_races > 0 else 0.0
        mech_rate = (mechanical_failures / total_races) * 100 if total_races > 0 else 0.0

        analytics[driver_ref] = {
            "avgStart": round(avg_start, 1),
            "avgFinish": round(avg_finish, 1),
            "avgQualy": round(avg_qualy_pos, 1),
            "progressIndex": round(progress_index, 1),
            "qualyBattle": {
                "score": duel_score,
                "teammate": teammate_code
            },
            "reliability": {
                "completionRate": round(completion_rate, 1),
                "driverErrorRate": round(error_rate, 1),
                "mechanicalFailureRate": round(mech_rate, 1),
                "totalDNFs": driver_errors + mechanical_failures
            }
        }

    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(analytics, f, ensure_ascii=False, indent=2)

    print(f"✅ ¡Éxito total! Archivo expandido generado en: {output_json}")

if __name__ == "__main__":
    main()