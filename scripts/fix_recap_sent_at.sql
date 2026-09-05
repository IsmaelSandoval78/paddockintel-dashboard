-- One-time data fix: recap-01-week-2026-07-27 and recap-02-week-2026-08-17
-- carry a real (not fabricated) sent_at, millisecond-precise and clustered
-- within 2 seconds of vol-05-zandvoort-week-2026's genuine send timestamp
-- (2026-09-04T09:01:00.466Z / 09:01:01.436Z / 09:01:02.432Z). This is
-- consistent with both rows still being `series='newsletter'` at the moment
-- the real daily cron ran that morning, and only reclassified to
-- `series='recap'` afterward (commit b13b7a5, 2026-09-03T18:28:25Z added the
-- code/filter; the data rename to recap-01/recap-02 was applied separately,
-- undocumented, and evidently after the 09:01 UTC cron on 2026-09-04 already
-- fired) -- see docs/ROADMAP-SEMANA.md for the full reconstruction.
--
-- Under current code (app/api/digest/send/route.ts filters
-- `series = 'newsletter'`), series='recap' issues are never eligible for a
-- real send and never will be -- `sent_at` has no semantic meaning for them
-- going forward and only misleads anyone reading the table. Clearing it here
-- regardless of what happened historically (which may have been a real,
-- accidental send to real subscribers -- verify against Resend's own send
-- logs for 2026-09-04 09:01 UTC if that matters for a subscriber-facing
-- correction; this script does not attempt to determine or fix that).
--
-- Run once via the Supabase service-role client (see scripts/README or run
-- inline with @supabase/supabase-js -- this project has no linked CLI/DB URL
-- for direct psql access). Safe to re-run (idempotent via the series guard).

update public.digest_issues
  set sent_at = null
  where series = 'recap'
    and sent_at is not null;
