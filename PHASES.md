# PaddockIntel — Unified Rebuild: PHASES.md

## Status snapshot (corrected 2026-07-05 — see note below)
- Ghost(Pro): invoice paid, reactivation requested — awaiting support response
- Domain: secured on Namecheap through 2028, unaffected by the Ghost suspension
- **Correction to an earlier version of this doc (same day):** an earlier pass through this file claimed Phase 3/4/5 (Blog/Digest/Book) were "completely untouched, zero progress" after an unplanned pivot to Hub polish. That was wrong — based on an incomplete check (`git log` only 20 commits back, `articles/` folder never inspected). Verified directly against Supabase + the live production domain just now:
  - **Blog is live**: two real published articles (`austria-gp-2026-russell-win-economic-impact`, `canada-gp-2026-economic-impact`) — sourced economic analysis, both return HTTP 200 on `hub.paddockintel.com`, both correctly in `sitemap.xml`/`feed.xml`.
  - **Digest is live**: Vol. 01 ("Austria Week 2026"), published, 8 sourced items + synthesis, `/weekly/vol-01-austria-week-2026/` returns HTTP 200.
  - **Book still appears incomplete**: `/season/2026/` returns HTTP 404 on production. Only a single 63-line route file exists (`(book)/season/[year]/page.tsx`) — not verified further this session, needs a real look before assuming status.
  - Hub visual polish (map, circuit/driver/compare pages) also genuinely happened in parallel — not a full pivot away from Blog/Digest, both tracks moved.
- **Bug found and fixed 2026-07-05**: `subscribers` table denied ALL access (SELECT/INSERT/DELETE) even to the `service_role` key, despite `supabase/migrations/20260626000001_subscribers.sql` granting full privileges — that migration was never actually run against the live database (same failure mode already hit once before with `digest_issues`/`digest_items`, see Phase 2 below). Grants applied via `scripts/grant_subscribers.sql` in the Supabase SQL Editor; verified end-to-end against the live `/api/subscribe` endpoint (`201 {"message":"subscribed"}`), test row cleaned up. Newsletter signup is live and working again.
- Data pipeline: British GP (round 9, 2026-07-05) loaded into Supabase; `refresh_stats()` RPC added so the loader no longer needs a manual SQL Editor step (`scripts/refresh_stats_rpc.sql`)
- Blog template also gained: BreadcrumbList JSON-LD (was missing, Phase 3 explicitly wants it) and a Next.js Draft Mode preview path (`/api/draft`) so unpublished articles can be previewed without going live — added this session, see Phase 3 below.

## Build calendar — week of June 22-28
Austrian GP: Fri June 26 – Sun June 28 (race 15:00 CEST / ~9:00 AM ET). Two-block week — build first, publish last. The real Austria article can't exist until the race does, so it's the last thing written, not the first thing attempted.

**Mon 22 – Wed 24 — Foundation**
- [ ] Phase 0 closed out (Ghost status confirmed; slug audit done if content was recovered)
- [ ] Phase 1 complete: route groups, Supabase schema, ingestion script, `redirects.json` scaffolded, billing/uptime monitoring live
- [ ] Phase 2 complete: DESIGN.md locked, bento grid, responsive baked into every component, share buttons, `/about` author page

**Thu 25 – Sat 27 — Build & dry-run, no real Austria content yet**
- [x] Full Blog template built (auto-TOC, sticky stat sidebar, NewsArticle+FAQPage schema, hreflang) — format: Market Report with stat callout boxes, TOC, FAQ, sources
- [ ] Digest plumbing + email capture + Resend wired up and test-sent
- [ ] Book MVP chapter view built

**Sun 28 — Race day, publish**
- [ ] Race ends ~11:00 AM ET
- [ ] Austria article written (EN), translated (ES/PT), ingested, published
- [ ] That week's Digest issue assembled (Austria angle included) and sent

## Pending decisions — resolve before Phase 2 locks
- [x] Body/prose font: **Lora** (neo-serif editorial), resolved 2026-06-22 — Blog/Book body text only; Digest `our_summary` stays Inter (short-form)

## Phase 0 — Recovery (in progress)
- [x] Diagnosed Ghost(Pro) suspension cause (failed payment, missed notifications)
- [x] Replied to support — invoice paid, reactivation requested
- [x] Reactivation confirmed — account is live again (export succeeded)
- [x] Full content exported: 106 published posts + 2 drafts recovered, zero content loss. Manifest with slug/title/date/image/tags saved as `ghost-content-manifest.csv`
- [x] Critical SEO pieces confirmed intact: `bearman-50g-crash-suzuka-2026-f1-safety` (Wikipedia citation) and `wheatley-aston-martin-audi-team-principal-2026` (the salary ranking)
- [ ] Download feature images for at least the two critical articles while the site is live, before touching anything else

## Phase 1 — Repo & schema foundation
- [x] Restructure `paddockintel-dashboard` into route groups: `(hub)` `(blog)` `(digest)` `(book)` — `(digest)/weekly/[issue-slug]` and `(book)/season/[year]` scaffolded 2026-06-22; `(book)` reads from `articles` (no own table, per SKILL.md), `(digest)` pages will 404 until `digest_items`/`digest_issues` exist (next item)
- [x] Create `articles`, `digest_items`, `digest_issues` tables in the existing Supabase project — `articles` confirmed live (used by `(blog)`); `digest_items`/`digest_issues` recreated 2026-06-23 (`supabase/migrations/20260623000000_recreate_digest_tables.sql`) to match the columns `(digest)/weekly/[issue-slug]/page.tsx` actually queries — an earlier pass had created them with mismatched columns (`issue_number`/`synthesis`/`outlet` instead of `slug`/`intro_synthesis`/`source_name`), caught with 0 rows so no data was lost
- [x] Build ingestion script: markdown + frontmatter → Supabase (`scripts/ingest-article.ts`)
- [x] Scaffold empty `redirects.json` — confirmed not needed for the 106 historical slugs (root-level structure matches exactly), kept only for future one-off slug changes
- [x] Set `trailingSlash: true` in `next.config` — Ghost served every URL with a trailing slash, Next.js must match exactly
- [ ] Billing alerts on every paid service (Vercel, Supabase, Resend, Namecheap) routed to an inbox checked daily — not the same blind spot that missed the Ghost notice — **manual, needs Ismael in each dashboard** (no CLI/API key for any of these four in the repo); checklist handed off 2026-06-23
- [ ] Uptime monitoring (e.g. UptimeRobot, free tier) on the live domain — **manual, needs Ismael** (new account signup); checklist handed off 2026-06-23

## Phase 2 — Identity extension
- [x] DESIGN.md v0.3.0 finalized (body font decision locked — Lora)
- [x] Bento grid applied to Digest card layout — `(digest)/weekly/[issue-slug]/page.tsx` items now render as a card grid (1 col mobile, 2 col tablet, 3 col desktop), hard 1px borders, no shadow/radius; visually verified 2026-06-24 at tablet (768px, 2 cols) and desktop (1280px, 3 cols) with seeded test data, then cleaned up. Found and fixed a real bug in the process: `digest_issues`/`digest_items` were missing `GRANT`s to `service_role`/`anon`/`authenticated` (migration `20260623000000` created the tables but never granted privileges — every query was failing with "permission denied"); fixed via `supabase/migrations/20260624000000_grant_digest_tables.sql`. Also fixed the grid's gap/background trick (`gap-px bg-border-subtle`) leaving a solid gray block over empty cells whenever item count isn't a multiple of the column count — switched to border-per-cell (`border-t border-l` on container, `border-r border-b` on each `<li>`). Mobile (375px) not re-verified visually — same `grid-cols-1` single-column class, and the empty-cell bug doesn't apply with one column
- [x] Responsive behavior (375/768/1280) audited across the whole site 2026-06-25 — Hub home, Drivers (list+detail), Constructors (list+detail), Circuits (list+panel+detail), Compare, Blog, Book, About all confirmed overflow-free at 768px and 1280px. True 375px couldn't be screenshotted (the browser session used for verification floors at ~768px, one page got to 500px with no overflow); Tailwind's unprefixed (mobile-first) classes were code-reviewed as the fallback check. Found and fixed two real bugs:
  - Navbar/MobileNav switched at the `md` (768px) breakpoint, but the desktop nav's content (brand + 5 links + Vol/Rd text + locale switcher) doesn't fit in 768px — caused a 62px horizontal page overflow exactly at iPad-portrait width. Moved both to `lg` (1024px) in `components/nav/Navbar.tsx` and `components/nav/MobileNav.tsx`.
  - `articles` table was missing the `race_id` column that `(book)/season/[year]/page.tsx` queries (per SKILL.md's data model, `articles` should carry optional `race_id`/`driver_id`/`constructor_id`/`season_id` FKs) — every Book page request silently failed with "permission denied"-style column-not-found and fell through to `notFound()`, so the Book could never render a chapter. Added `race_id` via `supabase/migrations/20260625000000_add_articles_race_id.sql` (the other three FKs aren't queried by any code yet, so left for whenever they're actually needed).
- [x] Share button component built once, reused on Digest + Blog cards
- [x] `/about` author page — real background, linked from every article and digest issue

## Phase 3 — Blog MVP
**Corrected 2026-07-05** — this was NOT paused; it shipped. Two real articles are live in production (verified via HTTP 200 + Supabase, see Status snapshot).
- [x] Article(s) live: Austria GP (Russell win, economic angle) AND a bonus Canadian GP economics piece — both `status: published`, both real sourced content, neither is placeholder
- [ ] EN, ES, and PT versions — only EN exists for both articles so far; ES/PT genuinely not started
- [ ] hreflang tags across all three locale versions — code supports this (`generateMetadata`'s `alternates`) but is a no-op until ES/PT rows exist
- [x] Slug matches the old Ghost convention (root-level, trailing slash) — no redirect issues reported
- [x] NewsArticle + FAQPage schema — confirmed in `page.tsx`. **BreadcrumbList added 2026-07-05** (this session) — was the one real gap, now closed (2-level Home→Article; upgrade to 3-level once a Blog index page exists)
- [ ] Title ≤ 60 / meta ≤ 145 chars — not audited this session, verify per-article before next publish
- [x] sitemap.xml + RSS feed — confirmed live, both articles present in `/sitemap.xml` and `/feed.xml`
- [x] Auto-generated TOC — `ArticleTOC` confirmed working (desktop sticky scroll-spy, mobile collapsible)
- [ ] Sticky scrollytelling chart (highlights as reader scrolls past the referencing paragraph) — not built; a static stat-callout sidebar exists instead, not the same thing
- [ ] Scroll-driven background parallax — a static technical grid (`article-bg-grid` CSS class) exists; not scroll-driven, doesn't fully meet the spec
- [x] Newsletter card exists on the article page, wired to `/api/subscribe` + `subscribers` table — grants bug fixed 2026-07-05, verified working end-to-end in production. Only one card position (after body), not the two originally specced (after Economic Impact + after Verdict)
- [x] Draft Mode preview path added 2026-07-05 (`/api/draft?secret=...`) — lets a new article be previewed before flipping `status` to `published`, so testing a new piece no longer means publishing it live first

**If the week runs short, cut from the bottom of this list up — never from the top:**
1. Article live in English, correct schema — non-negotiable floor
2. Billing/uptime monitoring — cheap, prevents repeating the Ghost incident
3. ES + PT translations
4. Auto-TOC
5. Newsletter cards + email capture
6. Digest (curation can't be rushed — protect real time for it, don't leave it to leftover hours)
7. Sticky scrollytelling chart — highest technical risk, most likely to slip
8. Book MVP — already last in the original ladder, stays last

## Phase 4 — Digest MVP
**Corrected 2026-07-05** — also NOT paused; also shipped. Vol. 01 ("Austria Week 2026") is live at `/weekly/vol-01-austria-week-2026/` (HTTP 200 confirmed).
- [x] One issue, 8 verified items, sourced format (`source_name`/`source_url`/`headline`/`our_summary` per item) — within the 6-10 range
- [x] One original synthesis paragraph tying the week's items together — present (`intro_synthesis`), real content about F1's 2026 commercial restructuring
- [x] No coverage-cluster mechanism — correctly not built, not needed for MVP
- [x] Email capture — component exists, `subscribers` grants bug fixed 2026-07-05, verified working end-to-end in production
- [ ] Basic privacy policy page — not verified this session
- [x] Resend + Vercel Cron auto-send — verified end-to-end 2026-07-05. It had NEVER worked: `digest_issues.sent_at` was missing in the live DB (same partial migration as the subscribers grants), so the cron silently no-oped and Vol. 01 was never emailed. Fixed via `scripts/add_digest_sent_at.sql` (column added, Vol. 01 backfilled as sent so the stale issue doesn't go out); `RESEND_API_KEY` + `CRON_SECRET` were also missing in Vercel (route 500'd), now set + redeployed. Authenticated cron call returns `200 {"message":"no issues to send"}` — next published issue (Vol. 02) will send automatically at 09:00 UTC. Resend domain verified (DKIM/SPF/MX confirmed in DNS); pending nicety: Namecheap email forwarding for `info@` so subscriber replies don't bounce

## Phase 5 — Book MVP
**Still genuinely incomplete** — this one wasn't a false alarm. `/season/2026/` returns HTTP 404 in production. Only a single 63-line route file exists (`(book)/season/[year]/page.tsx`), not investigated further this session.
- [ ] One chapter view rendering an article inside book-style layout — needs a real look, not just a file-existence check
- [ ] Typography only — no PDF export, no full-season assembly yet

## Hub Polish (2026-06-28 → 2026-07-05)
Not part of the original phase ladder. **Correction:** an earlier version of this section claimed this was a full pivot that left Phase 3-5 untouched — that was wrong (see corrected Phase 3/4 above, both actually shipped in this window too). What's true: this visual "wow pass" across the existing Hub/dashboard happened *in addition to*, not instead of, the Blog/Digest work. Kept here so the phase ladder stays complete about everything that happened, not just Blog/Digest.

- [x] Map: replaced 3D globe with flat SVG map (d3-geo Natural Earth), region filter zooms via per-region d3 projection, fixed globe FrontSide culling ghosting (pre-replacement bug, moot now)
- [x] Circuit detail page rebuilt: full-bleed hero (sector-colored track, era wall), Circuit Intelligence Grid (10-section analysis, renumbered from an earlier 01/03/05 layout), Champions Timeline, H2H panel, `LapRecordArc`, corner markers (SVG `path_percent` positioning + hover intel), track SVG restyled (flag-gradient stroke, 8px)
- [x] Driver detail page wow pass: kinetic hero, gold championships treatment, win history collapse
- [x] Drivers index wow pass: title fight chart, form guide, quali H2H, champions wall
- [x] Compare page wow pass: lights-out tale of the tape, real H2H, verdict board, career arc
- [x] Data pipeline: `refresh_stats()` RPC added (`scripts/refresh_stats_rpc.sql`) so post-race loads no longer need a manual Supabase SQL Editor step

**Not done / still open from this pass:**
- Driver page polish backlog items (Season by Season align-items, Qualifying Record scroll, Russell nationality mapping) — still listed in Backlog below, untouched
- Constructors detail page redesign — still listed in Backlog below, untouched
- Circuits **list** page — only the detail page and map panel got the wow pass; the list view itself wasn't touched

## Phase 6 — Circuit Hub (post-Austria, the real expansion of "Hub")
Each circuit gets its own page (`/circuits/[circuit_id]`) combining historical Ergast data with FastF1 telemetry-derived insight — this is what turns Hub from "stats tables" into "circuit intelligence."

**From Ergast (reorganized, not new data):**
- [x] All-time lap record + holder — `LapRecordArc` + `CircuitIntelGrid`, built during the Hub Polish pass (`components/circuits/kinetic/`)
- [x] Winners list by year, most successful driver/constructor at this track — `CircuitTimeline` (Champions Timeline) + `CircuitHero`
- [x] Historical pole-to-win conversion rate — in `CircuitIntelGrid` / hub home `SeasonShapeSection`

**From FastF1 (new — telemetry-derived, pre-computed offline):**
- Track dominance map for the most recent race weekend (uses the Blueprint motion standard, can be a static SVG render or a Remotion piece)
- "Race gift" quantifier — value of VSC/SC pit windfalls at this circuit, historically
- Upgrade ROI — sector-time trend specific to this track's characteristics (high-speed vs. low-speed corner profile)
- Tire degradation curve specific to this track's surface/temperature profile
- Teammate sector-by-sector delta from the most recent weekend
- This circuit's component of the proprietary season-long Driver Pace/Consistency Index

**Critical architecture rule:** FastF1 is Python — it cannot run inside the Next.js/Vercel runtime. All FastF1 computation happens in an offline batch script, scheduled via Vercel Cron or GitHub Actions to run automatically after each race weekend (not manually triggered), which writes pre-calculated, summarized results into new Supabase tables. The Next.js circuit page only ever reads from Supabase — same pattern already used for Ergast data, never a live FastF1 call from the web app.

## Backlog — not blocking Austria, don't lose track of these
- **Full historical migration: 106 articles** (Jan 3 – May 14, 2026) from `ghost-content-manifest.csv` into the new `articles` table — real scope, not a side note. No redirect mapping needed (slugs land at the same root path), but content/schema still has to be migrated article by article. Doesn't block Austria, but shouldn't drift indefinitely either
- Supabase PostgREST max-rows cap (Ferrari/McLaren truncated at 1,000 rows)
- `middleware.ts` deprecation warning
- Driver page polish (Season by Season align-items, Qualifying Record scroll, Russell nationality mapping)
- Constructors detail page redesign
- GSAP — only adopt on a specific page once a specific effect justifies it; never a global dependency
- Motion.so Pro/Max for branded video — shelved after the Barcelona test (felt flat, no licensed F1 footage); revisit only if that footage/licensing problem gets solved
- **Hyperframes** (hyperframes.heygen.com) evaluated 2026-06-23 as a possible alternative to the Remotion "Blueprint" standard for Phase 6 FastF1 motion pieces — HTML→video via headless Chrome/FFmpeg, native GSAP support (matches Hub's existing motion stack better than Remotion's React components), deterministic rendering, CLI-first/agent-friendly, Lambda/Cloud Run render adapters for batch automation. Not adopted — Remotion stays the locked standard; revisit only when Phase 6 actually starts, not before
- Book: full-season assembly + PDF export
- Digest: coverage-cluster mechanism (post-volume feature, not now)
