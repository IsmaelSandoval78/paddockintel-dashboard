-- Individual Feed item pages (app/[locale]/(digest)/feed/[slug]/page.tsx) need their own
-- slug, metadata, and a distinct data-driven stat block -- the Supabase-sourced numbers that
-- are PaddockIntel's actual differentiation from a wire-service rewrite, not just prose that
-- happens to mention a stat. Decided 2026-09-16 (see project memory
-- project_vol10_first_drama_batch): every Feed item gets summary + our take + "who/what this
-- is in numbers" + FAQ, the same four building blocks as a Blog article's stats/faq_items,
-- scoped down for a wire-brief instead of a full five-section piece.
--
-- `stats` reuses the exact shape as articles.stats (value/label/unit) so the existing stat-
-- callout rendering in app/[locale]/(blog)/[slug]/page.tsx can be reused as-is -- plus label_es/
-- unit_es because digest_items is one row with parallel _es text columns (see
-- 20260915180000_digest_items_es_columns.sql), not a locale-paired row like articles. Numbers
-- themselves don't translate (EDITORIAL.md's Translation Process), only the labels do.
--
-- `faq` mirrors articles.faq_items (q/a) with q_es/a_es added for the same reason.
--
-- All columns nullable/additive: existing items keep rendering on /feed exactly as before
-- until each one is backfilled with a slug. Run once in the Supabase SQL Editor (no linked
-- CLI/DB URL in this environment -- same workflow as 20260911210000 and 20260915180000).

alter table public.digest_items
  add column if not exists slug text;

create unique index if not exists digest_items_slug_key
  on public.digest_items (slug)
  where slug is not null;

alter table public.digest_items
  add column if not exists stats jsonb;

alter table public.digest_items
  add column if not exists faq jsonb;

alter table public.digest_items
  add column if not exists meta_description text;

alter table public.digest_items
  add column if not exists meta_description_es text;
