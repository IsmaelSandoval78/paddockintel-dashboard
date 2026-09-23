-- Beagle significance score v0 (schema only).
--
-- Judgments live here, not as columns on beagle_items. The cron at
-- app/api/cron/refresh-beagle upserts the raw press pool on link and
-- lib/beagleCounts.ts counts that pool. A score rewrite must not touch
-- those rows, their unique link, or their entity_tags.
--
-- This migration does not score anything and does not insert into
-- digest_items. A later job may upsert this table; it must not publish.
--
-- Uniqueness is (beagle_item_id, rubric_version), not beagle_item_id alone.
-- v0 and a later rubric have to sit side by side on the same item so the
-- editorial queue can compare them. Rescoring one rubric updates that one
-- row (scored_at moves). A single-row-per-item unique key would delete the
-- rubric the queue already used the moment the next version is written.
-- Same-version history (every intermediate rescore) is out of scope.

create table public.beagle_item_scores (
  id uuid primary key default gen_random_uuid(),
  beagle_item_id uuid not null references public.beagle_items(id) on delete cascade,
  independent_outlet_count integer not null default 0 check (independent_outlet_count >= 0),
  economic_payoff_flag boolean not null default false,
  score numeric not null,
  signals jsonb not null default '{}'::jsonb,
  rubric_version text not null check (length(btrim(rubric_version)) > 0),
  scored_at timestamptz not null default now(),
  unique (beagle_item_id, rubric_version),
  constraint beagle_item_scores_signals_object check (jsonb_typeof(signals) = 'object'),
  constraint beagle_item_scores_outlet_count_matches_signals check (
    not jsonb_exists(signals, 'independent_outlets')
    or (
      jsonb_typeof(signals -> 'independent_outlets') = 'array'
      and independent_outlet_count = jsonb_array_length(signals -> 'independent_outlets')
    )
  )
);

comment on table public.beagle_item_scores is
  'Significance judgments for beagle_items, one row per item per rubric_version. Not a publish queue. v0 contract: docs/BEAGLE-SCORE-V0.md.';

comment on column public.beagle_item_scores.independent_outlet_count is
  'Distinct outlets after syndication collapse (scripts/beagle.mjs SYNDICATION_GROUPS). An input to score, not the score. 0 means scored with no corroborating outlet, not unscored — unscored items have no row.';

comment on column public.beagle_item_scores.economic_payoff_flag is
  'Queue-sortable claim that the item has a verifiable economic or data payoff. Must stay false when the only evidence is signals.economic_title_hint.verified = false.';

comment on column public.beagle_item_scores.score is
  'Rubric output. Scale belongs to rubric_version (v0 does not freeze a formula here). Higher means more worth a human look. Not virality.';

comment on column public.beagle_item_scores.signals is
  'v0 keys: independent_outlets (text[] of collapsed outlet labels; length must equal independent_outlet_count when present), syndication_collapse (object, e.g. {"Motorsport Network": ["Motorsport.com"]}), source_tier (text or null — no new tier taxonomy), economic_title_hint (object with verified boolean, v0 writers set false), eeat_incomplete (boolean, true until Journalism/SEO/EEAT gates pass — this table does not pass them).';

comment on column public.beagle_item_scores.rubric_version is
  'Scorer version that produced the row. v0 value is the text ''v0''. Unique with beagle_item_id so versions coexist.';

create index beagle_item_scores_rubric_score_idx
  on public.beagle_item_scores (rubric_version, score desc);

-- Scores are an internal DigOps signal, not a public read surface.
-- RLS with no policy locks anon/authenticated out even if a later grant
-- adds SELECT without a matching policy. service_role bypasses RLS but
-- still needs an explicit table GRANT (beagle_items, 2026-09-18).
-- DELETE is included so a later job can replace a rubric row outright;
-- the openf1 tables missed DELETE and the sync failed on first run.

alter table public.beagle_item_scores enable row level security;

revoke all on table public.beagle_item_scores from anon, authenticated;

grant select, insert, update, delete on table public.beagle_item_scores to service_role;
