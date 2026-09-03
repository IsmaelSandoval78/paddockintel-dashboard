-- Paso 4 del roadmap ("Who's Who" — mapa de atención experta), Fase 1: ingesta mínima
-- de un source. Tabla aditiva, no toca ninguna tabla existente.
--
-- Datos: los 34 nombres curados en la Fase 0 (docs/WHOS-WHO-FASE0-CANDIDATES.md),
-- revisados con Ismael categoría por categoría y con handles de X verificados uno por
-- uno vía búsqueda real (no de memoria) antes de cargarlos acá.
--
-- category = la "lente" de aiweekly.co adaptada a F1: investigation (reporteros de
-- paddock), construction (analistas técnicos), critique (ex-pilotos/comentaristas),
-- context (veteranos independientes), data (estadística con identidad real).
--
-- is_active existe desde el día 1 para poder retirar una voz de circulación (cuenta
-- borrada, cambio de rol que invalida el criterio de curación) sin perder el historial
-- de por qué había entrado en su momento.

create table if not exists public.experts (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    category text not null check (category in ('investigation', 'construction', 'critique', 'context', 'data')),
    role text not null,
    x_handle text,
    bluesky_handle text,
    credibility_note text,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists idx_experts_category
    on public.experts (category);

insert into public.experts (name, slug, category, role, x_handle, bluesky_handle, credibility_note) values
    -- Investigación
    ('Chris Medland', 'chris-medland', 'investigation', 'Freelance, paddock veterano (ex Sky/RACER)', 'ChrisMedlandF1', null, 'Voz muy respetada, sindicado en varios medios'),
    ('Lawrence Barretto', 'lawrence-barretto', 'investigation', 'Corresponsal, F1.com', 'lawrobarretto', null, 'Acceso oficial F1'),
    ('Jonathan Noble', 'jonathan-noble', 'investigation', 'Editor de F1, Motorsport.com', 'NobleF1', null, '20+ años en la disciplina'),
    ('Adam Cooper', 'adam-cooper', 'investigation', 'Motorsport.com / Motor Sport Magazine', 'adamcooperF1', null, 'Veterano, cobertura histórica'),
    ('Luke Smith', 'luke-smith', 'investigation', 'Senior writer, The Athletic', 'LukeSmithF1', null, 'Foco en detrás de escena (mecánicos, ingenieros)'),
    ('Madeline Coleman', 'madeline-coleman', 'investigation', 'Staff writer, The Athletic', 'mwc13_3', null, 'Co-cobertura con Smith'),
    ('Andrew Benson', 'andrew-benson', 'investigation', 'Corresponsal de F1, BBC Sport', 'andrewbensonf1', null, 'Medio generalista de referencia'),
    ('Nate Saunders', 'nate-saunders', 'investigation', 'ESPN (podcast Unlapped)', 'natesaundersF1', 'natesaunders.bsky.social', 'Único confirmado con presencia activa en Bluesky'),
    ('Laurence Edmondson', 'laurence-edmondson', 'investigation', 'ESPN, editor de F1', 'Edmondson_F1', null, null),
    ('Scott Mitchell-Malm', 'scott-mitchell-malm', 'investigation', 'The Race', 'SMitchellF1', null, null),
    ('Ben Anderson', 'ben-anderson', 'investigation', 'The Race (Group F1 Editor) / WTF1', 'BenAndersonAuto', null, null),
    ('Thomas Maher', 'thomas-maher', 'investigation', 'PlanetF1', 'thomasmaheronf1', null, null),
    ('Mat Coch', 'mat-coch', 'investigation', 'PlanetF1 (Deputy Editor)', 'matcoch', null, null),
    ('Dieter Rencken', 'dieter-rencken', 'investigation', 'RaceFans / RacingNews365, ex-Autosport (25 años)', 'RacingLines', null, 'Fuerte en política/economía de F1 — relevante para el ángulo de PaddockIntel'),
    ('Craig Slater', 'craig-slater', 'investigation', 'Sky Sports News, reportero de F1', 'craigslatersky', null, 'Cobertura de mercado de fichajes/negocios, relevante para economía'),
    ('Ted Kravitz', 'ted-kravitz', 'investigation', 'Sky Sports F1 (Kravitz Notebook)', 'tedkravitz', null, 'Investigativo, fuentes de paddock'),
    -- Construcción
    ('Craig Scarborough', 'craig-scarborough', 'construction', 'Freelance, F1 TV Tech Talk (ScarbsF1)', 'ScarbsTech', null, 'Ilustrador/analista técnico dedicado — @Scarbsf1 es una cuenta vieja suya, inactiva, no usar'),
    ('Giorgio Piola', 'giorgio-piola', 'construction', 'Veterano (50+ años)', 'Giorgio_Piola', null, 'El ilustrador técnico histórico de F1'),
    ('Mark Hughes', 'mark-hughes', 'construction', 'The Race / Motor Sport / F1.com', 'SportmphMark', null, 'Veterano en análisis técnico/estrategia'),
    ('Gary Anderson', 'gary-anderson', 'construction', 'The Race F1 Tech Show', 'GaryAndersonF1', null, 'Ex-director técnico real (Jordan, Jaguar) — homónimo del jugador de darts, usar el handle con F1 explícito'),
    ('Bernie Collins', 'bernie-collins', 'construction', 'Sky Sports F1, analista', 'bernie_collins1', null, 'Ex-jefa de estrategia (Aston Martin, McLaren) — rol técnico real'),
    ('Toni Cuquerella', 'toni-cuquerella', 'construction', 'DAZN España, comentarista (ex-Movistar+)', 'tonicuque', null, 'Ex-ingeniero de pista en escuderías de F1'),
    -- Crítica
    ('Martin Brundle', 'martin-brundle', 'critique', 'Sky Sports F1', 'MBrundleF1', null, 'Ex-piloto de F1'),
    ('Jenson Button', 'jenson-button', 'critique', 'Sky Sports F1', 'JensonButton', null, 'Campeón del mundo F1'),
    ('Nico Rosberg', 'nico-rosberg', 'critique', 'Sky Sports F1', 'NicoRosberg', null, 'Campeón del mundo F1'),
    ('Jacques Villeneuve', 'jacques-villeneuve', 'critique', 'Sky Sports F1', '27villeneuve', null, 'Campeón del mundo F1'),
    ('Karun Chandhok', 'karun-chandhok', 'critique', 'Sky Sports F1', 'karunchandhok', null, 'Ex-piloto de F1'),
    ('Anthony Davidson', 'anthony-davidson', 'critique', 'Sky Sports F1', 'antdavidson', null, 'Ex-piloto de F1'),
    ('Naomi Schiff', 'naomi-schiff', 'critique', 'Sky Sports F1', 'NaomiSchiff', null, 'Ex-piloto GT'),
    ('Pedro de la Rosa', 'pedro-de-la-rosa', 'critique', 'DAZN/Movistar España, embajador Aston Martin', 'PedrodelaRosa1', null, 'Ex-piloto de F1'),
    -- Contexto
    ('Joe Saward', 'joe-saward', 'context', 'Independiente (Joe Blogs F1 / Motorsport Week)', 'joesaward', 'joesaward.bsky.social', 'Décadas cubriendo F1, fuerte en política del deporte'),
    ('James Allen', 'james-allen', 'context', 'JA on F1 (Motorsport.com/Autosport/Motor1)', 'Jamesallenonf1', null, 'Veterano, ex-comentarista TV'),
    ('Antonio Lobato', 'antonio-lobato', 'context', 'DAZN España, narrador principal', 'alobatof1', null, '20+ años narrando F1 en español — trayectoria, no credencial técnica/ex-piloto. @Alobato_F1 es cuenta secundaria, no usar'),
    -- Datos
    ('David Hayhoe', 'david-hayhoe', 'data', 'Estadístico del anuario Autocourse desde 1991', 'davidf1data', null, 'Autor de 4 ediciones del Grand Prix Data Book (1950-presente)')
on conflict (slug) do nothing;

alter table public.experts enable row level security;

create policy "public read experts"
    on public.experts for select
    using (true);

grant select on table public.experts to anon;
grant select on table public.experts to authenticated;
grant all on table public.experts to service_role;
