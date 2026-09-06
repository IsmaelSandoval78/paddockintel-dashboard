-- Adds a `series` column to distinguish the live weekly newsletter from the
-- "Recap Vol. N" series (docs/ROADMAP-SEMANA.md, "Idea aprobada: serie de
-- Recaps retroactivos"). Recaps cover past weeks retrospectively and use
-- their own independent Vol. N counter -- they must never share the live
-- newsletter's Issue # sequence (integrity rule: never backdate/fabricate
-- the real issue number).
--
-- Run this once in the Supabase SQL Editor (same workflow as
-- scripts/add_digest_sent_at.sql -- this project has no linked CLI/DB URL).

alter table public.digest_issues
  add column if not exists series text not null default 'newsletter';

alter table public.digest_issues
  drop constraint if exists digest_issues_series_check;

alter table public.digest_issues
  add constraint digest_issues_series_check check (series in ('newsletter', 'recap'));
