import json
import os
import random

try:
    import fastf1
    import numpy as np
    FASTF1_AVAILABLE = True
except ImportError:
    FASTF1_AVAILABLE = False
    print("⚠️ Faltan librerías. Ejecuta: pip install fastf1 pandas numpy")

def get_fia_track_svg(event_name):
    if not FASTF1_AVAILABLE: return ""
    try:
        print(f"📡 Descargando telemetría FIA para el trazado de {event_name}...")
        session = fastf1.get_session(2024, event_name, 'Q')
        session.load(telemetry=True, weather=False, messages=False)
        lap = session.laps.pick_fastest()
        
        x = lap.telemetry['X'].values
        y = lap.telemetry['Y'].values
        y = -y 
        
        min_x, max_x = np.min(x), np.max(x)
        min_y, max_y = np.min(y), np.max(y)
        scale = 280 / max(max_x - min_x, max_y - min_y)
        
        x_norm = (x - min_x) * scale + 60
        y_norm = (y - min_y) * scale + 60
        
        path = f"M {x_norm[0]:.1f},{y_norm[0]:.1f} "
        for i in range(1, len(x_norm), 10):
            path += f"L {x_norm[i]:.1f},{y_norm[i]:.1f} "
        path += "Z"
        
        return path
    except Exception as e:
        print(f"❌ Error al generar SVG para {event_name}: {e}")
        return ""

def generate_clean_2026_telemetry():
    if FASTF1_AVAILABLE:
        os.makedirs('data/cache', exist_ok=True)
        fastf1.Cache.enable_cache('data/cache')
        
    print("🏁 [PaddockIntel Engine] Generando base de datos F1 2026...")
    
    circuits_map = {
        "melbourne": {"api_name": "Australia", "title": "ALBERT PARK — <span>MELBOURNE GP</span>"},
        "china": {"api_name": "China", "title": "SHANGHAI INT. CIRCUIT — <span>CHINA GP</span>"},
        "japan": {"api_name": "Japan", "title": "SUZUKA CIRCUIT — <span>JAPAN GP</span>"},
        "miami": {"api_name": "Miami", "title": "MIAMI INT. AUTODROME — <span>MIAMI GP</span>"},
        "montreal": {"api_name": "Canada", "title": "CIRCUIT GILLES-VILLENEUVE — <span>CANADA GP</span>"}
    }
    
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
        "layouts": {},
        "driversDirectory": drivers_2026,
        "data": {}
    }

    for key, info in circuits_map.items():
        svg_path = get_fia_track_svg(info["api_name"])
        master_database["layouts"][key] = {
            "title": info["title"],
            "path": svg_path
        }
    
    for key in circuits_map.keys():
        track_laps = {}
        for lap in range(1, total_laps + 1):
            is_pit_lap = (lap == 34)
            lap_data = {"pitAlert": is_pit_lap, "trackTemp": 36 if key == "montreal" else 42, "drivers": {}}
            
            for index, (d_id, d_info) in enumerate(drivers_2026.items()):
                driver_gap = 0.0 if index == 0 else index * (0.28 + (lap * 0.012))
                base_speed = 325 if key in ["miami", "melbourne"] else 295
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
        master_database["data"][key] = track_laps

    # 📍 NUEVA RUTA DE SALIDA DIRECTA AL FRONTEND
    output_dir = "public/json-api"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "race-telemetry-historical.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(master_database, f, indent=4)
    print("✅ [PaddockIntel Engine] JSON renderizado correctamente en la nueva arquitectura.")

if __name__ == "__main__":
    generate_clean_2026_telemetry()