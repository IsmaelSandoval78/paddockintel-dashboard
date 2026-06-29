-- Circuit de Spa-Francorchamps — Corner Intelligence
-- Source: Wikipedia (Circuit de Spa-Francorchamps article)
-- Layout: Grand Prix Circuit (2007–present), 7.004 km, 19 turns
-- Notable: 2022 redevelopment added gravel traps at La Source, Les Combes, Pouhon, Stavelot, Blanchimont
-- circuit_ref: spa

INSERT INTO circuit_corners (circuit_ref, corner_number, name, type, sector, is_drs_zone, description) VALUES
  ('spa',  1, 'La Source',        'hairpin',       1, false, 'Opening right hairpin after the pit straight. The slowest corner on the circuit — the sole breathing moment before diving into Eau Rouge. Gravel traps added in 2022 redevelopment. Named after a local thermal spring.'),
  ('spa',  2, 'Eau Rouge',        'fast_left',     1, false, 'Left-hander at the bottom of the valley, crossing the Eau Rouge stream for which the complex is named. First direction change of the most iconic corner combination in motorsport.'),
  ('spa',  3, 'Raidillon',        'fast_right',    1, false, 'Steep uphill right-hander: the g-force compression at the valley bottom combines with the violent direction change. Fernando Alonso described the sensation as "a compression in your body as you go through the bottom" — a corner that makes an impression every lap.'),
  ('spa',  4, 'Raidillon crest',  'fast_left',     1, true,  'Left over the blind summit at the top of the climb. Exit opens DRS Zone 1 onto the Kemmel Straight at over 300 km/h. Cars have been airborne here; taking this flat is a long-standing driver milestone. The sequence was expanded with run-off in 2022 after multiple severe accidents.'),
  ('spa',  5, 'Les Combes 1',     'slow_left',     2, false, 'Hard left at the crest of the Kemmel hill. End of DRS Zone 1 — drivers brake from 330 km/h. The primary overtaking point in F1 at Spa due to the long DRS run preceding it.'),
  ('spa',  6, 'Les Combes 2',     'medium_right',  2, false, 'Immediate right follow-through from Les Combes 1. Entry is sacrificed to maximise exit speed into the forest section. Gravel traps added in 2022 redevelopment.'),
  ('spa',  7, 'Malmedy',          'medium_right',  2, false, 'Fast right-hander through the forest section after Les Combes. Part of the technically demanding sequence leading to the Rivage hairpin.'),
  ('spa',  8, 'Rivage 1',         'slow_left',     2, false, 'Tight left — the Rivage hairpin complex (also known as Bruxelles). Requires hard braking and a late apex before the following right. A crucial point for race strategy as cars can go side-by-side entering here.'),
  ('spa',  9, 'Rivage 2',         'medium_right',  2, false, 'Right-hand exit of the Rivage complex. Smooth exit sets up the run toward the Pouhon double-left sequence.'),
  ('spa', 10, 'Pouhon 1',         'fast_left',     2, false, 'Opening of the Pouhon "double gauche" (double left) — one of the fastest corners of the lap at around 280 km/h. High downforce loads. Gravel traps added in 2022 redevelopment. Punishes understeer severely.'),
  ('spa', 11, 'Jacky Ickx',       'fast_left',     2, false, 'Second left of the Pouhon complex. Renamed from "Speaker''s Corner" in 2018 to honour Belgian legend Jacky Ickx, six-time Spa winner. The name ''Speaker''s Corner'' came from the PA announcer who could first see the cars reappear after Raidillon from this spot.'),
  ('spa', 12, 'Fagnes',           'medium_right',  2, false, 'Right-hander exiting the Pouhon double complex. Part of the flowing forest section that makes Spa unlike any other circuit on the calendar.'),
  ('spa', 13, 'Stavelot',         'medium_right',  2, false, 'Sweeping right-hander named after the nearby historic town. Fast and descending. Gravel traps renovated in 2022 — the corner is taken with significant commitment.'),
  ('spa', 14, 'Paul Frère 1',     'medium_right',  3, false, 'First of the Paul Frère curves, named after the Belgian racing driver and motoring journalist who raced at Spa in the 1950s. Begins the acceleration sequence toward Blanchimont.'),
  ('spa', 15, 'Paul Frère 2',     'medium_left',   3, false, 'Second Paul Frère curve. Exit completes the acceleration onto the Blanchimont approach. Smooth passage through here is essential for Blanchimont entry speed.'),
  ('spa', 16, 'Blanchimont',      'fast_left',     3, false, 'High-speed left-hander where modern F1 cars barely lift, reaching around 290 km/h. The narrow run-off has a 7–8 metre drop behind the barrier — the scene of Burti''s 298 km/h accident in 2001 and Érik Comas''s 1992 crash where Senna stopped his own car to help. Gravel traps added in 2022.'),
  ('spa', 17, 'Bus Stop 1',       'chicane_right', 3, false, 'First element of the Bus Stop chicane. The chicane was reprofiled in 2007 with a longer approach when the pit lane was redesigned, giving the corner its current character.'),
  ('spa', 18, 'Bus Stop 2',       'chicane_left',  3, false, 'Left element of the Bus Stop chicane. Tight deceleration zone; drivers must carry maximum exit speed for DRS advantage onto the pit straight.'),
  ('spa', 19, 'Bus Stop exit',    'chicane_right', 3, true,  'Final right element of the Bus Stop complex. Exit opens DRS Zone 2 onto the 1.1 km pit straight, giving a full run to La Source. A clean Bus Stop exit is worth several tenths on a qualifying lap.')
ON CONFLICT (circuit_ref, corner_number) DO UPDATE SET
  name        = EXCLUDED.name,
  type        = EXCLUDED.type,
  sector      = EXCLUDED.sector,
  is_drs_zone = EXCLUDED.is_drs_zone,
  description = EXCLUDED.description;
