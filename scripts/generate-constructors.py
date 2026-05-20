import pandas as pd
import json
import os

def main():
    print("Iniciando generación de datos de constructores...")
    
    # 1. Definir rutas de la nueva arquitectura
    csv_constructors = 'data/constructors.csv'
    csv_standings = 'data/constructor_standings.csv'
    output_js = 'src/js/f1-constructors.js'
    
    # Verificar que los archivos existan antes de avanzar
    if not os.path.exists(csv_constructors) or not os.path.exists(csv_standings):
        print("Error: No se encontraron los archivos CSV en la carpeta 'data/'.")
        return

    # 2. Leer los datos con Pandas
    df_constructors = pd.read_csv(csv_constructors)
    df_standings = pd.read_csv(csv_standings)

    # 3. Encontrar el raceId de la última carrera disputada
    latest_race_id = int(df_standings['raceId'].max())
    print(f"Procesando campeonato de constructores para el raceId: {latest_race_id}")

    # 4. Filtrar las posiciones del campeonato de esa última carrera
    df_latest_standings = df_standings[df_standings['raceId'] == latest_race_id]

    # 5. Fusionar las posiciones con la información de las escuderías (Nombres, refs, etc.)
    merged_data = df_latest_standings.merge(df_constructors, on='constructorId')

    # 6. Ordenar de primer lugar a último lugar
    merged_data = merged_data.sort_values(by='position')

    # 7. Seleccionar solo las columnas limpias que usará tu JS en la web
    final_list = merged_data[['constructorId', 'constructorRef', 'name', 'nationality', 'points', 'position', 'wins']].to_dict(orient='records')

    # 8. Darle estructura de archivo JavaScript exportable
    js_content = f"""// Archivo autogenerado por el pipeline de Paddock Intel - NO EDITAR MANUALMENTE
const f1ConstructorsData = {json.dumps(final_list, ensure_ascii=False, indent=2)};

// Hacerlo disponible si usas módulos o mantenerlo global para JS Vanilla
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = f1ConstructorsData;
}}
"""

    # Asegurar que la carpeta src/js existe
    os.makedirs(os.path.dirname(output_js), exist_ok=True)

    # 9. Guardar el archivo final
    with open(output_js, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"¡Éxito total! Archivo generado en: {output_js}")

if __name__ == "__main__":
    main()