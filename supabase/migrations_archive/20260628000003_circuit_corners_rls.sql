-- Grant public read access to circuit_corners.
-- The anon role needs SELECT to serve circuit corner data from the Next.js server component.
-- All other F1 data tables follow this same pattern (no auth required for reads).

GRANT SELECT ON circuit_corners TO anon;
GRANT SELECT ON circuit_corners TO authenticated;

-- Also enable RLS and add a permissive read policy consistent with other tables.
ALTER TABLE circuit_corners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "circuit_corners_public_read"
  ON circuit_corners
  FOR SELECT
  USING (true);
