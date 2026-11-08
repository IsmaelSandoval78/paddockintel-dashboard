# Media pipeline — flujo de un fin de semana de carrera

Cómo pasar del live timing de F1 a los videos de PaddockIntel (3D y tipografía
cinética). El código vive en `media/`; **todos los datos viven fuera del repo**,
en `$PI_DATA_DIR` (default `~/PaddockIntel-Data`). Reorganizado desde el Desktop
el 2026-11-08 (rama `media-pipeline`).

## Las carpetas

```
media/                          (en el repo — solo código)
  recorder/   graba el live timing y exporta CSVs (FastF1)
  pipeline/   grabación → CSVs → session.json / cars.json
  3d/         template Three.js + Vite (carrera y clasificación)
  kinetic/    tipografía cinética: kinetic.html + stories + render.py

~/PaddockIntel-Data/            (fuera del repo — datos)
  recordings/   grabaciones .txt del live timing
  sessions/     CSVs decodificados, zips y session.json de archivo
  renders/      videos terminados (y renders/referencias/ con los clips de referencia)
  music/        PaddockIntel Decoded.wav y ediciones
  cache/        caché de FastF1 (se regenera solo, se puede borrar)
```

Para usar otra ubicación de datos: `export PI_DATA_DIR=/otra/ruta` antes de
correr cualquier script. Sin la variable, todo usa `~/PaddockIntel-Data`.

## Secretos — regla fija

El token de F1 TV vive en `~/.f1tv_token` y/o `~/.local/share/fastf1/f1auth.json`
(carpeta home, **nunca** dentro del repo ni de `media/`). `media/recorder/f1tv_auth.py`
solo lo lee en runtime. Si un token se pega por accidente en un chat, pantalla o
commit: rotarlo de inmediato (regla de `docs/advisors/CYBERSECURITY-EXPERT.md`).

## 0. Antes del fin de semana — renovar el login de F1 TV

El token caduca. Verificar y renovar (una vez por fin de semana alcanza):

```bash
cd media/recorder
.venv/bin/python -m fastf1 auth f1tv --status        # ¿sigue válido?
.venv/bin/python -m fastf1 auth f1tv --authenticate  # si no, abre el login en el navegador
```

Primera vez en una máquina nueva: `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`
(desde `media/recorder/`). Sin login, la grabación puede salir vacía o parcial
(un .txt menor a ~50 KB al final de una sesión es la señal típica).

## 1. Grabar cada sesión

Automático para todo el fin de semana (lee el calendario oficial):

```bash
cd media/recorder
.venv/bin/python race_weekend.py --dry-run   # muestra qué grabaría y cuándo — probar SIEMPRE primero
.venv/bin/python race_weekend.py             # espera cada sesión y la graba
```

Una sesión suelta, a mano (arrancar unos minutos antes):

```bash
.venv/bin/python record_session.py --label sao-paulo-2026-race --minutes 180
```

Las grabaciones quedan en `~/PaddockIntel-Data/recordings/`. Si se corta la
conexión, el script se reconecta y sigue en el mismo archivo.

## 2. Después de cada sesión — decodificar

```bash
python3 media/pipeline/decode_recording.py \
  ~/PaddockIntel-Data/recordings/<fecha>_<gp>-qualifying.txt \
  ~/PaddockIntel-Data/sessions/<gp>-quali
```

Deja CSVs (laps, results, telemetry, race control, weather) + un zip en
`~/PaddockIntel-Data/sessions/`. Alternativa cuando la sesión ya terminó y F1
ya publicó los datos: `export_session.py <año> <gp> <sesión>` (descarga vía
FastF1, mismo destino).

## 3a. Video 3D (clasificación)

```bash
python3 media/pipeline/build_session.py \
  ~/PaddockIntel-Data/sessions/<gp>-quali \
  media/3d/data/session.json \
  "São Paulo Grand Prix 2026" "Autódromo José Carlos Pace" "Saturday, November 7, 2026" \
  "Frase opcional del capítulo de la parrilla."
# sanciones FIA post-quali, si las hay:  --penalties=RUS=5,HAM=back
cd media/3d && npm install && npm run dev   # npm install solo la primera vez
```

Abrir `http://localhost:5173/?session=q&vertical=1&autoplay=1&clean=1` y grabar
la pantalla (`Mayús + Cmd + 5`). Detalle completo: `media/pipeline/README.md` y
`media/3d/LEEME.md`. Para la carrera: `extract_cars.py` regenera
`data/cars.json`/`telemetry.json` (ver `media/pipeline/README.md`).

## 3b. Video de tipografía cinética

```bash
cd media/kinetic
# primera vez: python3.13 -m pip install playwright imageio-ffmpeg && python3.13 -m playwright install chromium
python3.13 render.py kinetic.html ~/PaddockIntel-Data/renders/<nombre>.mp4 \
  --story story-<tema>.json \
  --music ~/PaddockIntel-Data/music/"PaddockIntel Decoded.wav" --music-start 22.646
```

Las historias (`story-*.json`) son el único archivo a editar por video — el
motor `kinetic.html` no se toca. Guía del formato: `media/kinetic/GUIA-TEMPLATE.md`.

## 4. Publicar

Los MP4 terminados van a `~/PaddockIntel-Data/renders/` — nunca al repo (el
`.gitignore` bloquea `*.mp4`/`*.mov`/`*.wav`). De ahí salen a redes a mano.

## Reglas de datos (gate de DATA-EXPERT.md — obligatorio)

- **Nada de datos inventados.** Cada cifra de un video (tiempos, gaps, posiciones,
  sectores) sale de la grabación del live timing o de FastF1/fuentes verificadas —
  nunca de memoria ni "aproximada".
- **Resultados provisionales se marcan como provisionales.** La clasificación del
  domingo no es oficial hasta que la FIA la confirma; las sanciones post-sesión
  no vienen en la grabación — agregarlas con `--penalties` solo cuando la FIA las
  publica, no antes.
- **Verificar antes de publicar:** la pole, el ganador y los gaps del video se
  cruzan contra una fuente externa (Formula1.com) antes de subir nada a redes —
  mismo criterio que `scripts/load_race.py` (ver `docs/ROADMAP-SEMANA.md`, caso Monza).
- El feed de live timing es extraoficial y pertenece a Formula 1: válido para
  análisis personal y uso editorial; revisar los términos de F1 antes de construir
  productos pagos encima.
- Supabase sigue siendo la autoridad del sitio web: este pipeline alimenta
  **videos**, no la base de datos del Hub (eso es `scripts/load_race.py`).
