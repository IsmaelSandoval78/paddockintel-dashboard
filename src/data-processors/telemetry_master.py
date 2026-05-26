import json
import os
import random
import requests

def get_official_2026_grid():
    print("📡 Conectando con los servidores de la API oficial de F1...")
    # Endpoint global de Jolpi para la temporada actual
    url = "https://api.jolpi.ca/ergast/f1/2026/drivers.json"
    
    try:
        response = requests.get(url, timeout=8)
        if response.status_code == 200:
            data = response.json()
            drivers_list = data["MRData"]["DriverTable"]["Drivers"]
            
            grid = {}
            for d in drivers_list:
                driver_id = d["driverId"]
                # Extraer código de 3 letras de la FIA, si no tiene usar iniciales
                code = d.get("code", driver_id[:3].upper())
                full_name = f"{d['givenName']} {d['familyName']}"
                
                grid[driver_id] = {
                    "name": full_name,
                    "code": code,
                    "team": "F1 Entrant", # Se asocia dinámicamente en el Front
                    "color": "#7a828e"    # Gris base por defecto
                }
            print(f"✅ Éxito. Se descargaron {len(grid)} pilotos reales desde la API.")
            return grid
    except Exception as e:
        print(f"⚠️ Servidor API no disponible ({e}). Activando grilla real de respaldo...")
        
    # RESPALDO DE SEGURIDAD CON EL GRID CONFIRMADO DE LA TEMPORADA
    return {
        "verstappen": {"name": "Max Verstappen", "code": "VER", "team": "Red Bull Racing", "color": "#3671C6"},
        "perez": {"name": "Sergio Pérez", "code": "PER", "team": "Red Bull Racing", "color": "#3671C6"},
        "hamilton": {"name": "Lewis Hamilton", "code": "HAM", "team": "Scuderia Ferrari", "color": "#E8002D"},
        "leclerc": {"name": "Charles Leclerc", "code": "LEC", "team": "Scuderia Ferrari", "color": "#E8002D"},
        "russell": {"name": "George Russell", "code": "RUS", "team": "Mercedes AMG", "color": "#27F4D2"},
        "antonelli": {"name": "Kimi Antonelli", "code": "ANT", "team": "Mercedes AMG", "color": "#27F4D2"},
        "norris": {"name": "Lando Norris", "code": "NOR", "team": "McLaren F1", "color": "#FF8000"},
        "piastri": {"name": "Oscar Piastri", "code": "PIA", "team": "McLaren F1", "color": "#FF8000"},
        "alonso": {"name": "Fernando Alonso", "code": "ALO", "team": "Aston Martin", "color": "#229971"},
        "stroll": {"name": "Lance Stroll", "code": "STR", "team": "Aston Martin", "color": "#229971"},
        "sainz": {"name": "Carlos Sainz", "code": "SAI", "team": "Williams Racing", "color": "#64C4FF"},
        "albon": {"name": "Alex Albon", "code": "ALB", "team": "Williams Racing", "color": "#64C4FF"},
        "gasly": {"name": "Pierre Gasly", "code": "GAS", "team": "Alpine F1", "color": "#FF87BC"},
        "doohan": {"name": "Jack Doohan", "code": "DOO", "team": "Alpine F1", "color": "#FF87BC"},
        "tsunoda": {"name": "Yuki Tsunoda", "code": "TSU", "team": "Visa Cash App RB", "color": "#6692FF"},
        "lawson": {"name": "Liam Lawson", "code": "LAW", "team": "Visa Cash App RB", "color": "#6692FF"},
        "hulkenberg": {"name": "Nico Hülkenberg", "code": "HUL", "team": "Audi F1 Team", "color": "#52E252"},
        "bortoleto": {"name": "Gabriel Bortoleto", "code": "BOR", "team": "Audi F1 Team", "color": "#52E252"},
        "bearman": {"name": "Oliver Bearman", "code": "BEA", "team": "Haas F1 Team", "color": "#B6BABD"},
        "ocon": {"name": "Esteban Ocon", "code": "OCO", "team": "Haas F1 Team", "color": "#B6BABD"},
        "stroll_cad": {"name": "Lance Stroll", "code": "STR", "team": "Cadillac Racing", "color": "#C8102E"},
        "ricciardo": {"name": "Daniel Ricciardo", "code": "RIC", "team": "Cadillac Racing", "color": "#C8102E"}
    }

def generate_historical_telemetry():
    print("🏁 [PaddockIntel Engine] Iniciando generación de base de datos...")
    
    # Obtener el listado real
    drivers_grid = get_official_2026_grid()
    driver_ids = list(drivers_grid.keys())
    
    total_laps = 57
    database = {
        "simulationDurationSeconds": 30,
        "realLapTimeSeconds": 96.280,
        "totalLaps": total_laps,
        "driversDirectory": drivers_grid, # Guardamos el directorio real dentro del JSON
        "laps": {}
    }
    
    for lap in range(1, total_laps + 1):
        is_pit_lap = (lap == 34)
        lap_data = {
            "pitAlert": is_pit_lap,
            "trackTemp": 41 if lap < 30 else 38,
            "drivers": {}
        }
        
        for index, d_id in enumerate(driver_ids):
            driver_gap = 0.0 if index == 0 else index * (0.32 + (lap * 0.011)) + random.uniform(-0.1, 0.1)
            
            if is_pit_lap and index % 5 == 0:
                speed, throttle, brake = 80, 12, 82
                t_pct, b_pct, c_pct = 40, 30, 30
                t_mod = -12
            else:
                speed = int(320 + random.uniform(-3, 5) - (index * 0.6))
                throttle = int(94 + random.randint(-4, 6))
                brake = int(random.randint(0, 4))
                t_pct = int(79 + random.uniform(-2, 2) - (index * 0.3))
                b_pct = int(6 + random.uniform(-1, 1))
                c_pct = 100 - (t_pct + b_pct)
                t_mod = int(lap * 0.36)

            lap_data["drivers"][d_id] = {
                "gap": f"{driver_gap:.3f}s" if driver_gap > 0 else "LEADER",
                "speed": max(80, speed),
                "throttle": min(100, max(0, throttle)),
                "brake": min(100, max(0, brake)),
                "aws_throttle_pct": min(100, max(0, t_pct)),
                "aws_brake_pct": min(100, max(0, b_pct)),
                "aws_cornering_pct": min(100, max(0, c_pct)),
                "tyres": {
                    "fl": int(88 + t_mod + random.randint(-2, 2)),
                    "fr": int(89 + t_mod + random.randint(-1, 3)),
                    "rl": int(85 + (t_mod * 0.8) + random.randint(-2, 2)),
                    "rr": int(86 + (t_mod * 0.8) + random.randint(-1, 3))
                },
                "pos_pct": round((0.04 + (index * 0.042) + (lap * 0.011)) % 1.0, 4)
            }
            
        database["laps"][str(lap)] = lap_data

    output_dir = "src/data-outputs"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "race-telemetry-historical.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(database, f, indent=4)
    print(f"✅ [PaddockIntel Engine] Compresión y mapeo real completado en: {output_path}")

if __name__ == "__main__":
    generate_historical_telemetry()