-- Records Hub v2, Group 2 (youngest/oldest race winner): Supabase JS can't
-- express `DISTINCT ON (driver_id) ... ORDER BY age_days` as a nested
-- subquery via `.from()`, so the DISTINCT ON collapse (one row per driver —
-- their single most extreme win) lives in the view instead of client code.
-- See RECORDS-HUB-SPEC-V2.md.

CREATE OR REPLACE VIEW public.youngest_race_winners AS
SELECT DISTINCT ON (driver_id) driver_id, race_id, race_name, race_date, year, age_days
FROM public.race_winner_ages
ORDER BY driver_id, age_days ASC;

CREATE OR REPLACE VIEW public.oldest_race_winners AS
SELECT DISTINCT ON (driver_id) driver_id, race_id, race_name, race_date, year, age_days
FROM public.race_winner_ages
ORDER BY driver_id, age_days DESC;

-- service_role is included alongside anon/authenticated — this project's
-- server-side Supabase client (lib/supabase/server.ts) queries with the
-- service_role key, and it does NOT implicitly bypass view grants here
-- (same gap already hit for digest_issues/subscribers, see PHASES.md).
GRANT SELECT ON public.youngest_race_winners TO anon, authenticated, service_role;
GRANT SELECT ON public.oldest_race_winners TO anon, authenticated, service_role;
