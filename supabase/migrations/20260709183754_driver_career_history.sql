create table if not exists driver_career_history (
    id bigint generated always as identity primary key,
    driver_id text not null,
    season text not null,
    series_name text not null,
    series_normalized text,
    team text,
    races text,
    wins text,
    poles text,
    fastest_laps text,
    podiums text,
    points text,
    position text,
    source_url text not null,
    verified boolean default false,
    created_at timestamptz default now()
);

create index if not exists idx_driver_career_history_driver_id
    on driver_career_history (driver_id);

create table if not exists racing_series (
    id bigint generated always as identity primary key,
    raw_name text not null unique,
    normalized_name text not null,
    tier integer
);
