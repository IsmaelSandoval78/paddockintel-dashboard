# PaddockIntel — Unified Rebuild: PHASES.md

## Status snapshot
- Ghost(Pro): invoice paid, reactivation requested — awaiting support response
- Domain: secured on Namecheap through 2028, unaffected by the Ghost suspension
- Target: Austria GP, Sun June 28 — Blog + Digest + Book MVP all live by then

## Build calendar — week of June 22-28
Austrian GP: Fri June 26 – Sun June 28 (race 15:00 CEST / ~9:00 AM ET). Two-block week — build first, publish last. The real Austria article can't exist until the race does, so it's the last thing written, not the first thing attempted.

**Mon 22 – Wed 24 — Foundation**
- [ ] Phase 0 closed out (Ghost status confirmed; slug audit done if content was recovered)
- [ ] Phase 1 complete: route groups, Supabase schema, ingestion script, `redirects.json` scaffolded, billing/uptime monitoring live
- [ ] Phase 2 complete: DESIGN.md locked, bento grid, responsive baked into every component, share buttons, `/about` author page

**Thu 25 – Sat 27 — Build & dry-run, no real Austria content yet**
- [ ] Full Blog template built (auto-TOC, sticky data viz, schema, hreflang) and proven using the existing Barcelona article as the dry run — not throwaway placeholder content, a real second article goes live as a side effect of testing
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
- [ ] Restructure `paddockintel-dashboard` into route groups: `(hub)` `(blog)` `(digest)` `(book)`
- [ ] Create `articles`, `digest_items`, `digest_issues` tables in the existing Supabase project
- [ ] Build ingestion script: markdown + frontmatter → Supabase (`scripts/ingest-article.ts`)
- [ ] Scaffold empty `redirects.json` — confirmed not needed for the 106 historical slugs (root-level structure matches exactly), kept only for future one-off slug changes
- [ ] Set `trailingSlash: true` in `next.config` — Ghost served every URL with a trailing slash, Next.js must match exactly
- [ ] Billing alerts on every paid service (Vercel, Supabase, Resend, Namecheap) routed to an inbox checked daily — not the same blind spot that missed the Ghost notice
- [ ] Uptime monitoring (e.g. UptimeRobot, free tier) on the live domain

## Phase 2 — Identity extension
- [x] DESIGN.md v0.3.0 finalized (body font decision locked — Lora)
- [ ] Bento grid applied to Digest card layout
- [ ] Responsive behavior (375/768/1280) built into each component from the start, not patched on after
- [ ] Share button component built once, reused on Digest + Blog cards
- [ ] `/about` author page — real background, linked from every article and digest issue

## Phase 3 — Blog MVP
- [ ] One article: Austria GP economic angle, written per the existing framework (WHAT HAPPENED / WHY IT HAPPENED / ECONOMIC IMPACT / THE FRAMEWORK / Verdict)
- [ ] EN, ES, and PT versions — all three, not staggered (see Language/i18n rule above)
- [ ] hreflang tags across all three locale versions
- [ ] Slug matches the old Ghost convention exactly (root-level, trailing slash) — confirmed no redirect needed
- [ ] NewsArticle + BreadcrumbList + FAQPage schema, validated in Google Rich Results Test
- [ ] Title ≤ 60 chars / meta description ≤ 145 chars
- [ ] sitemap.xml + RSS feed generated at build time from Supabase content — automatic, not manually maintained
- [ ] Auto-generated TOC from the fixed five-section structure, sticky on desktop with scroll-spy, collapsible drawer on mobile
- [ ] Sticky data visualization (desktop two-column layout) that highlights/updates as the reader scrolls past the paragraph referencing it — CSS `position: sticky` + `IntersectionObserver`, no GSAP
- [ ] Subtle technical-grid background parallax (same texture as the Remotion Blueprint standard), CSS scroll-driven animation, no JS library
- [ ] Newsletter invitation card after the ECONOMIC IMPACT section, and a second after Verdict before the share buttons — inline, never a modal/popup

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
- [ ] One issue, 6-10 verified items, numbered-source format (`1. [Outlet — description](url?ref=paddockintel.com)`)
- [ ] One original synthesis paragraph tying the week's items together
- [ ] No coverage-cluster mechanism yet — that's a later-stage feature once volume justifies it, not part of MVP
- [ ] Email capture component (input + button) → subscriber table in Supabase
- [ ] Basic privacy policy page — required once email capture goes live, international audience (EN/ES/PT)
- [ ] Resend + React Email wired up — sends automatically when an issue is marked published in Supabase, never a manual export/send

## Phase 5 — Book MVP
- [ ] One chapter view rendering the Austria article inside book-style layout
- [ ] Typography only — no PDF export, no full-season assembly yet

## Phase 6 — Circuit Hub (post-Austria, the real expansion of "Hub")
Each circuit gets its own page (`/circuits/[circuit_id]`) combining historical Ergast data with FastF1 telemetry-derived insight — this is what turns Hub from "stats tables" into "circuit intelligence."

**From Ergast (reorganized, not new data):**
- All-time lap record + holder
- Winners list by year, most successful driver/constructor at this track
- Historical pole-to-win conversion rate

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
- Book: full-season assembly + PDF export
- Digest: coverage-cluster mechanism (post-volume feature, not now)
