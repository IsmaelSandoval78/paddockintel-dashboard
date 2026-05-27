import json
import os
import random

def generate_clean_2026_telemetry():
    print("🏁 [PaddockIntel Engine] Compilando base de datos histórica F1 2026...")
    
    circuits = ["melbourne", "china", "japan", "miami", "montreal"]
    
    drivers_2026 = {
        "verstappen": {"name": "Max Verstappen", "code": "VER", "team": "Red Bull Racing"},
        "perez": {"name": "Sergio Pérez", "code": "PER", "team": "Red Bull Racing"},
        "hamilton": {"name": "Lewis Hamilton", "code": "HAM", "team": "Scuderia Ferrari"},
        "leclerc": {"name": "Charles Leclerc", "code": "LEC", "team": "Scuderia Ferrari"},
        "russell": {"name": "George Russell", "code": "RUS", "team": "Mercedes AMG"},
        "antonelli": {"name": "Kimi Antonelli", "code": "ANT", "team": "Mercedes AMG"},
        "norris": {"name": "Lando Norris", "code": "NOR", "team": "McLaren F1"},
        "piastri": {"name": "Oscar Piastri", "code": "PIA", "team": "McLaren F1"},
        "alonso": {"name": "Fernando Alonso", "code": "ALO", "team": "Aston Martin"},
        "stroll": {"name": "Lance Stroll", "code": "STR", "team": "Aston Martin"},
        "sainz": {"name": "Carlos Sainz", "code": "SAI", "team": "Williams Racing"},
        "colapinto": {"name": "Franco Colapinto", "code": "COL", "team": "Williams Racing"},
        "albon": {"name": "Alex Albon", "code": "ALB", "team": "Williams Racing"},
        "gasly": {"name": "Pierre Gasly", "code": "GAS", "team": "Alpine F1"},
        "doohan": {"name": "Jack Doohan", "code": "DOO", "team": "Alpine F1"},
        "tsunoda": {"name": "Yuki Tsunoda", "code": "TSU", "team": "Visa Cash App RB"},
        "lawson": {"name": "Liam Lawson", "code": "LAW", "team": "Visa Cash App RB"},
        "hulkenberg": {"name": "Nico Hülkenberg", "code": "HUL", "team": "Audi F1 Team"},
        "bortoleto": {"name": "Gabriel Bortoleto", "code": "BOR", "team": "Audi F1 Team"},
        "bearman": {"name": "Oliver Bearman", "code": "BEA", "team": "Haas F1 Team"},
        "ocon": {"name": "Esteban Ocon", "code": "OCO", "team": "Haas F1 Team"}
    }
    
    total_laps = 57
    master_database = {
        "circuits": circuits,
        "driversDirectory": drivers_2026,
        "data": {}
    }
    
    for track in circuits:
        track_laps = {}
        for lap in range(1, total_laps + 1):
            is_pit_lap = (lap == 34)
            lap_data = {
                "pitAlert": is_pit_lap,
                "trackTemp": 36 if track == "montreal" else 42,
                "drivers": {}
            }
            
            for index, (d_id, d_info) in enumerate(drivers_2026.items()):
                driver_gap = 0.0 if index == 0 else index * (0.28 + (lap * 0.012))
                base_speed = 325 if track in ["miami", "melbourne"] else 295
                speed = int(base_speed + random.uniform(-4, 4) - (index * 0.5))
                
                lap_data["drivers"][d_id] = {
                    "gap": f"{driver_gap:.3f}s" if driver_gap > 0 else "LEADER",
                    "speed": speed if not is_pit_lap else 80,
                    "throttle": int(95 + random.randint(-5, 5)) if not is_pit_lap else 12,
                    "brake": int(random.randint(0, 3)) if not is_pit_lap else 80,
                    "aws_throttle_pct": int(80 - (index * 0.3)),
                    "aws_brake_pct": int(6 + random.randint(-1, 1)),
                    "aws_cornering_pct": int(14 + (index * 0.1)),
                    "tyres": {
                        "fl": int(90 + (lap * 0.34)), "fr": int(91 + (lap * 0.34)),
                        "rl": int(87 + (lap * 0.28)), "rr": int(88 + (lap * 0.28))
                    },
                    "pos_pct": round((0.02 + (index * 0.043) + (lap * 0.011)) % 1.0, 4)
                }
            track_laps[str(lap)] = lap_data
        master_database["data"][track] = track_laps

    output_dir = "src/data-outputs"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "race-telemetry-historical.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(master_database, f, indent=4)
    print("✅ [PaddockIntel Engine] Datos purificados listos.")

if __name__ == "__main__":
    generate_clean_2026_telemetry()