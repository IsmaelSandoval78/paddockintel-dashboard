-- Aditivo, no toca ninguna tabla existente
create table if not exists driver_career_history (
    id bigint generated always as identity primary key,
    driver_id text not null,           -- mismo driverId que usa tu tabla drivers (Ergast)
    season text not null,              -- texto: a veces hay "2015-2016" o similar
    series_name text not null,         -- texto libre, ej "FIA Formula 2 Championship"
    series_normalized text,            -- se llena despues via racing_series, para agrupar (GP2/F2 etc)
    team text,
    races text,
    wins text,
    poles text,
    fastest_laps text,
    podiums text,
    points text,
    position text,
    source_url text not null,
    verified boolean default false,    -- true solo despues de revision manual
    created_at timestamptz default now()
);

create index if not exists idx_driver_career_history_driver_id
    on driver_career_history (driver_id);

-- Tabla de referencia para normalizar nombres de series que cambiaron con el tiempo
create table if not exists racing_series (
    id bigint generated always as identity primary key,
    raw_name text not null unique,     -- como aparece en Wikipedia, ej "GP2 Series"
    normalized_name text not null,     -- ej "Formula 2" (agrupa GP2 + F2)
    tier integer                       -- opcional: 1=F1, 2=F2/GP2, 3=F3/GP3, etc, para ordenar
);
