-- Circuit Zandvoort — Corner Intelligence (PARTIAL: Turn 14 only)
-- Source: Wikipedia (Circuit Zandvoort article) + circuitzandvoort.nl official corners page
--         + Formula1.com circuit guide, cross-referenced via WebSearch (RaceFans, Scuderiafans,
--         GPblog) for DRS-zone history. Direction (left/right) and path_percent are NOT sourced
--         from a written reference — Wikipedia/circuitzandvoort.nl/Formula1.com do not state
--         them for this corner. Both were derived from the real trackPathData geometry
--         (julesr0y/f1-circuits-svg, same source app/api/circuits/[id] already fetches):
--         curvature-peak detection (0.2% sampling) + local refinement (±0.3% window, 0.05% step)
--         located the apex; direction was read from the signed turn angle at that apex, sign
--         convention validated against two corners of independently-known direction — Tarzan
--         (right-hand, well established) and Hugenholtz (left-hand, per circuitzandvoort.nl).
-- 2026 Dutch GP incident facts verified via WebSearch (Formula1.com, Sky Sports, ESPN,
--         Motorsport.com) — corrects an earlier UNVERIFIED assumption (used in an earlier
--         planning conversation) that the crash was at Turn 3. It was Turn 14.
-- Layout: Grand Prix Circuit (2020–present), 4.259 km, 14 turns.
-- Only Turn 14 is seeded here. The other 13 corners are NOT verified/loaded — do not assume
-- they exist. Full-circuit backfill is a separate follow-up task, same sourcing discipline.
-- circuit_ref: zandvoort

INSERT INTO circuit_corners (circuit_ref, corner_number, name, type, sector, is_drs_zone, description) VALUES
  ('zandvoort', 14, 'Arie Luyendyk Corner', 'fast_right', 3, true,
   'Final corner of the lap — an 18-degree banked right-hander leading onto the pit straight, rebuilt with a SAFER barrier in the 2020 redesign. Named after two-time Indianapolis 500 winner Arie Luyendyk; known as the Bos Uit corner from 1948 to 2001. DRS zone runs from the Turn 13 exit through here onto the straight (since 2022), rewarding maximum banking-carried speed. Site of Max Verstappen''s race-ending crash in the wet at the 2026 Dutch Grand Prix, the circuit''s final race on the calendar — a loss of control on the white line under red-flag conditions; Lando Norris went on to win.')
ON CONFLICT (circuit_ref, corner_number) DO NOTHING;

UPDATE circuit_corners SET path_percent = 94.5 WHERE circuit_ref = 'zandvoort' AND corner_number = 14;
