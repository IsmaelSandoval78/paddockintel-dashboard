-- (book)/season/[year]/page.tsx queries `articles.race_id` to group chapters by
-- season, but the articles table was created without that column (per SKILL.md
-- it should have optional race_id/driver_id/constructor_id/season_id FKs) — every
-- Book page request was failing with "Could not find the 'race_id' column",
-- which the code silently treated as zero chapters (notFound()).
-- Only adding race_id here since it's the only one actually queried today.

alter table articles add column race_id bigint references races(id);
