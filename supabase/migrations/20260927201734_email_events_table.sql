-- Growth funnel today has zero visibility past "email sent": no table tracks
-- deliveries, opens, clicks, bounces, or complaints for the newsletter. That
-- means retention (GROWTH-EXPERT.md's real health metric, not raw subscriber
-- count) can't be measured at all -- see docs/advisors/GROWTH-EXPERT.md's
-- funnel section, step 4.
--
-- Resend (already the ESP, see app/api/digest/send/route.ts) emits these
-- events via a webhook rather than requiring hand-rolled tracking pixels or
-- link redirects -- CYBERSECURITY-EXPERT.md's "use a maintained provider,
-- don't hand-roll" principle applied to tracking infra, not just auth.
--
-- `issue_id` is nullable and set from the `issue_id` tag attached to each
-- send in app/api/digest/send/route.ts -- a webhook event whose tag doesn't
-- resolve (or carries no tag, e.g. the separate WelcomeEmail) still gets
-- recorded, just without the per-issue rollup.
--
-- `raw` keeps the full webhook payload for events whose shape this table
-- doesn't otherwise capture -- never re-derive from Resend's API after the
-- fact when the original payload is already on hand.
--
-- RLS enabled with zero policies, same posture as `subscribers` and
-- `digest_issues` -- this table holds subscriber email addresses, so it's
-- service-role-only by default (the webhook route and any future admin
-- dashboard both use the service role key server-side; RLS blocks anon/
-- authenticated entirely rather than needing a policy to get that).
--
-- Run once in the Supabase SQL Editor (no linked CLI/DB URL for this
-- project -- same workflow as every other migration here).

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  resend_email_id text not null,
  event_type text not null check (
    event_type in (
      'sent', 'delivered', 'delivery_delayed',
      'opened', 'clicked', 'bounced', 'complained'
    )
  ),
  email text not null,
  issue_id uuid references public.digest_issues(id) on delete set null,
  link_url text,
  occurred_at timestamptz not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists email_events_issue_id_idx on public.email_events(issue_id);
create index if not exists email_events_email_idx on public.email_events(email);
create index if not exists email_events_type_idx on public.email_events(event_type);
-- Resend retries a webhook delivery on a non-2xx response; without this, a
-- retry after a transient failure would double-count the same event.
create unique index if not exists email_events_dedupe_idx
  on public.email_events(resend_email_id, event_type, coalesce(link_url, ''));

alter table public.email_events enable row level security;
