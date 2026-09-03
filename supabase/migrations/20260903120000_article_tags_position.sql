-- Aditivo. Paso 1 de 2 para dropear `articles.tags` (text[]) en una sesion
-- futura, una vez que el codigo de la app este migrado a leer de
-- `article_tags`/`tags` y verificado en el sitio real.
--
-- `article_tags` (creada 27 ago 2026) no preservaba el orden original del
-- array `articles.tags` -- se inserto via `select distinct`, sin columna de
-- posicion. El primer tag de cada articulo (`tags[0]`) es lo que hoy arma el
-- "kicker" editorial (ArticleHero, ArticlePreviewCard, FeaturedArticleCard) y
-- el link de filtro `?tag=`, asi que hay que reconstruir ese orden antes de
-- poder dropear la columna vieja sin cambiar que tag se muestra primero.

alter table public.article_tags
    add column if not exists position smallint;

-- Mismo mapeo valor-viejo -> tag canonico usado en
-- 20260827180000_articles_tags_relational.sql. Los valores que no aparecen
-- aca (japanese-gp, miami-gp, hub, season-2026) no generan fila en
-- article_tags y por lo tanto no reciben posicion -- si eran tags[0] en el
-- array viejo, el articulo pasa a mostrar su primer tag real siguiente (o
-- ninguno, si no le quedan tags migrables).
with old_tag_map(old_value, category, slug) as (
    values
        ('race-analysis', 'topic', 'race-analysis'),
        ('analisis-de-carrera', 'topic', 'race-analysis'),
        ('analise-de-corrida', 'topic', 'race-analysis'),
        ('regulations', 'topic', 'regulations'),
        ('regulaciones', 'topic', 'regulations'),
        ('regulamentacoes', 'topic', 'regulations'),
        ('economics', 'topic', 'economics'),
        ('economia', 'topic', 'economics'),
        ('technical', 'topic', 'technical'),
        ('tecnico', 'topic', 'technical'),
        ('europe', 'region', 'europe'),
        ('europa', 'region', 'europe'),
        ('north-america', 'region', 'north-america'),
        ('mercedes-amg-f1', 'team', 'mercedes-amg-f1'),
        ('mercedes', 'team', 'mercedes-amg-f1'),
        ('aston-martin', 'team', 'aston-martin'),
        ('ferrari', 'team', 'ferrari'),
        ('mclaren', 'team', 'mclaren'),
        ('williams', 'team', 'williams'),
        ('red-bull-racing', 'team', 'red-bull'),
        ('cadillac-formula-1-team', 'team', 'cadillac'),
        ('f1-academy', 'series', 'f1-academy'),
        ('indycar', 'series', 'indycar'),
        ('nascar', 'series', 'nascar'),
        ('breaking-news', 'format', 'breaking-news'),
        ('deep-dive', 'format', 'deep-dive'),
        ('featured', 'format', 'featured'),
        ('quick-take', 'format', 'quick-take'),
        ('paddock-life', 'format', 'paddock-life'),
        ('economic-intelligence', 'topic', 'economic-intelligence'),
        ('driver-finance', 'topic', 'driver-finance'),
        ('team-finance', 'topic', 'team-finance'),
        ('team-valuations', 'topic', 'team-valuations'),
        ('sponsorships', 'topic', 'sponsorships'),
        ('supply-chain-operations', 'topic', 'supply-chain-operations'),
        ('operational-strategy', 'topic', 'operational-strategy'),
        ('race-weekend-economics', 'topic', 'race-weekend-economics'),
        ('race-intel', 'topic', 'race-intel'),
        ('motorsport-business', 'topic', 'motorsport-business'),
        ('liberty-media', 'topic', 'liberty-media'),
        ('disney', 'topic', 'disney')
),
ordinal_tags as (
    select a.id as article_id, old_tag.value as old_value, old_tag.ord as ord
    from public.articles a
    cross join lateral unnest(a.tags) with ordinality as old_tag(value, ord)
),
resolved as (
    select ot.article_id, t.id as tag_id, min(ot.ord) as first_ord
    from ordinal_tags ot
    join old_tag_map m on m.old_value = ot.old_value
    join public.tags t on t.category = m.category and t.slug = m.slug
    group by ot.article_id, t.id
),
ranked as (
    select article_id, tag_id,
           row_number() over (partition by article_id order by first_ord) as rn
    from resolved
)
update public.article_tags at
set position = ranked.rn
from ranked
where at.article_id = ranked.article_id and at.tag_id = ranked.tag_id;

-- `data-desk` es un tag de formato usado por getDataDeskArticles()
-- (app/[locale]/(blog)/magazine-home/data.ts) que ya existia en el codigo
-- desde antes de la migracion relacional pero nunca se le habia asignado a
-- ningun articulo -- no aparecia en los 45 valores distintos auditados el 27
-- ago, asi que se quedo fuera de la tabla `tags`. Se agrega ahora para que el
-- mismo mecanismo de lookup por slug canonico sirva para featured y
-- data-desk por igual.
insert into public.tags (category, slug, name) values
    ('format', 'data-desk', 'Data Desk')
on conflict (category, slug) do nothing;
