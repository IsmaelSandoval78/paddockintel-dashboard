-- circuit_corners: per-corner intelligence for each F1 circuit
-- Source: Wikipedia circuit articles (crowd-sourced by PaddockIntel team)
-- This data is not in Ergast — it's a competitive differentiator for the platform

CREATE TABLE IF NOT EXISTS circuit_corners (
  id              serial PRIMARY KEY,
  circuit_ref     text NOT NULL,            -- FK to circuits.circuit_ref
  corner_number   int  NOT NULL,            -- 1-based, per official circuit map
  name            text,                     -- named corner (null if unnamed)
  type            text,                     -- fast_right | fast_left | medium_right | medium_left | slow_right | slow_left | hairpin | chicane_left | chicane_right
  sector          int  CHECK (sector IN (1,2,3)),
  is_drs_zone     boolean DEFAULT false,    -- true if DRS activation begins at exit of this corner
  description     text,                     -- editorial note: what makes it notable
  UNIQUE (circuit_ref, corner_number)
);

-- Read-only for anon (same pattern as other hub tables)
GRANT SELECT ON circuit_corners TO anon, authenticated;
