-- Visible corrections and updates (2026-11-09).
--
-- The About page promises that "when we get a number wrong, we fix it and say so on the page,
-- with the date and what changed", and Google News weighs that kind of transparency. Until now a
-- correction was a silent re-ingest (e.g. the 2026 São Paulo race cover, provisional result
-- replaced by the FIA final classification). Each row now keeps its own dated list, written from
-- the `corrections` frontmatter by scripts/ingest-article.ts and scripts/ingest-digest.ts and
-- shown under the byline (lib/corrections.ts).
--
--   articles.corrections      [{ "date": "<ISO 8601>", "note": "<text in the row's locale>" }]
--   digest_items.corrections  [{ "date": "<ISO 8601>", "note": "<EN>", "note_es": "<ES>" }]
--
-- Applied 2026-11-09 through the Supabase connector (Management API), a one-off the founder
-- approved because the CLI can't reach Postgres from a cloud session and the founder has web-only
-- access; the file is named after the version Supabase recorded, so `supabase db push` stays aligned.
--
-- Additive only: no existing column, policy or grant changes, and the default keeps every
-- existing row valid.

alter table public.articles
  add column if not exists corrections jsonb not null default '[]'::jsonb;

alter table public.digest_items
  add column if not exists corrections jsonb not null default '[]'::jsonb;

comment on column public.articles.corrections is
  'Dated public corrections/updates shown on the article: [{date, note}]. Newest last.';
comment on column public.digest_items.corrections is
  'Dated public corrections/updates shown on the Feed item: [{date, note, note_es}]. Newest last.';
