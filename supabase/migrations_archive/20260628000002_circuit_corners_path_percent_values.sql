-- Populate path_percent for Silverstone, Spa-Francorchamps, and Hungaroring.
-- Values computed via svg-path-properties from the julesr0y/f1-circuits-svg paths,
-- using curvature peak detection (0.2% sampling, 15° threshold) + manual interpolation
-- for sub-corners within complexes. Layout IDs: silverstone-8, spa-francorchamps-4, hungaroring-3.
-- All paths are 500×500 SVG user units (no viewBox attribute).

-- ─── SILVERSTONE (18 corners) ──────────────────────────────────────────────────
-- Peak anchors (detected): 11.4%, 31.2%, 37.6%, 46.6%, 56.8%, 62.0%, 78.8%, 87.4%
UPDATE circuit_corners SET path_percent =  11.0 WHERE circuit_ref = 'silverstone' AND corner_number =  1; -- Abbey
UPDATE circuit_corners SET path_percent =  14.0 WHERE circuit_ref = 'silverstone' AND corner_number =  2; -- Farm
UPDATE circuit_corners SET path_percent =  17.0 WHERE circuit_ref = 'silverstone' AND corner_number =  3; -- Village
UPDATE circuit_corners SET path_percent =  21.0 WHERE circuit_ref = 'silverstone' AND corner_number =  4; -- The Loop
UPDATE circuit_corners SET path_percent =  25.0 WHERE circuit_ref = 'silverstone' AND corner_number =  5; -- Aintree
UPDATE circuit_corners SET path_percent =  28.0 WHERE circuit_ref = 'silverstone' AND corner_number =  6; -- Wellington
UPDATE circuit_corners SET path_percent =  31.0 WHERE circuit_ref = 'silverstone' AND corner_number =  7; -- Brooklands
UPDATE circuit_corners SET path_percent =  33.5 WHERE circuit_ref = 'silverstone' AND corner_number =  8; -- Luffield 1
UPDATE circuit_corners SET path_percent =  36.0 WHERE circuit_ref = 'silverstone' AND corner_number =  9; -- Luffield 2
UPDATE circuit_corners SET path_percent =  40.0 WHERE circuit_ref = 'silverstone' AND corner_number = 10; -- Woodcote
UPDATE circuit_corners SET path_percent =  47.0 WHERE circuit_ref = 'silverstone' AND corner_number = 11; -- Copse
UPDATE circuit_corners SET path_percent =  54.0 WHERE circuit_ref = 'silverstone' AND corner_number = 12; -- Maggotts
UPDATE circuit_corners SET path_percent =  57.0 WHERE circuit_ref = 'silverstone' AND corner_number = 13; -- Becketts 1
UPDATE circuit_corners SET path_percent =  60.0 WHERE circuit_ref = 'silverstone' AND corner_number = 14; -- Becketts 2
UPDATE circuit_corners SET path_percent =  62.0 WHERE circuit_ref = 'silverstone' AND corner_number = 15; -- Chapel
UPDATE circuit_corners SET path_percent =  79.0 WHERE circuit_ref = 'silverstone' AND corner_number = 16; -- Stowe
UPDATE circuit_corners SET path_percent =  84.0 WHERE circuit_ref = 'silverstone' AND corner_number = 17; -- Vale
UPDATE circuit_corners SET path_percent =  87.5 WHERE circuit_ref = 'silverstone' AND corner_number = 18; -- Club

-- ─── SPA-FRANCORCHAMPS (19 corners) ───────────────────────────────────────────
-- Peak anchors (detected): 10.6%, 29.0%, 38.6%, 49.4%, 59.2%, 65.4%, 83.4%, 92.0%
UPDATE circuit_corners SET path_percent =  10.0 WHERE circuit_ref = 'spa' AND corner_number =  1; -- La Source
UPDATE circuit_corners SET path_percent =  13.0 WHERE circuit_ref = 'spa' AND corner_number =  2; -- Eau Rouge
UPDATE circuit_corners SET path_percent =  15.0 WHERE circuit_ref = 'spa' AND corner_number =  3; -- Raidillon
UPDATE circuit_corners SET path_percent =  26.5 WHERE circuit_ref = 'spa' AND corner_number =  4; -- Les Combes 1
UPDATE circuit_corners SET path_percent =  28.0 WHERE circuit_ref = 'spa' AND corner_number =  5; -- Les Combes 2
UPDATE circuit_corners SET path_percent =  29.5 WHERE circuit_ref = 'spa' AND corner_number =  6; -- Les Combes 3
UPDATE circuit_corners SET path_percent =  33.0 WHERE circuit_ref = 'spa' AND corner_number =  7; -- Malmedy
UPDATE circuit_corners SET path_percent =  38.0 WHERE circuit_ref = 'spa' AND corner_number =  8; -- Rivage
UPDATE circuit_corners SET path_percent =  40.5 WHERE circuit_ref = 'spa' AND corner_number =  9; -- Bruxelles
UPDATE circuit_corners SET path_percent =  44.5 WHERE circuit_ref = 'spa' AND corner_number = 10; -- Pouhon 1
UPDATE circuit_corners SET path_percent =  49.0 WHERE circuit_ref = 'spa' AND corner_number = 11; -- Pouhon 2
UPDATE circuit_corners SET path_percent =  53.0 WHERE circuit_ref = 'spa' AND corner_number = 12; -- Campus
UPDATE circuit_corners SET path_percent =  57.0 WHERE circuit_ref = 'spa' AND corner_number = 13; -- Fagnes
UPDATE circuit_corners SET path_percent =  59.0 WHERE circuit_ref = 'spa' AND corner_number = 14; -- Stavelot
UPDATE circuit_corners SET path_percent =  63.0 WHERE circuit_ref = 'spa' AND corner_number = 15; -- Paul Frère 1
UPDATE circuit_corners SET path_percent =  65.5 WHERE circuit_ref = 'spa' AND corner_number = 16; -- Paul Frère 2
UPDATE circuit_corners SET path_percent =  78.0 WHERE circuit_ref = 'spa' AND corner_number = 17; -- Blanchimont
UPDATE circuit_corners SET path_percent =  83.5 WHERE circuit_ref = 'spa' AND corner_number = 18; -- Bus Stop 1
UPDATE circuit_corners SET path_percent =  92.0 WHERE circuit_ref = 'spa' AND corner_number = 19; -- Bus Stop 2

-- ─── HUNGARORING (14 corners) ─────────────────────────────────────────────────
-- Peak anchors (detected): 11.6%, 16.6%, 27.4%, 32.6%, 40.2%, 45.4%, 57.4%, 66.8%, 72.6%, 80.4%
UPDATE circuit_corners SET path_percent =  11.5 WHERE circuit_ref = 'hungaroring' AND corner_number =  1;
UPDATE circuit_corners SET path_percent =  16.5 WHERE circuit_ref = 'hungaroring' AND corner_number =  2;
UPDATE circuit_corners SET path_percent =  19.5 WHERE circuit_ref = 'hungaroring' AND corner_number =  3; -- interpolated kink
UPDATE circuit_corners SET path_percent =  27.0 WHERE circuit_ref = 'hungaroring' AND corner_number =  4;
UPDATE circuit_corners SET path_percent =  32.5 WHERE circuit_ref = 'hungaroring' AND corner_number =  5;
UPDATE circuit_corners SET path_percent =  40.0 WHERE circuit_ref = 'hungaroring' AND corner_number =  6;
UPDATE circuit_corners SET path_percent =  45.5 WHERE circuit_ref = 'hungaroring' AND corner_number =  7;
UPDATE circuit_corners SET path_percent =  50.0 WHERE circuit_ref = 'hungaroring' AND corner_number =  8; -- interpolated (back straight)
UPDATE circuit_corners SET path_percent =  57.5 WHERE circuit_ref = 'hungaroring' AND corner_number =  9;
UPDATE circuit_corners SET path_percent =  66.5 WHERE circuit_ref = 'hungaroring' AND corner_number = 10;
UPDATE circuit_corners SET path_percent =  72.5 WHERE circuit_ref = 'hungaroring' AND corner_number = 11;
UPDATE circuit_corners SET path_percent =  76.5 WHERE circuit_ref = 'hungaroring' AND corner_number = 12; -- interpolated
UPDATE circuit_corners SET path_percent =  80.5 WHERE circuit_ref = 'hungaroring' AND corner_number = 13;
UPDATE circuit_corners SET path_percent =  86.0 WHERE circuit_ref = 'hungaroring' AND corner_number = 14;
