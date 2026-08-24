# PaddockIntel · Records Hub — Spec v3: Closest Championships
# Para Claude Code — leer DESIGN.md, CLAUDE.md, PHASES.md, RECORDS-HUB-SPEC.md, RECORDS-HUB-SPEC-V2.md antes de implementar

---

## Objetivo

Nueva sección "D · Season Battles" en `/records`: ranking de los campeonatos más reñidos de la historia (usando la vista ya creada y verificada `season_title_fights`, migración `20260709024355`), con una página de detalle por temporada que muestra la brecha de puntos cerrándose carrera por carrera.

## Rutas — nota de colisión con Next.js

`/records/closest-championships` es una ruta **estática** (carpeta propia, no parte de `[slug]`), y coexiste sin problema con `/records/[slug]` porque Next.js siempre prioriza rutas estáticas sobre dinámicas al mismo nivel. No hay que tocar `page.tsx` de `[slug]` para esto.

- `app/[locale]/(hub)/records/closest-championships/page.tsx` — lista: top 10 temporadas más reñidas
- `app/[locale]/(hub)/records/closest-championships/[year]/page.tsx` — detalle: gráfico de progresión de esa temporada

## Datos — lista

```sql
SELECT year, champion_id, runner_up_id, champion_points, runner_up_points, gap
FROM season_title_fights
ORDER BY gap ASC
LIMIT 10;
```

Batch-fetch nombres de `drivers` para `champion_id` y `runner_up_id` combinados (mismo patrón que `fetchDriverRefs` — reusar esa función, no duplicarla).

## Datos — detalle de una temporada (sin vista nueva, 2 queries + merge en cliente)

```ts
// 1. Carreras de esa temporada, en orden
const { data: seasonRaces } = await supabase
  .from('races')
  .select('id, round, name')
  .eq('year', year)
  .order('round', { ascending: true });

// 2. driver_standings de esas carreras, solo para los 2 drivers del título
const raceIds = seasonRaces.map(r => r.id);
const { data: standings } = await supabase
  .from('driver_standings')
  .select('race_id, driver_id, points')
  .in('race_id', raceIds)
  .in('driver_id', [championId, runnerUpId]);

// 3. Merge en cliente: por cada ronda, { round, raceName, championPoints, runnerUpPoints, gap }
```

Nota: no todas las temporadas tienen el mismo número de rondas — el formato de puntos cambió varias veces en la historia (ej. 1991-2002 solo top 6 puntuaban, desde 2010 top 10). No normalizar ni "corregir" esto — mostrar los puntos reales tal como están en `driver_standings`, la vista es históricamente honesta, no necesita interpretación.

## Componente de gráfico — SVG hecho a mano, sin librería nueva

`components/records/SeasonBattleChart.tsx` — SVG con 2 polylines (una por driver), eje X = ronda, eje Y = puntos acumulados. Línea del campeón en `--red` (#E61919), línea del subcampeón en `--text-2`. Sin grid de fondo pesado — un par de líneas horizontales sutiles en `--border-subtle` para referencia de puntos, nada más. Tooltip on-hover opcional (mostrar ronda + nombre de la carrera + puntos de ambos) — si se implementa, mismo patrón visual que el resto del sitio (fondo `--surface`, texto mono).

Esto es 100% SVG generado desde los datos, no un componente de librería externa — sigue el mismo patrón que ya usaste para el mapa de circuitos con `d3-geo` (cálculo de coordenadas a mano, sin dependencia pesada).

## Página de lista — diseño

Nueva `SectionHeader` "D" en `/records/page.tsx`, mismo patrón que A/B/C. Cada fila (no card bento, es una lista más lineal porque el dato principal es "año + gap", no un ranking numérico 1-10 de personas):
01 · 1984 · Lauda vs. Prost · +0.5 pts →
02 · 1958 · [campeón] vs. [subcampeón] · +1.0 pts →

## Página de detalle — diseño

- Header: año + nombres de los 2 drivers + gap final
- `SeasonBattleChart` a todo el ancho
- Debajo: tabla compacta ronda-por-ronda (carrera, puntos de cada uno, brecha en ese punto) — mono, tabular-nums
- Scorecard exportable: versión simplificada del gráfico (mismo canvasUtils, nueva función `drawSeasonBattleCard` — año, los 2 nombres, gap final; sparkline opcional si el tiempo alcanza)
- Share button, mismo componente de siempre

## i18n

Namespace `records`, nuevas claves: `sectionSeasonBattles`, `closestChampionships.title`, `closestChampionships.unit` ("Point gap" / "Diferencia de puntos" / "Diferença de pontos"), `closestChampionships.vs` ("vs." es igual en los 3 idiomas). EN/ES/PT completos, mismo estándar que v1/v2.

## Reglas que se mantienen

- `#F4F4F0` / `#E61919` / cero dark mode
- Reusar `fetchDriverRefs`, `ShareButton`, patrones de scorecard existentes
- Todo cambio de esquema ya está hecho (vista `season_title_fights` ya en producción) — esta fase es solo frontend + 2 queries nuevas en `lib/records.ts`, no requiere migraciones adicionales

## Success criteria

- [ ] `/records` muestra sección D con las 10 temporadas más reñidas
- [ ] `/records/closest-championships/[year]` funciona para al menos 1984, 2008, 1994
- [ ] Gráfico SVG sin librería nueva en package.json
- [ ] Build limpio
