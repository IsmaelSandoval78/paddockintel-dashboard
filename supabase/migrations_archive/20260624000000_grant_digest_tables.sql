-- digest_issues/digest_items were recreated in 20260623000000 without
-- granting privileges to anon/authenticated/service_role, so every query
-- against them (including from the service role used by the Digest page
-- and ingestion scripts) fails with "permission denied for table".
-- Confirmed via direct service_role SELECT during Phase 2 verification.

grant select, insert, update, delete on digest_issues to service_role;
grant select, insert, update, delete on digest_items to service_role;

grant select on digest_issues to anon, authenticated;
grant select on digest_items to anon, authenticated;

