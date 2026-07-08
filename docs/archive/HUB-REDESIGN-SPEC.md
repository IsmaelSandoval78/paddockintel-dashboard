# PADDOCKINTEL · HUB REDESIGN SPEC
# hub.paddockintel.com · v0.2.0 · 2 Jun 2026
# Para Claude Code — leer DESIGN.md antes de implementar cualquier componente

---

## PRINCIPIOS GENERALES

- Stack: Next.js 16 + TypeScript + Tailwind v4 + Supabase + next-intl
- Responsive-first: mobile (375px) → tablet (768px) → desktop (1280px+)
- Estética: Swiss Industrial Print (DESIGN.md) como base del hub
- Cards flotantes: neumorphism SOLO en cards de KPI/scorecard — substrate #F4F4F0,
  box-shadow suave, nunca glassmorphism ni gradientes
- Interactividad: máxima, pero liviana — SVG nativo, CSS transitions ≤120ms, no librerías pesadas
- Datos: todos desde Supabase excepto mapas de pista (hardcoded SVG desde Wikipedia)

---

## PAGE 01 · HOME (Hub)

### Layout desktop
```
┌─────────────────────────────────────────────────────┐
│  TOP REGISTER STRIP — Vol.01 · Rd.09 · 2026        │
├──────────────┬──────────────────┬───────────────────┤
│ NEXT RACE    │   TOP 10         │  CONSTRUCTOR      │
│ CARD         │   DRIVERS        │  DEL DÍA          │
│ (izquierda)  │   (centro)       │  + TOP 5 CONSTRS  │
│              │                  │  (derecha)        │
├──────────────┴──────────────────┴───────────────────┤
│  COMPARE SCORECARDS — usuario elige 2 drivers       │
│  [ Scorecard A ]    VS    [ Scorecard B ]           │
└─────────────────────────────────────────────────────┘
```

### Layout mobile
```
Stack vertical:
1. Top register strip
2. Next Race card (full width)
3. Top 10 Drivers (full width, scrollable)
4. Constructor del día (full width)
5. Top 5 Constructors (full width)
6. Compare Scorecards (stack vertical, A luego B)
```

---

### COMPONENTE: Next Race Card
```
Datos: races table — próxima fecha > TODAY, JOIN circuits
Campos mostrados:
  - Round number: "RD.09" — JetBrains Mono 10px, uppercase
  - Circuit name: Archivo Black 22px
  - Location + Country: JetBrains Mono 11px, ink muted
  - Date: DD.MM.YYYY — Archivo Black 18px
  - Days remaining: "IN 12 DAYS" — hazard red #E61919, JetBrains Mono
  - Circuit country flag: 24px inline
  - CTA: "[ VIEW CIRCUIT → ]" — link al circuito detallado

Estilo:
  - Card flotante: box-shadow 0 2px 12px rgba(5,5,5,0.08)
  - Background: #F4F4F0
  - Border: 1px solid #050505
  - Border-radius: 0
  - Padding: 24px

Supabase query:
  SELECT r.*, c.name, c.location, c.country, c.lat, c.lng
  FROM races r
  JOIN circuits c ON r.circuit_id = c.id
  WHERE r.date > NOW()
  ORDER BY r.date ASC
  LIMIT 1
```

---

### COMPONENTE: Top 10 Drivers
```
Datos: driver_standings JOIN drivers, filtrado por último race_id de la temporada actual

Columnas: POS · DRIVER · TEAM DOT · PTS
Filas: top 10 únicamente

Estilo tabla:
  - display: grid, gap: 1px, background: #050505
  - Header: background #050505, text #F4F4F0, JetBrains Mono 10px
  - Rows: background #F4F4F0
  - POS: Archivo Black 13px
  - Surname: Archivo Black 14px uppercase
  - PTS: Archivo Black 20px, tabular-nums — número dominante
  - P1 row: border-left 3px #E61919, background #EAE8E3
  - Team dot: 8px circle, official team hex

Mobile: colapsa TEAM DOT, muestra solo POS · DRIVER · PTS
```

---

### COMPONENTE: Constructor del Día
```
Lógica: random entre los 11 constructors, seed por fecha (mismo día = mismo constructor)
  const seed = new Date().toDateString()
  const index = hashCode(seed) % constructors.length

Datos mostrados:
  - "CONSTRUCTOR OF THE DAY" — JetBrains Mono 10px, label
  - Constructor name: Archivo Black clamp(1.8rem, 3vw, 2.4rem)
  - Nationality: JetBrains Mono 11px
  - Team dot color: grande, 32px
  - Stats: Races · Wins · First Year · Last Year
  - CTA: "[ VIEW CONSTRUCTOR → ]"

Estilo: misma card flotante que Next Race
```

---

### COMPONENTE: Top 5 Constructors
```
Datos: constructor_standings JOIN constructors, top 5 por puntos temporada actual

Lista compacta:
  POS · NAME · PTS · mini bar de puntos proporcional

Bar: width proporcional al líder (líder = 100%)
Color bar: official team hex
Height: 3px, border-radius: 0
```

---

### COMPONENTE: Compare Scorecards
```
Layout: dos columnas en desktop, stack en mobile
Separador: "VS" — Archivo Black 32px, centered, ink

Search/Select:
  - Input: border 1px #050505, border-radius 0, JetBrains Mono 13px
  - Dropdown con lista de drivers filtrable
  - Placeholder: "[ SELECT DRIVER ]"

Scorecard (por driver seleccionado):
  - Número con bandera nacional como clip-path fill
  - Nombre: Archivo Black uppercase
  - Stats grid: WINS · PODS · POLES · FL · DNF · RACES
  - Cada stat: label JetBrains Mono 10px + valor Archivo Black 28px
  - Nationality flag: clip-path dentro del número
  - Estilo: card flotante, substrate #F4F4F0
  - Botón: "[ FULL SCORECARD → ]" — link a /drivers/[slug]

Estado vacío: "[ SELECT TWO DRIVERS TO COMPARE ]" — JetBrains Mono, centered
Estado un driver: muestra solo ese scorecard, el otro side vacío con prompt
```

---

## PAGE 02 · DRIVERS

### Concepto: Scorecards por Era
```
Eras F1 definidas:
  - Modern (2014–2026): hybrid era — MÁS GRANDE, posición hero
  - Turbo (1977–1988): turbo era — mediano, lado derecho
  - Classic (1950–1976): early era — más pequeño, abajo izquierda
  - V10 (1989–2005): golden era — mediano, abajo derecha
  - V8 (2006–2013): refueling ban era — pequeño, fill

Layout tipo masonry/tramado — era reciente ocupa más espacio visual
Responsive: en mobile, stack vertical ordenado por era desc
```

### Scorecard de driver (en grid)
```
- Número + bandera como clip-path (igual que compare)
- Surname: Archivo Black, tamaño proporcional al era block
- Stats condensados: WINS · CHAMPS · RACES
- Años activos: "1984–1994"
- Click → /drivers/[slug]
```

### Filtros
```
- Por era (tabs): ALL · MODERN · V10 · TURBO · CLASSIC · V8
- Por nacionalidad: dropdown
- Search: input monospace, border-radius 0
- Toggle: 2026 SEASON / ALL TIME (ya existe)
```

---

## PAGE 03 · CONSTRUCTORS

### Mismo concepto de eras que Drivers
```
Eras por dominancia:
  - Hybrid Era (2014–2026): Mercedes/Red Bull — hero
  - V10 Era (1989–2005): Ferrari/McLaren/Williams
  - Turbo Era (1977–1988): McLaren/Williams
  - Classic Era (1950–1976): Ferrari/Lotus

Constructor scorecard:
  - Nombre: Archivo Black grande
  - Nationality flag: accent
  - Stats: WINS · CHAMPS · RACES · FIRST YEAR
  - Team color: left border 3px en color oficial
  - Click → /constructors/[slug]
```

---

## PAGE 04 · CIRCUITS

### Mapa principal (Leaflet, ya implementado)
```
Filtros por continente:
  - ALL · EUROPE · AMERICAS · ASIA & PACIFIC · AFRICA & MIDDLE EAST · OCEANIA
  - Click en continente: mapa hace flyTo() a las coordenadas del continente
  - Coordenadas de zoom por continente:
    EUROPE:              [50.0, 10.0] zoom 4
    AMERICAS:            [10.0, -80.0] zoom 3
    ASIA & PACIFIC:      [25.0, 100.0] zoom 3
    AFRICA & MIDDLE EAST:[20.0, 35.0] zoom 3
    OCEANIA:             [-25.0, 135.0] zoom 4
    ALL:                 [20.0, 0.0] zoom 2

Circuits activos: dot rojo #E61919, 8px
Circuits históricos: dot gris #B0AFA8, 6px

Click en dot: abre inline panel con info del circuito
Inline panel: mismo sistema actual, con CTA "[ VIEW FULL CIRCUIT → ]"
```

### Responsive mapa
```
Mobile: mapa full width, altura 50vh
Inline panel: drawer desde abajo (bottom sheet), altura 60vh, draggable
Desktop: mapa + panel side-by-side (layout actual)
```

---

## PAGE 05 · CIRCUIT DETAIL (/circuits/[slug])

### Layout
```
┌─────────────────────────────────────────────────────┐
│  CIRCUIT NAME — Archivo Black hero                  │
│  Location · Country · Coordinates                   │
├──────────────────────┬──────────────────────────────┤
│  TRACK MAP SVG       │  CIRCUIT STATS               │
│  (interactivo)       │  First Race · Total Races    │
│                      │  Last 5 Champions            │
│                      │  Fastest Pit Stop            │
│                      │  Fastest Lap                 │
│                      │  Top Constructor             │
│                      │  Most Wins driver            │
│                      │  Most Poles driver           │
│                      │  Avg. Starting Position      │
└──────────────────────┴──────────────────────────────┘
```

### COMPONENTE ESTRELLA: Track Map SVG
```
Implementación:
  - SVG hardcoded por circuito (path de la pista)
  - Fuente: Wikipedia circuit maps (solo circuitos activos en 2026)
  - Nombres de curvas: hardcoded como <text> elements en el SVG
  - Interactividad: hover en segmento de pista → tooltip con nombre de la curva
  - Sin librerías externas — SVG nativo + CSS

Circuitos activos 2026 a implementar (prioridad):
  Monaco, Silverstone, Monza, Spa, Suzuka, COTA, Interlagos,
  Melbourne, Bahrain, Jeddah, Miami, Barcelona, Hungaroring,
  Zandvoort, Singapore, Baku, Mexico City, Las Vegas, Abu Dhabi,
  Imola, Montreal, Shanghai

Tooltip en hover:
  - Nombre de la curva: JetBrains Mono 11px
  - Background: #050505, color: #F4F4F0
  - border-radius: 0
  - Sin delay, aparece instant

Track SVG estilo:
  - Stroke: #050505, stroke-width: 3px
  - Fill: none
  - Curva hover: stroke: #E61919
  - Background SVG: #F4F4F0
  - Kerb zones: stroke-dasharray, gris claro

Fallback (circuitos sin SVG):
  - Mostrar coordenadas en Leaflet mini-map centrado en el circuito
  - Label: "[ TRACK MAP NOT YET AVAILABLE ]"
```

### Responsive circuit detail
```
Mobile:
  - Track map: full width, altura fija 280px
  - Stats: stack vertical debajo del mapa
  - Curva tooltip: tap en lugar de hover
```

---

## PAGE 06 · COMPARE (mejoras)

```
Mejoras sobre el actual:
  - Search inputs con autocompletar
  - Resultado: dos scorecards completos side-by-side
  - H2H As Teammates: ya implementado
  - Agregar: mini chart de puntos por temporada (SVG nativo, no recharts si es posible)
  - Responsive: stack vertical en mobile
```

---

## RESPONSIVE BREAKPOINTS

```css
/* Mobile first */
--bp-sm:  375px   /* base mobile */
--bp-md:  768px   /* tablet */
--bp-lg:  1024px  /* desktop pequeño */
--bp-xl:  1280px  /* desktop */
--bp-2xl: 1536px  /* wide */
```

### Reglas generales responsive
```
- Tablas: colapsar columnas secundarias en mobile (mantener POS, DRIVER, PTS)
- Cards: full width en mobile, grid en desktop
- Inline panels: bottom sheet en mobile, side panel en desktop
- Nav: hamburger menu en mobile (mismo estilo Swiss, border-radius: 0)
- Typography: fluid clamp() para display, fixed px para micro UI
- Mapa: 50vh en mobile, full height en desktop
```

---

## DATOS SUPABASE — QUERIES PRINCIPALES

```sql
-- Próxima carrera
SELECT r.id, r.round, r.name, r.date, r.time,
       c.name as circuit_name, c.location, c.country, c.lat, c.lng, c.circuit_ref
FROM races r
JOIN circuits c ON r.circuit_id = c.id
WHERE r.date > NOW()
ORDER BY r.date ASC
LIMIT 1;

-- Top 10 drivers temporada actual
SELECT ds.position, ds.points, ds.wins,
       d.forename, d.surname, d.code, d.nationality, d.number,
       co.name as constructor_name, co.constructor_ref
FROM driver_standings ds
JOIN drivers d ON ds.driver_id = d.id
JOIN results res ON res.driver_id = d.id AND res.race_id = ds.race_id
JOIN constructors co ON res.constructor_id = co.id
WHERE ds.race_id = (SELECT MAX(id) FROM races WHERE date <= NOW())
ORDER BY ds.position ASC
LIMIT 10;

-- Top 5 constructors temporada actual
SELECT cs.position, cs.points, cs.wins,
       c.name, c.nationality, c.constructor_ref
FROM constructor_standings cs
JOIN constructors c ON cs.constructor_id = c.id
WHERE cs.race_id = (SELECT MAX(id) FROM races WHERE date <= NOW())
ORDER BY cs.position ASC
LIMIT 5;

-- Todos los drivers para Compare/scorecard
SELECT d.*, ds.*
FROM driver_stats ds
JOIN drivers d ON ds.driver_id = d.id
ORDER BY ds.wins DESC;
```

---

## IMPLEMENTACIÓN — ORDEN RECOMENDADO

```
Phase 7:  Responsive foundation — breakpoints, nav mobile, layout tokens
Phase 8:  Home redesign — Next Race card, Top 10, Constructor del día, Top 5
Phase 9:  Compare Scorecards en Home — search + scorecard component
Phase 10: Drivers — era grid / masonry con scorecards
Phase 11: Constructors — mismo sistema que drivers
Phase 12: Circuits — filtros por continente, flyTo(), activos/históricos
Phase 13: Circuit detail — track SVG map interactivo
Phase 14: Polish — micro-interactions, responsive QA, pre-flight checklist
```

---

## PROMPT PARA CLAUDE CODE

```
Read DESIGN.md and HUB-REDESIGN-SPEC.md before starting.

Implement Phase 7: Responsive foundation.
- Add breakpoint tokens to tailwind.config
- Refactor navbar to collapse to hamburger on mobile (border-radius: 0, Swiss style)
- Add bottom sheet component for mobile inline panels
- Ensure all existing pages stack correctly on 375px viewport
- No visual changes on desktop — mobile only in this phase
```

---
# PADDOCKINTEL · HUB-REDESIGN-SPEC · v0.2.0 · MMXXVI