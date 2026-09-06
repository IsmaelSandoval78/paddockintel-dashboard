-- User accounts system, Phase 1: user_profiles + follows (drivers/constructors/experts).
-- Auth provider: Supabase Auth (Google OAuth + email), integrated via
-- lib/supabase/authServerClient.ts — never via lib/supabase/server.ts, which
-- always uses the Service Role key and would bypass every policy below.
--
-- Deliberately NOT creating user_preferences yet — the only defined use for
-- a preferences table is the newsletter v2 personalization wizard
-- (docs/ROADMAP-SEMANA.md, "roles" step), which is explicitly out of scope
-- for this phase. Inventing placeholder columns now would violate the
-- project's no-speculative-features rule.

-- ---------------------------------------------------------------------------
-- Hygiene fix: driver_career_history was the only table in the schema
-- without RLS enabled. It currently has zero grants for anon/authenticated
-- (only postgres/service_role), so it wasn't exploitable — but it's the one
-- inconsistency against the rest of the schema's "RLS + public SELECT" model,
-- and a landmine if a future migration ever grants SELECT to anon without
-- re-checking RLS state first. Closing it here with the same pattern already
-- used on every other read-only table.
-- ---------------------------------------------------------------------------

alter table public.driver_career_history enable row level security;

create policy "public read driver_career_history"
  on public.driver_career_history
  for select
  to public
  using (true);

-- ---------------------------------------------------------------------------
-- user_profiles — 1:1 companion to auth.users for app-specific profile data.
-- ---------------------------------------------------------------------------

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "select own profile"
  on public.user_profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "insert own profile"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "update own profile"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No delete policy on purpose: account deletion goes through the Supabase
-- Auth Admin API / account-closure flow, which deletes the auth.users row
-- and cascades via the FK above — never a direct DELETE from the user
-- against their own profile row.

-- When a sensitive column (e.g. a `role` or `is_admin` flag) is ever added
-- to this table, revoke its UPDATE from `authenticated` explicitly:
--   revoke update (role) on public.user_profiles from authenticated;
-- RLS's `with check` protects rows, not individual columns — a user could
-- otherwise set auth.uid() = id and still smuggle a role change through the
-- same UPDATE that changes display_name. This doesn't happen automatically.

-- ---------------------------------------------------------------------------
-- Follows — three separate tables (not one generic follows table) to keep
-- real foreign keys: drivers.id/constructors.id are integer, experts.id is
-- uuid, so a single polymorphic entity_id column would have to drop FK
-- enforcement entirely. Paying the repetition here buys real referential
-- integrity instead of trusting the app layer to never write an orphaned
-- follow row.
-- ---------------------------------------------------------------------------

create table public.driver_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  driver_id integer not null references public.drivers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, driver_id)
);

create table public.constructor_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  constructor_id integer not null references public.constructors(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, constructor_id)
);

create table public.expert_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expert_id uuid not null references public.experts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, expert_id)
);

alter table public.driver_follows enable row level security;
alter table public.constructor_follows enable row level security;
alter table public.expert_follows enable row level security;

create policy "select own driver follows"
  on public.driver_follows for select to authenticated using (auth.uid() = user_id);
create policy "insert own driver follows"
  on public.driver_follows for insert to authenticated with check (auth.uid() = user_id);
create policy "delete own driver follows"
  on public.driver_follows for delete to authenticated using (auth.uid() = user_id);

create policy "select own constructor follows"
  on public.constructor_follows for select to authenticated using (auth.uid() = user_id);
create policy "insert own constructor follows"
  on public.constructor_follows for insert to authenticated with check (auth.uid() = user_id);
create policy "delete own constructor follows"
  on public.constructor_follows for delete to authenticated using (auth.uid() = user_id);

create policy "select own expert follows"
  on public.expert_follows for select to authenticated using (auth.uid() = user_id);
create policy "insert own expert follows"
  on public.expert_follows for insert to authenticated with check (auth.uid() = user_id);
create policy "delete own expert follows"
  on public.expert_follows for delete to authenticated using (auth.uid() = user_id);

-- No UPDATE policy on any of the three: a follow is a boolean membership
-- row, managed with INSERT/DELETE only.

-- ---------------------------------------------------------------------------
-- Grants: authenticated needs table-level privileges before RLS policies
-- can take effect at all (RLS narrows what a grant already allows, it
-- doesn't grant anything by itself). anon gets nothing on the four new
-- tables — these are account-only surfaces, not public read data.
-- ---------------------------------------------------------------------------

grant select, insert, update on public.user_profiles to authenticated;
grant select, insert, delete on public.driver_follows to authenticated;
grant select, insert, delete on public.constructor_follows to authenticated;
grant select, insert, delete on public.expert_follows to authenticated;
