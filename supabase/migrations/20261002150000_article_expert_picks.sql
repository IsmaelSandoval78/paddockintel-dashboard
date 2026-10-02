-- Links an article to one or more expert_picks whose topic is directly
-- relevant to it -- "voices talking about what this article covers," shown
-- as a small module on the article page. Manual/curated by design, same
-- reasoning as expert_picks itself (Fase 2 of docs/WHOS-WHO-FASE0-CANDIDATES.md):
-- automatic matching on expert_picks.topic (free text, no taxonomy yet) against
-- article tags would produce weak/wrong pairings far more often than it helps,
-- with only ~23 picks against 300+ articles.
--
-- References expert_picks.id, not experts.id -- an article should point at a
-- specific real quote relevant to its topic, not just "this person exists."
-- Ingestion resolves a frontmatter `voices: [expert-slug, ...]` list to each
-- expert's current single active pick (today's real-world case: every expert
-- has at most one active pick) -- see scripts/ingest-article.ts.
--
-- RLS: public read, same posture as articles/expert_picks (this table holds
-- no subscriber data, no reason to restrict it).

create table if not exists public.article_expert_picks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  expert_pick_id uuid not null references public.expert_picks(id) on delete cascade,
  position int not null default 1,
  created_at timestamptz not null default now(),
  unique (article_id, expert_pick_id)
);

create index if not exists article_expert_picks_article_id_idx
  on public.article_expert_picks(article_id);
create index if not exists article_expert_picks_expert_pick_id_idx
  on public.article_expert_picks(expert_pick_id);

alter table public.article_expert_picks enable row level security;

create policy "public read article_expert_picks"
  on public.article_expert_picks for select
  using (true);

grant select on table public.article_expert_picks to anon;
grant select on table public.article_expert_picks to authenticated;
grant select, insert, update, delete on table public.article_expert_picks to service_role;
