-- DigOps editorial queue v0. Candidates only. Nothing here is published.
--
-- A high beagle_item_scores row is not a Feed item. This table stores the
-- top of that list so a person can accept or reject it. accepted is a
-- decision on this table. It does not insert into digest_items, does not
-- set digest_issues.status, and does not create a /feed/[slug] URL.
--
-- Parking the same rows on a draft digest_issues row was rejected:
--   * digest_items.issue_id, headline, our_summary, source_name, source_url,
--     and published_at are NOT NULL, so a candidate cannot sit there with
--     empty editorial slots.
--   * digest_items has no queued|accepted|rejected status. scripts/publish_digest.py
--     flips the parent issue, and every child row becomes public with it.
--   * /feed, /feed/[slug], the sitemap, and the magazine teaser do filter
--     digest_issues.status = 'published'. Two public reads do not:
--     app/[locale]/(digest)/weekly/[issue-slug]/page.tsx loads a newsletter
--     issue by slug with no status filter, then loads every digest_items row.
--     getAttentionThisWeek() in app/[locale]/(blog)/magazine-home/data.ts
--     counts digest_items for every newsletter issue, drafts included.
--
-- No route selects this table. Apply by hand in the Supabase SQL editor
-- after 20260923010000_beagle_item_scores.sql. The queue script does not
-- apply it.

create table public.digest_item_candidates (
  id uuid primary key default gen_random_uuid(),
  beagle_item_id uuid not null references public.beagle_items(id) on delete cascade,
  score_id uuid references public.beagle_item_scores(id) on delete set null,
  rubric_version text not null default 'v0' check (rubric_version = 'v0'),
  score numeric not null,
  independent_outlet_count integer not null check (independent_outlet_count >= 0),
  economic_payoff_flag boolean not null,
  signals jsonb not null default '{}'::jsonb,
  scored_at timestamptz not null,
  status text not null default 'queued' check (status in ('queued', 'accepted', 'rejected')),
  editor_note text,
  editor_take text,
  stats jsonb,
  slug text,
  faq jsonb,
  queued_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (beagle_item_id),
  constraint digest_item_candidates_signals_object check (jsonb_typeof(signals) = 'object'),
  constraint digest_item_candidates_stats_array check (stats is null or jsonb_typeof(stats) = 'array'),
  constraint digest_item_candidates_faq_array check (faq is null or jsonb_typeof(faq) = 'array'),
  constraint digest_item_candidates_slug_nonempty check (slug is null or length(btrim(slug)) > 0)
);

comment on table public.digest_item_candidates is
  'Editorial candidates copied from beagle_item_scores. Not the public Feed. accepted does not publish. Contract: docs/DIGOPS-QUEUE-V0.md.';

comment on column public.digest_item_candidates.beagle_item_id is
  'Pool row this candidate was cut from. One candidate per pool row. ON DELETE CASCADE so a prune of beagle_items does not leave a queue row.';

comment on column public.digest_item_candidates.score_id is
  'beagle_item_scores row the snapshot was copied from. SET NULL if that score row is deleted; the numeric snapshot columns stay.';

comment on column public.digest_item_candidates.score is
  'Copy of beagle_item_scores.score at queue time for rubric v0. Not a live ranking, and not a publish threshold.';

comment on column public.digest_item_candidates.status is
  'queued until a person decides. accepted and rejected are decisions on this table only. Neither status writes digest_items or flips an issue to published.';

comment on column public.digest_item_candidates.editor_note is
  'Empty until a person writes it. The queue script does not set it. A value here is not public copy.';

comment on column public.digest_item_candidates.editor_take is
  'Empty until a person writes it. The queue script does not set it. A value here is not public copy.';

comment on column public.digest_item_candidates.stats is
  'Empty jsonb array slot for a later human stat block. The queue script does not set it. Nothing renders it.';

comment on column public.digest_item_candidates.slug is
  'Draft slug slot. Not a route. No page, sitemap, or /feed/[slug] lookup reads this column.';

comment on column public.digest_item_candidates.faq is
  'Empty jsonb array slot for a later human FAQ. The queue script does not set it. Nothing renders it.';

-- Slug is a draft label only. Unique among candidates so two rows cannot
-- claim the same future slug. This index does not consult digest_items.
create unique index digest_item_candidates_slug_key
  on public.digest_item_candidates (slug)
  where slug is not null;

create index digest_item_candidates_status_score_idx
  on public.digest_item_candidates (status, score desc);

-- Same access as beagle_item_scores. RLS with no policy locks
-- anon/authenticated out even if a later grant adds SELECT without a
-- matching policy. service_role bypasses RLS and still needs an explicit
-- table GRANT (beagle_items, 2026-09-18). Accepted rows stay on this
-- grant: accepting a candidate does not make it world-readable.
-- DELETE is granted so a replace-the-row writer does not discover the miss
-- in production.

alter table public.digest_item_candidates enable row level security;

revoke all on table public.digest_item_candidates from anon, authenticated, public;

grant select, insert, update, delete on table public.digest_item_candidates to service_role;
