-- Add path_percent to circuit_corners
-- Used by the SVG corner-marker overlay: stores position along the track path (0–100)
-- to place numbered corner markers using path.getPointAtLength(totalLength * pct / 100)

ALTER TABLE circuit_corners
  ADD COLUMN IF NOT EXISTS path_percent numeric(5,2);

COMMENT ON COLUMN circuit_corners.path_percent IS
  'Position along the circuit SVG path, 0–100. Set per circuit by inspecting the path element in browser DevTools: path.getPointAtLength(path.getTotalLength() * pct / 100). NULL = not yet calibrated.';
