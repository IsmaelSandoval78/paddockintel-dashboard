-- The circuit layout each race was run on, so lap-time records compare only like with like.
-- A circuit's name hides layout changes: Silverstone has had 8 layouts, Monaco 6, and the pole
-- record shown on the circuit page (2026-10-27) was Raikkonen's 1:18.233 from 2004, set on the
-- 5.141 km layout of 1997-2009 and not comparable with a lap of today's 5.891 km track.
--
-- Values are F1DB's circuit layout ids (e.g. silverstone-8, 2010 on), filled for every race in the
-- table by scripts/f1db/layouts.py in the same transaction as this migration. A race whose layout
-- is unknown stays null, and pages that need it leave the record out rather than mix layouts.

ALTER TABLE "public"."races" ADD COLUMN IF NOT EXISTS "circuit_layout" text;

COMMENT ON COLUMN "public"."races"."circuit_layout" IS 'Circuit layout the race was run on (F1DB circuit_layout_id, e.g. silverstone-8). Null when unknown.';
