CREATE OR REPLACE VIEW public.race_winner_ages AS
SELECT
  res.driver_id,
  ra.id AS race_id,
  ra.name AS race_name,
  ra.date AS race_date,
  ra.year,
  (ra.date - d.dob) AS age_days
FROM results res
JOIN races ra ON ra.id = res.race_id
JOIN drivers d ON d.id = res.driver_id
WHERE res.position = 1 AND ra.date IS NOT NULL AND d.dob IS NOT NULL;

GRANT SELECT ON public.race_winner_ages TO anon, authenticated;
