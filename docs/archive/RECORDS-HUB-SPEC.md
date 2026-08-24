# PaddockIntel · Records Hub — Spec v1
# Para Claude Code — leer DESIGN.md, CLAUDE.md y PHASES.md antes de implementar

---

## Objetivo

Nueva sección `/records` que responde directamente al patrón de búsqueda más común en F1 ("who has the most wins/poles/podiums in F1 history"). Cada récord es una tarjeta compartible con su propio ranking top 10 y export de Scorecard, reusando componentes ya existentes — no se construye UI nueva desde cero, se reutiliza el patrón de Compare/Scorecard.

## Alcance v1

7 categorías de drivers, **todas usando vistas que ya existen en Supabase** (`driver_stats`, `driver_win_streaks`) — cero migraciones nuevas en esta fase. Constructors, youngest/oldest winner, y wins-por-circuito quedan para v2 (necesitan una vista nueva cada uno).

## Rutas

- `app/[locale]/(hub)/records/page.tsx` — índice: 7 tarjetas, cada una mostrando el líder actual + top 3 mini-ranking
- `app/[locale]/(hub)/records/[slug]/page.tsx` — detalle: top 10 completo + Scorecard export + Share button
- Slugs: `most-wins`, `most-poles`, `most-podiums`, `most-fastest-laps`, `most-championships`, `most-points`, `longest-win-streak`

## Queries exactas (verificadas contra el esquema real, no inventadas)

**1. Most wins**
```sql
SELECT driver_id, name, code, nationality, wins
FROM driver_stats
ORDER BY wins DESC
LIMIT 10;
```

**2. Most pole positions**
```sql
SELECT driver_id, name, code, nationality, poles
FROM driver_stats
ORDER BY poles DESC
LIMIT 10;
```

**3. Most podiums**
```sql
SELECT driver_id, name, code, nationality, podiums
FROM driver_stats
ORDER BY podiums DESC
LIMIT 10;
```

**4. Most fastest laps**
```sql
SELECT driver_id, name, code, nationality, fastest_laps
FROM driver_stats
ORDER BY fastest_laps DESC
LIMIT 10;
```

**5. Most World Championships**
```sql
SELECT driver_id, name, code, nationality, championships
FROM driver_stats
WHERE championships > 0
ORDER BY championships DESC
LIMIT 10;
```

**6. Most career points**
```sql
SELECT driver_id, name, code, nationality, total_points
FROM driver_stats
ORDER BY total_points DESC
LIMIT 10;
```

**7. Longest consecutive win streak**
```sql
SELECT driver_id, forename, surname, streak_len, end_year
FROM driver_win_streaks
ORDER BY streak_len DESC
LIMIT 10;
```
Nota: esta vista NO trae `code`/`nationality` — si el diseño de la tarjeta los necesita, hacer JOIN adicional contra `drivers` por `driver_id`, no asumir que la columna existe en la vista.

## Componentes a reutilizar (no crear nuevos)

- **Scorecard export**: mismo componente canvas/PNG usado en Compare — cambia el contenido, no la mecánica de export ni los aspect ratios (1:1, 9:16, 16:9)
- **Share button**: el componente único ya usado en Digest/Blog — misma posición, mismo comportamiento (Web Share API en móvil, flyout en desktop)
- **Estilo de tarjeta**: patrón bento/card ya establecido en `components/home/kinetic/` — no inventar un nuevo tipo de card

## Reglas de diseño (de DESIGN.md — no negociable)

- Background `#F4F4F0`, cero dark mode
- Nombres/headline en Archivo Black, cifras (wins, poles, streak_len, etc.) en JetBrains Mono con `font-variant-numeric: tabular-nums`
- Accent red `#E61919` solo para el #1 del ranking (el récord vigente) — nunca como fill grande
- Border-radius `0` en todo, sin excepciones
- Mobile-first: rankings colapsan a lista vertical de una columna en <768px

## i18n

Cada slug necesita label EN/ES/PT en `locales/{en,es,pt}.json` bajo la clave `records.{slug}.title` — ejemplo: `records.most-wins.title` = "Most Race Wins" / "Más Victorias" / "Mais Vitórias". No hardcodear texto en los componentes.

## Fuera de alcance v1 (no construir todavía)

- Constructors (mismo patrón, necesita `constructor_stats`/`constructor_win_streaks` — ya existen, pero es v2 para no mezclar scope)
- Youngest/oldest race winner — necesita cruzar `drivers.dob` contra `races.date`, no existe vista para esto aún
- Most wins at a single circuit — necesita nueva vista agrupando `results` por `driver_id` + `circuit_id`

## Success criteria

- [ ] `/records` carga con las 7 tarjetas, datos reales de Supabase (cero mock data)
- [ ] `/records/[slug]` muestra top 10 correcto para cada categoría
- [ ] Scorecard exportable en los 3 aspect ratios
- [ ] Share button funcional
- [ ] Responsive 375/768/1280 verificado
- [ ] Pasa el Critique Gate de CLAUDE.md (5 dimensiones, mínimo 4 en cada una)
