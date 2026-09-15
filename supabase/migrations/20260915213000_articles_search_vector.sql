-- Full-text search for the Magazine's search bar. Scoped to `articles` for
-- v1 (Blog content) — digest_items/digest_issues are a separate schema and
-- are not included yet; add a second generated column + a UNION in the
-- search query if/when that's needed.
--
-- to_tsvector(regconfig, text) is STABLE, not IMMUTABLE, so Postgres refuses
-- it directly inside a generated column expression. This wrapper re-declares
-- it IMMUTABLE — the standard, documented workaround (a text search config
-- changing under a live app is not a real risk for this project).
create or replace function immutable_to_tsvector(config regconfig, txt text)
returns tsvector
language sql
immutable
parallel safe
as $$
  select to_tsvector(config, coalesce(txt, ''));
$$;

-- One generated column covering all three locales — language config picked
-- per row from `locale` so Spanish/Portuguese get real stemming instead of
-- being tokenized as English.
alter table articles
  add column if not exists search_vector tsvector
  generated always as (
    immutable_to_tsvector(
      case locale
        when 'es' then 'spanish'::regconfig
        when 'pt' then 'portuguese'::regconfig
        else 'english'::regconfig
      end,
      coalesce(title, '') || ' ' || coalesce(meta_description, '') || ' ' || coalesce(body_markdown, '')
    )
  ) stored;

create index if not exists articles_search_vector_idx on articles using gin (search_vector);
