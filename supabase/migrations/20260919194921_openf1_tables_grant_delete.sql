-- The first real openf1_sync.py dispatch (run 35464183282, Spanish GP 2026) hit
-- "permission denied for table weather_readings" — the migration that created
-- these 4 tables granted SELECT/INSERT/UPDATE to service_role but not DELETE,
-- which the script needs for its delete-then-insert idempotency pattern.
-- Same class of bug as the beagle_items GRANT miss earlier this project.

GRANT DELETE ON tire_stints TO service_role;
GRANT DELETE ON weather_readings TO service_role;
GRANT DELETE ON race_control_messages TO service_role;
GRANT DELETE ON overtakes TO service_role;
