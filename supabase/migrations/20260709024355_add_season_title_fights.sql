CREATE OR REPLACE VIEW public.season_title_fights AS
WITH last_race AS (
  SELECT year, max(id) AS race_id
  FROM races
  GROUP BY year
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