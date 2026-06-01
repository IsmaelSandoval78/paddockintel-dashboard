# PaddockIntel — Design System
**Edition:** hub.paddockintel.com
**Voice:** "Inside the Business of Speed"
**Aesthetic:** Editorial de revista especializada meets data intelligence
**Reference:** open-design.ai typography + Monocle Magazine structure + Bloomberg data density
**Mode:** Dark-first, minimalista premium

---

## 1. Filosofía

El hub es la versión interactiva de paddockintel.com — misma voz editorial, misma seriedad intelectual, pero con datos vivos. Cada elemento visual debe sentirse como una decisión editorial, no como un componente de UI genérico.

**Principios:**
- Tipografía como protagonista — los números grandes SON el diseño
- Color = información, nunca decoración
- Detalles editoriales que elevan: numeración de secciones, coordenadas, volumen/ronda
- Datos técnicos con tipografía técnica (mono)
- Nunca parecer un dashboard de SaaS genérico

---

## 2. Typography

### Font Stack
```css
/* Editorial — títulos, números grandes, posiciones */
font-family: 'DM Serif Display', Georgia, serif;

/* Interface — labels, navegación, body */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Technical — lap times, pit stops, coordenadas, datos exactos */
font-family: 'JetBrains Mono', 'Fira Code', monospace;

/* Numbers always tabular */
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum";
```

### Google Fonts Import
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Scale
```
/* Display — posiciones héroe, puntos grandes */
--text-display:   3.5rem  / 56px   font: DM Serif Display 700

/* Hero — número de ronda, stat principal */
--text-hero:      2.25rem / 36px   font: DM Serif Display 700

/* Title — nombre de sección, driver surname */
--text-xl:        1.5rem  / 24px   font: Inter 600

/* Section — headers de panel */
--text-lg:        1.125rem/ 18px   font: Inter 500

/* Body — labels, metadata */
--text-base:      1rem    / 16px   font: Inter 400

/* Small — badges, secondary info */
--text-sm:        0.875rem/ 14px   font: Inter 400

/* Micro — coordenadas, volume, issue number */
--text-xs:        0.75rem / 12px   font: JetBrains Mono 400

/* Technical — lap times, pit stop durations */
--text-mono:      0.875rem/ 14px   font: JetBrains Mono 500
```

### Reglas tipográficas
- Driver SURNAME en mayúsculas con DM Serif Display: `ANTONELLI`
- Forename en Inter regular más pequeño arriba: `Andrea`
- Posiciones (P1, P2) en DM Serif Display bold
- Tiempos (1:23.456) siempre en JetBrains Mono
- Coordenadas geográficas siempre en JetBrains Mono xs: `45.50°N · 73.52°W`
- Numeración editorial: `01 ·` en mono xs color muted, antes del título de sección
- Never font-size below 11px

---

## 3. Color

### Base (Dark — Primary)
```css
--background:        #080808   /* Negro editorial */
--surface:           #0f0f0f   /* Cards, panels */
--surface-raised:    #161616   /* Hover states */
--surface-overlay:   #1a1a1a   /* Panel sobre mapa */
--border:            #1e1e1e   /* Bordes principales */
--border-subtle:     #141414   /* Bordes muy sutiles */
```

### Text
```css
--text-primary:      #F5F5F0   /* Warm white — titulos, datos */
--text-secondary:    #888884   /* Labels, metadata */
--text-tertiary:     #3a3a38   /* Placeholders, issue numbers */
--text-accent:       #E10600   /* F1 Red — P1, wins, activo */
```

### Brand
```css
--accent:            #E10600   /* F1 Red */
--accent-hover:      #FF1801   
--accent-dim:        #1a0302   /* Background hint */
--accent-gold:       #C9A84C   /* P2, podiums, especial */
--accent-gold-dim:   #1a1408
```

### Constructor Colors (para dots y badges)
```css
--team-mercedes:     #00D2BE
--team-mclaren:      #FF8700
--team-redbull:      #3671C6
--team-ferrari:      #E8002D
--team-alpine:       #FF87BC
--team-aston:        #358C75
--team-haas:         #B6BABD
--team-williams:     #64C4FF
--team-sauber:       #52E252
--team-rb:           #6692FF
```

### Semantic
```css
--positive:          #22C55E   /* Gains, fastest lap */
--negative:          #EF4444   /* DNF, loss */
--neutral:           #A0A0A0   /* Neutral data */
```

---

## 4. Editorial Details (lo que hace la diferencia)

### Navbar
```
[PaddockIntel logo]   Hub · Circuits · Drivers · Constructors · Compare   [Vol.01 · Rd.09 · 2026]   [EN · ES · PT]
```

- Logo: imagen existente de paddockintel.com
- Volume/Round info: `Vol.01 · Rd.09` en JetBrains Mono xs, color tertiary, right side
- Locale switcher: texto simple, no dropdown complejo

### Circuit Coordinate Detail
Cuando hay un circuito seleccionado o como detalle del próximo GP:
```
45.50°N · 73.52°W — Circuit Gilles Villeneuve
```
En JetBrains Mono, color tertiary, tamaño xs. Se actualiza con el circuito activo en el mapa.

### Section Numbering
Cada sección del panel tiene numeración editorial:
```
01 · Championship Standings
02 · Constructor Battle
```
`01 ·` en JetBrains Mono xs color tertiary
Título en Inter 500

### Status Ticker (opcional, nav inferior)
```
● LIVE  Round 9 · Canadian GP · Montreal · Race Day
```
O en off-season:
```
Next: Round 10 · British GP · Silverstone · 15 días
```

---

## 5. Layout

### Hub Principal
```
┌─────────────────────────────────────┬─────────────────────┐
│  navbar full width                                        │
├─────────────────────────────────────┬─────────────────────┤
│                                     │                     │
│   MAPA INTERACTIVO                  │  PANEL EDITORIAL    │
│   (62% width, full height)          │  (38% width)        │
│                                     │                     │
│   • Dark map tiles                  │  Estado default:    │
│   • Circuit dots                    │  01 · Drivers       │
│   • Coordenadas activas             │  02 · Constructors  │
│                                     │                     │
│                                     │  Circuit selected:  │
│                                     │  Circuit Info Panel │
│                                     │  + X close          │
└─────────────────────────────────────┴─────────────────────┘
```

- Map: full bleed, zero padding, ocupa height del viewport
- Panel: scroll interno si el contenido excede viewport
- Breakpoint tablet (< 1024px): mapa top 50vh, panel bottom
- Breakpoint mobile (< 768px): mapa 40vh, panel scroll

### Panel Interior Spacing
```css
padding: 24px 20px;
gap between sections: 24px;
gap between rows: 0; (usar border-bottom en rows)
```

### Driver Row — Panel
```
[rank]  [name block]              [pts]  [podiums]  [rate]
  1     Andrea                    195      8        42%
        ANTONELLI                                        
```
- Rank: JetBrains Mono, color tertiary, 20px fixed width
- Forename: Inter 400, 11px, color secondary, display block
- Surname: Inter 600, 13px, color primary, uppercase
- Stats: JetBrains Mono, right-aligned, tabular
- Row: 52px height, border-bottom border-subtle
- P1 row: accent-dim background, left border 2px accent

### Constructor Row — Panel
```
[color dot]  [name]          [pts]  [wins]
   ●         Mercedes         323      5
```
- Dot: 8px circle, team color
- Name: Inter 500, 13px
- Stats: JetBrains Mono, right-aligned

---

## 6. Map

### Tiles
Usar CartoDB Dark Matter tiles (free, no API key):
```
https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
```

### Circuit Markers
```css
/* 2026 active circuit */
.marker-2026 {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #E10600;
  border: 1.5px solid rgba(225,6,0,0.3);
}

/* Historical only */
.marker-historical {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #2a2a2a;
  border: 1px solid #333;
}

/* Selected state */
.marker-selected {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #E10600;
  border: 2px solid #F5F5F0;
  box-shadow: 0 0 12px rgba(225,6,0,0.5);
}
```

### Map Attribution
Mínimo, esquina inferior izquierda, opacity 0.4

---

## 7. Components

### Badge
```css
/* Base */
font: JetBrains Mono 400 11px;
text-transform: uppercase;
letter-spacing: 0.06em;
padding: 2px 6px;
border-radius: 3px;

/* Variants */
.badge-default  { background: #1e1e1e; color: #888884; }
.badge-p1       { background: #1a0302; color: #E10600; }
.badge-podium   { background: #1a1408; color: #C9A84C; }
.badge-positive { background: #0a1f0f; color: #22C55E; }
.badge-team     { background: team-color-dim; color: team-color; }
```

### Button
```css
/* Primary */
background: #E10600; color: #fff;
padding: 8px 16px; border-radius: 4px;
font: Inter 500 13px;
hover: background #FF1801;

/* Ghost */
background: transparent; color: #888884;
border: 0.5px solid #1e1e1e;
hover: background #161616; color: #F5F5F0;

/* Icon close (X) */
width: 28px; height: 28px; border-radius: 4px;
background: transparent;
hover: background #161616;
```

### Panel Transition
```css
/* Content swap en panel derecho */
transition: opacity 150ms ease;
/* Out: opacity 0 → In: opacity 1 */
/* No sliding, no movement — fade in place */
```

### Scorecard
```css
/* Aspect ratios */
--ratio-square:   1/1      /* Instagram */
--ratio-story:    9/16     /* Stories, TikTok */
--ratio-wide:     16/9     /* X/Twitter */

/* Always include */
- PaddockIntel logo top-left
- paddockintel.com watermark bottom
- Driver stats en DM Serif Display para números
- Constructor color accent
- Dark background #080808
```

---

## 8. Motion

```css
--duration-fast:   100ms
--duration-base:   150ms  
--duration-slow:   200ms
--easing:          cubic-bezier(0.16, 1, 0.3, 1)
```

- Hover states: 150ms
- Panel swap: fade 150ms
- Map markers: 100ms scale
- Zero decorative animations
- Zero page transitions (instant)
- Zero bounce/spring

---

## 9. Anti-Patterns — Nunca hacer

- No tablas con borders pesados — usar rows con border-bottom sutil
- No cards con sombras — usar surface color + border sutil
- No gradients en backgrounds
- No glassmorphism
- No rounded corners > 6px (excepto avatares circulares)
- No más de 2 font families por pantalla (DM Serif + Inter, o Inter + Mono)
- No skeleton loaders complejos — pulse simple en background
- No tooltips como fuente primaria de datos — mostrar inline
- No carousels
- No pie charts — usar ranked lists
- No accent red para decoración — solo P1, wins, estados activos, errores
- No parecer Sofascore, ESPN, o cualquier app de deportes genérica
- No parecer un SaaS dashboard (Linear, Vercel son referencia de calidad, no de temática)

---

## 10. Voice & Data Format

### Labels
```
Posiciones:    P1, P2, P3  (no "1st", "2nd")
Puntos:        195 pts  (número + "pts" lowercase)
Tiempos vuelta: 1:23.456  (M:SS.mmm — JetBrains Mono)
Pit stops:     23.4s  (SS.ms + "s" — JetBrains Mono)
Fechas:        15 Jun 2026  (DD Mon YYYY)
Coordenadas:   45.50°N · 73.52°W  (JetBrains Mono)
Ronda:         Rd. 09  (no "Round 9")
Volumen:       Vol. 01
```

### Driver Names
```
Display hero:  Andrea / ANTONELLI  (forename small, surname DM Serif Display caps)
Table row:     A. Antonelli  (inicial + apellido, Inter)
Badge/short:   ANT  (código 3 letras, Mono)
```

### Constructor Names
```
Full:    Mercedes-AMG Petronas  (solo en páginas de detalle)
Display: Mercedes  (en hub y listas)
Short:   MER  (en scorecards)
```

---

## 11. CSS Variables — globals.css

```css
:root {
  /* Backgrounds */
  --bg:              #080808;
  --surface:         #0f0f0f;
  --surface-raised:  #161616;
  --surface-overlay: #1a1a1a;

  /* Borders */
  --border:          #1e1e1e;
  --border-subtle:   #141414;

  /* Text */
  --text-1:          #F5F5F0;
  --text-2:          #888884;
  --text-3:          #3a3a38;

  /* Accent */
  --red:             #E10600;
  --red-dim:         #1a0302;
  --gold:            #C9A84C;
  --gold-dim:        #1a1408;

  /* Semantic */
  --green:           #22C55E;
  --green-dim:       #0a1f0f;

  /* Fonts */
  --font-serif:      'DM Serif Display', Georgia, serif;
  --font-sans:       'Inter', -apple-system, sans-serif;
  --font-mono:       'JetBrains Mono', monospace;

  /* Timing */
  --ease:            cubic-bezier(0.16, 1, 0.3, 1);
  --fast:            100ms;
  --base:            150ms;
}
```
