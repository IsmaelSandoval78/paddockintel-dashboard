# Guía del template cinético 3D

## Los archivos
| Archivo | Para qué sirve |
|---|---|
| `kinetic.html` | El **motor**. Nunca hace falta tocarlo. Reproduce cualquier historia. |
| `story-mercedes.json` | Una **historia**: textos, colores, tiempos y movimientos. Para hacer otro vídeo, duplica este archivo y cambia el texto. |
| `render.py` | Convierte una historia en MP4 (ahora acepta `--story`). `render-original.py` es la copia sin tocar. |
| `mercedes-9.html` | El original, intacto. |

## Ver una historia en tiempo real (sin renderizar)
1. Abre `kinetic.html` en Chrome (doble clic).
2. Arrastra encima el archivo `story-….json`. Empieza a reproducirse.
3. Clic = pausa. Flechas ← → = moverte 1 segundo. Abajo a la izquierda ves el segundo y el **beat** (útil para ajustar tiempos).

## Renderizar el vídeo
```
cd ~/Desktop/kinetic-kit
python3.13 render.py kinetic.html mi-video.mp4 --story story-mercedes.json --hold 22.5 --music PaddockIntel_Decoded.wav --music-start 22.646
```
La duración la toma de la historia (`"seconds"`). Tarda unos minutos: las transiciones 3D son más pesadas.

## Cómo está hecha una historia
Todo el tiempo se mide en **beats** (1 beat = 0,566 s a 106,06 BPM). Así los cortes siempre caen con la música.

```json
{
  "bpm": 106.06, "seconds": 24,
  "colors": { "ink": "#0E0E0E", "paper": "#F4F2EE", "accent": "#00A19B", "grey": "#BDB8AE" },
  "scenes": [ { ...póster 1... }, { ...póster 2... } ]
}
```
Los colores se usan por nombre: `"color": "accent"`. Para cambiar el color de acento de todo el vídeo cambias una sola línea.

### Un póster (escena)
| Campo | Qué hace |
|---|---|
| `beats` | Cuánto dura. |
| `elements` | Los textos (ver abajo). |
| `enter` | Cómo **entra** este póster (y cómo sale el anterior). |
| `exit` | La zambullida dentro de una letra al final (`dive`). |
| `camera` | Movimientos de cámara dentro del póster (zoom, subir/bajar, inclinar). |
| `float` | Balanceo 3D suave en grados (1 a 1,5 queda bien). Hace que las capas se separen en profundidad. |

### Entradas (`enter`)
**Planas (las del original):**
- `"ink"`: sale de negro (después de entrar en el trazo de una letra).
- `"slam"`: llega grande y golpea (`"from": 1.5`).
- `"settle"`: se asienta suavemente (`"from": 1.25`).

**3D nuevas:**
- `"cube"`: los dos pósters son caras de un cubo que gira. `"dir"`: `left`, `right`, `up` o `down`.
- `"flip"`: el póster se da la vuelta como una carta y detrás está el siguiente.
- `"fly"`: la cámara vuela hacia delante; el póster viejo pasa a tu lado y el nuevo llega desde el fondo. `"twist"` lo gira en grados; `"depth"` fija desde cuán lejos viene.
- `"door"`: el póster se abre como una puerta hacia ti.
- `"fold"`: el póster cae hacia atrás como una hoja y revela el siguiente.

Todas aceptan `"beats"` (duración; 1,5 es un buen valor).

### Zambullida en una letra (`exit`)
```json
"exit": { "type": "dive", "target": "nueve", "char": 0, "aim": "ink", "zoom": 60, "beats": 1.77, "roll": 14 }
```
- `target`: el `id` del texto. `char`: qué letra (0 = la primera).
- `aim`: `"ink"` entra en el trazo y la pantalla se queda negra; `"hole"` entra por el hueco (0, 6, 8, 9, A, O, B, D…) y se queda blanca. El punto se busca solo.
- `roll`: la cámara gira sobre sí misma mientras entra. `tilt`: la letra se inclina en 3D a mitad del viaje.

### Textos
```json
{ "text": "ANTONELLI", "size": 184, "x": 44, "y": 1010, "z": 120,
  "anim": { "from": "right", "at": 1.4, "dur": 0.88 } }
```
- `x`, `y`: posición en píxeles del lienzo de 1080×1920. `y` es la línea base de la letra.
- `weight`: 900 (negra) o 500 (fina). `align`: `left`, `right` o `center`. `color`. `outline`: grosor de contorno (letra hueca).
- **`z` = profundidad.** Positivo = más cerca de ti. En reposo el texto queda exactamente donde lo pusiste; al girar la cámara o al zambullirse, las capas cercanas se mueven más y pasan por delante de ti. Valores buenos: −150 a 260. Usa pocos valores distintos (2–3 por póster), porque cada capa hace más lento el render.
- `anim.from`: `left`, `right`, `up`, `down` (deslizar), `fade` (aparecer), `flip` (se levanta girando en 3D), `depth` (llega desde delante de la cámara), `slam`. `at` = beat en que empieza, `dur` = duración en beats.

### Filas cinéticas (`rows`) y tabla (`table`)
Mira los ejemplos en `story-mercedes.json`. En `rows`, `"from": "alternate"` hace que entren alternando izquierda/derecha, una cada `every` beats. Sin `from` quedan quietas (como "THE WAIT").

### Cámara dentro del póster
```json
"camera": [ { "at": 7.78, "zoom": 1, "y": 960 },
            { "at": 9.2, "zoom": 0.62, "y": 1930, "rx": 32, "ry": -10 },
            { "at": 10.6, "zoom": 0.85, "y": 2900, "rx": 0, "ry": 0 } ]
```
Cada línea es una posición en un beat; el motor viaja suavemente de una a otra. `y` mueve la cámara hacia abajo por el póster (puede ser más alto que 1920). `rx` inclina el póster hacia atrás y `ry` lo gira de lado (en grados).

## Motion blur
Es automático. Cuando algo se mueve rápido (zoom, giro de cubo, vuelo), cada fotograma mezcla 8 sub-imágenes, igual que en el original.

## Piezas nuevas (sacadas de los vídeos de `referencias/`)
Ejemplo completo de las cuatro en `story-mercedes-brasil.json`.

### Bordeado de color en un texto (`trace`)
```json
{ "text": "9", "size": 1500, "x": 20, "y": 1500,
  "trace": { "colors": ["accent", "silver"], "at": 0, "dur": 1.8, "gap": 0.35, "width": 26, "fillAt": 2.4 } }
```
Los contornos se dibujan solos, uno detrás de otro: el primer color es el más grueso. Después aparece el relleno (`fillAt`, en beats desde `at`). Pon `"fill": false` para dejar solo el contorno.

### Rueda de años (`wheel`)
Una lista curva en 3D que gira hasta cada opción. La opción elegida se marca con una caja de color y, a la izquierda, se presenta en grande con el bordeado de color.
- `items`: `["2014", "subtítulo", "color opcional"]`.
- `steps`: la lista de paradas. `{ "at": beat de llegada, "index": cuál, "color": color del bordeado, "move": cuántos beats tarda en girar }`. Con un `move` largo hacia un índice lejano, la rueda pasa rápido por los intermedios (como 2022 a 2025 en gris).
- Se puede zambullir en el año grande final: `"exit": { "type": "dive", "target": "<id de la rueda>", "char": 3, "aim": "hole" }`.

### Circuito (`track`)
Un trazado cerrado que se dibuja con varios colores apilados (`colors` y `widths`, del más grueso al más fino), más un punto (`dot`) que da vueltas. `points` son coordenadas en una caja de unos 1000×800. El de Interlagos es un dibujo **estilizado**: si consigues el trazado oficial en SVG, lo convierto a puntos.

### Transición de baldosas (`"enter": { "type": "tiles" }`)
La pantalla se divide en `cols` × `rows` baldosas que giran en diagonal, una tras otra, y revelan el póster siguiente.
