-- Follow-up to 20260906120000_user_accounts.sql: that migration enabled RLS
-- on driver_career_history and added a public-read SELECT policy, but never
-- granted anon/authenticated the underlying SELECT privilege the policy
-- depends on -- a policy is meaningless without the base grant, and
-- PostgREST returns "permission denied" regardless of RLS state until this
-- exists. Verified against every other public-read table (e.g. `races`):
-- the real, established convention is SELECT granted to both anon and
-- authenticated explicitly, matching this migration.

grant select on public.driver_career_history to anon, authenticated;
