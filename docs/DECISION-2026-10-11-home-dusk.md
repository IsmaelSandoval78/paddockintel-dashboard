# Decision 2026-10-11 — Home page "Telemetry at Dusk" (dark, warm) — trial on the home only

**Status:** proposed (home only, preview branch `home-dusk`). Decide on site-wide adoption after review.
Design handoff: `docs/design/home-dusk/` (HANDOFF.md, reference/, data/).

## Context
- PRODUCT.md states that dark mode is not offered and positions PaddockIntel as "the only light-substrate
  F1 property". It also lists "anything that looks like a live timing screen" as an anti-reference.
- The authoritative design system is DESIGN.md **v5.0.0 "Warm Studio"** (warm cream `#EDE7E3`, teal +
  orange accents), decided 2026-09-21. (The handoff copy of this record named Swiss Industrial Print v0.3.0
  as current — that system was superseded twice before this decision; corrected here.)
- This is the **third** dark direction tried for PaddockIntel: the navy "Data Mode" (reverted Aug 23 2026)
  and the dark "Hypermodern" direction built out in PR #27 and closed without merging (Sep 21 2026).
- CLAUDE.md bans gradients and glassmorphism site-wide. This design uses gradients (hero sky, newsletter
  band) and glow, deliberately.
- Ismael finds the current home too flat. PaddockIntel's best-performing videos (YouTube Shorts) use a dark,
  warm "night telemetry" look, and after a structured inspiration review (Oct 11) he explicitly chose to
  revisit a dark look for the home: graphite + sunset warm light + data drawn as terrain.

## Decision
Build the home page in the "Telemetry at Dusk" look as a scoped trial:
- Only the home route changes; all other pages keep DESIGN.md v5.0.0 Warm Studio.
- Scoping mechanism: the home wraps its content in `.theme-dusk`, which redefines the existing CSS tokens
  (`--bg`, `--surface`, `--text-1`, ...). The shared Navbar and Footer pick the dusk tokens up through
  `body:has(.theme-dusk)` on the home only — no second header, no global token change.
- It is warm (sunset over graphite, terracotta inside the gradient), not the reverted navy "Data Mode" and
  not PR #27's glass/blur. No `backdrop-blur`; glass stays banned.
- **Scoped exception to CLAUDE.md:** gradients (hero sky, newsletter band) and glow are allowed inside
  `.theme-dusk` only. Gradient *text* stays banned everywhere. Outside the home, the CLAUDE.md "Do Not"
  list applies unchanged.
- Team colours are reserved for data.
- Every number on the home comes from real data with a stated source: Supabase for standings, races and
  pole-to-win history; `content/race-highlights/<year>-<round>.json` for per-race facts that don't exist in
  Supabase (pole-lap speed trace, laps led, sector deltas), each value carrying its own `source`.

## Data note (found while implementing, 2026-10-11)
The handoff's `data/singapore-2026-ver-pole-speed.json` was labelled as coming from PaddockIntel's own
live-timing recording. That recording contains timing data only — no car telemetry — so it cannot be the
source. The production trace is regenerated from FastF1 car telemetry by
`scripts/highlights/race_highlights.py` (reproducible); its top speed is **308 km/h**, not the 307 shown
in the reference. The original file is kept in `docs/design/home-dusk/data/` as design material only.

## Consequences
- PRODUCT.md's "only light-substrate" positioning and the live-timing anti-reference are now under review;
  update them only if the trial is adopted site-wide.
- Visual continuity between the website and the video channels.
- New per-race highlights data is needed after every race weekend; a race without a highlights file simply
  hides those modules (no stale or placeholder numbers).

## v2 — "Zentra skeleton, dusk skin, pit-wall charts" (2026-10-12)
After the first dusk home, Ismael judged the site still visually flat ("eeeh") next to how the data performs
on social. From three references (Zentra light bento dashboard; an AI-generated dusk-landscape UI kit; an
AI-generated dark "pit wall" dashboard) we took one thing each:
- **Structure from Zentra:** a 12-column bento grid of cards; big number + context + source in every card;
  an insight card; a page header naming the race.
- **Identity from the dusk landscape:** the dusk palette, cards with depth (inner highlight + soft shadow),
  and the hero as a landscape — ours is drawn from the real pole-lap speed trace, with the featured
  article's key number as the sun.
- **Chart language from the pit wall:** large glowing line/area charts; warm (leader/pole) against ice (the
  rival) for two-driver comparisons.
Rejected from the AI references: neumorphic knobs/controls, decorative widgets with fake data, the generic
"black + cyan neon" look.

Validated first as a static prototype with real Singapore 2026 data, approved ("bastante wow"), then built
into the home. **Home only**; the rest of the site migrates one surface at a time (articles next, prototype
first — open question: light reading sheet vs. dark body text).

Data rules carried over unchanged: every card hides when its data is missing; per-race data comes from
`race_highlights.py` (now also `raceTrace`: winner-vs-P2 gap per lap — published only if the flag lap
reproduces the official interval —, top-8 running order, VSC/SC and pit laps); the insight card only shows
key numbers already published in our own race-week articles, each linking to its article.

## Articles (2026-10-12)
Prototyped on the Singapore 2026 race report with a dark-body vs. light-sheet toggle; Ismael chose the
**light reading sheet** ("la clara"). Built into `app/[locale]/(blog)/[slug]/page.tsx` for every article:
- **Dusk shell:** crumbs, cover (kicker, title, dek, byline, share/scorecard; the pole-lap landscape when
  the article is tied to a race), the article's own key numbers as a KPI row, a rail (TOC, race result),
  FAQ and sources as cards, related articles. `dusk.css` moved up to `app/[locale]/(blog)/` and the
  Instrument Sans setup to `dusk-font.ts`, shared by both pages.
- **Light sheet:** `.dusk-sheet` resets the shared tokens to light values, so the existing prose, TOC,
  charts, newsletter and paywall components render light untouched; serif body at 17–19px.
- **Race figures** (dark `.dusk-island`s inside the sheet), placed by a paragraph that is only
  `[[figure:name]]` in `body_markdown`, and only when the article has `race_id` set (frontmatter →
  `articles.race_id`): `pole-dominance[:corner]` (front-row track dominance, `race_highlights.py`
  `qualiDominance`: laps aligned on the official sector times, sections split at straight-line speed
  peaks, official corner numbers), `grid-to-flag` (every car's grid → classification from `results`),
  `race-story` (the home's gap/running-order card). An unknown marker or missing data renders nothing.
- Gating, JSON-LD, metadata and draft mode are unchanged; all new labels live in `articleDusk` (EN/ES/PT).
- **Rollout order matters:** production only understands the markers once this code is deployed, so a
  markdown file with markers is ingested *after* the deploy (otherwise the live page shows the raw
  `[[figure:…]]` line). `race_id` alone is harmless and can be ingested any time.

## Feed (2026-10-12)
Prototyped from the live Feed data (dumped with the site's own functions) and approved. Built into
`app/[locale]/(digest)/feed/`:
- **Index:** header with this week's counts; the lead story (highest significance score of the
  latest day) with its key numbers and the editor's take; "Who the press is covering" (the existing
  most-mentioned counts, Beagle + Feed, last 7 days) as ranked bars; this week's totals; stories per
  day over the last 14 days. Then one block per day of the last 7 days (top three by significance as
  cards, the rest as rows) and an **archive by week** for everything older, folded in `<details>`
  (first week open). Every story is still linked from the page and listed in the ItemList JSON-LD.
- **Significance** keeps its meaning (`significanceScore`) but reads as a signal: number plus a bar
  scaled to the page's top story. Hook & Deliver facts render in ice (`HubContext`), the colour for
  context, so they never compete with a story's own key number.
- **Story page:** dusk cover (source, headline, summary, entities, byline, original report), the
  numbers as a KPI row, the analysis on the light sheet (Hub context, what our data adds, editor's
  take, FAQ, original source), rail with this week's press mentions of the story's entities (only
  for stories inside that 7-day window, never zeros) and the other stories of the same day.
- Metadata, canonical/hreflang (EN/ES) and all JSON-LD unchanged; new labels in `feed` (EN/ES/PT).

## Weekly Digest (2026-10-12)
Prototyped from the live issues and approved. Built into `app/[locale]/(digest)/weekly/`:
- **Index:** latest issue (volume number, synthesis, its stories with their key numbers) next to
  the subscribe card (the page is the newsletter's own landing), the archive in numbers, then older
  issues by month (volume, date, synthesis, story count, first key number) and the Recaps link.
- **Issue page:** dusk cover with the volume number and the synthesis, the issue's key numbers as
  cards that jump to their story, the stories in issue order on the light sheet (each links to our
  Feed page when it has one, and to the original report), rail with the issue's contents,
  subscribe and older/newer issue.
- All interface text moved into `digest` (EN/ES/PT); it was hardcoded English on every locale.
  Story headlines and summaries use their Spanish columns on `/es/`; issue syntheses only exist in
  English. Metadata kept (titles now localized for ES/PT); no JSON-LD existed and none was added.

## Voices and Glossary (2026-10-12)
Prototyped from the live rows (`experts`, `expert_picks`, `glossary_terms`) and approved.
- **Voices** (`app/[locale]/(digest)/whos-who/`): header with picks / voices quoted / voices
  tracked, the five lenses as cards with their pick counts (jump links), the latest pick as the
  lead card, the rest by lens in two columns, and the full roster of active experts by lens
  ("quoted" marks the ones with a pick). Founder decision: picks are shown on every locale in the
  language they were written in, marked with a language tag and `lang` attribute, instead of
  filtering by locale (filtering would leave `/es/` with 2 picks and `/pt/` with none). The
  hardcoded English "SOURCE: SUPABASE" footer was removed. Expert `role` values are Spanish in the
  data and render as stored on every locale (a separate data task, not done here).
- **Glossary index** (`app/[locale]/(blog)/glossary/`): counts, the three depths explained once,
  category jump chips, terms by category as cards with the depths each term actually has. Added
  the missing canonical + en/es/pt hreflang; the DefinedTermSet JSON-LD is unchanged.
- **Term pages:** dusk cover (category, term, short definition, depth switch), body and sources on
  the light sheet, rail with related terms and the rest of the category. Titles with depth suffix,
  canonical and DefinedTerm JSON-LD unchanged. hreflang now lists only the locales where that term
  exists at that depth (pt has 7 of the 27 terms; it used to declare pt for all of them).

## Recaps and tag archives (2026-10-13)
Prototyped from the live rows and approved.
- **Tag archive** (`app/[locale]/(blog)/tag/[slug]/`): counts (articles, first and latest date), the
  newest article as the lead card with its key number, "often tagged with" (co-tag counts, the
  internal `featured` flag excluded), then articles by month as cards with their first stat, 20 per
  page. A tag with no published article in a locale is `noindex, follow` and is left out of
  `app/sitemap.ts` (`breaking-news`, `deep-dive` and `data-desk` today); the sitemap now reads
  `article_tags` in pages, since the table is past PostgREST's 1,000-row default.
- **Recaps** (`app/[locale]/(digest)/recaps/`): index with counts, a "how to read a recap" note and
  recap cards; recap pages on the Weekly layout (cover, light sheet, rail). What a recap covers is
  now the date span of its own stories, not the week in its slug -- recap 01's slug says "week of
  July 27" but its stories run February 19 to July 16. Draft recaps now return 404 instead of
  rendering. All interface text moved to `recaps` (EN/ES/PT); recap content is English-only and is
  marked `lang="en"` on `/es/` and `/pt/`.
- Data fix (founder-approved): recap 02's third story carried the source roundup's headline
  ("Hamilton's team hits $9bn valuation") over a summary about the F1-Disney extension; the headline
  now matches the summary, checked against the GPFans source.

## About (2026-10-13)
Prototyped and approved. `app/[locale]/about/` on the dusk shell: cover, "PaddockIntel in numbers"
(live counts: articles, cited sources, Feed stories, Weekly issues, races and results in the
database, glossary terms), the bio and career table on the light sheet, "why this perspective
matters" as three figures read live from our own published articles in the reader's locale, four
working principles (including visible corrections), what you can read, subscribe, coverage areas,
disclaimer. `/author/[slug]` keeps redirecting here.
- Removed three unsourced figures from the old copy ("$20 billion ecosystem", a "$90 million" sponsor
  deal, Red Bull's "$500 million" engine investment) and the stale "coming soon" products (race
  reports and paywalled analysis already exist).
- Founder-confirmed career facts: "Onboarding & Estimating Coordinator" at Verst Logistics, Jabil
  "Fortune 500" (the old meta said "Fortune 100"); the `authors.bio` row was aligned to the title.
- All copy moved to `about` (EN/ES/PT); English reads the bio from `authors`, ES/PT use translated
  paragraphs. Added canonical + en/es/pt hreflang and AboutPage/Person JSON-LD (name, url, job,
  employer, no invented photo or social profiles).
