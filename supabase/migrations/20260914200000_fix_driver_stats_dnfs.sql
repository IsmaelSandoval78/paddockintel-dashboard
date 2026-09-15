-- driver_stats.dnfs counted `results.position IS NULL` as the DNF signal.
-- That's wrong for this dataset: a driver who retires after completing enough
-- race distance still gets classified with a real numeric position (confirmed
-- against Antonelli's Barcelona 2026 retirement -- position=16, status=
-- 'Retired', reported by Ismael as missing from the site's DNF count and
-- verified real). Quantified before this migration: 795 of 11,722 real-DNF
-- rows (results whose status is neither 'Finished' nor a lapped '+N Lap(s)'
-- classification) have a non-null position and were silently excluded.
--
-- Same root cause already fixed in application code for the magazine-home
-- Retirements panel (getRaceHighlights() in
-- app/[locale]/(blog)/magazine-home/data.ts) -- this migration applies the
-- identical status-based logic at the schema level, since driver_stats is a
-- SQL view, not something app code can patch.
--
-- constructor_stats has no dnfs column -- nothing to fix there.

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
             JOIN ( SELECT "races"."year",
                    "max"("races"."id") AS "race_id"
                   FROM "public"."races"
                  GROUP BY "races"."year") "lr" ON (("ds"."race_id" = "lr"."race_id")))
          WHERE ("ds"."position" = 1)
          GROUP BY "ds"."driver_id") "champ" ON (("champ"."driver_id" = "d"."id")))
  GROUP BY "d"."id", "d"."forename", "d"."surname", "d"."code", "d"."nationality", "d"."dob", "champ"."championships";
