# PaddockIntel — Unified Platform SKILL.md

## What this project is
Single Next.js application unifying four surfaces under paddockintel.com:

- **Hub** — F1 statistics: drivers/constructors/compare/scorecards (existing, live)
- **Blog** — economic-angle editorial articles (replacing the suspended Ghost site)
- **Digest** — curated weekly aggregator of external F1/F1-economics news with original synthesis on top
- **Book** — collectible, chapter-based presentation of published articles + live data, no new content of its own

All four read from one Supabase project. Editorial and digest content are new data sources. The Book is a *view*, not a content source — it never has its own writing, only its own layout.

## Repo
Extending `IsmaelSandoval78/paddockintel-dashboard` — not starting fresh. It already has the stack every surface needs: Next.js 16, TypeScript, Tailwind v4, Supabase client, Vercel deploy, next-intl (EN/ES/PT). Rebuilding that plumbing elsewhere would cost more than it would save.

## Route structure
Route groups keep surfaces visually/architecturally independent while sharing infra:

```
app/
  (hub)/drivers, constructors, compare, scorecards...   [existing]
  (blog)/[slug]                                         [new]
  (digest)/weekly/[issue-slug]                          [new]
  (book)/season/[year]                                  [new]
```

Shared across all groups: Supabase client, next-intl config, root layout, design tokens (see DESIGN.md). Each group gets its own nested layout for surface-specific chrome (article width, digest card list, book pagination).

## Data model additions
New tables in the existing Supabase project:

**`articles`**
- `id`, `slug`, `title`, `meta_description`, `body` (markdown), `published_at`, `locale`
- optional FKs: `race_id`, `driver_id`, `constructor_id`, `season_id` — lets an article reference live stats instead of hardcoded numbers
- `faq_items` (jsonb) — for NewsArticle + FAQPage structured data

**`digest_items`**
- `id`, `issue_id`, `source_name`, `source_url`, `headline`, `our_summary` (1-2 sentences, original wording), `entity_tags` (text[]), `published_at`

**`digest_issues`**
- `id`, `slug`, `published_at`, `intro_synthesis` (the original-analysis paragraph tying the week's items together)

## EEAT signals
Beyond source attribution (already covered in the Sourcing Rule), two things are required, not optional:

- **Author/About page** — `/about` or `/author/ismael-sandoval` with real, verifiable background. Google's E-E-A-T requires the reader (and the algorithm) to be able to identify who's behind the analysis and why they're credible. Every article and digest issue links to it.
- **First-party data is the strongest EEAT asset in this whole project** — the proprietary FastF1-derived metrics (Driver Pace Index, circuit insights) are data that exists nowhere else. That's worth more for authority than any amount of careful sourcing, because other outlets would have to cite *PaddockIntel* to use it. Treat it accordingly: never bury it as "just a Hub feature" — surface it as the thing that makes the site citable.

## Newsletter & distribution
The Digest is one piece of content, two delivery formats — not two separate projects:
- **Web**: the `(digest)` route group page, as already specced
- **Email**: same `digest_items` data, sent via **Resend + React Email** — same Vercel/React ecosystem, React components double as email templates, generous free tier at this volume
- Needs an email capture component (input + button) feeding a subscriber table in Supabase — appears on Blog, Digest, and Hub pages

## Operating principle — low-touch by design
Verst stays active day-to-day; SNDOVL and CAPM are paused for now. PaddockIntel needs to run with minimal daily attention so it doesn't silently stall the way Ghost did — but "low-touch" applies selectively, not everywhere.

**Automated, no manual trigger:**
- FastF1 batch pipeline — scheduled (Vercel Cron / GitHub Actions) after each race weekend, not manually run
- sitemap.xml + RSS feed — generated at build time from Supabase content
- Digest email send — fires automatically when an issue is marked published in Supabase, not exported/sent by hand

**Stays deliberately manual — automating these would break the thing that makes them valuable:**
- Article writing / economic analysis
- Digest item selection + the original synthesis paragraph
This is the same reasoning that ruled out the AI Weekly-style coverage-cluster earlier: full automation of curation and synthesis is exactly how EEAT and trust erode into thin content. A few minutes of human judgment a week is the cost of this staying worth reading.

## Language / i18n for editorial content
Every article ships in EN/ES/PT simultaneously — not staggered, not English-first-then-maybe-translate. English is the source of truth (it's where the existing SEO equity lives — the Wikipedia citation and "jonathan wheatley salary" ranking are both in English), but all three locales are written/reviewed with care, not machine-translated and left unchecked.

This is an accepted extension of the manual-effort exception above: translating editorial analysis well is closer to rewriting than translating, and it triples the per-article cost. That's a deliberate trade the schedule has to account for — `articles.locale` already supports this without any schema change, but each locale is its own row, its own review pass.

Technical requirement: hreflang tags across all three locale versions of each article so Google doesn't treat them as duplicate content — same pattern the Hub already uses, just extended to Blog.

## Content ingestion
Same pattern as VerstTracker's CSV migration: write content locally with frontmatter → a script upserts into Supabase. No heavyweight CMS UI needed.

```
articles/2026-austria-gp-economic-impact.md  →  scripts/ingest-article.ts  →  Supabase
```

## FastF1 / telemetry rule
FastF1 is Python — it never runs inside the Next.js/Vercel runtime. All telemetry computation (track dominance, tire degradation, upgrade ROI, teammate deltas, the proprietary pace index) happens in an offline batch script, run after each race weekend, that writes pre-calculated results into Supabase. Next.js pages only ever read from Supabase — same pattern as Ergast, never a live call to FastF1 from the web app.

## Sourcing Rule (carries over from PaddockIntel editorial standard — applies to digest too)
REGLA ABSOLUTA: nunca inventar datos, URLs, IDs, ni citas. Siempre verificar con búsqueda antes de incluir cualquier información externa.

Digest items use the existing numbered-source format: `1. [Outlet Name — description](url?ref=paddockintel.com)`. One quote maximum per source if quoting at all; default to paraphrase.

## SEO continuity (non-negotiable — this is the recovery point)
The Ghost site had earned real equity: a Wikipedia citation (DA 93), growing GSC impressions, ~position 2.9 for "jonathan wheatley salary." None of that transfers automatically on migration.

**Confirmed (verified against live `paddockintel.com` URLs):** Ghost served every article at the domain root with a trailing slash — e.g. `paddockintel.com/suzuka-2026-japanese-grand-prix-cost-economic-impact/`, no `/blog/` prefix. The planned `(blog)/[slug]` route group already lands at the same root path, so **no redirect map is needed for the 106 historical slugs** — they fall into place automatically once content is migrated under matching slugs.

The one real requirement: set `trailingSlash: true` in `next.config` so every article URL ends in `/` exactly like the old Ghost URLs did. Skipping this creates a slash/no-slash duplicate-content split that costs equity for no reason.

- Every article ships with NewsArticle + BreadcrumbList + FAQPage schema, validated in Google Rich Results Test before publish.
- Title tags ≤ 60 chars, meta descriptions ≤ 145 chars — same standard as before.
- `redirects.json` stays scaffolded for the rare case a slug genuinely needs to change going forward — not for the historical migration itself.

## Workflow
Dual-Claude pattern continues: Claude Chat for planning/decisions, Claude Code for execution. Critique Gate before shipping each surface — score 5 dimensions × 5 points, every section ≥ 4 to proceed.

## Motion, responsive & sharing rules

**Motion** — CSS-native by default (scroll-driven animations, transitions, `prefers-reduced-motion` respected everywhere). GSAP is not a global dependency — only dynamic-import it on the specific page where an effect justifies it (e.g. SplitText on a hero headline), never load it app-wide.

**Responsive — mobile/tablet-first, non-negotiable.** Every new surface gets checked at minimum 375px (phone), 768px (tablet), 1280px (desktop) before it's considered done:
- Bento grid (Hub home, Digest cards) collapses to single column on phone, 2-col on tablet
- Headline sizes use `clamp()` for fluid scaling — Archivo Black at desktop hero size breaks on a 375px screen if it's a fixed `rem` value
- Blog/Book max-width (680-720px) only applies above tablet breakpoint; on phone, content goes full-width with side padding
- Data tables (JetBrains Mono) get horizontal scroll or a stacked/card fallback on phone — never force a 10-column table to shrink-to-fit
- Nav collapses to a menu below tablet breakpoint

**Sharing — every card needs a share action.** Digest item cards and Blog article preview cards both get a share button:
- Mobile/tablet: native Web Share API (`navigator.share`) — opens the OS share sheet directly, zero custom UI needed
- Desktop fallback (no Web Share API support): small custom menu — copy link, X, LinkedIn
- Button style follows DESIGN.md share-button spec — square, zero border-radius, icon-only, consistent position across all card types

## Known tech debt — carry forward, don't block on
These exist in the current hub and don't need fixing before extending, but shouldn't be forgotten:

- Supabase PostgREST max-rows cap truncating Ferrari/McLaren at 1,000 rows
- `middleware.ts` deprecation warning
- Driver page polish (Season by Season align-items, Qualifying Record scroll, George Russell nationality mapping)
- Constructors detail page redesign

## Austria GP scope ladder — target Sun, June 28
All three new surfaces live, scoped to MVP, not full feature set:

1. **Blog** — one article on the Austria GP's economic angle, full schema, live at a real slug.
2. **Digest** — one issue, 6-10 items, real verified sources, one synthesis paragraph. No coverage-cluster mechanism, no "N sources tracking this story" — that infrastructure isn't earned yet at this content volume.
3. **Book** — one chapter view rendering that article in book-style layout (typography only — no PDF export, no full season yet).

Anything beyond this ladder before Austria is scope creep. Defer it.
