-- Subscribers table for Digest email list.
-- sent_at on digest_issues tracks which issues have been emailed so the
-- Vercel Cron can find un-sent published issues without re-querying history.

create table subscribers (
  id           uuid        primary key default gen_random_uuid(),
  email        text        not null unique,
  locale       text        not null default 'en' check (locale in ('en', 'es', 'pt')),
  subscribed_at timestamptz not null default now()
);

grant select, insert, delete on subscribers to anon, authenticated;
grant select, insert, update, delete on subscribers to service_role;

alter table digest_issues
  add column if not exists sent_at timestamptz;
