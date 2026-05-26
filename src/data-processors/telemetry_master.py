import json
import os
import random

def generate_historical_telemetry():
    print("🏁 [PaddockIntel Engine] Iniciando procesamiento de parrilla masiva (22 Pilotos)...")
    
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
        
        # Generar una base lineal de gaps escalonados para los 22 pilotos en esta vuelta
        for index, driver in enumerate(drivers):
            # El líder (P1) tiene gap 0, los de atrás van acumulando segundos secuencialmente
            if index == 0:
                driver_gap = 0.0
            else:
                # El pelotón se estira más conforme avanza la carrera
                driver_gap = index * (0.3 + (lap * 0.012)) + random.uniform(-0.2, 0.2)
            
            # Dinámica de pedales y velocidades según la posición en la grilla
            if is_pit_lap and index % 4 == 0:  # Simular que algunos entran a boxes en la 34
                speed = 80
                throttle = 10
                brake = 85
                t_mod = -15
            else:
                speed = int(315 + random.uniform(-5, 8) - (index * 0.8))
                throttle = int(90 + random.randint(-5, 10))
                brake = int(random.randint(0, 8))
                t_mod = int(lap * 0.38)

            lap_data["drivers"][driver] = {
                "gap": f"{driver_gap:.3f}s" if driver_gap > 0 else "LEADER",
                "speed": max(80, speed),
                "throttle": min(100, max(0, throttle)),
                "brake": min(100, max(0, brake)),
                "tyres": {
                    "fl": int(90 + t_mod + random.randint(-2, 2)),
                    "fr": int(91 + t_mod + random.randint(-1, 3)),
                    "rl": int(87 + (t_mod * 0.8) + random.randint(-2, 2)),
                    "rr": int(88 + (t_mod * 0.8) + random.randint(-1, 3))
                },
                # Mapeo cartesiano simulado del progreso en la pista
                "pos_pct": round((0.05 + (index * 0.04) + (lap * 0.015)) % 1.0, 4)
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