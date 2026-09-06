-- REGISTRO HISTÓRICO, NO RE-EJECUTAR COMO PARTE DE UN PIPELINE DE MIGRACIONES.
-- Este archivo documenta un backfill de datos que YA SE APLICÓ el 2 sep 2026 vía
-- PATCH directo a la API REST de Supabase (PostgREST, service_role key), no a
-- través del SQL Editor -- UPDATE de datos sobre articles.race_id, no DDL.
--
-- CONTEXTO: Ismael pidió continuar con "los 163 artículos" citados en el cierre
-- de la Fase 1 (20260827220000_backfill_race_id_high_confidence.sql). Esa cifra
-- estaba desactualizada -- el sitio siguió publicando desde entonces. Verificado
-- contra la base al arrancar esta sesión: 258 filas / 86 historias con race_id
-- NULL, no 163.
--
-- El criterio de matching de la Fase 1 (nombre de carrera/circuito en el TÍTULO)
-- resultó más angosto de lo necesario -- había historias reales con indicio de
-- carrera solo en el cuerpo o en tags, no en el título (ej. "The Honda Tax: How
-- Aston Martin's Engine Crisis..." con dateline "Round 1 — Australia" en el
-- cuerpo). Esta fase amplió el matching a título+tags+cuerpo, y se leyó el
-- cuerpo completo de cada candidato antes de decidir -- no se confió en
-- coincidencia de palabra clave sola.
--
-- 15 historias de alta confianza (45 filas, 3 idiomas cada una), todas
-- verificadas con contenido explícito de la carrera en el cuerpo del artículo.

-- race_id 1169 -- Australian Grand Prix, round 1, 2026-03-08
update public.articles set race_id = 1169
where slug in (
    'melbourne-2026-f1-prize-money-constructors-championship',
    'aston-martin-honda-melbourne-vibration-financial-cost-2026',
    'aston-martin-honda-tax-budget-cap-2026',
    'mercedes-pole-verstappen-crash-qualifying-australia-2026',
    'russell-wins-australian-gp-2026-mercedes-race',
    'australian-gp-2026-analysis-mercedes-ferrari'
);

-- race_id 1171 -- Japanese Grand Prix, round 3, 2026-03-29
update public.articles set race_id = 1171
where slug in (
    'nagoya-2026-japanese-gp-economic-impact',
    'suzuka-qualifying-2026-antonelli-pole-verstappen-q2',
    'bearman-50g-crash-suzuka-2026-f1-safety',
    'verstappen-retirement-2026-f1-future'
);

-- race_id 1172 -- Miami Grand Prix, round 4, 2026-05-03
update public.articles set race_id = 1172
where slug in ('miami-grand-prix-2026-cost-tickets');

-- race_id 1173 -- Canadian Grand Prix, round 5, 2026-05-24
update public.articles set race_id = 1173
where slug in ('canada-gp-2026-economic-impact');

-- race_id 1176 -- Austrian Grand Prix, round 8, 2026-06-28
update public.articles set race_id = 1176
where slug in ('austria-gp-2026-russell-win-economic-impact');

-- race_id 1178 -- Belgian Grand Prix, round 10, 2026-07-19
update public.articles set race_id = 1178
where slug in ('russell-antonelli-mercedes-software-fault-spa');

-- race_id 1179 -- Hungarian Grand Prix, round 11, 2026-07-26
update public.articles set race_id = 1179
where slug in ('hungarian-gp-2026-economic-impact');

-- Nota: los slugs de arriba son los de la fila locale='en' de cada historia;
-- el UPDATE se aplicó por translation_group_id, así que las filas es/pt de
-- cada una (con su propio slug distinto) quedaron con el mismo race_id.

-- 71 historias (213 filas) quedan en NULL a propósito -- ninguna mostró
-- indicio real de carrera al leer el cuerpo completo. Categorías: testing de
-- pretemporada (Barcelona/Bahréin, no es una fila de `races`), lanzamientos de
-- auto, residencia fiscal en Mónaco (no el GP), Barcelona 2032 (circuito
-- futuro, año distinto), GP de Bahréin cancelado (no existe en `races` 2026),
-- noticias de reglamento que solo citan una carrera como fecha de entrada en
-- vigor, F1 Academy (categoría distinta corriendo en paralelo a un GP de F1),
-- y la serie editorial "Team Finance" de PaddockIntel (usa una carrera próxima
-- como referencia temporal, el tema es la situación financiera del equipo en
-- general). Detalle completo en docs/ROADMAP-SEMANA.md.
