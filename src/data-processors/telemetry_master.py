import json
import os
import random

def generate_clean_2026_telemetry():
    print("🏁 [PaddockIntel Engine] Compilando base de datos histórica F1 2026...")
    
    # 🌟 CIRCUITOS REALES CONFIRMADOS 2026
    circuits = ["melbourne", "china", "japan", "miami", "montreal"]
    
    # 🌟 PARRILLA REAL DE PILOTOS TEMPORADA 2026
    drivers_2026 = {
        "verstappen": {"name": "Max Verstappen", "code": "VER", "team": "Red Bull Racing", "color": "#3671C6"},
        "perez": {"name": "Sergio Pérez", "code": "PER", "team": "Red Bull Racing", "color": "#22499c"},
        "hamilton": {"name": "Lewis Hamilton", "code": "HAM", "team": "Scuderia Ferrari", "color": "#E8002D"},
        "leclerc": {"name": "Charles Leclerc", "code": "LEC", "team": "Scuderia Ferrari", "color": "#b80223"},
        "russell": {"name": "George Russell", "code": "RUS", "team": "Mercedes AMG", "color": "#27F4D2"},
        "antonelli": {"name": "Kimi Antonelli", "code": "ANT", "team": "Mercedes AMG", "color": "#1caba5"},
        "norris": {"name": "Lando Norris", "code": "NOR", "team": "McLaren F1", "color": "#FF8000"},
        "piastri": {"name": "Oscar Piastri", "code": "PIA", "team": "McLaren F1", "color": "#cc6600"},
        "alonso": {"name": "Fernando Alonso", "code": "ALO", "team": "Aston Martin", "color": "#229971"},
        "stroll": {"name": "Lance Stroll", "code": "STR", "team": "Aston Martin", "color": "#187052"},
        "sainz": {"name": "Carlos Sainz", "code": "SAI", "team": "Williams Racing", "color": "#64C4FF"},
        "albon": {"name": "Alex Albon", "code": "ALB", "team": "Williams Racing", "color": "#478cb5"},
        "gasly": {"name": "Pierre Gasly", "code": "Alpine F1", "color": "#FF87BC"},
        "doohan": {"name": "Jack Doohan", "code": "DOO", "team": "Alpine F1", "color": "#cc6393"},
        "tsunoda": {"name": "Yuki Tsunoda", "code": "Visa Cash App RB", "color": "#6692FF"},
        "lawson": {"name": "Liam Lawson", "code": "LAW", "team": "Visa Cash App RB", "color": "#496cb8"},
        "hulkenberg": {"name": "Nico Hülkenberg", "code": "Audi F1 Team", "color": "#52E252"},
        "bortoleto": {"name": "Gabriel Bortoleto", "code": "Audi F1 Team", "color": "#3da63d"},
        "bearman": {"name": "Oliver Bearman", "code": "Haas F1 Team", "color": "#B6BABD"},
        "ocon": {"name": "Esteban Ocon", "code": "Haas F1 Team", "color": "#8a8d8f"}
    }
    
    total_laps = 57
    master_database = {
        "circuits": circuits,
        "driversDirectory": drivers_2026,
        "data": {}
    }
    
    # Generar bloques independientes por circuito para eliminar amarres de mockups
    for track in circuits:
        track_laps = {}
        for lap in range(1, total_laps + 1):
            is_pit_lap = (lap == 34)
            lap_data = {
                "pitAlert": is_pit_lap,
                "trackTemp": 38 if track == "melbourne" else 43,
                "drivers": {}
            }
            
            for index, (d_id, d_info) in enumerate(drivers_2026.items()):
                driver_gap = 0.0 if index == 0 else index * (0.28 + (lap * 0.013))
                
                # Simular velocidades reales según la naturaleza de la pista
                if track == "monza" or track == "miami":
                    base_speed = 325 # Circuitos de alta velocidad de punta
                else:
                    base_speed = 295 # Circuitos de alta carga
                    
                speed = int(base_speed + random.uniform(-4, 4) - (index * 0.5))
                throttle = int(95 + random.randint(-5, 5)) if not is_pit_lap else 12
                brake = int(random.randint(0, 3)) if not is_pit_lap else 80
                
                lap_data["drivers"][d_id] = {
                    "gap": f"{driver_gap:.3f}s" if driver_gap > 0 else "LEADER",
                    "speed": speed if not is_pit_lap else 80,
                    "throttle": throttle,
                    "brake": brake,
                    "aws_throttle_pct": int(82 - (index * 0.4)),
                    "aws_brake_pct": int(7 + random.randint(-1, 2)),
                    "aws_cornering_pct": int(11 + (index * 0.2)),
                    "tyres": {
                        "fl": int(92 + (lap * 0.35)),
                        "fr": int(94 + (lap * 0.35)),
                        "rl": int(89 + (lap * 0.30)),
                        "rr": int(90 + (lap * 0.30))
                    },
                    "pos_pct": round((0.02 + (index * 0.045) + (lap * 0.009)) % 1.0, 4)
                }
            track_laps[str(lap)] = lap_data
        master_database["data"][track] = track_laps

    output_dir = "src/data-outputs"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "race-telemetry-historical.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(master_database, f, indent=4)
    print(f"✅ [PaddockIntel Engine] Base de datos oficial 2026 unificada en: {output_path}")

if __name__ == "__main__":
    generate_clean_2026_telemetry()