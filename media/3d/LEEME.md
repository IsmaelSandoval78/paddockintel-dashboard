# PaddockIntel 3D — "Two Winners"

Una página 3D que se recorre con el scroll y cuenta el Gran Premio de México
2026 en siete capítulos. La historia y sus textos salen de `data/race.json`;
el movimiento de los 22 autos sale de `data/cars.json`, sacado de la
grabación en vivo de la carrera.

## Cómo abrirla

1. Abre la Terminal y escribe: `cd ~/Desktop/paddockintel-3d`
2. Escribe: `npm run dev`
3. Abre en el navegador la dirección que aparece: **http://localhost:5173/**
4. Baja con la rueda del ratón o el trackpad. Para cerrarla, pulsa `Ctrl + C`
   en la Terminal.

## Los dos modos para grabar

| Dirección | Qué hace |
| --- | --- |
| `http://localhost:5173/` | Normal, a pantalla completa. |
| `http://localhost:5173/?vertical=1` | Marco vertical 9:16, para vídeo de móvil. |
| `http://localhost:5173/?autoplay=1` | Recorre los 7 capítulos solo, en unos 45 segundos. |
| `http://localhost:5173/?vertical=1&autoplay=1` | Los dos a la vez: lo que necesitas para grabar un vertical sin tocar el ratón. |
| `http://localhost:5173/?clean=1` | Modo limpio para grabar: solo titular, texto y un velocímetro pequeño (sin tiempo, comisarios, neumáticos ni vueltas). Se combina con los otros, p. ej. `?clean=1&autoplay=1`. |

Para grabar la pantalla en el Mac: `Mayús + Cmd + 5`. Elige "Grabar porción
seleccionada", ajusta el recuadro al marco claro de la página, dale a grabar y
recarga la página con autoplay. La animación empieza sola 1,2 segundos después
de cargar.

## Plantilla de clasificación

`http://localhost:5173/?session=q` abre la versión de clasificación, que lee
todo de `data/session.json` (seis capítulos: pole, eliminados Q1→Q2→Q3, tres
vueltas a la vez, sectores, margen P1–P2 y parrilla). Funciona con los mismos
modos: `&vertical=1`, `&autoplay=1`, `&clean=1`. Cómo regenerar el archivo
cada sábado: `scripts/README.md`.

## Los siete capítulos

1. **TWO WINNERS.** — plano general, órbita lenta alrededor del circuito, con
   el nombre del autódromo pintado en el interior del trazado.
2. **LIGHTS OUT.** — la parrilla en la recta principal; las cinco luces rojas
   se encienden y se apagan, y Max sale disparado.
3. **LAP 28. KIMI LEADS.** — cámara baja por delante de la estela turquesa.
4. **RED FLAG.** — todo se tiñe de rojo, la cámara se inclina y las estelas
   se congelan.
5. **LAP 48. P3.** — picado cenital; las posiciones reales vuelta a vuelta se
   levantan del suelo como tres líneas.
6. **0.799s** — cámara trasera detrás de Max con Hamilton pegado; el número se
   descompone hasta quedarse en 0.799.
7. **CAMPIONE.** — vuelta al plano general con confeti verde, blanco y rojo,
   los colores de Italia, por el título de Antonelli.

## Qué hay en cada archivo

```
index.html        la página y las tipografías (Anton + JetBrains Mono)
data/race.json    la historia: trazado, capítulos, gráfico y colores
data/cars.json    cuánto ha avanzado cada uno de los 22 autos, segundo a segundo
data/telemetry.json  velocidad, marcha, acelerador y freno de Max
scripts/extract_cars.py  genera cars.json a partir de la grabación en vivo
src/main.js       junta todo y dibuja cada fotograma
src/scene.js      cámara, luces, niebla, suelo y fondo crema
src/track.js      el trazado: curva, cinta azul, bordillos tricolor, meta
src/sweep.js      utilidad de geometría para extruir la cinta y los bordillos
src/field.js      lee cars.json: dónde está cada auto en cada momento
src/trails.js     las estelas: VER, ANT y HAM brillantes, el resto más suaves
src/props.js      semáforo, rótulo del circuito, gráfico, confeti, tinte rojo
src/story.js      la coreografía: scroll, línea de tiempo y planos de cámara
src/ui.js         los títulos, el efecto de letras y el texto de cada capítulo
src/post.js       el acabado: halo, trama de puntos, grano y papel crema
src/style.css     el diseño de los textos sobre la escena
```

## Si quieres cambiar algo

- **Los textos de los capítulos**: `data/race.json`, apartado `chapters`.
- **Lo que dura cada capítulo**: en `src/story.js`, cada capítulo ocupa una
  unidad de la línea de tiempo (el capítulo 3 va de 2 a 3, por ejemplo).
- **Dónde se coloca cada texto**: la lista `PLACEMENT` al principio de
  `src/ui.js`.
- **La fuerza del grano y de la trama**: los valores `uGrain` y `uHalftone`
  en `src/post.js`.
- **Los colores de los bordillos**: la lista `kerbColors` en `src/track.js`
  (verde, blanco y rojo, como la bandera de México).
- **Los colores del confeti**: la lista `flag` dentro de `createConfetti`
  en `src/props.js` (la bandera de Italia).
- **El rótulo del interior del circuito**: `createCircuitLabel` en
  `src/props.js`. Se desvanece cuando la cámara baja a la parrilla; ese
  momento se ajusta con el tween de `circuitName` en `src/story.js`.

## Los 22 autos reales

Los autos se colocan con sus diferencias reales en pista sacadas de la
grabación del 1 de noviembre. La historia decide dónde está el líder en
cada plano, y el resto se sitúa detrás a su distancia real.

- La estela de cada auto es tan larga como rápido va: en la parrilla y con
  bandera roja se ven como puntos.
- Los autos se alternan a izquierda y derecha de la cinta según su posición,
  como en la parrilla. La señal de la F1 coloca a todos sobre una misma línea
  central, así que no hay datos reales de la posición lateral.
- Si un auto abandona, se desvanece.
- Para regenerar los datos desde otra grabación:
  `python3 scripts/extract_cars.py <archivo-de-la-grabación.txt>`

## Banderas y vueltas

Abajo a la derecha, desde el capítulo 2, aparece la vuelta en curso
("LAP 28 / 71") y la bandera de ese momento real de la carrera:
SAFETY CAR, VSC, YELLOW, RED FLAG o CHEQUERED (con la pista en verde no se
muestra nada). Con Safety Car o VSC la cinta del circuito se pone amarilla.

- Los momentos salen de la grabación (`track_status` en `data/cars.json`):
  VSC en la vuelta 7, Safety Car al final de la 43, bandera roja en la 44,
  Safety Car en la 58.
- El capítulo 4 se detiene justo después de la bandera roja real, para que el
  tinte rojo y el dato coincidan.
- El amarillo de la pista es `ribbonYellow` en `createRedFlag`
  (`src/props.js`); los colores de la etiqueta están en `src/style.css`
  (`.race-flag`).

## Llantas

Encima del marcador de vuelta hay un panel **TYRES** con una barra por
protagonista (VER, ANT, HAM). Cada barra son las 71 vueltas, pintadas con el
compuesto que llevaba: rojo = blando (soft), amarillo = medio (medium). Una
línea avanza con la carrera mientras haces scroll, y a la derecha de cada barra
aparece la llanta que lleva puesta y cuántas vueltas lleva con ella ("12L").

- Los datos vienen de la grabación (`tyres` de cada auto en `data/cars.json`).
- Max: medios 1–27, blandos 28–45, blandos 46–71. Kimi: blandos 1–43, medios
  44–45, blandos 46–71. Hamilton: blandos 1–28, medios 29–44, blandos 45 y
  46–71. El cambio de la vuelta 46 fue durante la bandera roja.
- Qué pilotos salen: la lista `TYRE_DRIVERS` al principio de `src/ui.js`.
- Colores y tamaño del panel: `.hud-tyres` y `.stint` en `src/style.css`.

## Comisarios (penalizaciones)

Encima de las llantas hay un panel **STEWARDS** con las decisiones de los
comisarios, en el momento real en que se anunciaron (la más reciente arriba):

- Pastilla roja **+5s / +10s**: penalización. Cuando el piloto la cumple en su
  parada, se vuelve hueca con una ✓.
- Recuadro **no action**: incidente investigado sin castigo. Solo se muestran
  los que tocan a Max, Kimi o Hamilton (el toque HAM/VER en la curva 1 y la
  supuesta salida en falso de Max).
- Las penalizaciones: Leclerc +5s (vuelta 12), Russell +10s (13), Pérez +5s
  por velocidad en pits (46) y Hülkenberg +10s (51).
- Cuántas filas se ven: `STEWARD_ROWS` en `src/ui.js` (en vertical, 2).
- Los textos cortos de cada motivo: la lista `REASONS` en `src/ui.js`.
- Los datos: `stewards` en `data/cars.json`, sacados de los mensajes de
  dirección de carrera.

## Velocímetro de Max

Arriba a la derecha, desde el capítulo 2, un velocímetro con la telemetría
real de Max: velocidad (el arco y el número), marcha, acelerador (barra
turquesa) y freno (barra roja). En vertical se convierte en una sola línea
encima de los comisarios.

- Como la historia mueve el coche libremente, el velocímetro enseña la
  velocidad real que llevaba Max **en ese punto exacto de la pista** en la
  vuelta que se está contando: en las rectas sube a más de 300 y en las curvas
  baja. Con Safety Car, VSC o bandera roja enseña el momento real (por eso en
  la bandera roja va despacio camino de boxes).
- De quién es: `SPEEDO_DRIVER` en `src/ui.js`. Para otro piloto hay que
  añadirlo antes a la lista `TELEMETRY` de `scripts/extract_cars.py` y
  regenerar los datos.
- El tope del arco: `SPEED_MAX` en `src/ui.js` (360 km/h).
- Los datos: `data/telemetry.json` (4 muestras por segundo).

## Clima

Arriba a la izquierda, debajo de PADDOCK·INTEL, desde el capítulo 2, una línea
con el tiempo real de la estación meteorológica del circuito:

- **AIR**: temperatura del aire (unos 24–25 °C toda la carrera).
- **TRACK**: temperatura de la pista, con una pequeña curva roja de toda la
  carrera y un punto que avanza con el scroll. La pista se enfrió de unos
  48 °C en la salida a 34 °C al final.
- **HUM**: humedad. **WIND**: viento en m/s, con una flecha hacia donde sopla.
- **hPa**: presión. Unos 784 hPa, muy por debajo de los ~1013 del nivel del
  mar, porque el circuito está a 2.240 m de altura (en vertical no se muestra).
- Si lloviera aparecería **RAIN** (en esta carrera no llovió).
- Los datos: `weather` en `data/cars.json`. Las lecturas de 0 °C son fallos
  del sensor y se ignoran.
- Diseño: `.hud-weather` en `src/style.css`.

## Publicarla

`npm run build` deja la página lista en la carpeta `dist/`, que se puede subir
a cualquier alojamiento web estático.

## Dónde lo dejamos (5 de noviembre de 2026)

El prototipo está terminado y funcionando: los siete capítulos, los dos modos
de grabación, a 60 fps, y `npm run build` compila sin errores.

Todo está guardado en el historial de Git. Si algún día tocas algo y lo rompes,
desde la Terminal, dentro de la carpeta del proyecto:

```
git status          # ver qué has cambiado
git restore .       # deshacer TODOS los cambios y volver al último punto guardado
```

### Cosas que dejamos abiertas, por si quieres retomarlas

1. **Bordillos y confeti comparten paleta.** Los bordillos son verde, blanco y
   rojo (México) y el confeti también (Italia). No choca porque aparecen en
   momentos distintos, pero si quieres diferenciarlos, lo más limpio es
   devolver los bordillos a rojo y blanco.
2. **Cuándo desaparece el nombre del circuito.** Ahora se va mientras la cámara
   baja a la parrilla. Si lo quieres exactamente en el momento en que se apagan
   las luces, en `src/story.js` cambia el `0.75` del tween de `circuitName`
   por `1.5`.
3. **Los textos están en inglés** porque vienen tal cual de `data/race.json`.
   Si los quieres en español, se cambian ahí y la página los recoge sola.
