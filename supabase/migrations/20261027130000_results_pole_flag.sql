-- Pole positions: who took pole as the official records count it, in a new results.pole flag.
-- That is the driver who starts from the front of the grid, after grid penalties (Bottas at the
-- 2021 Turkish GP, Russell at the 2024 Qatar GP); on the 2022 sprint weekends, where the sprint set
-- the grid, it is the fastest qualifier.
--
-- Before, the two stats views counted two different things, both wrong in places (2026-10-27):
--   - driver_stats.poles counted starts from grid 1. That credits both drivers of a shared car in
--     the 1950s, the wrong car at the 1964 US GP (Clark and Spence swapped), and Russell instead of
--     Magnussen at the 2022 Sao Paulo GP. 11 drivers were off by one.
--   - constructor_stats.pole_positions counted qualifying P1, and our qualifying table starts in
--     1994: Ferrari 105 (official 254), McLaren 80 (180), Williams 38 (128), Lotus and Brabham 0.
--
-- results.pole is filled from F1DB's race_pole_position by scripts/f1db/poles.py, in the same
-- transaction as this migration, and by scripts/load_race.py for each new race (grid 1). Every
-- driver then matches F1DB's career total, and so does every constructor that is one entry on both
-- sides. Only the two pole columns change; the other columns, types and grants are untouched.

ALTER TABLE "public"."results" ADD COLUMN IF NOT EXISTS "pole" boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN "public"."results"."pole" IS 'This entry took pole position (official pole sitter: F1DB race_pole_position; loader: grid 1). At most one row per race.';

CREATE OR REPLACE VIEW "public"."driver_stats" AS
 SELECT "d"."id" AS "driver_id",
    (("d"."forename" || ' '::"text") || "d"."surname") AS "name",
    "d"."code",
    "d"."nationality",
    "d"."dob",
    "count"(DISTINCT "r"."id") AS "races",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."position" = 1)) AS "wins",
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."position" <= 3)) AS "podiums",
    "count"(DISTINCT "r"."id") FILTER (WHERE "r"."pole") AS "poles",
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
