# PaddockIntel · Records Hub — Spec v2
# Para Claude Code — leer DESIGN.md, CLAUDE.md, PHASES.md y RECORDS-HUB-SPEC.md (v1) antes de implementar

---

## Objetivo

Extender `/records` con 3 grupos nuevos: Constructors (mismo patrón que drivers v1), y dos categorías "especiales" que usan las vistas nuevas `race_winner_ages` y `driver_circuit_wins` (ya creadas y verificadas en producción, migraciones `20260709013813` y `20260709014531`).

## Cambio de estructura de la página índice

`/records` pasa de una sola grilla a 3 secciones con encabezado: **Drivers** (las 7 de v1, sin cambios), **Constructors** (6 nuevas), **Special** (2 nuevas). No tocar las queries ni el diseño de las 7 de v1.

## Grupo 1 — Constructors (cero SQL nuevo, mismo patrón que driver_stats)

Nuevos slugs: `constructors-most-wins`, `constructors-most-poles`, `constructors-most-podiums`, `constructors-most-fastest-laps`, `constructors-most-championships`, `constructors-most-points`, `constructors-longest-win-streak`.

Columnas verificadas en `constructor_stats`: `constructor_id, name, nationality, wins, podiums, pole_positions, fastest_laps, championships, total_points, first_year, last_year`. **Ojo**: la columna se llama `pole_positions`, no `poles` (distinto de `driver_stats`, no asumir el mismo nombre).

```sql
SELECT constructor_id, name, nationality, wins FROM constructor_stats ORDER BY wins DESC LIMIT 10;
SELECT constructor_id, name, nationality, pole_positions FROM constructor_stats ORDER BY pole_positions DESC LIMIT 10;
SELECT constructor_id, name, nationality, podiums FROM constructor_stats ORDER BY podiums DESC LIMIT 10;
SELECT constructor_id, name, nationality, fastest_laps FROM constructor_stats ORDER BY fastest_laps DESC LIMIT 10;
SELECT constructor_id, name, nationality, championships FROM constructor_stats WHERE championships > 0 ORDER BY championships DESC LIMIT 10;
SELECT constructor_id, name, nationality, total_points FROM constructor_stats ORDER BY total_points DESC LIMIT 10;
```

Streak, usa `constructor_win_streaks` (columnas: `constructor_id, name, constructor_ref, streak_len, end_year`):
```sql
SELECT constructor_id, name, constructor_ref, streak_len, end_year
FROM constructor_win_streaks
ORDER BY streak_len DESC
LIMIT 10;
```

No hace falta join extra para el nombre — a diferencia de `driver_win_streaks`, esta vista ya trae `name` y `constructor_ref` directo.

## Grupo 2 — Youngest / Oldest race winner

Usa `race_winner_ages` (`driver_id, race_id, race_name, race_date, year, age_days`). Usar `DISTINCT ON (driver_id)` para que el top 10 muestre 10 drivers distintos (su récord personal más extremo), no un solo driver repetido varias veces si ganó joven/viejo más de una vez:

```sql
-- Youngest
SELECT * FROM (
  SELECT DISTINCT ON (driver_id) driver_id, race_name, race_date, year, age_days
  FROM race_winner_ages
  ORDER BY driver_id, age_days ASC
) sub
ORDER BY age_days ASC
LIMIT 10;

-- Oldest
SELECT * FROM (
  SELECT DISTINCT ON (driver_id) driver_id, race_name, race_date, year, age_days
  FROM race_winner_ages
  ORDER BY driver_id, age_days DESC
) sub
ORDER BY age_days DESC
LIMIT 10;
```

Nota: Supabase JS no soporta subqueries anidadas así directo vía `.from()` — implementar esto como una vista SQL nueva (`youngest_oldest_race_winners` o dos vistas separadas), no como query client-side. Requiere una migración nueva (`npx supabase migration new`), avisar antes de crearla si no está clara la instrucción.

`age_days` es un intervalo de Postgres (diferencia de dos `date`) — llega como número de días. Convertir a años para mostrar: `(age_days / 365.25).toFixed(1)` años, formateado como `"22.1"` con la unidad "years old" / "años" en el label, no como fecha.

Join contra `drivers` por `driver_id` para nombre, código, nacionalidad — mismo patrón que `fetchDriverRefs` en v1, reusar esa función tal cual, no duplicarla.

`era` para estas dos categorías = `` `${race_name} · ${year}` `` (el contexto es la carrera específica, no un rango de años).

## Grupo 3 — Most wins at a single circuit

Usa `driver_circuit_wins` (`driver_id, circuit_id, wins`) — a diferencia de youngest/oldest, aquí SÍ se permite que el mismo driver aparezca más de una vez si domina dos circuitos distintos (es información real e interesante, no ruido):

```sql
SELECT driver_id, circuit_id, wins
FROM driver_circuit_wins
ORDER BY wins DESC
LIMIT 10;
```

Join contra `drivers` (nombre) y `circuits` (columna `name`) por sus IDs respectivos — dos lookups, mismo patrón de `fetchDriverRefs`.

`era` para esta categoría = nombre del circuito (ej. "Silverstone Circuit"), no un año.

## Reglas que se mantienen de v1 — no repetir errores ya corregidos

- Reusar `fetchDriverRefs`, `RecordScorecardButton`, `ShareButton`, el patrón de card/bento — no crear componentes nuevos donde ya existe uno que sirve
- `#F4F4F0` / `#E61919` / cero dark mode — mismas reglas de `DESIGN.md`
- i18n completo en `en.json`, `es.json`, `pt.json` para cada slug nuevo, mismo formato de `{slug}.title` / `{slug}.unit` que v1
- Todo cambio de esquema (la vista nueva de youngest/oldest si hace falta) va por `supabase migration new` → `db push`, nunca SQL pegado a mano

## Success criteria

- [ ] `/records` muestra 3 secciones: Drivers (7, sin cambios), Constructors (7 nuevas), Special (2 nuevas)
- [ ] Constructors usa `pole_positions` correctamente (no `poles`)
- [ ] Youngest/oldest muestra 10 drivers distintos, edad en años con 1 decimal
- [ ] Circuit wins permite drivers repetidos si dominan más de un circuito
- [ ] Build limpio (`npm run build`) contra producción real
