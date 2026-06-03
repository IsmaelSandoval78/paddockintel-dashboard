# PADDOCKINTEL · DESIGN.md
# hub.paddockintel.com · Vol.01 · Dual-Mode Design System
# Swiss Industrial Print (hub base) + Neumorphism (KPI cards)
# Distilled from web-prototype-taste-brutalist · Apache-2.0

---

## 01 · COLOR

```
Substrate (background)  #F4F4F0   /* unbleached newsprint — primary surface */
Substrate alt           #EAE8E3   /* section alternates, hover states */
Ink (foreground)        #050505   /* carbon black — body text, borders, grid lines */
Ink muted               #6B6B6B   /* secondary — metadata, labels, captions */
Ink faint               #B0AFA8   /* tertiary — disabled, placeholders */
Accent                  #E61919   /* hazard red — ONE accent, hub pages */
Accent dark             #B01010   /* red hover / active */
Teal accent             #00C9A7   /* SOLO en scorecards dark — nunca en hub pages */
Gold accent             #D4A017   /* SOLO en scorecards dark — nunca en hub pages */
Grid ink                #050505   /* gap background para 1px grid dividers */
```

### Reglas de color
- Accent red solo en: hairlines, border-left P1, nav activo, alerts, strikes
- NUNCA red como fill en superficies grandes
- Team dots: único uso de colores extra (official team hex, max 8px, nunca en texto)
- Blanco puro #ffffff: PROHIBIDO. Mínimo #F4F4F0
- Dark mode: NO soportado en hub. Solo en scorecards exportables.

---

## 02 · TYPOGRAPHY

### Display — números hero, standings, títulos de sección
```
font-family: 'Archivo Black', 'Inter', sans-serif
font-weight: 900
font-size:   clamp(3rem, 8vw, 12rem)
line-height: 0.88
letter-spacing: -0.04em
text-transform: uppercase
```

### Section titles
```
font-family: 'Archivo Black', sans-serif
font-weight: 900
font-size:   clamp(1.8rem, 3vw, 2.8rem)
line-height: 0.92
letter-spacing: -0.03em
text-transform: uppercase
```

### Micro UI — nav, metadata, labels, coordenadas, captions
```
font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace
font-weight: 400 / 700
font-size:   10px–13px (fixed, nunca fluid)
line-height: 1.4
letter-spacing: 0.1em
text-transform: uppercase
```

### Body / table data
```
font-family: 'JetBrains Mono', monospace
font-variant-numeric: tabular-nums
font-size: 13px–14px
letter-spacing: 0.05em
```

### Driver / Constructor surnames en tablas
```
font-family: 'Archivo Black', sans-serif
font-weight: 900
font-size: 14px–16px
letter-spacing: -0.01em
text-transform: uppercase
```

### Scale tokens
```
--text-hero:    clamp(4rem, 10vw, 15rem)
--text-display: clamp(1.8rem, 3vw, 2.8rem)
--text-body:    14px
--text-micro:   11px
--text-label:   10px
```

---

## 03 · GEOMETRÍA & BORDERS

### Regla global
```
border-radius: 0   /* everywhere — sin excepciones en hub base */
```

### EXCEPCIÓN: Neumorphism cards
```
border-radius: 12px   /* SOLO en cards flotantes del home */
/* Nunca en: tablas, nav, inputs standalone, botones, inline panels */
```

### Grid dividers (tablas)
```css
.grid-ink {
  display: grid;
  gap: 1px;
  background: #050505;
}
.grid-ink > * {
  background: #F4F4F0;
}
```

### Hairline rules
```css
border-top: 1px solid #050505;   /* section dividers */
border-top: 1px solid #B0AFA8;   /* row separators en tablas */
```

### P1 / leader accent
```css
.row-leader {
  border-left: 3px solid #E61919;
  background: #EAE8E3;
}
```

---

## 04 · NEUMORPHISM SYSTEM
# Aplicado SOLO a: KPI cards, Next Race card, Constructor del Día,
# Top 5 Constructors, Compare Scorecards en el Home

### Filosofía
```
Neumorphism sobre substrate #F4F4F0 — no sobre blanco ni oscuro.
La sombra simula elevación física sobre el papel.
Nunca glassmorphism (sin blur, sin transparencia).
Nunca gradientes de color — solo sombras luz/sombra neutras.
```

### Tokens neumorphism
```css
/* Card elevada — nivel 1 (default) */
.card-neu {
  background: #F4F4F0;
  border-radius: 12px;
  box-shadow:
    6px 6px 12px rgba(5, 5, 5, 0.12),
   -4px -4px 8px  rgba(255, 255, 255, 0.7);
  border: none;
}

/* Card elevada — nivel 2 (hover) */
.card-neu:hover {
  box-shadow:
    8px 8px 16px rgba(5, 5, 5, 0.15),
   -6px -6px 12px rgba(255, 255, 255, 0.8);
  transition: box-shadow 120ms ease;
}

/* Card pressed / active */
.card-neu:active {
  box-shadow:
    2px 2px 6px  rgba(5, 5, 5, 0.10),
   -2px -2px 4px rgba(255, 255, 255, 0.6);
}

/* Input dentro de card */
.input-neu {
  background: #F4F4F0;
  border-radius: 8px;
  box-shadow:
    inset 3px 3px 6px  rgba(5, 5, 5, 0.10),
    inset -2px -2px 4px rgba(255, 255, 255, 0.7);
  border: none;
  outline: none;
}

.input-neu:focus {
  box-shadow:
    inset 3px 3px 6px  rgba(5, 5, 5, 0.12),
    inset -2px -2px 4px rgba(255, 255, 255, 0.7),
    0 0 0 1px #E61919;
}
```

### Tipografía dentro de cards neumorphism
```
Sigue las mismas reglas tipográficas del hub:
  Labels:   JetBrains Mono 10px, uppercase, ink muted
  Valores:  Archivo Black, tabular-nums
  Metadata: JetBrains Mono 11px
  CTAs:     JetBrains Mono 11px, uppercase, "[ LABEL → ]"
```

### Prohibido en neumorphism
```
NUNCA gradientes de color
NUNCA glassmorphism / backdrop-filter
NUNCA sombras de color — solo rgba(#050505) y rgba(#ffffff)
NUNCA border visible además del box-shadow
NUNCA border-radius en elementos hijos dentro de la card
NUNCA neumorphism en tablas, nav, inputs standalone, botones de texto
```

---

## 05 · SPACING & LAYOUT

```
--space-xs:  4px
--space-sm:  8px
--space-md:  16px
--space-lg:  32px
--space-xl:  64px
--space-2xl: 128px
```

### Top register strip (requerido en cada página)
```
height: 32px
padding: 0 16px
background: #F4F4F0
border-bottom: 1px solid #050505
font: JetBrains Mono 11px, 0.1em tracking, uppercase
content: [ PADDOCKINTEL ] · VOL.01 · RD.09 · 2026 · 38.89°N 77.03°W
```

### Section numbering
```
Format: "01 · Championship Standings"
Font: JetBrains Mono 10px, ink muted (#6B6B6B)
```

### Home grid (desktop)
```css
.home-layout {
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  grid-template-rows: auto auto;
  gap: 24px;
  padding: 24px;
  background: #F4F4F0;
}
```

### Home grid (mobile)
```css
@media (max-width: 768px) {
  .home-layout {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
}
```

---

## 06 · COMPONENTS

### Nav bar
```
Background: #F4F4F0
Border-bottom: 1px solid #050505
Logo: "PADDOCK·INTEL" — Archivo Black 14px, tracking -0.02em, uppercase
Active link: color #E61919
Inactive: color #6B6B6B
Language switcher: JetBrains Mono 10px, separado por ·
Vol/Rd indicator: JetBrains Mono 11px, right-aligned, ink muted
Mobile: hamburger (líneas rectas, sin curves), menú full-width border-radius: 0
```

### Standings table
```
display: grid, gap: 1px, background: #050505
Header: background #050505, color #F4F4F0, JetBrains Mono 10px
POS: Archivo Black 13px
Surname: Archivo Black 14px uppercase
PTS: Archivo Black 18px, tabular-nums
P1 row: border-left 3px #E61919, background #EAE8E3
Team dot: 8px, official team hex
Mobile: colapsar POD, WIN% — mantener POS, DRIVER, PTS
```

### KPI Card (neumorphism)
```css
.kpi-card {
  /* Aplica .card-neu */
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kpi-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6B6B6B;
}
.kpi-value {
  font-family: 'Archivo Black', sans-serif;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  color: #050505;
  line-height: 1;
}
.kpi-delta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #E61919;
}
```

### Next Race Card (neumorphism)
```
Aplica .card-neu, padding: 24px
- "[ NEXT RACE ]" — JetBrains Mono 10px, label
- Circuit name: Archivo Black 22px
- Location · Country: JetBrains Mono 11px muted
- Date: Archivo Black 18px tabular-nums
- Countdown: "IN 12 DAYS" — #E61919
- Flag: 24px inline
- CTA: "[ VIEW CIRCUIT → ]" — JetBrains Mono 11px
```

### Compare Scorecard (neumorphism)
```
Aplica .card-neu
Número piloto: Archivo Black 120px+, bandera como clip-path fill
Surname: Archivo Black 24px uppercase
Stats grid 2x3: WINS · PODS · POLES / FL · DNF · RACES
Cada stat: label 10px mono + valor 28px Archivo Black
Search: .input-neu
VS: Archivo Black 32px, centered
```

### Track Map SVG
```
Stroke: #050505, stroke-width: 3px, fill: none
Background: #F4F4F0
Curva hover: stroke #E61919
Tooltip: background #050505, color #F4F4F0, border-radius: 0, instant
Kerbs: stroke-dasharray, color #B0AFA8
```

### ASCII decoration (mínimo 3 por página)
```
[ HUB ] [ CIRCUITS ] [ DRIVERS ]
>>> CHAMPIONSHIP STANDINGS
///
© PADDOCKINTEL · MMXXVI
⬤ LIVE · RD.09 · 2026
```

---

## 07 · MOTION

```
Permitido:
  IntersectionObserver reveal: opacity 0→1, instant
  Top register ticker: velocidad constante, sin easing
  :active en links: invert ink/paper instant
  card-neu hover: box-shadow 120ms ease
  Mapa flyTo(): 800ms máximo
  Track SVG hover: stroke instant, tooltip 120ms

Prohibido:
  Slide/translate/blur reveals
  transform: scale en hover
  Animaciones de layout
  Cualquier transition > 120ms (excepto mapa flyTo)
  Skeleton loaders animados — usar "[ LOADING... ]" estático
```

---

## 08 · RESPONSIVE

```
--bp-sm:  375px
--bp-md:  768px
--bp-lg:  1024px
--bp-xl:  1280px
--bp-2xl: 1536px

Mobile-first: base styles 375px, media queries hacia arriba
Nav: hamburger mobile, horizontal desktop
Cards: full-width mobile, grid desktop
Tablas: colapsar columnas secundarias mobile
Inline panels: bottom sheet 60vh mobile, side panel desktop
Mapa: 50vh mobile, full-height desktop
```

---

## 09 · VOICE & COPY

```
Register: clipped, declarativo, print-magazine
Labels: uppercase, abreviados (PTS, POD, WIN%, RD, VOL)
Coordenadas: decimal — 38.89°N 77.03°W
Fechas: DD.MM.YYYY o YYYY únicamente
Edition: Vol.01 · Rd.09 · 2026
Copyright: © PADDOCKINTEL · MMXXVI
```

---

## 10 · BRAND CONSTANTS

```
Name:     PADDOCK·INTEL
Hub URL:  hub.paddockintel.com
Logo:     https://paddockintel.com/content/images/2026/02/paddockintel-logo-light-xl.png
Stack:    Next.js 16 · TypeScript · Tailwind v4 · Supabase · Vercel · next-intl
i18n:     EN · ES · PT
```

---

## 11 · ANTI-PATTERNS

```
NUNCA:
  border-radius en tablas, nav, inputs, botones
  Blanco puro #ffffff
  Sombras con color — solo rgba(#050505) y rgba(#ffffff)
  Glassmorphism / backdrop-filter / blur
  Segundo accent en hub (teal/gold solo en scorecards dark)
  Texto centrado en body
  Gradientes
  Emoji
  Iconografía curva
  Copy AI-cliché
  Figuras proporcionales en datos — siempre tabular-nums
  P1 como fill rojo — solo border-left + substrate-alt
  Neumorphism en tablas o nav
  Scorecard dark substrate mezclado con newsprint hub
  Font < 10px
  Transitions > 120ms (excepto mapa)
```

---

## PRE-FLIGHT CHECKLIST

```
[ ] Substrate #F4F4F0 o #EAE8E3 — nunca blanco puro
[ ] border-radius: 0 en tablas, nav, inputs, botones
[ ] border-radius: 12px SOLO en cards neumorphism
[ ] Neumorphism: solo rgba(#050505) y rgba(#ffffff) en shadows
[ ] Display: Archivo Black, uppercase
[ ] Micro UI: JetBrains Mono, 10–13px fixed, 0.1em tracking, uppercase
[ ] Al menos un grid gap:1px ink-background por página de tabla
[ ] ASCII decoration mínimo 3× por página
[ ] Datos numéricos: tabular-nums + monospace
[ ] Accent red máx 3× por view — nunca fill grande
[ ] P1: border-left 3px #E61919, no red bg
[ ] Top register strip en cada página
[ ] Sin emoji, gradientes, sombras de color
[ ] Scorecards: dark substrate separado
[ ] Responsive probado 375px y 1280px
[ ] Transitions ≤ 120ms (excepto mapa)
```

---

## SCORECARD SYSTEM (dark substrate — separado)

```
Background:   #0a0a0a
Foreground:   #F0EDE6
Accent:       #00C9A7
Gold:         #D4A017
Font display: Archivo Black
Font data:    JetBrains Mono
Número hero:  bandera nacional clip-path fill
border-radius: 0
```

---
# PADDOCKINTEL · DESIGN.md · v0.2.0 · Apache-2.0 · MMXXVI