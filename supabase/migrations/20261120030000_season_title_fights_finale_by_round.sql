-- season_title_fights picked each season's "last race" as max(races.id). Race ids aren't calendar
-- order: the 2026 Bahrain GP in Malaysia (round 16) was inserted late and has the highest 2026 id
-- (1191). So the view treated round 16 as the 2026 finale and published a finished "2026
-- championship" (Antonelli 320, Russell 236, gap 84) with seven rounds still to run, live at
-- /records/closest-championships/2026/ (found 2026-11-20).
--
-- Fix: same rule as driver_stats / constructor_stats (migration 20261013160000) and
-- lib/seasonFinale.ts: the finale is the season's highest round on the calendar, including rounds
-- not run yet. A season in progress has no standings at its finale, so it has no row. Checked
-- against every season before writing this: the only change is that 2026 drops out (76 seasons,
-- 1950-2025, identical); it returns on its own once the Abu Dhabi standings are loaded.
--
-- Only the last_race CTE changes; columns, types, order and grants are untouched.

CREATE OR REPLACE VIEW public.season_title_fights AS
WITH last_race AS (
  SELECT DISTINCT ON (year) year, id AS race_id
  FROM races
  ORDER BY year, round DESC
),
final_standings AS (
  SELECT ds.driver_id, ds.points, ds.position, lr.year
  FROM driver_standings ds
  JOIN last_race lr ON lr.race_id = ds.race_id
  WHERE ds.position IN (1, 2)
)
SELECT
  champ.year,
  champ.driver_id AS champion_id,
  runner.driver_id AS runner_up_id,
  champ.points AS champion_points,
  runner.points AS runner_up_points,
  (champ.points - runner.points) AS gap
FROM final_standings champ
JOIN final_standings runner ON runner.year = champ.year AND runner.position = 2
WHERE champ.position = 1
ORDER BY gap ASC;

GRANT SELECT ON public.season_title_fights TO anon, authenticated, service_role;
