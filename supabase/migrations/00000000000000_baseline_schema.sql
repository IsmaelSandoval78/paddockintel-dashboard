


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."refresh_stats"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if exists (
    select 1 from pg_matviews
    where schemaname = 'public' and matviewname = 'driver_stats'
  ) then
    refresh materialized view public.driver_stats;
  end if;

  if exists (
    select 1 from pg_matviews
    where schemaname = 'public' and matviewname = 'constructor_stats'
  ) then
    refresh materialized view public.constructor_stats;
  end if;
end;
$$;


ALTER FUNCTION "public"."refresh_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "translation_group_id" "uuid" NOT NULL,
    "locale" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "meta_description" "text",
    "cover_image_url" "text",
    "body_markdown" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "race_id" bigint,
    "stats" "jsonb",
    "sources" "jsonb",
    "faq_items" "jsonb",
    CONSTRAINT "articles_locale_check" CHECK (("locale" = ANY (ARRAY['en'::"text", 'es'::"text", 'pt'::"text"]))),
    CONSTRAINT "articles_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."circuit_corners" (
    "id" integer NOT NULL,
    "circuit_ref" "text" NOT NULL,
    "corner_number" integer NOT NULL,
    "name" "text",
    "type" "text",
    "sector" integer,
    "is_drs_zone" boolean DEFAULT false,
    "description" "text",
    "path_percent" numeric(5,2),
    CONSTRAINT "circuit_corners_sector_check" CHECK (("sector" = ANY (ARRAY[1, 2, 3])))
);


ALTER TABLE "public"."circuit_corners" OWNER TO "postgres";


COMMENT ON COLUMN "public"."circuit_corners"."path_percent" IS 'Position along the circuit SVG path, 0–100. Set per circuit by inspecting the path element in browser DevTools: path.getPointAtLength(path.getTotalLength() * pct / 100). NULL = not yet calibrated.';



CREATE SEQUENCE IF NOT EXISTS "public"."circuit_corners_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."circuit_corners_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."circuit_corners_id_seq" OWNED BY "public"."circuit_corners"."id";



CREATE TABLE IF NOT EXISTS "public"."circuits" (
    "id" integer NOT NULL,
    "circuit_ref" "text",
    "name" "text" NOT NULL,
    "location" "text",
    "country" "text",
    "lat" numeric,
    "lng" numeric,
    "alt" integer,
    "url" "text",
    "map_svg_url" "text"
);


ALTER TABLE "public"."circuits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."constructor_results" (
    "id" integer NOT NULL,
    "race_id" integer,
    "constructor_id" integer,
    "points" numeric,
    "status" "text"
);


ALTER TABLE "public"."constructor_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."constructor_standings" (
    "id" integer NOT NULL,
    "race_id" integer,
    "constructor_id" integer,
    "points" numeric,
    "position" integer,
    "position_text" "text",
    "wins" integer
);


ALTER TABLE "public"."constructor_standings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."constructors" (
    "id" integer NOT NULL,
    "constructor_ref" "text",
    "name" "text" NOT NULL,
    "nationality" "text",
    "url" "text"
);


ALTER TABLE "public"."constructors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pit_stops" (
    "race_id" integer NOT NULL,
    "driver_id" integer NOT NULL,
    "stop" integer NOT NULL,
    "lap" integer,
    "time" "text",
    "duration" "text",
    "milliseconds" bigint
);


ALTER TABLE "public"."pit_stops" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."qualifying" (
    "id" integer NOT NULL,
    "race_id" integer,
    "driver_id" integer,
    "constructor_id" integer,
    "number" integer,
    "position" integer,
    "q1" "text",
    "q2" "text",
    "q3" "text"
);


ALTER TABLE "public"."qualifying" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."races" (
    "id" integer NOT NULL,
    "year" integer,
    "series_id" integer DEFAULT 1,
    "round" integer,
    "circuit_id" integer,
    "name" "text" NOT NULL,
    "date" "date",
    "time" "text",
    "url" "text",
    "fp1_date" "date",
    "fp1_time" "text",
    "fp2_date" "date",
    "fp2_time" "text",
    "fp3_date" "date",
    "fp3_time" "text",
    "quali_date" "date",
    "quali_time" "text",
    "sprint_date" "date",
    "sprint_time" "text"
);


ALTER TABLE "public"."races" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."results" (
    "id" integer NOT NULL,
    "race_id" integer,
    "driver_id" integer,
    "constructor_id" integer,
    "number" integer,
    "grid" integer,
    "position" integer,
    "position_text" "text",
    "position_order" integer,
    "points" numeric,
    "laps" integer,
    "time" "text",
    "milliseconds" bigint,
    "fastest_lap" integer,
    "rank" integer,
    "fastest_lap_time" "text",
    "fastest_lap_speed" "text",
    "status_id" integer
);


ALTER TABLE "public"."results" OWNER TO "postgres";


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
             JOIN ( SELECT "races"."year",
                    "max"("races"."id") AS "race_id"
                   FROM "public"."races"
                  GROUP BY "races"."year") "lr" ON (("cs"."race_id" = "lr"."race_id")))
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


ALTER VIEW "public"."constructor_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."constructor_win_streaks" AS
 WITH "race_wins" AS (
         SELECT "r"."constructor_id",
            "rc"."year",
            "row_number"() OVER (ORDER BY "rc"."date", "rc"."round") AS "rn",
            "row_number"() OVER (PARTITION BY "r"."constructor_id" ORDER BY "rc"."date", "rc"."round") AS "drn"
           FROM ("public"."results" "r"
             JOIN "public"."races" "rc" ON (("rc"."id" = "r"."race_id")))
          WHERE (("r"."position" = 1) AND ("rc"."date" IS NOT NULL) AND ("r"."constructor_id" IS NOT NULL))
        ), "streaks" AS (
         SELECT "race_wins"."constructor_id",
            ("race_wins"."rn" - "race_wins"."drn") AS "grp",
            ("count"(*))::integer AS "streak_len",
            "max"("race_wins"."year") AS "end_year"
           FROM "race_wins"
          GROUP BY "race_wins"."constructor_id", ("race_wins"."rn" - "race_wins"."drn")
        )
 SELECT "c"."id" AS "constructor_id",
    "c"."name",
    "c"."constructor_ref",
    "s"."streak_len",
    "s"."end_year"
   FROM ("streaks" "s"
     JOIN "public"."constructors" "c" ON (("c"."id" = "s"."constructor_id")))
  ORDER BY "s"."streak_len" DESC;


ALTER VIEW "public"."constructor_win_streaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."digest_issues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "intro_synthesis" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sent_at" timestamp with time zone
);


ALTER TABLE "public"."digest_issues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."digest_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "issue_id" "uuid" NOT NULL,
    "source_name" "text" NOT NULL,
    "source_url" "text" NOT NULL,
    "headline" "text" NOT NULL,
    "our_summary" "text" NOT NULL,
    "published_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."digest_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."driver_standings" (
    "id" integer NOT NULL,
    "race_id" integer,
    "driver_id" integer,
    "points" numeric,
    "position" integer,
    "position_text" "text",
    "wins" integer
);


ALTER TABLE "public"."driver_standings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drivers" (
    "id" integer NOT NULL,
    "driver_ref" "text",
    "number" integer,
    "code" "text",
    "forename" "text" NOT NULL,
    "surname" "text" NOT NULL,
    "dob" "date",
    "nationality" "text",
    "url" "text"
);


ALTER TABLE "public"."drivers" OWNER TO "postgres";


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
    "count"(DISTINCT "r"."id") FILTER (WHERE ("r"."position" IS NULL)) AS "dnfs",
    "min"("ra"."year") AS "first_year",
    "max"("ra"."year") AS "last_year",
    COALESCE("sum"("r"."points"), (0)::numeric) AS "total_points",
    COALESCE("champ"."championships", (0)::bigint) AS "championships"
   FROM ((("public"."drivers" "d"
     LEFT JOIN "public"."results" "r" ON (("r"."driver_id" = "d"."id")))
     LEFT JOIN "public"."races" "ra" ON (("ra"."id" = "r"."race_id")))
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


ALTER VIEW "public"."driver_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."driver_win_streaks" AS
 WITH "race_wins" AS (
         SELECT "r"."driver_id",
            "rc"."year",
            "row_number"() OVER (ORDER BY "rc"."date", "rc"."round") AS "rn",
            "row_number"() OVER (PARTITION BY "r"."driver_id" ORDER BY "rc"."date", "rc"."round") AS "drn"
           FROM ("public"."results" "r"
             JOIN "public"."races" "rc" ON (("rc"."id" = "r"."race_id")))
          WHERE (("r"."position" = 1) AND ("rc"."date" IS NOT NULL) AND ("r"."driver_id" IS NOT NULL))
        ), "streaks" AS (
         SELECT "race_wins"."driver_id",
            ("race_wins"."rn" - "race_wins"."drn") AS "grp",
            ("count"(*))::integer AS "streak_len",
            "max"("race_wins"."year") AS "end_year"
           FROM "race_wins"
          GROUP BY "race_wins"."driver_id", ("race_wins"."rn" - "race_wins"."drn")
        )
 SELECT "d"."id" AS "driver_id",
    "d"."forename",
    "d"."surname",
    "s"."streak_len",
    "s"."end_year"
   FROM ("streaks" "s"
     JOIN "public"."drivers" "d" ON (("d"."id" = "s"."driver_id")))
  ORDER BY "s"."streak_len" DESC;


ALTER VIEW "public"."driver_win_streaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lap_times" (
    "race_id" integer NOT NULL,
    "driver_id" integer NOT NULL,
    "lap" integer NOT NULL,
    "position" integer,
    "time" "text",
    "milliseconds" integer
);


ALTER TABLE "public"."lap_times" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seasons" (
    "year" integer NOT NULL,
    "series_id" integer DEFAULT 1,
    "url" "text"
);


ALTER TABLE "public"."seasons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."series" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."series" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."series_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."series_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."series_id_seq" OWNED BY "public"."series"."id";



CREATE TABLE IF NOT EXISTS "public"."sprint_results" (
    "id" integer NOT NULL,
    "race_id" integer,
    "driver_id" integer,
    "constructor_id" integer,
    "number" integer,
    "grid" integer,
    "position" integer,
    "position_text" "text",
    "position_order" integer,
    "points" numeric,
    "laps" integer,
    "time" "text",
    "milliseconds" bigint,
    "fastest_lap" integer,
    "fastest_lap_time" "text",
    "status_id" integer
);


ALTER TABLE "public"."sprint_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."status" (
    "id" integer NOT NULL,
    "status" "text" NOT NULL
);


ALTER TABLE "public"."status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "locale" "text" DEFAULT 'en'::"text" NOT NULL,
    "subscribed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscribers_locale_check" CHECK (("locale" = ANY (ARRAY['en'::"text", 'es'::"text", 'pt'::"text"])))
);


ALTER TABLE "public"."subscribers" OWNER TO "postgres";


ALTER TABLE ONLY "public"."circuit_corners" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."circuit_corners_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."series" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."series_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_locale_slug_key" UNIQUE ("locale", "slug");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."circuit_corners"
    ADD CONSTRAINT "circuit_corners_circuit_ref_corner_number_key" UNIQUE ("circuit_ref", "corner_number");



ALTER TABLE ONLY "public"."circuit_corners"
    ADD CONSTRAINT "circuit_corners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."circuits"
    ADD CONSTRAINT "circuits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."constructor_results"
    ADD CONSTRAINT "constructor_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."constructor_standings"
    ADD CONSTRAINT "constructor_standings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."constructors"
    ADD CONSTRAINT "constructors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."digest_issues"
    ADD CONSTRAINT "digest_issues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."digest_issues"
    ADD CONSTRAINT "digest_issues_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."digest_items"
    ADD CONSTRAINT "digest_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."driver_standings"
    ADD CONSTRAINT "driver_standings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lap_times"
    ADD CONSTRAINT "lap_times_pkey" PRIMARY KEY ("race_id", "driver_id", "lap");



ALTER TABLE ONLY "public"."pit_stops"
    ADD CONSTRAINT "pit_stops_pkey" PRIMARY KEY ("race_id", "driver_id", "stop");



ALTER TABLE ONLY "public"."qualifying"
    ADD CONSTRAINT "qualifying_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."races"
    ADD CONSTRAINT "races_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."results"
    ADD CONSTRAINT "results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("year");



ALTER TABLE ONLY "public"."series"
    ADD CONSTRAINT "series_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."series"
    ADD CONSTRAINT "series_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."series"
    ADD CONSTRAINT "series_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."sprint_results"
    ADD CONSTRAINT "sprint_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status"
    ADD CONSTRAINT "status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id");



CREATE INDEX "articles_translation_group_idx" ON "public"."articles" USING "btree" ("translation_group_id");



CREATE INDEX "digest_items_issue_id_idx" ON "public"."digest_items" USING "btree" ("issue_id");



CREATE INDEX "idx_lap_times_race" ON "public"."lap_times" USING "btree" ("race_id");



CREATE INDEX "idx_pit_stops_race" ON "public"."pit_stops" USING "btree" ("race_id");



CREATE INDEX "idx_qualifying_driver" ON "public"."qualifying" USING "btree" ("driver_id");



CREATE INDEX "idx_races_series" ON "public"."races" USING "btree" ("series_id");



CREATE INDEX "idx_races_year" ON "public"."races" USING "btree" ("year");



CREATE INDEX "idx_results_driver" ON "public"."results" USING "btree" ("driver_id");



CREATE INDEX "idx_results_position" ON "public"."results" USING "btree" ("position");



CREATE INDEX "idx_results_race" ON "public"."results" USING "btree" ("race_id");



CREATE INDEX "idx_standings_driver" ON "public"."driver_standings" USING "btree" ("driver_id");



CREATE INDEX "idx_standings_race" ON "public"."driver_standings" USING "btree" ("race_id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id");



ALTER TABLE ONLY "public"."constructor_results"
    ADD CONSTRAINT "constructor_results_constructor_id_fkey" FOREIGN KEY ("constructor_id") REFERENCES "public"."constructors"("id");



ALTER TABLE ONLY "public"."constructor_results"
    ADD CONSTRAINT "constructor_results_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id");



ALTER TABLE ONLY "public"."constructor_standings"
    ADD CONSTRAINT "constructor_standings_constructor_id_fkey" FOREIGN KEY ("constructor_id") REFERENCES "public"."constructors"("id");



ALTER TABLE ONLY "public"."constructor_standings"
    ADD CONSTRAINT "constructor_standings_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id");



ALTER TABLE ONLY "public"."digest_items"
    ADD CONSTRAINT "digest_items_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."digest_issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."driver_standings"
    ADD CONSTRAINT "driver_standings_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id");



ALTER TABLE ONLY "public"."driver_standings"
    ADD CONSTRAINT "driver_standings_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id");



ALTER TABLE ONLY "public"."lap_times"
    ADD CONSTRAINT "lap_times_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id");



ALTER TABLE ONLY "public"."lap_times"
    ADD CONSTRAINT "lap_times_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id");



ALTER TABLE ONLY "public"."pit_stops"
    ADD CONSTRAINT "pit_stops_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id");



ALTER TABLE ONLY "public"."pit_stops"
    ADD CONSTRAINT "pit_stops_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id");



ALTER TABLE ONLY "public"."qualifying"
    ADD CONSTRAINT "qualifying_constructor_id_fkey" FOREIGN KEY ("constructor_id") REFERENCES "public"."constructors"("id");



ALTER TABLE ONLY "public"."qualifying"
    ADD CONSTRAINT "qualifying_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id");



ALTER TABLE ONLY "public"."qualifying"
    ADD CONSTRAINT "qualifying_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id");



ALTER TABLE ONLY "public"."races"
    ADD CONSTRAINT "races_circuit_id_fkey" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuits"("id");



ALTER TABLE ONLY "public"."races"
    ADD CONSTRAINT "races_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id");



ALTER TABLE ONLY "public"."races"
    ADD CONSTRAINT "races_year_fkey" FOREIGN KEY ("year") REFERENCES "public"."seasons"("year");



ALTER TABLE ONLY "public"."results"
    ADD CONSTRAINT "results_constructor_id_fkey" FOREIGN KEY ("constructor_id") REFERENCES "public"."constructors"("id");



ALTER TABLE ONLY "public"."results"
    ADD CONSTRAINT "results_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id");



ALTER TABLE ONLY "public"."results"
    ADD CONSTRAINT "results_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id");



ALTER TABLE ONLY "public"."results"
    ADD CONSTRAINT "results_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."status"("id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id");



ALTER TABLE ONLY "public"."sprint_results"
    ADD CONSTRAINT "sprint_results_constructor_id_fkey" FOREIGN KEY ("constructor_id") REFERENCES "public"."constructors"("id");



ALTER TABLE ONLY "public"."sprint_results"
    ADD CONSTRAINT "sprint_results_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id");



ALTER TABLE ONLY "public"."sprint_results"
    ADD CONSTRAINT "sprint_results_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id");



ALTER TABLE ONLY "public"."sprint_results"
    ADD CONSTRAINT "sprint_results_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."status"("id");



CREATE POLICY "Allow public read" ON "public"."drivers" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read" ON "public"."results" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read access" ON "public"."drivers" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."results" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on circuits" ON "public"."circuits" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read access on drivers" ON "public"."drivers" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."circuit_corners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "circuit_corners_public_read" ON "public"."circuit_corners" FOR SELECT USING (true);



ALTER TABLE "public"."circuits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."constructor_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."constructor_standings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."constructors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."digest_issues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."digest_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."driver_standings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drivers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lap_times" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pit_stops" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read" ON "public"."circuits" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."constructor_results" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."constructor_standings" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."constructors" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."driver_standings" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."drivers" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."lap_times" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."pit_stops" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."qualifying" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."races" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."results" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."seasons" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."series" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."sprint_results" FOR SELECT USING (true);



CREATE POLICY "public read" ON "public"."status" FOR SELECT USING (true);



CREATE POLICY "public read published articles" ON "public"."articles" FOR SELECT USING (("status" = 'published'::"text"));



ALTER TABLE "public"."qualifying" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."races" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seasons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."series" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sprint_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscribers" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."refresh_stats"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."refresh_stats"() TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."articles" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."circuit_corners" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."circuit_corners" TO "authenticated";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."circuit_corners" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."circuits" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."circuits" TO "authenticated";
GRANT ALL ON TABLE "public"."circuits" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."constructor_results" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."constructor_results" TO "authenticated";
GRANT ALL ON TABLE "public"."constructor_results" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."constructor_standings" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."constructor_standings" TO "authenticated";
GRANT ALL ON TABLE "public"."constructor_standings" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."constructors" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."constructors" TO "authenticated";
GRANT ALL ON TABLE "public"."constructors" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."pit_stops" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."pit_stops" TO "authenticated";
GRANT ALL ON TABLE "public"."pit_stops" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."qualifying" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."qualifying" TO "authenticated";
GRANT ALL ON TABLE "public"."qualifying" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."races" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."races" TO "authenticated";
GRANT ALL ON TABLE "public"."races" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."results" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."results" TO "authenticated";
GRANT ALL ON TABLE "public"."results" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."constructor_stats" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."constructor_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."constructor_stats" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."constructor_win_streaks" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."constructor_win_streaks" TO "authenticated";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."constructor_win_streaks" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."digest_issues" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."digest_issues" TO "authenticated";
GRANT ALL ON TABLE "public"."digest_issues" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."digest_items" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."digest_items" TO "authenticated";
GRANT ALL ON TABLE "public"."digest_items" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."driver_standings" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."driver_standings" TO "authenticated";
GRANT ALL ON TABLE "public"."driver_standings" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."drivers" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."drivers" TO "authenticated";
GRANT ALL ON TABLE "public"."drivers" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."driver_stats" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."driver_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."driver_stats" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."driver_win_streaks" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."driver_win_streaks" TO "authenticated";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."driver_win_streaks" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."lap_times" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."lap_times" TO "authenticated";
GRANT ALL ON TABLE "public"."lap_times" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."seasons" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."series" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."series" TO "authenticated";
GRANT ALL ON TABLE "public"."series" TO "service_role";



GRANT ALL ON SEQUENCE "public"."series_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sprint_results" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sprint_results" TO "authenticated";
GRANT ALL ON TABLE "public"."sprint_results" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."status" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."status" TO "authenticated";
GRANT ALL ON TABLE "public"."status" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."subscribers" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."subscribers" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";







