import pandas as pd
import json
import os

def main():
    print("📊 Iniciando análisis avanzado de infografía de pilotos...")
    
    csv_results = 'data/results.csv'
    csv_status = 'data/status.csv'
    csv_drivers = 'data/drivers.csv'
    csv_races = 'data/races.csv'
    output_json = 'src/data-outputs/driver-analytics.json'
    
    if not all(os.path.exists(f) for f in [csv_results, csv_status, csv_drivers, csv_races]):
        print("❌ Error: Faltan archivos CSV en la carpeta 'data/'")
        return

    # Cargar materia prima
    df_results = pd.read_csv(csv_results)
    df_status = pd.read_csv(csv_status)
    df_drivers = pd.read_csv(csv_drivers)
    df_races = pd.read_csv(csv_races)

    # 🛠️ ESCUDO DE DATOS: Forzar conversión a tipo numérico limpiando textos basura
    df_results['grid'] = pd.to_numeric(df_results['grid'], errors='coerce')
    df_results['positionOrder'] = pd.to_numeric(df_results['positionOrder'], errors='coerce')

    # Filtrar por la última temporada registrada en los datos
    df_merged = df_results.merge(df_races, on='raceId')
    latest_season = int(df_merged['year'].max())
    print(f"🗓️ Extrayendo métricas Moneyball para la temporada: {latest_season}")
    
    df_season = df_merged[df_merged['year'] == latest_season].copy()

    # Clasificadores clave de tipos de abandono (DNFs)
    driver_errors_keywords = ['accident', 'collision', 'spun off', 'incident']
    mechanical_keywords = ['engine', 'gearbox', 'transmission', 'clutch', 'hydraulics', 
                           'electrical', 'brakes', 'suspension', 'turbo', 'power unit', 
                           'overheating', 'oil leak', 'water leak', 'radiator', 'fuel', 
                           'throttle', 'steering', 'exhaust', 'tyre', 'puncture', 'damage']

    status_map = dict(df_status[['statusId', 'status']].values)
    analytics = {}

    for driver_id, group in df_season.groupby('driverId'):
        driver_row = df_drivers[df_drivers['driverId'] == driver_id]
        if driver_row.empty:
            continue
        driver_ref = driver_row['driverRef'].values[0]
        
        # 1. Cálculo del Sunday Progress Index (Filtrando NaNs y ceros de forma segura)
        valid_grid = group[(group['grid'] > 0) & (group['positionOrder'].notna())]
        if not valid_grid.empty:
            avg_start = float(valid_grid['grid'].mean())
            avg_finish = float(valid_grid['positionOrder'].mean())
            progress_index = float((valid_grid['grid'] - valid_grid['positionOrder']).mean())
        else:
            avg_start, avg_finish, progress_index = 0.0, 0.0, 0.0

        # 2. Desglose del Damage & Reliability Report
        total_races = len(group)
        driver_errors = 0
        mechanical_failures = 0
        finished_clean = 0
        
        for _, row in group.iterrows():
            status_text = status_map.get(row['statusId'], '').lower()
            if 'finished' in status_text or 'lap' in status_text:
                finished_clean += 1
            elif any(k in status_text for k in driver_errors_keywords):
                driver_errors += 1
            elif any(k in status_text for k in mechanical_keywords):
                mechanical_failures += 1
            else:
                mechanical_failures += 1 # Contingencia por fallos externos

        completion_rate = (finished_clean / total_races) * 100 if total_races > 0 else 100.0
        error_rate = (driver_errors / total_races) * 100 if total_races > 0 else 0.0
        mech_rate = (mechanical_failures / total_races) * 100 if total_races > 0 else 0.0

        analytics[driver_ref] = {
            "avgStart": round(avg_start, 1),
            "avgFinish": round(avg_finish, 1),
            "progressIndex": round(progress_index, 1),
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

    print(f"✅ ¡Éxito total! Archivo generado en: {output_json}")

if __name__ == "__main__":
    main()