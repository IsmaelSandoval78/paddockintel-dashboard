-- OpenF1 telemetry sync (2026-09-19) -- adds the fields our Ergast-lineage tables never had:
-- real pit-stop stationary time, tire stints, weather, race control events, and on-track overtakes.
-- OpenF1 coverage starts 2023; stop_duration specifically only from the 2024 US GP onward.
-- Populated by scripts/openf1_sync.py (run via .github/workflows/openf1-sync.yml), never called
-- live from a request path -- same rule as jolpica-f1 (see CLAUDE.md "Do Not").

ALTER TABLE pit_stops ADD COLUMN IF NOT EXISTS stop_duration_ms integer;
COMMENT ON COLUMN pit_stops.stop_duration_ms IS 'Stationary time only (wheel-off to wheel-on), from OpenF1 stop_duration. NULL for stops OpenF1 does not cover (pre-2024 US GP, or a session OpenF1 never ingested). Distinct from milliseconds, which is total pit-lane time.';

CREATE TABLE tire_stints (
  id bigint generated always as identity primary key,
  race_id integer NOT NULL REFERENCES races(id),
  driver_id integer NOT NULL REFERENCES drivers(id),
  stint_number integer NOT NULL,
  compound text,
  tyre_age_at_start integer,
  lap_start integer,
  lap_end integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (race_id, driver_id, stint_number)
);
COMMENT ON TABLE tire_stints IS 'From OpenF1 /stints. One row per continuous tire stint (compound + age + lap range) per driver per race.';

CREATE TABLE weather_readings (
  id bigint generated always as identity primary key,
  race_id integer NOT NULL REFERENCES races(id),
  recorded_at timestamptz NOT NULL,
  air_temperature numeric,
  track_temperature numeric,
  humidity numeric,
  rainfall boolean,
  wind_speed numeric,
  wind_direction integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (race_id, recorded_at)
);
COMMENT ON TABLE weather_readings IS 'From OpenF1 /weather. One row per ~minute sample during a session -- real measured conditions, not a forecast.';

CREATE TABLE race_control_messages (
  id bigint generated always as identity primary key,
  race_id integer NOT NULL REFERENCES races(id),
  lap_number integer,
  category text,
  flag text,
  message text NOT NULL,
  driver_id integer REFERENCES drivers(id),
  recorded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE race_control_messages IS 'From OpenF1 /race_control. Flags, safety car/VSC, incidents -- the real sequence of what stewards flagged and when, with the lap number.';

CREATE TABLE overtakes (
  id bigint generated always as identity primary key,
  race_id integer NOT NULL REFERENCES races(id),
  lap_number integer,
  overtaking_driver_id integer REFERENCES drivers(id),
  overtaken_driver_id integer REFERENCES drivers(id),
  position integer,
  recorded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE overtakes IS 'From OpenF1 /overtakes. Real on-track position exchanges, not the grid-vs-finish delta getMovers() already derives.';

ALTER TABLE tire_stints ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_control_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON tire_stints FOR SELECT USING (true);
CREATE POLICY "public read" ON weather_readings FOR SELECT USING (true);
CREATE POLICY "public read" ON race_control_messages FOR SELECT USING (true);
CREATE POLICY "public read" ON overtakes FOR SELECT USING (true);

-- The bug we hit with beagle_items (2026-09-18): service_role bypasses RLS but still needs
-- explicit table GRANTs, or every write from the sync script fails with "permission denied."
-- Granting it up front this time instead of rediscovering the same lesson.
GRANT SELECT, INSERT, UPDATE ON tire_stints TO service_role;
GRANT SELECT, INSERT, UPDATE ON weather_readings TO service_role;
GRANT SELECT, INSERT, UPDATE ON race_control_messages TO service_role;
GRANT SELECT, INSERT, UPDATE ON overtakes TO service_role;
GRANT SELECT, UPDATE ON pit_stops TO service_role;
GRANT USAGE, SELECT ON SEQUENCE tire_stints_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE weather_readings_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE race_control_messages_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE overtakes_id_seq TO service_role;
