-- Aditivo, no toca ninguna tabla existente.
-- Evergreen reference content (F1 economics glossary) — same translation-group
-- shape as `articles` (locale + translation_group_id + slug), but a term is
-- short/definitional, not a dated narrative, so it gets its own table rather
-- than overloading `articles`.
create table if not exists public.glossary_terms (
    id uuid primary key default gen_random_uuid(),
    translation_group_id uuid not null,
    locale text not null check (locale in ('en', 'es', 'pt')),
    slug text not null,
    term text not null,
    category text not null,
    short_definition text not null,
    body_markdown text not null,
    related_terms text[] not null default '{}',
    sources jsonb,
    status text not null default 'draft' check (status in ('draft', 'published')),
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (locale, slug)
);

create index if not exists idx_glossary_terms_translation_group
    on public.glossary_terms (translation_group_id);

create index if not exists idx_glossary_terms_category
    on public.glossary_terms (category);

alter table public.glossary_terms enable row level security;

create policy "public read published glossary_terms"
    on public.glossary_terms for select
    using (status = 'published');

grant select, references, trigger, truncate, maintain on table public.glossary_terms to anon;
grant select, references, trigger, truncate, maintain on table public.glossary_terms to authenticated;
grant all on table public.glossary_terms to service_role;
