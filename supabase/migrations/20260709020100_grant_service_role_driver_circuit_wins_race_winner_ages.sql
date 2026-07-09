-- One-time fix: 20260709013813_add_driver_circuit_wins.sql and
-- 20260709014531_add_race_winner_ages.sql only granted SELECT to
-- anon/authenticated. The Records Hub server-side queries (lib/records.ts)
-- run through lib/supabase/server.ts, which uses the service_role key —
-- and service_role does not implicitly bypass view grants in this project
-- (same gap already hit for digest_issues/subscribers, see PHASES.md).
-- Confirmed live: service_role gets "permission denied for view
-- driver_circuit_wins" / "...race_winner_ages" right now.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run.

GRANT SELECT ON public.driver_circuit_wins TO service_role;
GRANT SELECT ON public.race_winner_ages TO service_role;
