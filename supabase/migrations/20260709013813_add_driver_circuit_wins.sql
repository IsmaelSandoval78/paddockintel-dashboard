CREATE OR REPLACE VIEW public.driver_circuit_wins AS
SELECT
  res.driver_id,
  ra.circuit_id,
  count(*) AS wins
FROM results res
JOIN races ra ON ra.id = res.race_id
WHERE res.position = 1
GROUP BY res.driver_id, ra.circuit_id;

GRANT SELECT ON public.driver_circuit_wins TO anon, authenticated;