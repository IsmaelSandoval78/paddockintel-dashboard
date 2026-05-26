import json
import os
import random
import numpy as np

def generate_historical_telemetry():
    print("🏁 [PaddockIntel Engine] Iniciando procesamiento de telemetría masiva...")
    
    total_laps = 57
    drivers = ["antonelli", "verstappen"]
    
    # Estructura maestra del JSON
    database = {
        "simulationDurationSeconds": 30,
        "realLapTimeSeconds": 96.280,
        "totalLaps": total_laps,
        "laps": {}
    }
    
    # Datos base para simular curvas y rectas a lo largo de la carrera
    # Simulamos degradación de llantas, consumo de combustible y picos de pedales
    for lap in range(1, total_laps + 1):
        # El combustible baja, el coche se hace más rápido (reducción de peso)
        weight_advantage = (57 - lap) * 0.015 
        base_lap_time = 94.5 - weight_advantage
        
        # Degradación de neumáticos (sube la temperatura promedio con las vueltas)
        tyre_wear_factor = lap * 0.4
        
        # Determinar si hay ventana de parada en boxes (Lap 34)
        is_pit_lap = (lap == 34)
        
        lap_data = {
            "pitAlert": is_pit_lap,
            "trackTemp": 42 if lap < 30 else 39, # El clima cambia en carrera
            "drivers": {}
        }
        
        for driver in drivers:
            # Variaciones sutiles por piloto
            if driver == "antonelli":
                speed_mod = random.uniform(1.0, 3.5) if lap > 15 else random.uniform(-2.0, 0.5)
                driver_gap = max(0.0, 5.4 - (lap * 0.09)) if lap < 15 else 0.0
                throttle_base = 92 if not is_pit_lap else 15
                brake_base = 5 if not is_pit_lap else 85
            else: # Verstappen
                speed_mod = random.uniform(0.5, 2.0)
                driver_gap = 0.0 if lap < 15 else (lap - 15) * 0.11
                throttle_base = 95 if not is_pit_lap else 90
                brake_base = 2 if not is_pit_lap else 0
                
            # Simulación termodinámica de las 4 llantas (Front Left, Front Right, Rear Left, Rear Right)
            t_fl = int(90 + tyre_wear_factor + random.uniform(-2, 3))
            t_fr = int(92 + tyre_wear_factor + random.uniform(-1, 4))
            t_rl = int(88 + (tyre_wear_factor * 0.8) + random.uniform(-3, 2))
            t_rr = int(89 + (tyre_wear_factor * 0.8) + random.uniform(-2, 3))
            
            # Forzar enfriamiento en parada de pits
            if is_pit_lap and driver == "antonelli":
                t_fl, t_fr, t_rl, t_rr = 75, 75, 80, 80
                
            lap_data["drivers"][driver] = {
                "gap": f"{driver_gap:.3f}s" if driver_gap > 0 else "LEADER",
                "speed": int(320 + speed_mod if not is_pit_lap else 80),
                "throttle": int(min(100, throttle_base + random.randint(-5, 5))),
                "brake": int(max(0, brake_base + random.randint(-2, 10) if is_pit_lap else brake_base)),
                "tyres": {
                    "fl": t_fl,
                    "fr": t_fr,
                    "rl": t_rl,
                    "rr": t_rr
                },
                "pos_pct": round(random.uniform(0.05, 0.95), 4)
            }
            
        database["laps"][str(lap)] = lap_data

    # Asegurar que el directorio de salida exista
    output_dir = "src/data-outputs"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "race-telemetry-historical.json")
    
    # Guardar los bytes en disco de forma limpia
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(database, f, indent=4)
        
    print(f"✅ [PaddockIntel Engine] Compresión exitosa. Archivo generado en: {output_path}")

if __name__ == "__main__":
    generate_historical_telemetry()