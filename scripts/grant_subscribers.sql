-- One-time fix: supabase/migrations/20260626000001_subscribers.sql defines
-- grants for the `subscribers` table, but they were never actually applied
-- to the live database — service_role gets "permission denied for table
-- subscribers" on SELECT/INSERT/DELETE right now, meaning the live
-- newsletter signup form is broken.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run.

grant select, insert, delete on public.subscribers to anon, authenticated;
grant select, insert, update, delete on public.subscribers to service_role;
