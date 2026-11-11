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
  renders/      videos terminados
  references/   clips de referencia de motion + NOTES.md (catálogo y vocabulario de recursos)
  music/        PaddockIntel Decoded.wav y ediciones
  audios/       narraciones por GP (un archivo por capítulo) + guion
  cache/        caché de FastF1 (se regenera solo, se puede borrar)
```

**Regla fija de referencias:** todo video nuevo (o revisión de formato) empieza
revisando `~/PaddockIntel-Data/references/` y su `NOTES.md` — ahí vive el catálogo
de clips con el vocabulario de recursos visuales (qué mecánica aporta cada clip y
cómo se aplica). Las nuevas referencias se agregan a esa carpeta y se catalogan en
el `NOTES.md` antes de usarse.

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

## 3c. Mural de carrera (formato insignia)

Un solo póster gigante (2160×4320, negro/blanco/amarillo) con TODA la carrera, y la
cámara contando la historia: gancho en el frame 0, pista en neón al compás, la
escalada en regla, podio, y zoom-out final que revela el mural completo. Motor:
`media/kinetic/mural.html` (no se toca por carrera); datos: un story JSON generado
desde el `race_story.json` de la grabación.

```bash
# 1. datos (tras decodificar la carrera y generar race_story.json + race.json 3D):
cd media/kinetic
python3 ../pipeline/build_mural_story.py \
  ~/PaddockIntel-Data/sessions/<AÑO-gp>-R/race_story.json \
  --track ../3d/data/race.json \
  --title "LAS VEGAS" --circuit "LAS VEGAS" --year 2026 \
  # líneas editoriales (opcionales, verificadas antes):
  --hook-tag "..." --chip "..." --note "..." \
  --out story-<gp>-mural.json

# 2. OBLIGATORIO antes de renderizar — valida que el protagonista de cada parada
#    quede completo dentro del área segura (falla con lista si no):
python3 check_mural.py story-<gp>-mural.json            # 9:16 (por defecto)
python3 check_mural.py story-<gp>-mural.json --fmt 16x9 # si va a YouTube/X

# 3. video (42s, 9:16 por defecto; 16x9 con ?fmt=16x9 en la URL del story):
python3.13 render.py mural.html ~/PaddockIntel-Data/renders/<gp>-mural.mp4 \
  --story story-<gp>-mural.json \
  --music ~/PaddockIntel-Data/music/"PaddockIntel Decoded.wav" --music-start 22.646

# 4. póster estático (9:16 Stories/TikTok + 4:5 feed IG/X):
python3 export_mural_still.py story-<gp>-mural.json ~/PaddockIntel-Data/renders/<gp>-mural
```

El builder calcula todo de los datos (gancho = mayor remontada, stats, estrategia,
liderato, podio con gaps); los flags `--hook-tag/--chip/--note` son las únicas
líneas editoriales y pasan por el gate de DATA-EXPERT como cualquier claim. Si el
`race_story.json` trae sección `provisional`, el builder lo avisa: no marcar nada
como final sin la clasificación FIA.

**Reglas del formato (legibilidad móvil + zonas seguras):**

- Un solo dato protagonista por parada de cámara, COMPLETO en el encuadre con
  ≥60 px de margen a cada lado. Si no cabe, la cámara se aleja.
- Palabras largas a dos líneas ("SÃO / PAULO", "NORRIS / WINS.", "EVERY F1
  SESSION, / IN DATA."); los cortes de palabra solo se permiten con la cámara en
  movimiento, nunca durante una pausa de lectura (los elementos de cada zona
  aparecen cuando su cámara llega, para no quedar cortados en otras paradas).
- Texto que debe leerse: ≥48 px de alto en pantalla (sobre 1080 de ancho);
  etiquetas secundarias ≥36 px. Lo que no llegue, se quita o se agranda.
- Cada parada de cámara se queda quieta ≥1.5 s.
- Zonas seguras TikTok/Reels/Shorts (9:16): nada importante en los 320 px
  inferiores ni en los 160 px de la derecha (`x<920, y<1600` en pantalla).
  `window.checkStops()` en `mural.html` lo valida; `check_mural.py` lo corre.
- Cierre: los últimos ~3 s el mural completo quieto + barra CTA
  ("EVERY F1 SESSION, IN DATA · SUBSCRIBE") fuera de las zonas seguras.
- El frame 0 es la portada: el gancho completo y legible dentro de la franja
  central (Instagram recorta la cuadrícula a 3:4) — nunca un fundido.
- Formatos: 9:16 (1080×1920, por defecto) para Shorts/TikTok/Reels; 16:9
  (`?fmt=16x9`) para YouTube/X con cámara auto-encuadrada por parada. Pósters
  estáticos en 9:16 y 4:5.

## 3d. Episodio largo con narración (mural 16:9)

Versión de ~2:30 del mural con la narración de Ismael: muro de 2 filas × 5 zonas
(7700×4330, aspecto 16:9) leído como un cómic, cada dato aparece en el instante en
que la voz lo dice, subtítulos grandes y zoom-out final (el muro es el póster).
Motor: `media/kinetic/mural-episode.html`.

**Las narraciones viven en `~/PaddockIntel-Data/audios/<GP>/` — un archivo por
capítulo** (`1 - Hook.mp3`, `2 - …`), junto al guion (`*-voiceover-script.md`).
Estructura de 13 capítulos (muro de 3 filas × 5 zonas): Hook, Circuito, Salida,
Liderato, Neumáticos, Remontada, Bandera, Movers (los que más ganaron/perdieron),
Brazil's Day (locales/debuts), Abandonos, Comisarios, Campeonato, Cierre.
La música es la canción completa (`PaddockIntel Decoded.wav`, 3:02) sin recortar:
el video dura lo que el track y termina con su final natural.

Flujo (cada cifra del guion se verifica contra la grabación antes de grabar):
1. Normalizar capítulos a −16 LUFS + limitador −1 dB
   (iterar ganancia + `alimiter`; ver sesión São Paulo).
2. Transcribir con timestamps por palabra (`faster-whisper`, modelo base.en) y
   corregir nombres propios en el builder (mapa FIXES).
3. Plan de montaje: capítulos anclados al compás (106.06 BPM), gaps de 2–4 s para
   las revelaciones, música en secciones cortadas en compás que terminan con el
   final natural del track.
4. `media/pipeline/build_episode_story.py --mural <story-mural> --plan <plan>
   --transcripts <transcripts> --texts <texts-episodio.json> --out <story>`
5. `check_mural.py <story> --page mural-episode.html` (obligatorio; checker v2,
   ver reglas abajo).
6. Mezcla: voz en offsets + música con ducking −12 dB (rampas 0.3 s) + mezcla
   final a ~−14 LUFS con limitador a **−1 dBTP** (verificar con
   `ebur128=peak=true`, no asumir que el limitador aterrizó donde se pidió).
7. `render.py mural-episode.html <out>.mp4 --story <story> --music <mix>.wav
   --music-start 0`

**Reglas de encuadre del episodio (checker v2 — `window.checkStops()` las mide
en un fotograma a mitad de cada parada y lista las que fallen):**

- El bloque protagonista (dato + contexto) llena **≥60 % del ancho o ≥50 % del
  alto** del encuadre; la cámara se acerca por parada hasta conseguirlo.
- La cifra protagonista mide **≥280 px** de alto en 1920×1080; todo texto que
  deba leerse, **≥44 px**.
- Nada de zonas negras vacías en las paradas: los datos que aún no se dijeron
  se marcan con guías punteadas (ref canvas & frames) que se desvanecen cuando
  la voz llega al dato; los pasillos entre zonas llevan deco (puntos/reglas).
- Subtítulos grandes (92 px, con auto-ajuste si la frase es larga), centrados
  abajo con fondo semitransparente; el bloque protagonista no invade su banda.
- **Cada capítulo usa al menos un recurso del vocabulario de referencias**
  (`~/PaddockIntel-Data/references/NOTES.md`), sin repetir el mismo en dos
  capítulos seguidos; las transiciones también salen de las referencias
  (desvíos de cámara del one-canvas + paneles que barren y re-encuadran).
  Antes de renderizar: tabla capítulo → recurso → clip → dato.

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
