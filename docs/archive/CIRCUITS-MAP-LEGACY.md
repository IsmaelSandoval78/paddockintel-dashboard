# PaddockIntel · circuits-map-legacy — el índice `/circuits` con mapa

Retirado 2026-08-25. Código borrado del árbol 2026-09-22 (vivió en
`components/archive/circuits-map-legacy/` hasta el commit `3ce10e8`; para recuperarlo,
`git log --all -- components/archive/circuits-map-legacy/`). Este doc conserva lo que el
`git log` no cuenta: qué hacía, por qué se fue y qué funcionalidad se perdió en el camino.

## Qué era

El índice `/circuits` de antes del rediseño Vintage Editorial
(`app/[locale]/(hub)/circuits/page.tsx`). Tres archivos, un cluster:

- **`CircuitsClient.tsx`** — el shell de página client-side: estado del filtro por región,
  búsqueda, import dinámico del mapa, render del panel quick-look al seleccionar.
- **`CircuitMapSVG.tsx`** — un mapa mundial d3-geo (`geoNaturalEarth1`) renderizado como SVG,
  con presets de proyección por región (rotate/center/scale para Europe, Americas,
  Asia & Pacific, Africa & Middle East, Oceania) y paths de países desde TopoJSON de
  `world-atlas`.
- **`CircuitLeftPanel.tsx`** — el panel quick-look slide-in / bottom-sheet (vía
  `components/ui/BottomSheet.tsx`) que previsualizaba la info de un circuito sin salir del
  índice.

## Por qué se retiró

Reemplazado por el índice `/circuits` Vintage Editorial: un circuito destacado + una lista
compacta del calendario 2026, en clave póster más que navegador sobre mapa. Parte del pivote
de DESIGN.md v3.0.0 alejándose de los modos interactivos por superficie.

## Funcionalidad que el índice actual no tiene

| Feature | Legacy | Índice actual |
|---|---|---|
| Mapa mundial (d3-geo) | Sí — proyección Natural Earth, paths de países animados | Ninguno |
| Filtro por región | Sí — All / Europe / Americas / Asia & Pacific / Africa & Middle East / Oceania | Ninguno |
| Búsqueda en vivo | Sí (`CircuitsClient`) | Ninguna |
| Preview sin navegar | Sí — `CircuitLeftPanel` slide-in/bottom-sheet | Ninguna (hay que abrir la página del circuito) |
| Animaciones GSAP | Sí — `SplitText` (headers), `DrawSVGPlugin` (panel) | No se usan |

Si "explorar circuitos en un mapa" o "previsualizar sin salir del índice" tiene que volver,
empezar por el `git log` de esos tres archivos para ver cómo estaba cableada la interactividad.

## Dependencias que se fueron con él

`d3-geo`, `world-atlas` y `topojson-client` (más `@types/d3-geo` y `@types/topojson-client`)
existían en `package.json` **solo** por `CircuitMapSVG.tsx`. Se quitaron junto con el código.
Revivir el mapa implica reinstalarlas.

Nota relacionada: `CLAUDE.md` decía "el mapa es un SVG plano con proyección Natural Earth de
d3-geo" como si fuera código vivo. Se corrigió en el mismo cambio — desde 2026-08-25 no hubo
ningún mapa en producción. La regla que sí sigue en pie es la negativa: si el mapa vuelve, no
volver a Leaflet ni a un globo 3D.
