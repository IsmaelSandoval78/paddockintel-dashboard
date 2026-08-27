-- Aditivo, no toca ninguna tabla existente en su forma actual.
-- 1) content_type on articles: distinguishes hand-written analysis from a future
--    aggregation pipeline. Everything ingested so far was written directly, so
--    backfill existing rows as 'original_analysis'.
-- 2) authors table + articles.author_id: single author (Ismael Sandoval) today,
--    but articles needs an FK target before a future multi-author pipeline lands.
-- 3) article_sources: per-source citation rows for aggregated content. Starts
--    empty — no existing article uses this pattern yet. The existing `sources`
--    jsonb column on articles is left untouched; whether article_sources
--    replaces it is a decision for a later session.

alter table public.articles
    add column if not exists content_type text
        check (content_type in ('original_analysis', 'aggregated_brief', 'recap'));

update public.articles
    set content_type = 'original_analysis'
    where content_type is null;

create table if not exists public.authors (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    bio text,
    avatar_url text,
    created_at timestamptz not null default now()
);

insert into public.authors (name, slug, bio, avatar_url)
values ('Ismael Sandoval', 'ismael-sandoval', null, null)
on conflict (slug) do nothing;

alter table public.articles
    add column if not exists author_id uuid references public.authors(id);

update public.articles
    set author_id = (select id from public.authors where slug = 'ismael-sandoval')
    where author_id is null;

create index if not exists idx_articles_author_id
    on public.articles (author_id);

create table if not exists public.article_sources (
    id uuid primary key default gen_random_uuid(),
    article_id uuid not null references public.articles(id),
    source_name text not null,
    source_url text not null,
    original_headline text,
    published_at_source timestamptz
);

create index if not exists idx_article_sources_article_id
    on public.article_sources (article_id);

alter table public.authors enable row level security;
alter table public.article_sources enable row level security;

create policy "public read authors"
    on public.authors for select
    using (true);

create policy "public read article_sources"
    on public.article_sources for select
    using (true);

grant select on table public.authors to anon;
grant select on table public.authors to authenticated;
grant all on table public.authors to service_role;

grant select on table public.article_sources to anon;
grant select on table public.article_sources to authenticated;
grant all on table public.article_sources to service_role;
