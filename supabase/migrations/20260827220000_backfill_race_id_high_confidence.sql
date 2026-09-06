-- REGISTRO HISTÓRICO, NO RE-EJECUTAR COMO PARTE DE UN PIPELINE DE MIGRACIONES.
-- Este archivo documenta un backfill de datos que YA SE APLICÓ el 27 ago 2026 vía
-- PATCH directo a la API REST de Supabase (PostgREST, service_role key), no a
-- través del SQL Editor -- a diferencia de las migraciones de schema anteriores,
-- esto es un UPDATE de datos sobre una columna existente (articles.race_id), no
-- DDL, así que no requirió acceso directo a Postgres. Se deja acá únicamente como
-- registro histórico del criterio de matching y de qué filas se tocaron y cuáles
-- se dejaron intencionalmente en NULL. Es idempotente (vuelve a poner los mismos
-- valores si se corre de nuevo), pero no forma parte del flujo normal de
-- migraciones de este repo.
--
-- CONTEXTO: articles.race_id (agregado en 20260827160000) estaba NULL en las 315
-- filas. De las 237 filas con season_year poblado, se identificaron 74 filas /
-- 27 historias (slug/translation_group) con indicio real de carrera puntual en
-- el título (nombre de Grand Prix o de circuito). De esas 27 historias, 19 (57
-- filas, 3 idiomas cada una) se resolvieron con alta confianza; las otras 8 se
-- dejaron en NULL a propósito (detalle abajo). Las 163 filas con season_year sin
-- ningún indicio de carrera puntual también quedan en NULL a propósito -- no son
-- carreras, son piezas de temporada en general (fichajes, finanzas, reglamento).
--
-- CRITERIO DE MATCHING (alta confianza): season_year = races.year (siempre 2026
-- en este lote) Y el nombre de la carrera o del circuito en el título coincide
-- de forma inequívoca con races.name / circuits.name / circuits.location (vía
-- races.circuit_id), confirmado contra las 22 carreras reales del calendario
-- 2026. race_id se resuelve por historia (slug), no por fila -- se propaga por
-- igual a las 3 traducciones (en/es/pt) de cada una.

-- 19 historias de alta confianza (57 filas) --------------------------------

-- race_id 1169 -- Australian Grand Prix, round 1, 2026-03-08
update public.articles set race_id = 1169
where slug in (
    'aston-martin-fp1-melbourne-alonso-garage-fp1-2026',
    'aston-martin-fp2-melbourne-two-batteries-honda-2026',
    'aston-martin-honda-force-majeure-melbourne-cost-2026',
    'melbourne-2026-australian-grand-prix-cost-economic-impact',
    'mercedes-fp3-melbourne-russell-antonelli-crash-2026'
);

-- race_id 1170 -- Chinese Grand Prix, round 2, 2026-03-15
update public.articles set race_id = 1170
where slug in (
    'chinese-gp-2026-antonelli-wins-mclaren-dns-mercedes',
    'shanghai-2026-chinese-grand-prix-cost-economic-impact',
    'shanghai-2026-fp1-mercedes-ferrari-macarena-racing-bulls',
    'shanghai-2026-qualifying-antonelli-pole-russell-q3-crisis',
    'shanghai-2026-sprint-russell-wins-antonelli-penalty'
);

-- race_id 1171 -- Japanese Grand Prix, round 3, 2026-03-29
update public.articles set race_id = 1171
where slug in (
    'fia-qualifying-energy-limit-suzuka-2026',
    'honda-aston-martin-suzuka-2026-cost-engine-crisis',
    'japanese-gp-2026-race-antonelli-wins-suzuka',
    'suzuka-2026-japanese-grand-prix-cost-economic-impact',
    'suzuka-fp1-2026-russell-verstappen-aston-martin',
    'suzuka-fp2-2026-piastri-fastest-reliability'
);

-- race_id 1172 -- Miami Grand Prix, round 4, 2026-05-03
update public.articles set race_id = 1172
where slug = 'miami-2026-f1-prize-money-constructors-championship';

-- race_id 1173 -- Canadian Grand Prix, round 5, 2026-05-24
update public.articles set race_id = 1173
where slug = 'canadian-grand-prix-2026-tickets-economic-impact';

-- race_id 1177 -- British Grand Prix, round 9, 2026-07-05
update public.articles set race_id = 1177
where slug = 'british-gp-2026-data-analysis';

-- 8 historias ambiguas -- race_id se deja en NULL a propósito ------------
-- No hay UPDATE para estas: NULL ya es su estado correcto. Motivo por caso:
--
--   bahrain-grand-prix-2026-cancelled
--     -> No existe Bahrain en el calendario real 2026 (confirmado contra las
--        22 carreras). No hay fila en races a la que apuntar.
--
--   f1-2026-bahrain-test-day-1-analysis-ferrari-mercedes
--   lando-norris-fastest-on-day-one-of-f1-testing-in-bahrain-a-valuation-of-mileage-and-aero-efficiency
--     -> Sobre testing pretemporada, no una carrera. races no tiene filas para
--        sesiones de test; no hay match posible por diseño.
--
--   f1-stranded-equipment-bahrain-2026
--     -> Logística de equipos tras cancelar Bahrain Y Saudi Arabia -- ninguna
--        carrera real de por medio.
--
--   bahrain-testing-2026-economic-impact
--     -> Título ambiguo: menciona Bahrain (testing) Y Melbourne (carrera real,
--        race_id 1169) en la misma oración. Podría ser sobre el Australian GP
--        o no ser sobre ninguna carrera puntual -- requiere leer el contenido
--        completo para decidir, no se fuerza un match por prudencia.
--
--   barcelona-2032-f1-investment-strategy
--     -> El título es sobre 2032 (inversión de infraestructura a futuro), no
--        sobre el fin de semana de carrera de Barcelona 2026 (round 7,
--        race_id 1175). Asociarlo a esa carrera sería probablemente incorrecto.
--
--   f1-drivers-monaco-2026
--     -> Sobre residencia fiscal de pilotos en Mónaco (el país/estrategia
--        impositiva), no sobre el fin de semana de carrera (round 6,
--        race_id 1174). Coincidencia de nombre, no de tema.
--
--   f1-2026-rule-changes-six-fixes-miami
--     -> Menciona Miami solo como fecha límite ("before Miami GP") para
--        cambios de reglamento, no es cobertura del fin de semana de esa
--        carrera. Sin tag miami-gp tampoco -- zona gris real.
