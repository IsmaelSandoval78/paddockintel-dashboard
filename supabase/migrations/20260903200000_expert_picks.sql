-- Paso 4 del roadmap ("Who's Who"), Fase 2: proceso semi-manual de curación.
-- Aditiva, no toca ninguna tabla existente.
--
-- Por qué semi-manual: el embed gratuito de X (Fase 1) corre 100% client-side --
-- nunca llega el texto del post al servidor, así que no hay nada que mandarle a un
-- LLM para clasificar/tendencias automáticamente sin pagar la API de X (~$200/mes).
-- En vez de eso, Ismael elige a mano qué post destacar de cada experto y escribe
-- (con ayuda de un LLM para redactar, no para elegir) un takeaway editorial corto.
--
-- topic queda como texto libre por ahora, no una FK a la tabla `tags` de artículos --
-- este es el primer pick real, todavía no hay evidencia de qué taxonomía de temas
-- tiene sentido acá. Se revisa cuando haya volumen real que analizar.

create table if not exists public.expert_picks (
    id uuid primary key default gen_random_uuid(),
    expert_id uuid not null references public.experts(id),
    post_url text not null,
    topic text,
    takeaway text not null,
    locale text not null default 'en' check (locale in ('en', 'es', 'pt')),
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists idx_expert_picks_expert_id
    on public.expert_picks (expert_id);

alter table public.expert_picks enable row level security;

create policy "public read expert_picks"
    on public.expert_picks for select
    using (true);

grant select on table public.expert_picks to anon;
grant select on table public.expert_picks to authenticated;
grant all on table public.expert_picks to service_role;
