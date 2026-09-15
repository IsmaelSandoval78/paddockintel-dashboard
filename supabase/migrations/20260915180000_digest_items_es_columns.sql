-- Feed (digest_items) has never been translated -- headline/our_summary/
-- editor_note/editor_take are English-only regardless of route locale, unlike
-- Blog articles (separate .en/.es/.pt rows). Reconfirmed 2026-09-15: EN+ES is
-- the project's language scope (PT frozen, see project_language_rollout
-- memory), and the Feed is now explicitly in that scope.
--
-- Parallel _es columns on the same row, not a Blog-style locale-paired-row
-- model: source_url/entity_tags/published_at/source_name are facts, not
-- prose -- duplicating them per locale would double-count entities in
-- lib/entityMentions.ts's weekly significance score unless every caller
-- remembered to filter by locale first. One row per story, two text
-- variants inside it, is the simpler and harder-to-misuse shape here.
--
-- All four columns are nullable and additive: existing items keep rendering
-- in English exactly as before. app/[locale]/(digest)/feed/page.tsx falls
-- back to the English column whenever the _es one is null -- never blocks
-- on a missing translation.
--
-- Run this once in the Supabase SQL Editor (same workflow as
-- 20260911210000_digest_items_editor_note_take.sql -- no linked CLI/DB URL).

alter table public.digest_items
  add column if not exists headline_es text;

alter table public.digest_items
  add column if not exists our_summary_es text;

alter table public.digest_items
  add column if not exists editor_note_es text;

alter table public.digest_items
  add column if not exists editor_take_es text;
