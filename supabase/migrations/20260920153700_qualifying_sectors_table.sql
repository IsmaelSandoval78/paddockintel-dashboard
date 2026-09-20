-- Qualifying mini-sector data (2026-09-20) -- OpenF1 /laps segments_sector_1/2/3 and
-- duration_sector_1/2/3, scoped to Qualifying only. Verified against real data (Spanish GP,
-- session_key 11365): the fastest lap of the session reads mostly green/purple and the
-- slowest mostly yellow, as expected. The same field on the Race session does NOT behave
-- this way (OpenF1's own docs: "segments are not available during races") -- confirmed with
-- the Race session's own fastest lap reading mostly yellow, backwards from expected. So this
-- table is Qualifying-only; do not populate it from a Race session_key.
--
-- Populated by scripts/openf1_sync.py, never called live from a request path -- same rule as
-- jolpica-f1/OpenF1 elsewhere (see CLAUDE.md "Do Not").

CREATE TABLE qualifying_sectors (
  id bigint generated always as identity primary key,
  race_id integer NOT NULL REFERENCES races(id),
  driver_id integer NOT NULL REFERENCES drivers(id),
  lap_number integer NOT NULL,
  sector integer NOT NULL CHECK (sector IN (1, 2, 3)),
  duration_seconds numeric,
  segments integer[],
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (race_id, driver_id, lap_number, sector)
);
COMMENT ON TABLE qualifying_sectors IS 'From OpenF1 /laps (Qualifying session only). duration_seconds = duration_sector_N; segments = raw segments_sector_N codes (0=n/a, 2048=yellow, 2049=green, 2051=purple, 2064=pit, else=unknown -- decode at render time, not storage time).';

ALTER TABLE qualifying_sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON qualifying_sectors FOR SELECT USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON qualifying_sectors TO service_role;
GRANT USAGE, SELECT ON SEQUENCE qualifying_sectors_id_seq TO service_role;
