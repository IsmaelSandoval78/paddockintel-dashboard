-- Adds a `charts` jsonb column to articles, the same pattern already used for
-- `stats`/`faq_items`/`sources`: structured data the article page template
-- knows how to render server-side, instead of prose or embedded markup.
--
-- Why this exists: a Race Report needs a real grid-to-finish chart, not just
-- prose describing positions. Markdown bodies never execute embedded
-- JavaScript (deliberately -- that would be an XSS vector for anything that
-- reaches `body_markdown`), so a chart can only reach the page as data that a
-- real React component draws server-side, the same way `stats` already
-- becomes the sidebar number tiles in app/[locale]/(blog)/[slug]/page.tsx.
--
-- Shape (array, so an article can carry more than one chart; the article
-- page dispatches on `type`):
--   [{ "type": "grid_to_finish", "title": "...", "note": "...",
--      "rows": [{ "code": "ANT", "team": "mercedes", "quali": 16,
--                 "finish": 5, "dnf": false, "highlight": true }, ...] }]
--
-- `team` maps to the existing --team-* CSS custom properties in
-- app/globals.css (mercedes, mclaren, redbull, ferrari, alpine, aston, haas,
-- williams, sauber, rb) -- add a new team color there first if a chart needs
-- one that isn't defined yet, never hardcode a hex in chart data.
--
-- Nullable and additive: existing articles keep rendering exactly as before
-- with no `charts` array. Run once in the Supabase SQL Editor (no linked
-- CLI/DB URL for this project -- same workflow as every other migration
-- here).

alter table public.articles
  add column if not exists charts jsonb;
