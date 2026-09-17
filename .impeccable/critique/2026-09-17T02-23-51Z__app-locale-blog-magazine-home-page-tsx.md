---
target: magazine-home
total_score: 27
p0_count: 1
p1_count: 4
timestamp: 2026-09-17T02-23-51Z
slug: app-locale-blog-magazine-home-page-tsx
---
Method: dual-agent (A: design-review sub-agent · B: detector/browser-evidence sub-agent)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Newsletter/JoinTwoWays give loading/success/error states; no skeleton for the async archive grid, but SSR makes this low-stakes |
| 2 | Match System / Real World | 4 | Genuine F1 vocabulary (grid deltas P22→P16, fastest pit, retirements) — reads like it was written by someone who knows the sport |
| 3 | User Control and Freedom | 2 | No jump-to-page across 7 archive pages; only Newer/Older text links |
| 4 | Consistency and Standards | 3 | Visual language is consistent, but the hero-number card pattern claims every article has a "headline stat" even when the number is trivial |
| 5 | Error Prevention | 3 | Email fields have `type="email"` + `required`; no inline format feedback beyond native validation |
| 6 | Recognition Rather Than Recall | 3 | Section labels are clear; top-right nav zone (build badge, locale switcher, sign-in) is a little crowded |
| 7 | Flexibility and Efficiency | 2 | No search on this page; archive filtering only via tag chips buried inside card eyebrows |
| 8 | Aesthetic and Minimalist Design | 3 | Kraft/terracotta/mono restraint holds up until the archive grid, where repetition undercuts "every element earns its place" |
| 9 | Error Recovery | 2 | Subscribe forms show one flat generic error string regardless of cause |
| 10 | Help and Documentation | 2 | No inline help; About/Privacy live in the footer only |
| **Total** | | **27/40** | **Acceptable — top of the band, one point from "Good"** |

#### Anti-Patterns Verdict

**LLM assessment**: Borderline, leaning yes. The clearest tell is the archive card grid — `ArticlePreviewCard.tsx` and `FeaturedArticleCard.tsx` force *every* article, regardless of whether it has a real standout number, into the same eyebrow → headline → 2-line description → terracotta hero-number → mono label → share-icon mold. DESIGN.md sanctions the hero-number as a signature move for a genuine standout stat, not as default scaffolding for 140+ archive cards — at scale this reads exactly like the banned "hero-metric template," just recolored into the brand's own palette. No gradient text, no glassmorphism, no side-stripe borders, no numbered 01/02/03 scaffolding — those specific bans are clean.

**Deterministic scan**: The static CLI scan (`detect.mjs` over `app/[locale]/(blog)/magazine-home` + `components/blog`) came back clean — exit 0, zero findings. The **rendered-DOM overlay** (script-injected into the live page) found 23 issues the static scan structurally cannot see, because Tailwind arbitrary-bracket values (`text-[10px]`, `text-text-3`) only resolve to real computed colors/sizes in a browser:
- **low-contrast (2)** — `#A69A82` (`--text-3`) on `#EDE3D0` (`--bg`) measures **2.2:1**, against a 4.5:1 requirement, on two mono caption elements.
- **tiny-text (5)** — 10-11px body-weight paragraphs.
- **all-caps-body (14)** — uppercase tracked mono labels repeated across card instances (this is the browser-level echo of the same card-repetition the LLM review flagged structurally — two independent methods converging on one root cause).
- **overused-font (1)** — `body` measures ~20% Inter. This is a real regression, not a stylistic quirk: DESIGN.md explicitly retires Inter as a UI font under Vintage Editorial ("Lora replaces it for anything that isn't a number") — some component is still falling back to `font-sans`/Inter instead of `font-prose`/Lora.
- **bounce-easing (1)** — `cubic-bezier(0.54, 1.5, 0.38, 1.11)` on `body`. Y-values above 1 produce overshoot/bounce. DESIGN.md's own motion token is `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out, no bounce), and the parent skill bans bounce/elastic easing outright.

Minor internal count discrepancy in the overlay's own group header ("21 anti-patterns found" vs. 23 logged lines) — noted, not investigated further; doesn't change any individual finding above.

**Visual overlays**: Script injection succeeded on a live tab (`http://localhost:3000/en/magazine-home/`, titled with a `[Human]` suffix, left open). Findings were captured via the browser console (`[impeccable] ... anti-patterns found` group) rather than an on-page highlight overlay — if you want to inspect the flagged elements directly, that tab is still open with the detector script loaded.

**False positives / needs judgment**: The all-caps-body hits on short mono kicker/label text (9-11 words, e.g. section eyebrows, stat labels) are arguably intentional editorial typography under this system's own "JetBrains Mono labels" pattern, not body-copy readability failures — the rule's *intent* (don't shout at readers in paragraph text) doesn't fully apply to a 4-word caption. The size+contrast combination on `--text-3` is the part that's unambiguously real regardless of case.

#### Overall Impression

The page's best material (Race Day Movers, Circuit of the Day, the two-path subscribe) is genuinely well-built and on-brand. The problem is scale and repetition: one card template stamped across 140+ archive articles, a live font/motion drift away from what DESIGN.md actually specifies, and a first screenful that asks for an email twice before the reader has read a single story. None of this requires a rebuild — it's tuning, not redesign.

#### What's Working

1. **Race Day Movers** (`RaceHighlightsPanel.tsx`) — bars scaled to a shared `maxAbsDelta` so a P19→P1 story is visually, not just numerically, bigger than a P8→P6 one. Real information design, unmistakably F1.
2. **Circuit of the Day** — countdown, session schedule, lap record with driver+year, last-5-winners read top-to-bottom like a program note, exactly the "editorial chapter" DESIGN.md asks for.
3. **JoinTwoWays** — two honestly differentiated paths ("a confirmation link, sent once" vs. "instant — nothing to confirm") — real UX writing, not filler.

#### Priority Issues

**[P0] Archive card monotony — the AI-slop risk.**
Why it matters: 140+ articles all forced through the same eyebrow → headline → hero-number → share mold reads as templated, directly working against PRODUCT.md's own audience description ("opinionated, informed... know what boring looks like"). Confirmed two independent ways: structurally (identical component instantiated per card) and in the rendered DOM (14 repeated all-caps-label + 5 repeated tiny-text hits tracing to the same card list).
Fix: make the hero-number block conditional — only render when `featuredStat` is a genuinely distinctive, editor-verified number (a record, not just "a number that exists"). Vary the no-stat card layout so the grid doesn't read as one component stamped N times.
Suggested command: `/impeccable distill`

**[P1] Real WCAG contrast failure on `--text-3` captions.**
Why it matters: `#A69A82` on `#EDE3D0` measures 2.2:1, well under the 4.5:1 minimum for body text — this is a genuine accessibility bug the manual design review missed entirely (exactly the kind of thing static/manual review can't catch and a rendered-DOM check can).
Fix: darken `--text-3` toward the ink end, or reserve it strictly for truly decorative/ghost text ≥18px, moving the affected captions to `--text-2`.
Suggested command: `/impeccable audit`

**[P1] Bounce easing live on `body`, contradicting the design system.**
Why it matters: `cubic-bezier(0.54, 1.5, 0.38, 1.11)` overshoots — DESIGN.md's own `--ease` token is a clean ease-out-quint with no bounce, and the skill's own motion rules ban bounce/elastic easing outright. Motion is supposed to "map to meaning" here (lights out, gap closing) — a bounce curve doesn't map to anything in F1.
Fix: find the source (likely a library default or a leftover animation utility) and replace with `var(--ease)`.
Suggested command: `/impeccable animate`

**[P1] ~20% of live text still renders in Inter, not Lora.**
Why it matters: DESIGN.md explicitly retired Inter as a UI font under Vintage Editorial — Lora is supposed to carry everything that isn't a number. A live 20% Inter share means some component still uses `font-sans`/a default Tailwind sans stack instead of `font-prose`.
Fix: audit remaining `font-sans`/unstyled-text usages on this page's component tree and switch them to `font-prose`.
Suggested command: `/impeccable typeset`

**[P1] Page 1 asks for an email twice before the reader has read one article.**
Why it matters: Band 2 (JoinTwoWays) and the mid-page NewsletterCard both ask for commitment before any story has demonstrated value, and nine-plus full screens of eagerly-rendered modules (Featured, Standings, Last/Next Race, Attention, Newsletter, Data Desk, Learning+Latest, 7 archive pages) sit ahead of any real choice point — 3 of 8 cognitive-load checklist items fail (chunking, minimal-choices, progressive disclosure).
Fix: consider collapsing/lazy-revealing lower modules (Data Desk, Learning F1) and re-examine whether both subscribe asks need to appear before the fold.
Suggested command: `/impeccable layout`

#### Persona Red Flags

**Jordan (first-timer)**: Strong first 10 seconds — masthead pitch + two clear join paths land immediately. Red flag: by "The Data Desk"/"Learning F1"/"Latest," Jordan has already passed two separate subscribe asks without reading a single article — commitment requested before value shown.

**Riley (stress-tester)**: Tag-clear (×) and Older/Newer pagination both work; no jump-to-page across 7 archive pages, no search box (Circuits has one per the docs, magazine-home doesn't). Riley will also clock the hero-number pattern repeating verbatim on cards #4, #7, #12 and conclude the "stat" is decorative rather than curated — a real trust hit for a persona who explicitly prides themself on spotting padding.

**Casey (mobile, 390px verified)**: No red flags on responsiveness itself — all bands stack cleanly, no horizontal scroll, no headline overflow found in any breakpoint checked. Casey's only complaint is the same monotony issue Riley has, amplified by single-column scroll making the repetition even more visible card-after-card.

#### Minor Observations

- Top-right nav is crowded: `Vol.01 · Rd.14 · 2026`, a `#92` build badge, `EN · ES`, and `Sign in` all compete in one row — the `#92` badge looks like a leftover dev/PR-number artifact; confirm it's meant to ship.
- "The Data Desk" rendered no articles during this check — confirm the tag-gating query isn't silently starving a section the docs treat as a named module.
- `ShareButton`'s aria-label is hardcoded `"Share"` (`components/ui/ShareButton.tsx:58`), bypassing next-intl despite CLAUDE.md's i18n rule — invisible in EN, stays English in ES/PT screen readers.
- No archive filter/search beyond clicking a tag chip embedded in a card's eyebrow — a real gap for "data-driven fans who've seen every other F1 data tool" browsing 140+ articles.
- Subscribe forms (`NewsletterCard.tsx`, `JoinTwoWays.tsx`) show one flat generic error string regardless of cause (network fail vs. already-subscribed vs. server error).
- Keyboard focus rings verified correct via `:focus-visible` on nav links and the "Full Circuit Intelligence" link — a real strength, easy to miss in a quick pass.
- A one-time React hydration-mismatch console error (`data-copytables-uid` attribute) traced to a browser extension injecting attributes pre-hydration — environmental noise, not an app defect.

#### Questions to Consider

- What if the hero-number stat only appeared on the Featured card and one "story of the day," and every other archive card just ran headline + description — would the page feel more editorial, or would "specificity" (DESIGN.md principle 4) suffer without a number on every tile?
- What if Attention This Week / Learning F1 / The Data Desk were teased as single links from the masthead instead of full sections, and page 1 moved straight from Featured+Standings to Last/Next Race to the Archive — how much of the current length earns its place vs. fills space because the module already existed?
- What if the terracotta hero-number were reserved strictly for numbers verified as actual records (fastest, most, first) rather than any metric a writer picked — would that restore the "hero number = something worth boasting about" meaning DESIGN.md intends?
