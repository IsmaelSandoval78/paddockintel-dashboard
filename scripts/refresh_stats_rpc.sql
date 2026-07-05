-- One-time setup: RPC function so the data pipeline can refresh
-- driver_stats / constructor_stats via the Supabase REST API
-- (service_role key), without needing a direct psql connection.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run (CREATE OR REPLACE).

create or replace function public.refresh_stats()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from pg_matviews
    where schemaname = 'public' and matviewname = 'driver_stats'
  ) then
    refresh materialized view public.driver_stats;
  end if;

  if exists (
    select 1 from pg_matviews
    where schemaname = 'public' and matviewname = 'constructor_stats'
  ) then
    refresh materialized view public.constructor_stats;
  end if;
end;
$$;

revoke all on function public.refresh_stats() from public;
grant execute on function public.refresh_stats() to service_role;
