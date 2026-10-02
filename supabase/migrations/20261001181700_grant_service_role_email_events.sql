-- email_events_table (20260927201734) enabled RLS with zero policies on the
-- assumption that service_role bypassing RLS was enough -- but RLS bypass and
-- table-level GRANTs are separate things, and revoke_excess_default_grants
-- (20260827200000) turned off the ALTER DEFAULT PRIVILEGES that used to hand
-- new tables their grants automatically. Every table created since then needs
-- an explicit service_role grant (see grant_service_role_beagle_items_write,
-- driver_career_history_grant) -- this one was missed, so the Resend webhook
-- route failed every delivery with "permission denied for table email_events"
-- (confirmed live via Resend's webhook delivery log, 500 on every attempt).
grant select, insert on table public.email_events to service_role;
