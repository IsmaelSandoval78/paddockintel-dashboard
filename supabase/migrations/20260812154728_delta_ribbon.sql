-- Delta Ribbon — precomputed track-dominance frames, historical mode only.
-- One race/driver-pair per ingestion run (scripts/load-delta-ribbon.mjs).
-- path_percent shares the same 0-100 space as circuit_corners.path_percent —
-- both are calibrated against the same external track SVG (lib/trackSvg.ts).

create table if not exists public.delta_ribbon_frames (
    id bigserial primary key,
    race_id integer not null references public.races(id),
    driver_a_id integer not null references public.drivers(id),
    driver_b_id integer not null references public.drivers(id),
    path_percent numeric(5,2) not null,
    lap integer,
    distance_m numeric,
    delta_seconds numeric not null,
    leader_driver_id integer references public.drivers(id),
    speed_a smallint,
    speed_b smallint,
    throttle_a smallint,
    throttle_b smallint,
    brake_a smallint,
    brake_b smallint,
    gear_a smallint,
    gear_b smallint,
    drs_a smallint,
    drs_b smallint,
    corner_name text,
    created_at timestamptz not null default now(),
    unique (race_id, driver_a_id, driver_b_id, path_percent)
);

create index if not exists idx_delta_ribbon_frames_pair
    on public.delta_ribbon_frames (race_id, driver_a_id, driver_b_id);

create table if not exists public.delta_ribbon_events (
    id serial primary key,
    race_id integer not null references public.races(id),
    driver_a_id integer not null references public.drivers(id),
    driver_b_id integer not null references public.drivers(id),
    path_percent numeric(5,2) not null,
    lap integer,
    event_type text not null check (event_type in ('snap', 'defend', 'braid_start', 'braid_end')),
    corner_name text,
    created_at timestamptz not null default now()
);

create index if not exists idx_delta_ribbon_events_pair
    on public.delta_ribbon_events (race_id, driver_a_id, driver_b_id);

alter table public.delta_ribbon_frames enable row level security;
alter table public.delta_ribbon_events enable row level security;

create policy "public read delta_ribbon_frames"
    on public.delta_ribbon_frames for select
    using (true);

create policy "public read delta_ribbon_events"
    on public.delta_ribbon_events for select
    using (true);

grant select on table public.delta_ribbon_frames to anon;
grant select on table public.delta_ribbon_frames to authenticated;
grant all on table public.delta_ribbon_frames to service_role;

grant select on table public.delta_ribbon_events to anon;
grant select on table public.delta_ribbon_events to authenticated;
grant all on table public.delta_ribbon_events to service_role;
