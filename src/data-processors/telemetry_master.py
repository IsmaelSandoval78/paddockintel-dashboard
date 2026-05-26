import json
import os
import random

def generate_historical_telemetry():
    print("🏁 [PaddockIntel Engine] Calculando métricas de rendimiento AWS para 22 pilotos...")
    
    total_laps = 57
    drivers = [
        "verstappen", "antonelli", "leclerc", "norris", "hamilton", 
        "russell", "piastri", "sainz", "perez", "alonso", 
        "gasly", "albon", "tsunoda", "hulkenberg", "bearman", 
        "ocon", "stroll", "ricciardo", "magnussen", "bottas", 
        "zhou", "bortoleto"
    ]
    
    database = {
        "simulationDurationSeconds": 30,
        "realLapTimeSeconds": 96.280,
        "totalLaps": total_laps,
        "laps": {}
    }
    
    for lap in range(1, total_laps + 1):
        weight_advantage = (57 - lap) * 0.015 
        is_pit_lap = (lap == 34)
        
        lap_data = {
            "pitAlert": is_pit_lap,
            "trackTemp": 42 if lap < 30 else 39,
            "drivers": {}
        }
        
        for index, driver in enumerate(drivers):
            if index == 0:
                driver_gap = 0.0
            else:
                driver_gap = index * (0.3 + (lap * 0.012)) + random.uniform(-0.1, 0.1)
            
            if is_pit_lap and index % 4 == 0:
                speed = 80
                throttle = 10
                brake = 85
                # Métricas AWS en Pitlane
                throttle_lap_pct = 45
                heavy_brake_pct = 25
                cornering_lap_pct = 30
                t_mod = -15
            else:
                speed = int(318 + random.uniform(-4, 6) - (index * 0.7))
                throttle = int(92 + random.randint(-4, 8))
                brake = int(random.randint(0, 5))
                # Métricas AWS simuladas de telemetría de carrera estilo Monza/Miami
                throttle_lap_pct = int(78 + random.uniform(-2, 3) - (index * 0.4))
                heavy_brake_pct = int(6 + random.uniform(-1, 2))
                cornering_lap_pct = 100 - (throttle_lap_pct + heavy_brake_pct)
                t_mod = int(lap * 0.38)

            lap_data["drivers"][driver] = {
                "gap": f"{driver_gap:.3f}s" if driver_gap > 0 else "LEADER",
                "speed": max(80, speed),
                "throttle": min(100, max(0, throttle)),
                "brake": min(100, max(0, brake)),
                "aws_throttle_pct": min(100, max(0, throttle_lap_pct)),
                "aws_brake_pct": min(100, max(0, heavy_brake_pct)),
                "aws_cornering_pct": min(100, max(0, cornering_lap_pct)),
                "tyres": {
                    "fl": int(90 + t_mod + random.randint(-2, 2)),
                    "fr": int(91 + t_mod + random.randint(-1, 3)),
                    "rl": int(87 + (t_mod * 0.8) + random.randint(-2, 2)),
                    "rr": int(88 + (t_mod * 0.8) + random.randint(-1, 3))
                },
                "pos_pct": round((0.05 + (index * 0.041) + (lap * 0.012)) % 1.0, 4)
            }
            
        database["laps"][str(lap)] = lap_data

    output_dir = "src/data-outputs"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "race-telemetry-historical.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(database, f, indent=4)
        
    print(f"✅ [PaddockIntel Engine] Mapeo de 22 pilotos completado en: {output_path}")

if __name__ == "__main__":
    generate_historical_telemetry()