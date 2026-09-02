-- Aditivo. Soporta la estrategia de "niveles de profundidad" del glosario
-- (docs/ROADMAP-SEMANA.md, sección "Sub-línea: contenido educativo evergreen"):
-- cada término da hasta 3 URLs indexables (eli5 / technical / fia), cada una
-- atacando una intención de búsqueda distinta, en vez de una sola definición plana.
--
-- Los 6 términos ya publicados (cost-cap, concorde-agreement, anti-dilution-fee,
-- prize-money, hosting-fee, title-sponsorship) son de formato plano previo a esta
-- decisión -- se backfillean a depth='technical' (el nivel más cercano a lo que
-- ya tienen: explicación técnica estándar con detalle regulatorio dentro).

alter table public.glossary_terms
    add column if not exists depth text not null default 'technical'
    check (depth in ('eli5', 'technical', 'fia'));

-- El slug ya no es único por sí solo -- las 3 capas de un mismo término
-- comparten slug base, distinguidas por depth.
alter table public.glossary_terms drop constraint if exists glossary_terms_locale_slug_key;
alter table public.glossary_terms add constraint glossary_terms_locale_slug_depth_key
    unique (locale, slug, depth);
