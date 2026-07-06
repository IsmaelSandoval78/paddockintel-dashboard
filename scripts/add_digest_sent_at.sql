-- One-time fix: supabase/migrations/20260626000001_subscribers.sql also adds
-- `sent_at` to digest_issues, but that part never made it to the live database
-- (same partial-migration failure as the subscribers grants, fixed 2026-07-05
-- via grant_subscribers.sql). Without the column, /api/digest/send errors on
-- its SELECT and silently reports "no issues to send" — no digest email has
-- ever gone out.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run.

alter table public.digest_issues
  add column if not exists sent_at timestamptz;

-- Vol. 01 was published 2026-06-26 and is now stale. Backfill sent_at so the
-- next cron run (daily 09:00 UTC) does NOT email a ten-day-old issue; the
-- pipeline then goes out naturally with Vol. 02. Comment this out if you DO
-- want Vol. 01 delivered to the current list.
update public.digest_issues
  set sent_at = published_at
  where slug = 'vol-01-austria-week-2026'
    and sent_at is null;
