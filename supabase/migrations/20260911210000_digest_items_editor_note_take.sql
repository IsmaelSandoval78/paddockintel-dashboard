-- /feed items currently ship as source + our_summary + outbound link only.
-- That fails the EEAT-EXPERT.md / SEO-EXPERT.md Hook & Deliver checks: no
-- clearly-labeled PaddockIntel commentary, and rumor/conflict items with no
-- economic mechanism attached. Adding the aiweekly-style "Editor's note" /
-- "Editor's take" split (session 2026-09-11) so each item can carry that
-- commentary explicitly attributed and visually separated from the source
-- summary, plus an optional link to an existing PaddockIntel Nivel 2 piece
-- (SEO-EXPERT.md's Nivel 1 -> Nivel 2 linking rule).
--
-- All three columns are nullable and additive: the 24 existing items keep
-- rendering exactly as before until an editor fills these in per item --
-- never backfilled with invented commentary.
--
-- Run this once in the Supabase SQL Editor (same workflow as
-- scripts/add_digest_sent_at.sql -- this project has no linked CLI/DB URL).

alter table public.digest_items
  add column if not exists editor_note text;

alter table public.digest_items
  add column if not exists editor_take text;

alter table public.digest_items
  add column if not exists internal_link_slug text;
