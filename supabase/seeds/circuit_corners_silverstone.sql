-- Silverstone Circuit — Corner Intelligence
-- Source: Wikipedia (Silverstone Circuit article, "A lap in a Formula One car" section)
-- Layout: Arena Grand Prix Circuit (2011–present), 5.891 km, 18 turns
-- circuit_ref: silverstone

INSERT INTO circuit_corners (circuit_ref, corner_number, name, type, sector, is_drs_zone, description) VALUES
  ('silverstone',  1, 'Abbey',        'fast_right',    1, false, 'Flat-out in 6th gear at the end of the Hamilton Straight. Into Abbey flat-out is a rite of passage for F1 drivers.'),
  ('silverstone',  2, 'Farm',         'fast_left',     1, false, 'Immediate flat-out left follow-through from Abbey. No braking required in a modern F1 car.'),
  ('silverstone',  3, 'Village',      'slow_right',    1, false, 'First heavy braking point of the lap. Drivers drop to 2nd gear; exit sacrifice is necessary to optimize The Loop entry.'),
  ('silverstone',  4, 'The Loop',     'hairpin',       1, false, 'Slowest corner on the circuit, approached at approximately 90 km/h. Getting power down early here is critical for the Wellington Straight run.'),
  ('silverstone',  5, 'Aintree',      'medium_right',  1, false, 'Named after the nearby Aintree circuit. Exit opens DRS Detection Zone 1 onto the Wellington Straight.'),
  ('silverstone',  6, 'Brooklands',   'slow_left',     2, false, 'End of Wellington Straight DRS zone. Sharp left-hander rewarding a very late apex, flowing immediately into Luffield.'),
  ('silverstone',  7, 'Luffield',     'slow_right',    2, false, 'Long 180-degree right-hander. Immense patience on the throttle required; Woodcote exit leads onto Copse approach.'),
  ('silverstone',  8, 'Woodcote',     'medium_left',   2, false, 'Quick left flick at the end of the Old Pit Straight sequence. Acceleration toward the high-speed Copse corner.'),
  ('silverstone',  9, 'Copse',        'fast_right',    2, false, 'Taken in 7th or 8th gear at approximately 290 km/h with only a slight lift. One of the fastest corners on the F1 calendar.'),
  ('silverstone', 10, 'Maggotts',     'fast_left',     2, false, 'Opening of the legendary Maggotts-Becketts-Chapel complex. Lateral G-forces exceed 5g through the full sequence.'),
  ('silverstone', 11, 'Becketts 1',   'fast_right',    2, false, 'First right in the rapid-fire Becketts sequence. The goal is to carry maximum momentum through the entire complex.'),
  ('silverstone', 12, 'Becketts 2',   'fast_left',     2, false, 'Second left in Becketts. Rhythmic left-right-left-right demands extreme precision and commitment.'),
  ('silverstone', 13, 'Becketts 3',   'fast_right',    2, false, 'Final right before Chapel. Sets up the DRS activation zone entry onto the Hangar Straight.'),
  ('silverstone', 14, 'Chapel',       'fast_right',    2, true,  'Opens onto the 770m Hangar Straight DRS Zone 2. Speeds reach 325 km/h down the straight — the prime overtaking spot.'),
  ('silverstone', 15, 'Stowe',        'fast_right',    3, false, '6th gear right-hander with a blind entry and a downhill exit. Running wide here is easy but costly under DRS.'),
  ('silverstone', 16, 'Vale',         'chicane_left',  3, false, 'Hardest braking zone on the circuit. Drivers drop to 2nd gear for this tight left-hand kink — the toughest stop of the lap.'),
  ('silverstone', 17, 'Vale exit',    'chicane_right', 3, false, 'Right-side exit of the Vale chicane. Immediate transition to Club, the final corner of the lap.'),
  ('silverstone', 18, 'Club',         'slow_right',    3, false, 'Long, accelerating final corner. Drivers must carefully "unwind" the steering wheel to maximize traction across the finish line.')
ON CONFLICT (circuit_ref, corner_number) DO UPDATE SET
  name        = EXCLUDED.name,
  type        = EXCLUDED.type,
  sector      = EXCLUDED.sector,
  is_drs_zone = EXCLUDED.is_drs_zone,
  description = EXCLUDED.description;
