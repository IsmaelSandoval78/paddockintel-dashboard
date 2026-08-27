-- Aditivo. No toca `articles.tags` (text[]) — convive con la tabla relacional nueva
-- hasta que se confirme que la migración está completa; el drop de `tags` queda para
-- una sesión futura, no acá.
--
-- 1) season_year: `season-2026` era, en la práctica, un campo estructurado (237/315
--    artículos, ~75%) disfrazado de tag de texto. Se extrae a una columna propia;
--    NO se migra a la tabla `tags` (ver mapeo de fusión abajo).
-- 2) tags / article_tags: tabla relacional para los 45 valores distintos que vivían en
--    `articles.tags`, fusionando duplicados de idioma/nomenclatura (33 conceptos
--    canónicos resultantes) según decisión de Ismael. `japanese-gp`, `miami-gp` y `hub`
--    se descartan por completo — no se migran a ninguna tabla:
--      - japanese-gp / miami-gp: se van a resolver vía articles.race_id -> races,
--        no como tags de texto. Pendiente para sesión separada (race_id hoy es NULL
--        en las 315 filas existentes).
--      - hub: tag obsoleto, sin reemplazo necesario.

alter table public.articles
    add column if not exists season_year integer;

update public.articles
    set season_year = (
        select substring(t from 'season-(\d{4})')::integer
        from unnest(articles.tags) as t
        where t ~ '^season-\d{4}$'
        limit 1
    )
    where season_year is null
      and exists (
        select 1 from unnest(articles.tags) as t where t ~ '^season-\d{4}$'
      );

create table if not exists public.tags (
    id uuid primary key default gen_random_uuid(),
    category text not null check (category in ('team', 'topic', 'format', 'series', 'region')),
    slug text not null,
    name text not null,
    unique (category, slug)
);

create index if not exists idx_tags_category
    on public.tags (category);

create table if not exists public.article_tags (
    article_id uuid references public.articles(id) not null,
    tag_id uuid references public.tags(id) not null,
    primary key (article_id, tag_id)
);

create index if not exists idx_article_tags_tag_id
    on public.article_tags (tag_id);

-- 33 conceptos canónicos, resultado de fusionar los 41 tags viejos que sí se migran
-- (los 4 restantes de los 45 originales -- japanese-gp, miami-gp, hub, season-2026 --
-- no entran acá, ver comentario de cabecera).
insert into public.tags (category, slug, name) values
    ('team', 'aston-martin', 'Aston Martin'),
    ('team', 'ferrari', 'Ferrari'),
    ('team', 'mclaren', 'McLaren'),
    ('team', 'williams', 'Williams'),
    ('team', 'mercedes-amg-f1', 'Mercedes-AMG F1'),
    ('team', 'red-bull', 'Red Bull Racing'),
    ('team', 'cadillac', 'Cadillac F1 Team'),
    ('series', 'f1-academy', 'F1 Academy'),
    ('series', 'indycar', 'IndyCar'),
    ('series', 'nascar', 'NASCAR'),
    ('format', 'breaking-news', 'Breaking News'),
    ('format', 'deep-dive', 'Deep Dive'),
    ('format', 'featured', 'Featured'),
    ('format', 'quick-take', 'Quick Take'),
    ('format', 'paddock-life', 'Paddock Life'),
    ('region', 'europe', 'Europe'),
    ('region', 'north-america', 'North America'),
    ('topic', 'race-analysis', 'Race Analysis'),
    ('topic', 'regulations', 'Regulations'),
    ('topic', 'economics', 'Economics'),
    ('topic', 'technical', 'Technical'),
    ('topic', 'economic-intelligence', 'Economic Intelligence'),
    ('topic', 'driver-finance', 'Driver Finance'),
    ('topic', 'team-finance', 'Team Finance'),
    ('topic', 'team-valuations', 'Team Valuations'),
    ('topic', 'sponsorships', 'Sponsorships'),
    ('topic', 'supply-chain-operations', 'Supply Chain & Operations'),
    ('topic', 'operational-strategy', 'Operational Strategy'),
    ('topic', 'race-weekend-economics', 'Race Weekend Economics'),
    ('topic', 'race-intel', 'Race Intel'),
    ('topic', 'motorsport-business', 'Motorsport Business'),
    ('topic', 'liberty-media', 'Liberty Media'),
    ('topic', 'disney', 'Disney')
on conflict (category, slug) do nothing;

-- Mapeo de fusión: valor viejo en articles.tags -> (category, slug) del concepto
-- canónico en `tags`. Cualquier valor de articles.tags que NO aparezca en este mapeo
-- (japanese-gp, miami-gp, hub, season-2026) simplemente no genera fila en article_tags.
insert into public.article_tags (article_id, tag_id)
select distinct a.id, t.id
from public.articles a
cross join lateral unnest(a.tags) as old_tag(value)
join (
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
) as tag_map(old_value, category, slug)
    on tag_map.old_value = old_tag.value
join public.tags t
    on t.category = tag_map.category and t.slug = tag_map.slug
on conflict (article_id, tag_id) do nothing;

alter table public.tags enable row level security;
alter table public.article_tags enable row level security;

create policy "public read tags"
    on public.tags for select
    using (true);

create policy "public read article_tags"
    on public.article_tags for select
    using (true);

grant select on table public.tags to anon;
grant select on table public.tags to authenticated;
grant all on table public.tags to service_role;

grant select on table public.article_tags to anon;
grant select on table public.article_tags to authenticated;
grant all on table public.article_tags to service_role;
