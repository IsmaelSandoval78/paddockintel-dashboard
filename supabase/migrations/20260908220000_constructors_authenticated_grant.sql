-- Hygiene fix: public.constructors was missing the GRANT SELECT ... TO
-- authenticated present on every comparable public read table (drivers,
-- races, results, constructor_standings, etc. all have it — see
-- 00000000000000_baseline_schema.sql). It was dormant because nothing in the
-- codebase ever queried constructors as the `authenticated` Postgres role
-- until lib/follows/actions.ts (getFollowedRefs/importMiBoxFollowsOnLogin),
-- which is the first code path to read drivers/constructors via
-- authServerClient.ts under a real signed-in session. Confirmed via a real
-- authenticated-session query against the constructors table returning
-- "permission denied for table constructors" (Postgres error 42501) before
-- this fix.
--
-- RLS is not involved here (constructors has no RLS policies of its own —
-- see baseline schema); this is a plain missing table-level GRANT.

grant select on public.constructors to authenticated;
