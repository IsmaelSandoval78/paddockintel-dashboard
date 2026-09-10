-- Driver Qualifying Pace Delta — first metric of the "pure data" vertical
-- (docs/DECISIONS-2026-08-24-radical-pivot.md §4, roadmap step 7).
--
-- What it computes: for each driver/season, the average % gap between their
-- best qualifying lap (Q3 if they reached it, else Q2, else Q1 — same
-- fallback scripts/load_race.py already uses when printing a driver's quali
-- time) and that session's pole time, averaged across every qualifying
-- session they set a time in that season. Lower = more consistently close
-- to pole pace, independent of grid penalties or race results.
--
-- Source table: qualifying.q1/q2/q3 are text "m:ss.sss" (see
-- scripts/load_race.py's td_to_str()), parsed here via split_part on ':' —
-- safe because every stored value follows that exact format, no locale/unit
-- ambiguity to worry about.
--
-- Descriptive, not predictive (see DATA-EXPERT.md) — a season-to-date
-- average, not a forecast.

CREATE OR REPLACE VIEW "public"."driver_qualifying_pace" AS
WITH "best_times" AS (
  SELECT
    "q"."race_id",
    "q"."driver_id",
    "ra"."year",
    COALESCE("q"."q3", "q"."q2", "q"."q1") AS "best_time_text"
  FROM "public"."qualifying" "q"
  JOIN "public"."races" "ra" ON "ra"."id" = "q"."race_id"
  WHERE COALESCE("q"."q3", "q"."q2", "q"."q1") IS NOT NULL
),
"parsed" AS (
  SELECT
    "race_id",
    "driver_id",
    "year",
    (
      split_part("best_time_text", ':', 1)::numeric * 60
      + split_part("best_time_text", ':', 2)::numeric
    ) AS "time_seconds"
  FROM "best_times"
),
"with_pole" AS (
  SELECT
    "p".*,
    MIN("p"."time_seconds") OVER (PARTITION BY "p"."race_id") AS "pole_seconds"
  FROM "parsed" "p"
)
SELECT
  "driver_id",
  "year",
  COUNT(*) AS "sessions",
  AVG(("time_seconds" - "pole_seconds") / "pole_seconds" * 100) AS "avg_pct_gap"
FROM "with_pole"
GROUP BY "driver_id", "year";

ALTER VIEW "public"."driver_qualifying_pace" OWNER TO "postgres";

-- SELECT-only grants (project convention corrected 2026-09-08 — see
-- docs/ROADMAP-SEMANA.md "CLI de Supabase" section — never the broader
-- REFERENCES/TRIGGER/TRUNCATE/MAINTAIN the original baseline views got).
GRANT SELECT ON TABLE "public"."driver_qualifying_pace" TO "anon";
GRANT SELECT ON TABLE "public"."driver_qualifying_pace" TO "authenticated";
GRANT ALL ON TABLE "public"."driver_qualifying_pace" TO "service_role";
