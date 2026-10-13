-- Championships were counted at the race with the highest id in each season ("max"(races.id)).
-- Two problems with that, both visible on the live Hub on 2026-10-13:
--   1. Race ids aren't calendar order. The 2026 Bahrain GP (round 16) was inserted late and has
--      the highest 2026 id (1191), so it was treated as the 2026 finale.
--   2. Nothing required the season to be finished, so whoever led the standings at that race
--      counted as champion. Result: Antonelli showed 1 drivers' title and Mercedes 9 constructors'
--      titles (8 real: 2014-2021) with six 2026 rounds still to run.
--
-- Fix: the finale is the season's highest round on the calendar, including rounds not run yet.
-- A season in progress has no standings at its finale, so it can't count. Checked against every
-- season 1950-2026 before writing this: the only changes are Antonelli 1 -> 0 and Mercedes 9 -> 8.
-- The highest round is also the latest date in every season in the table.
--
-- Same rule as the app code (lib/seasonFinale.ts). Only the "lr" subquery changes; columns,
-- types and grants are untouched.

CREATE OR REPLACE VIEW "public"."driver_stats" AS
 SELECT "d"."id" AS "driver_id",
    (("d"."forename" || ' '::"text") || "d"."surname") AS "name",
    "d"."code",
    "d"."nationality",
    "d"."dob",
    "count"(DISTINCT "r"."id") AS "races",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."position" = 1)) AS "wins",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."position" <= 3)) AS "podiums",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."grid" = 1)) AS "poles",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."rank" = 1)) AS "fastest_laps",
    "count"(DISTINCT "r"."id") FILTER (
      WHERE "st"."status" IS NOT NULL
        AND "st"."status" <> 'Finished'
        AND "st"."status" !~ '^\+[0-9]+ Laps?$'
    ) AS "dnfs",
    "min"("ra"."year") AS "first_year",
    "max"("ra"."year") AS "last_year",
    COALESCE("sum"("r"."points"), (0)::numeric) AS "total_points",
    COALESCE("champ"."championships", (0)::bigint) AS "championships"
   FROM (((("public"."drivers" "d"
     LEFT JOIN "public"."results" "r" ON (("r"."driver_id" = "d"."id")))
     LEFT JOIN "public"."races" "ra" ON (("ra"."id" = "r"."race_id")))
     LEFT JOIN "public"."status" "st" ON (("st"."id" = "r"."status_id")))
     LEFT JOIN ( SELECT "ds"."driver_id",
            "count"(*) AS "championships"
           FROM ("public"."driver_standings" "ds"
             JOIN ( SELECT DISTINCT ON ("races"."year") "races"."year",
                    "races"."id" AS "race_id"
                   FROM "public"."races"
                  ORDER BY "races"."year", "races"."round" DESC) "lr" ON (("ds"."race_id" = "lr"."race_id")))
          WHERE ("ds"."position" = 1)
          GROUP BY "ds"."driver_id") "champ" ON (("champ"."driver_id" = "d"."id")))
  GROUP BY "d"."id", "d"."forename", "d"."surname", "d"."code", "d"."nationality", "d"."dob", "champ"."championships";

CREATE OR REPLACE VIEW "public"."constructor_stats" AS
 SELECT "c"."id" AS "constructor_id",
    "c"."name",
    "c"."nationality",
    "count"(DISTINCT "r"."id") AS "races",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."position" = 1)) AS "wins",
    "min"("ra"."year") AS "first_year",
    "max"("ra"."year") AS "last_year",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."position" <= 3)) AS "podiums",
    COALESCE("cr_agg"."total_points", (0)::numeric) AS "total_points",
    COALESCE("q_agg"."pole_positions", (0)::bigint) AS "pole_positions",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."rank" = 1)) AS "fastest_laps",
    COALESCE("champ"."championships", (0)::bigint) AS "championships",
    "fp"."fastest_pit_stop_ms",
    "fp"."fastest_pit_stop_duration",
    "fp"."fastest_pit_stop_race_id"
   FROM (((((("public"."constructors" "c"
     LEFT JOIN "public"."results" "r" ON (("r"."constructor_id" = "c"."id")))
     LEFT JOIN "public"."races" "ra" ON (("ra"."id" = "r"."race_id")))
     LEFT JOIN ( SELECT "constructor_results"."constructor_id",
            COALESCE("sum"("constructor_results"."points"), (0)::numeric) AS "total_points"
           FROM "public"."constructor_results"
          GROUP BY "constructor_results"."constructor_id") "cr_agg" ON (("cr_agg"."constructor_id" = "c"."id")))
     LEFT JOIN ( SELECT "qualifying"."constructor_id",
            "count"(*) AS "pole_positions"
           FROM "public"."qualifying"
          WHERE ("qualifying"."position" = 1)
          GROUP BY "qualifying"."constructor_id") "q_agg" ON (("q_agg"."constructor_id" = "c"."id")))
     LEFT JOIN ( SELECT "cs"."constructor_id",
            "count"(*) AS "championships"
           FROM ("public"."constructor_standings" "cs"
             JOIN ( SELECT DISTINCT ON ("races"."year") "races"."year",
                    "races"."id" AS "race_id"
                   FROM "public"."races"
                  ORDER BY "races"."year", "races"."round" DESC) "lr" ON (("cs"."race_id" = "lr"."race_id")))
          WHERE ("cs"."position" = 1)
          GROUP BY "cs"."constructor_id") "champ" ON (("champ"."constructor_id" = "c"."id")))
     LEFT JOIN LATERAL ( SELECT "ps"."milliseconds" AS "fastest_pit_stop_ms",
            "ps"."duration" AS "fastest_pit_stop_duration",
            "ps"."race_id" AS "fastest_pit_stop_race_id"
           FROM ("public"."pit_stops" "ps"
             JOIN "public"."results" "res" ON ((("ps"."race_id" = "res"."race_id") AND ("ps"."driver_id" = "res"."driver_id"))))
          WHERE (("res"."constructor_id" = "c"."id") AND ("ps"."milliseconds" IS NOT NULL) AND ("ps"."milliseconds" > 0))
          ORDER BY "ps"."milliseconds"
         LIMIT 1) "fp" ON (true))
  GROUP BY "c"."id", "c"."name", "c"."nationality", "cr_agg"."total_points", "q_agg"."pole_positions", "champ"."championships", "fp"."fastest_pit_stop_ms", "fp"."fastest_pit_stop_duration", "fp"."fastest_pit_stop_race_id";
