-- The original beagle_items migration (PR #4) granted anon/authenticated public SELECT
-- but never granted service_role INSERT/UPDATE/SELECT. service_role bypasses RLS but
-- still needs explicit table GRANTs -- without this, the cron route (which writes with
-- the service role key) failed with "permission denied for table beagle_items" on every
-- run, both the automatic 4h Cloudflare cron and the manual on-demand trigger.
GRANT SELECT, INSERT, UPDATE ON beagle_items TO service_role;
