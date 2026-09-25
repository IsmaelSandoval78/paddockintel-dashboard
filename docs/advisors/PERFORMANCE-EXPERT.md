# PaddockIntel — Performance Expert (.md advisor)

Read this before merging anything that touches a page template, adds a dependency, adds a
new visual/motion effect, or changes how data loads on a public route. Core Web Vitals are
not a Lighthouse vanity score here — they are a ranking signal (Google uses them directly)
and a retention signal (a reader who waits three seconds for a chart to paint is a reader who
bounces before reaching the Economic Impact section). A site that wins the content battle and
loses it on load time still loses.

---

## Non-negotiables (fail = do not ship)

- [ ] LCP, INP, CLS within "Good" thresholds on the changed route, measured with throttling
      (Slow 4G / mid-tier mobile CPU), never just on localhost fiber
- [ ] Every image uses `next/image` (or the Cloudflare-image equivalent post-migration) with
      explicit `width`/`height` — no layout shift from an image popping into a reserved space
      late
- [ ] No new heavy dependency added without checking its bundle-size impact first
      (`next build` output or bundle analyzer) — a nice-to-have npm package is not worth a
      100kb+ hit to every page that imports it
- [ ] Any motion/WebGL/kinetic-scroll effect (see `components/*/kinetic`) is lazy-loaded and
      never blocks first paint — respects `prefers-reduced-motion`, and has a static fallback
      that isn't visually broken
- [ ] Content that matters for EEAT/SEO (article body, schema, stat callouts) renders
      server-side — never gated behind a client-only fetch that a crawler or a slow connection
      might not wait for (same principle EEAT-EXPERT.md flags for the Cloudflare migration)
- [ ] Custom fonts use `font-display: swap` and are subset to the character set actually used
      — no invisible-text flash, no shipping a full Cyrillic+Greek+Latin font for an
      English/Spanish/Portuguese site

## Per-deploy checklist

- [ ] PageSpeed Insights / Lighthouse run against the actual deployed preview URL for the
      changed route, not assumed from "it felt fast in dev"
- [ ] Third-party scripts (analytics, ads, embeds) audited for Total Blocking Time — anything
      added must justify its cost against the CWV budget, not just get dropped in
- [ ] Chart/dataviz components (Delta Ribbon, scorecards, kinetic tables) checked for paint
      cost on the article types that use them most, not just the smallest test case

## Cloudflare migration — performance-specific risks to verify before cutover

- [ ] Edge caching rules are correct for article/Hub pages — stale-while-revalidate behavior
      confirmed, and cache is actually invalidated when an article is republished/corrected
      (a fast page serving a stale correction is worse than a slow page serving the truth)
- [ ] Image resizing/optimization service parity confirmed post-migration — don't silently
      lose `next/image`'s optimization if the platform change swaps out the image pipeline
- [ ] Edge runtime cold-start behavior checked on low-traffic routes (older articles, less
      common locales) — CWV budgets apply to every page Google might crawl, not just the
      homepage

## When this advisor should block shipping

Any LCP/INP/CLS regression on a changed route, an unoptimized image shipped without
`next/image`, a motion effect that blocks first paint or ignores `prefers-reduced-motion`, or
EEAT/SEO-relevant content gated behind a client-only fetch — hold the deploy:
`[PERF-HOLD: reason]`.
