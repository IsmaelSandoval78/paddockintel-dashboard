# PaddockIntel — Google News Expert (.md advisor)

Read this before publishing any article or Feed item, and before merging anything that touches an
article/Feed template, `lib/seo.ts`, `app/sitemap-news.xml/`, the favicon/PWA icons, the about page,
bylines, timestamps or the corrections log. The goal (set 2026-11-09): be ranked in Google News,
Top Stories and Discover for F1 news, as a publication with its own data, not as an aggregator.

There is no application to fill in. Google's Publisher Center stopped accepting new publications;
Google News now builds publication pages on its own, from sites that meet its content policies and
send clean technical signals. The publication name comes from our site name (WebSite schema), the
icon from our favicon. So everything below is about making Google's automatic reading of the site
unambiguous, and about earning the "authoritative and original" judgement one story at a time.

This advisor overlaps SEO-EXPERT.md (schema, titles) and EEAT-EXPERT.md (authorship, sourcing). It
does not replace them; it adds the news-specific layer: identity, freshness, transparency and the
news surfaces themselves.

---

## Non-negotiables (fail = do not ship)

**Identity — one publication, read the same way everywhere**
- [ ] The homepage keeps its `WebSite` + `NewsMediaOrganization` JSON-LD (`siteJsonLd()` in
      `lib/seo.ts`), `name` exactly "PaddockIntel", and `og:site_name` "PaddockIntel" in the locale
      layout. Never a second spelling ("Paddock Intel", "PaddockIntel Magazine") anywhere a crawler
      reads a name: titles, schema, manifest, news sitemap `<news:name>`.
- [ ] Every `NewsArticle` names the same `publisher` (`ORGANIZATION_ID`, `PUBLISHER_LOGO`) — never
      an ad-hoc publisher object written inline in a template.
- [ ] The favicon set stays square and in multiples of 48px (`app/favicon.ico` 32+48,
      `/api/pwa-icon/?size=48|96|192|512`). It is the icon Google shows next to our name.

**Every story page**
- [ ] `NewsArticle` JSON-LD with `headline` (the same text as the visible H1), `datePublished`,
      `dateModified`, `author` (a Person with a profile URL; today the editor, linking to `/about/`),
      `publisher`, and an `image` of at least 1200px wide. Validate in the Rich Results Test on the
      preview before merging a template change.
- [ ] A visible byline and a visible publish date and time (with time zone) on the page itself,
      matching the schema. Schema without the visible equivalent does not count for transparency.
- [ ] Canonical, hreflang and JSON-LD URLs built from `SITE_URL` (CLAUDE.md "SEO & Indexing
      Rules"); EN/ES/PT for articles that have a PT edition, EN/ES only for the Feed.
- [ ] The story leads with something that is ours: a number from our own database, a comparison
      nobody else ran, or our reading of what a quote means. A Feed item that only restates the
      source with a link is aggregation, and Google News demotes aggregation. Every Feed item
      carries `editor_note` (our data) and `editor_take` (our view), not just `our_summary`.
- [ ] The source is named and linked in the first paragraph; quotes are attributed to the outlet
      that got them. Never present another outlet's interview as our reporting.

**Freshness — real, never manufactured**
- [ ] `datePublished` is the real moment the story went live. Never a future time (it drops out
      of the news sitemap) and never re-set to look new.
- [ ] `dateModified` changes only with a substantive change — new facts, a correction, a result
      update — and when it changes because of an error, the change is logged in `corrections`
      (EDITORIAL.md, "Corrections are visible, never silent"). Re-saving a story to bump its date
      is the one freshness trick Google explicitly calls out; we never do it.
- [ ] Race-weekend stories go out while the topic is live. A race report published the next day
      competes with dozens already in Top Stories; the Beagle workflow exists to close that gap.

**News sitemap**
- [ ] `/sitemap-news.xml` lists only stories published in the last two days, every locale they
      exist in, with `<news:publication>` name "PaddockIntel" and the right `<news:language>`.
      After every publish, confirm the new URLs appear there (part of the Feed workflow's live
      check).
- [ ] It stays referenced in `robots.txt` on the magazine host only, and answers 404 on the Hub
      host.

**Transparency pages**
- [ ] `/about/` names who runs PaddockIntel, how stories are sourced and verified, and how to
      contact the newsroom (`CONTACT_EMAIL`, also in the organization schema). Author URLs resolve
      (today `/author/*` 308s to `/about/`, which is fine while the newsroom is one person).
- [ ] The corrections policy and the methodology are reachable from `/about/` (see "Open gaps").

## Open gaps (as of 2026-11-09)

- `/about/` does not yet link to `/methodology/` or state the corrections policy in public, even
  though corrections are logged on each story. Close it with a short "How we correct" block on
  `/about/` (EN/ES/PT, through the message files) linking to the methodology page.

## Per-publish checklist

- [ ] Title ≤60 characters, specific and factual (FAN-PSYCHOLOGY-EXPERT.md governs the hook); the
      `<title>`, H1, `headline` in schema and `<news:title>` all say the same thing.
- [ ] Live check on production: 200 on every locale, one `NewsArticle` block, hreflang present,
      URL in `/sitemap-news.xml`.
- [ ] The "Add PaddockIntel as a preferred source" link is on the page (`PreferredSourceLink`).
      Readers who pick us there see our stories more often in Top Stories; it is the one news
      signal we can ask readers for directly. Asking is fine; incentivising it (prizes, gated
      content) is not.

## Measuring it

- Search Console → Performance → "Google News" (traffic from news.google.com and the News app) and
  Performance → Search results with search type "News" (the News tab). Discover has its own
  report. Look weekly, after the Monday Feed, and compare race weeks with the weeks between races.
- Whether Google has created our publication page: search the publication name in news.google.com.
  Its absence is not something to fix with a form; it is fixed by the list above, held for weeks.
- Core Web Vitals (PERFORMANCE-EXPERT.md) count here too: Top Stories is a mobile surface.

## Never

- Buying, swapping or soliciting links or placements to look more authoritative (also
  DIGITAL-PR-EXPERT.md).
- Publishing at scale with little added value: rewritten wire copy, AI-spun versions of other
  outlets' stories, near-duplicate pages for the same news. Google treats scaled low-value content
  as spam, and one bad pattern can sink the whole site's news eligibility.
- Clickbait that the story doesn't pay off, or a headline that changes meaning after indexing.
- Hiding a correction, or editing a number without logging it.

## When this advisor should block shipping

A story page without a visible byline or date, schema that disagrees with the visible page, a
`datePublished` that is not the real publish time, a silent correction, a Feed item with no data
or view of our own, a second spelling of the publication name, or a template change that drops
the news sitemap entry — hold it: `[NEWS-HOLD: reason]`.
