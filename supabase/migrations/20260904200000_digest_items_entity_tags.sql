-- Paso 5 "Feed F1 news today" (docs/ROADMAP-SEMANA.md): the feed reuses
-- digest_items chronologically instead of a new table -- it's the same
-- external-source-cited pattern the newsletter already uses. The one real
-- gap: generate_digest_draft.py's model output already includes
-- entity_tags per item (companies/people/teams), but neither
-- save_draft() (Python) nor scripts/ingest-digest.ts (TS) ever persisted
-- them -- the column didn't exist. Adding it now so the feed's "most
-- mentioned entities this week" counter has real data to read, going
-- forward and backfilled for the existing 24 newsletter items.
--
-- Run this once in the Supabase SQL Editor (same workflow as
-- scripts/add_digest_sent_at.sql -- this project has no linked CLI/DB URL).

alter table public.digest_items
  add column if not exists entity_tags text[] not null default '{}';

create index if not exists digest_items_entity_tags_idx
  on public.digest_items using gin (entity_tags);
