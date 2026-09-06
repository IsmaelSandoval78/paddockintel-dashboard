# PaddockIntel — SEO Expert (.md advisor)

Read this before publishing any article, digest issue, or Hub page. This advisor exists to
catch SEO failures before they ship — not to write copy. If a draft fails any check below,
it goes back for revision, it does not publish with a caveat.

---

## Non-negotiables (fail = do not publish)

- [ ] Title ≤ 60 characters
- [ ] `meta_description` ≤ 145 characters, contains the primary keyword naturally (not stuffed)
- [ ] Slug matches the actual query someone would type — no filler words, no internal jargon
- [ ] Canonical URL set, self-referencing unless explicitly a syndicated/duplicate piece
- [ ] H1 exists once, matches (but isn't identical to) the title
- [ ] At least one FAQ question matches a real "People Also Ask" pattern — verify with search,
      don't guess the phrasing
- [ ] Schema present and valid: NewsArticle/Article + BreadcrumbList + FAQPage (validate in
      Google Rich Results Test before `status: published`)
- [ ] `hreflang` present across all three locale versions (EN/ES/PT), same
      `translation_group_id`
- [ ] Internal links: minimum 2 to existing PaddockIntel content (driver/constructor/circuit
      page, related article) — never zero internal links on a new article
- [ ] Image alt text present and descriptive, not keyword-stuffed

## Keyword strategy

- **Primary keyword** identified before writing starts, stated in the article brief — not
  reverse-engineered after the draft is done
- **Search intent match** — is the query informational ("why did X happen"), navigational
  ("Red Bull 2026 standings"), or comparative ("Verstappen vs Hamilton stats")? The article
  structure must match the intent, not fight it
- Prefer **question-shaped queries** the reader would actually Google — this is where the
  economic/data angle wins: nobody else answers "what does Russell's Austria win mean for
  Mercedes' cost cap" as a direct, structured answer
- Avoid keyword cannibalization — before publishing, check whether an existing PaddockIntel
  page already targets the same primary keyword. If yes, either differentiate the angle
  sharply or fold into the existing page instead of competing with yourself

## Competitive positioning (update as the landscape shifts)

Known competitors and their SEO posture, for gap-finding:
- **RACER.com** — DA 75, backlink authority target, not a content-angle competitor
- **The Paddock Magazine** — DA 42, closest positioning competitor (business+lifestyle F1)
- **Feedspot F1 Magazines directory** — inclusion target for backlink + distribution

Before publishing a new content vertical (e.g. a stats/data-heavy piece), search for whether
this specific angle already exists at scale. The rule is not "is there F1 content on this
topic" — it's "is there F1 content that answers it with real data and cites its source." If
nobody else does that, say so explicitly in the brief — that gap is the SEO opportunity.

## Technical SEO (site-wide, check periodically, not per-article)

- [ ] `sitemap.xml` includes every published article/issue/driver/constructor/circuit page,
      regenerated at build time from Supabase — never stale
- [ ] RSS feed valid and discoverable
- [ ] Core Web Vitals: LCP, INP, CLS within "Good" thresholds — especially watch this during
      any redesign that adds motion/WebGL back in; heavy kinetic scroll effects are a known
      risk to LCP/INP if not lazy-loaded correctly
- [ ] No orphan pages — every page reachable via internal links within 3 clicks of the homepage
- [ ] 404s and broken internal links checked after any slug/route restructuring (this matters
      a lot during the Cloudflare migration — redirect map must preserve every historical
      Ghost slug, no exceptions)

## Cloudflare migration — SEO-specific risks to verify before cutover

- [ ] All existing URLs resolve identically post-migration (same paths, same trailing slash
      behavior — `trailingSlash: true` must survive the platform change)
- [ ] 301 redirects (not 302) for anything that does change
- [ ] `robots.txt` and `sitemap.xml` accessible at the same paths post-migration
- [ ] SSL/TLS cutover has zero downtime window where the domain resolves to neither host
- [ ] Submit updated sitemap to Google Search Console immediately post-cutover, monitor
      Coverage report for a spike in errors over the following 2 weeks

## When this advisor should block publication

If any non-negotiable is unchecked, or if the primary keyword targets a query PaddockIntel
already ranks for with a different page, hold the piece. Flag it explicitly:
`[SEO-HOLD: reason]` in the draft — do not publish around it.
