import pandas as pd
import json
import os

def main():
    print("📊 Iniciando motor de telemetría comparativa multi-piloto...")
    
    csv_drivers = 'data/drivers.csv'
    output_json = 'src/data-outputs/lap-comparison.json'
    
    # Base de datos de telemetría de alta fidelidad por sector para el GP de Miami 2026
    # Estos tiempos simulan el desglose exacto de los tres sectores de la pista
    telemetry_matrix = {
        "1": { # Vuelta 1 (Salida caótica desde parrilla)
            "antonelli":  {"s1": 31.420, "s2": 35.650, "s3": 29.810, "total": "1:36.880", "total_ms": 96880},
            "verstappen": {"s1": 30.950, "s2": 35.410, "s3": 29.920, "total": "1:36.280", "total_ms": 96280},
            "norris":     {"s1": 31.850, "s2": 35.910, "s3": 30.120, "total": "1:37.880", "total_ms": 97880},
            "hamilton":   {"s1": 32.110, "s2": 36.050, "s3": 30.450, "total": "1:38.610", "total_ms": 98610},
            "leclerc":    {"s1": 32.450, "s2": 36.210, "s3": 30.620, "total": "1:39.280", "total_ms": 99280}
        },
        "15": { # Vuelta 15 (Ritmo de carrera limpio - Ataque de Kimi)
            "antonelli":  {"s1": 28.310, "s2": 33.250, "s3": 28.182, "total": "1:29.742", "total_ms": 89742},
            "verstappen": {"s1": 28.450, "s2": 33.410, "s3": 28.320, "total": "1:30.180", "total_ms": 90180},
            "norris":     {"s1": 28.650, "s2": 33.580, "s3": 28.410, "total": "1:30.640", "total_ms": 90640},
            "hamilton":   {"s1": 28.810, "s2": 33.720, "s3": 28.550, "total": "1:31.080", "total_ms": 91080},
            "leclerc":    {"s1": 28.750, "s2": 33.690, "s3": 28.490, "total": "1:30.930", "total_ms": 90930}
        },
        "34": { # Vuelta 34 (Ventana de Pit Stops - Degradación y parada)
            "antonelli":  {"s1": 30.110, "s2": 52.450, "s3": 28.620, "total": "1:51.180", "total_ms": 111180},
            "verstappen": {"s1": 29.950, "s2": 54.120, "s3": 28.850, "total": "1:52.920", "total_ms": 112920},
            "leclerc":    {"s1": 29.650, "s2": 51.200, "s3": 28.410, "total": "1:49.260", "total_ms": 109260},
            "hamilton":   {"s1": 29.880, "s2": 51.550, "s3": 28.520, "total": "1:49.950", "total_ms": 109950},
            "norris":     {"s1": 30.450, "s2": 55.110, "s3": 29.120, "total": "1:54.680", "total_ms": 114680}
        },
        "57": { # Vuelta Final (Sprint final a fondo)
            "antonelli":  {"s1": 28.210, "s2": 33.150, "s3": 28.110, "total": "1:29.470", "total_ms": 89470},
            "verstappen": {"s1": 28.320, "s2": 33.220, "s3": 28.190, "total": "1:29.730", "total_ms": 89730},
            "leclerc":    {"s1": 28.450, "s2": 33.390, "s3": 28.310, "total": "1:30.150", "total_ms": 90150},
            "norris":     {"s1": 28.510, "s2": 33.420, "s3": 28.250, "total": "1:30.180", "total_ms": 90180},
            "hamilton":   {"s1": 28.620, "s2": 33.550, "s3": 28.420, "total": "1:30.590", "total_ms": 90590}
        }
    }

    drivers_meta = {
        "antonelli": {"name": "K. Antonelli", "code": "ANT", "color": "#27F4D2"},
        "verstappen": {"name": "M. Verstappen", "code": "VER", "color": "#3671C6"},
        "leclerc": {"name": "C. Leclerc", "code": "LEC", "color": "#E8002D"},
        "norris": {"name": "L. Norris", "code": "NOR", "color": "#FF8000"},
        "hamilton": {"name": "L. Hamilton", "code": "HAM", "color": "#E8002D"}
    }

    output_data = {
        "drivers": drivers_meta,
        "matrix": telemetry_matrix
    }

    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Matrix JSON de comparación creado con éxito en: {output_json}")

if __name__ == "__main__":
    main()