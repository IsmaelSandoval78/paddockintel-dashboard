-- Career "races" count starts, not entries (2026-10-27).
--
-- Before, both views counted every results row. Ergast's results also hold entries that never took
-- the start: failed to qualify or pre-qualify (position_text F, 1,344 rows), withdrew before the
-- start (W, about 320) and excluded from the meeting (E, 12; F1DB has all 12 as not started,
-- e.g. Ghinzani at the 1987 British GP, excluded in practice after taking a grid slot). On top of that,
-- constructor_stats.races counted cars, not races: Ferrari showed 2,523 races (1,140 starts),
-- so the constructor page's win rate was about half the real one.
--
-- Now:
--   - driver_stats.races and constructor_stats.races are the races with at least one start
--     (a 1950s shared drive is one race, not two). Drivers match F1DB's total_race_starts: Alonso
--     444, Schumacher 306, Fangio 51 (was 58), Tarquini 38 (was 78). So do constructors that are one
--     entry on both sides (Ferrari 1,140, Red Bull 435, Minardi 339).
--   - driver_stats.dnfs counts retirements from a start only; a DNQ is not a DNF.
-- Same start rule as the comparator's head-to-head (#142, which this aligns: E is never a start). Other columns, types and grants are
-- untouched.

CREATE OR REPLACE VIEW "public"."driver_stats" AS
 SELECT "d"."id" AS "driver_id",
    (("d"."forename" || ' '::"text") || "d"."surname") AS "name",
    "d"."code",
    "d"."nationality",
    "d"."dob",
    "count"(DISTINCT "r"."race_id") FILTER (WHERE (COALESCE("r"."position_text", ''::"text") <> ALL (ARRAY['F'::"text", 'W'::"text", 'E'::"text"]))) AS "races",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."position" = 1)) AS "wins",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."position" <= 3)) AS "podiums",
    "count"(DISTINCT "r"."id") FILTER (WHERE "r"."pole") AS "poles",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."rank" = 1)) AS "fastest_laps",
    "count"(DISTINCT "r"."id") FILTER (
      WHERE "st"."status" IS NOT NULL
        AND "st"."status" <> 'Finished'
        AND "st"."status" !~ '^\+[0-9]+ Laps?$'
        AND (COALESCE("r"."position_text", ''::"text") <> ALL (ARRAY['F'::"text", 'W'::"text", 'E'::"text"]))
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
    "count"(DISTINCT "r"."race_id") FILTER (WHERE (COALESCE("r"."position_text", ''::"text") <> ALL (ARRAY['F'::"text", 'W'::"text", 'E'::"text"]))) AS "races",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."position" = 1)) AS "wins",
    "min"("ra"."year") AS "first_year",
    "max"("ra"."year") AS "last_year",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."position" <= 3)) AS "podiums",
    COALESCE("cr_agg"."total_points", (0)::numeric) AS "total_points",
    "count"(DISTINCT "r"."id") FILTER (WHERE "r"."pole") AS "pole_positions",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."rank" = 1)) AS "fastest_laps",
    COALESCE("champ"."championships", (0)::bigint) AS "championships",
    "fp"."fastest_pit_stop_ms",
    "fp"."fastest_pit_stop_duration",
    "fp"."fastest_pit_stop_race_id"
   FROM ((((("public"."constructors" "c"
     LEFT JOIN "public"."results" "r" ON (("r"."constructor_id" = "c"."id")))
     LEFT JOIN "public"."races" "ra" ON (("ra"."id" = "r"."race_id")))
     LEFT JOIN ( SELECT "constructor_results"."constructor_id",
            COALESCE("sum"("constructor_results"."points"), (0)::numeric) AS "total_points"
           FROM "public"."constructor_results"
          GROUP BY "constructor_results"."constructor_id") "cr_agg" ON (("cr_agg"."constructor_id" = "c"."id")))
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
  GROUP BY "c"."id", "c"."name", "c"."nationality", "cr_agg"."total_points", "champ"."championships", "fp"."fastest_pit_stop_ms", "fp"."fastest_pit_stop_duration", "fp"."fastest_pit_stop_race_id";
