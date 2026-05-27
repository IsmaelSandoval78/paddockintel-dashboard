import pandas as pd
import json
import os

def main():
    print("🏎️ Iniciando generación del mapa de tiempos de carrera...")
    
    # 1. Definir rutas de la arquitectura limpia
    csv_laps = 'data/lap_times.csv'
    csv_drivers = 'data/drivers.csv'
    output_json = 'src/data-outputs/latest-race-simulation.json'
    
    if not os.path.exists(csv_laps) or not os.path.exists(csv_drivers):
        print("❌ Error: No se encontraron los archivos CSV en la carpeta 'data/'.")
        return

    # 2. Cargar la materia prima con Pandas
    print("⏳ Leyendo archivos de telemetría...")
    df_laps = pd.read_csv(csv_laps)
    df_drivers = pd.read_csv(csv_drivers)

    # 3. Identificar cuál es la última carrera registrada en los tiempos por vuelta
    latest_race_id = int(df_laps['raceId'].max())
    print(f"📍 Última carrera detectada en telemetría histórica: ID {latest_race_id}")

    # 4. Filtrar únicamente las vueltas de esa carrera
    df_race_laps = df_laps[df_laps['raceId'] == latest_race_id].copy()

    # 5. Mapear los IDs numéricos de los pilotos a sus códigos de 3 letras (ej: 863 -> ANT)
    driver_map = dict(df_drivers[['driverId', 'code']].values)

    # 6. Pivotar los datos para tener las vueltas como índice y los pilotos como columnas
    # Esto nos da la matriz perfecta de quién estaba en qué posición en cada momento
    print("📊 Pivotando matriz de posiciones vuelta por vuelta...")
    pivot_df = df_race_laps.pivot(index='lap', columns='driverId', values='position')
    
    # Renombrar columnas con los códigos de los pilotos (ej: HAM, VER, ANT)
    pivot_df.columns = [driver_map.get(col, f"DRV_{col}") for col in pivot_df.columns]

    # 7. Formatear la estructura JSON para que sea ultra ligera para el navegador
    simulation_timeline = []
    for lap_number in pivot_df.index:
        # Extraer posiciones de la vuelta actual eliminando pilotos que abandonaron (NaN)
        lap_positions = pivot_df.loc[lap_number].dropna().to_dict()
        
        # Convertir las posiciones flotantes a enteros para limpiar el JSON
        cleaned_positions = {driver: int(pos) for driver, pos in lap_positions.items()}
        
        simulation_timeline.append({
            "lap": int(lap_number),
            "positions": cleaned_positions
        })

    # 8. Guardar el archivo JSON final de telemetría compacta
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(simulation_timeline, f, ensure_ascii=False, indent=2)

    print(f"✅ ¡Éxito total! Datos de simulación exportados a: {output_json}")
    print(f"📦 Tamaño de la simulación: {len(simulation_timeline)} vueltas procesadas.")

if __name__ == "__main__":
    main()