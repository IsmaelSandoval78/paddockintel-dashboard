-- Recreates digest_issues / digest_items to match the columns queried by
-- app/[locale]/(digest)/weekly/[issue-slug]/page.tsx. Both tables exist with
-- zero rows under an older, mismatched schema (issue_number/synthesis/outlet
-- instead of slug/intro_synthesis/source_name) — safe to drop and recreate.

drop table if exists digest_items;
drop table if exists digest_issues;

create table digest_issues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  intro_synthesis text not null,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table digest_items (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references digest_issues(id) on delete cascade,
  source_name text not null,
  source_url text not null,
  headline text not null,
  our_summary text not null,
  published_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index digest_items_issue_id_idx on digest_items(issue_id);
