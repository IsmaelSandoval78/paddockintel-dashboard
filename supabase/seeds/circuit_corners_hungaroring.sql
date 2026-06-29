-- Hungaroring — Corner Intelligence
-- Source: Wikipedia (Hungaroring article)
-- Layout: Grand Prix Circuit (2003–present), 4.381 km, 14 turns
-- Notable: Turn 4 = Mansell Corner, Turn 11 = Alesi Corner (named corners confirmed by Wikipedia)
-- One DRS zone: 908m main straight (extended 2003). Nicknamed "Monaco without the barriers."
-- circuit_ref: hungaroring

INSERT INTO circuit_corners (circuit_ref, corner_number, name, type, sector, is_drs_zone, description) VALUES
  ('hungaroring',  1, NULL,              'hairpin',       1, false, 'Heavy braking hairpin at the end of the 908m main straight — the only real overtaking point. Tightened in 2003 to improve opportunities. Taken in 1st gear; end of DRS Zone. The entry is a chess game: brake too early and you gift a slipstream, too late and you run wide.'),
  ('hungaroring',  2, NULL,              'fast_left',     1, false, 'Quick left sweeper accelerating out of the T1 hairpin. The fastest exit of the lap — getting the line right here is crucial to load the tyres before the tighter sections ahead.'),
  ('hungaroring',  3, NULL,              'medium_right',  1, false, 'Medium-speed right-hander leading into the most technical sector of the lap. Clean entry required to set up the demanding Mansell Corner approach.'),
  ('hungaroring',  4, 'Mansell Corner',  'medium_left',   1, false, 'Named after Nigel Mansell, who lost his right rear wheel here while leading the 1987 Hungarian Grand Prix — handing victory to Nelson Piquet. A compact left in the high-downforce first sector that demands precision over speed.'),
  ('hungaroring',  5, NULL,              'slow_right',    2, false, 'Tight right beginning the technical middle sector — the section that earns Hungary its "Monaco without the barriers" nickname. Low speeds expose mechanical grip differences between cars.'),
  ('hungaroring',  6, NULL,              'medium_left',   2, false, 'Left entry to the valley section. The circuit descends here, changing the aero balance as ground clearance shifts. Patience on the throttle matters more than peak speed.'),
  ('hungaroring',  7, NULL,              'medium_right',  2, false, 'Medium right in the valley — part of the relentless sequence of direction changes that gives Hungaroring the highest number of corners-per-kilometre on the calendar after Monaco.'),
  ('hungaroring',  8, NULL,              'slow_left',     2, false, 'Tight left in the lower valley section. Pre-1989, a chicane ran through here to avoid a discovered underground spring; the stream was culverted and the chicane removed for the 1989 season, making the circuit marginally faster.'),
  ('hungaroring',  9, NULL,              'medium_right',  2, false, 'Right-hander in the lower valley. The circuit is close to sea level here — maximum tyre loading before the return climb. This section can be three or four car widths wide, yet overtaking is nearly impossible.'),
  ('hungaroring', 10, NULL,              'medium_left',   2, false, 'Left sweeper climbing back toward the upper part of the circuit. Approximately 80% of the circuit is visible from any vantage point due to the valley bowl — this corner is watched by thousands of fans simultaneously.'),
  ('hungaroring', 11, 'Alesi Corner',   'slow_right',    2, false, 'Named after Jean Alesi, who crashed heavily here in qualifying for the 1995 Hungarian Grand Prix. A tight right requiring maximum commitment on a circuit where every tenth of a second is fought for.'),
  ('hungaroring', 12, NULL,              'slow_left',     3, false, 'Tightened in the 2003 circuit revision alongside the main straight extension. The modification was intended to slow approach speeds and create a longer braking zone for overtaking — in reality the circuit remained just as difficult for passing.'),
  ('hungaroring', 13, NULL,              'medium_right',  3, false, 'Medium right beginning the return run to the main straight. The circuit surface here is particularly sensitive to rubber build-up — track evolution makes lap times drop significantly over a race weekend.'),
  ('hungaroring', 14, NULL,              'slow_right',    3, true,  'Final right-hander onto the 908m main straight. Exit quality determines the entire DRS advantage for the following straight — a single car-length loss at T14 exit can cost a driver the DRS activation window into T1. The only DRS zone on the circuit opens here.')
ON CONFLICT (circuit_ref, corner_number) DO UPDATE SET
  name        = EXCLUDED.name,
  type        = EXCLUDED.type,
  sector      = EXCLUDED.sector,
  is_drs_zone = EXCLUDED.is_drs_zone,
  description = EXCLUDED.description;
