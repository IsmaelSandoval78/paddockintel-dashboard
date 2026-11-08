# Scripts — cómo refrescar los datos

Las grabaciones viven en `$PI_DATA_DIR/recordings` (default `~/PaddockIntel-Data/recordings`).
Estos comandos se corren desde la raíz del repo (`paddockintel-dashboard`).

## Clasificación (`media/3d/data/session.json`) — cada sábado

La plantilla de clasificación (`http://localhost:5173/?session=q`) lee **todo**
de `data/session.json`: nombres, tiempos, colores, forma del circuito y los
textos de los capítulos. Para una nueva clasificación solo hay que regenerar
ese archivo; no se toca código.

1. Grabar la sesión con el recorder (queda en
   `~/PaddockIntel-Data/recordings/AAAA-MM-DD_<gp>-qualifying.txt`).
   Tiene que ser la grabación completa, hasta el final de Q3.
2. Decodificar la grabación a CSV (tarda unos segundos):

       python3 media/pipeline/decode_recording.py ~/PaddockIntel-Data/recordings/<archivo>-qualifying.txt ~/PaddockIntel-Data/sessions/<gp>-quali

3. Construir `media/3d/data/session.json` (el último texto, opcional, es la frase del
   capítulo final de la parrilla):

       python3 media/pipeline/build_session.py ~/PaddockIntel-Data/sessions/<gp>-quali media/3d/data/session.json "São Paulo Grand Prix 2026" "Autódromo José Carlos Pace" "Saturday, November 7, 2026" "Frase opcional para el capítulo de la parrilla."

   Imprime la pole, la diferencia P1–P2, los eliminados y los seis capítulos,
   para revisarlos de un vistazo.
4. Con `npm run dev` abierto (desde `media/3d/`), recargar `http://localhost:5173/?session=q`.

Los títulos y textos de los capítulos están en `chapters` dentro de
`data/session.json`: se pueden editar a mano (en inglés o en español). Cada
capítulo tiene un `kind` (pole, knockout, three_laps, sectors, margin, grid)
que decide qué se ve; se pueden reordenar o quitar.

## Carrera (`media/3d/data/cars.json`, `media/3d/data/telemetry.json`)

Correr desde `media/3d/` para que escriba en su `data/`:

    cd media/3d
    python3 ../pipeline/extract_cars.py ~/PaddockIntel-Data/recordings/<grabación de la carrera>.txt

Tarda unos 3 minutos. No abras la página mientras se regenera.

## Colores de la pista

`session.json` puede llevar una clave `theme` con el color de la pista y los
colores de los bordillos (se alternan en ese orden):

    "theme": { "track": "#1d1f24", "kerbs": ["#009C3B", "#FFDF00"] }

`build_session.py` la pone sola según el nombre del Gran Premio (tabla
`THEMES` del script; por ahora Brasil → pista negra y bordillos verde/amarillo).
Sin `theme`, la pista es azul con bordillos rojo/blanco.

Para comparar opciones sin tocar el archivo, añade a la dirección:
`&track=negro`, `&track=gris`, `&track=azul` y `&kerbs=brasil`,
`&kerbs=brasil3` (verde, amarillo, azul), `&kerbs=clasico`.

## Sanciones de parrilla

La grabación no trae las sanciones que la FIA publica después de la
clasificación. Si las hay, añádelas al final del comando de `build_session.py`
(N = puestos que pierde, `back` = sale al fondo):

    --penalties=RUS=5,LEC=10,HAM=back,VER=back,PER=back

El capítulo de la parrilla mostrará entonces la parrilla de salida real, con
▼N junto a cada piloto sancionado.

## Clasificación con lluvia

Para el capítulo de las tres vueltas, los sectores y la diferencia, se usa la
vuelta que cuenta para la clasificación (la de Q3 para el top 10), no la más
rápida de toda la tarde, que con lluvia puede haber sido en Q1 o Q2.

## Video vertical y música

`?session=q&vertical=1&autoplay=1&clean=1` es el modo para grabar redes:
gancho de 2 s con el margen de la pole, después los seis capítulos; 35 s en
total. Si existe `public/music.mp3`, suena con el autoplay y se funde en los
últimos 3 s (el navegador solo deja sonar audio después de un clic: haz clic
una vez en la página si no se oye). Usa música con licencia para redes.
La música de archivo vive en `~/PaddockIntel-Data/music/`.
