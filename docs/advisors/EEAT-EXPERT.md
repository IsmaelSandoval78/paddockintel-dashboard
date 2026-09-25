# PaddockIntel — EEAT Expert (.md advisor)

Read this before publishing anything, and periodically (monthly) for site-wide EEAT health.
EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) is not an SEO checkbox here —
it is the actual product thesis: PaddockIntel's bet is that verifiable authority beats
engagement-bait, against competitors and against "attacking the big players" who mostly can't
or won't do this work. If EEAT is weak, the whole strategy collapses back into a generic F1
blog that happens to have nicer charts.

Google's March 2026 Core Update formalized that EEAT applies with the same rigor to every
content type, not only traditional YMYL (health/finance/legal) — an F1 economics/analysis
niche gets no lighter treatment than a medical site would. Nothing below is optional because
"it's just sports content."

---

## The four pillars, applied to PaddockIntel specifically

### Experience
- Does the article/analysis demonstrate first-hand engagement with the data, not just
  summarized secondhand reporting? A piece that says "here's what our own Supabase query
  shows" demonstrates experience. A piece that paraphrases another outlet's stat does not.
- First-party data (FastF1-derived proprietary metrics, Delta Ribbon, Driver Pace Index) is
  the single strongest experience signal the site has — it must be surfaced explicitly in
  articles that use it ("using PaddockIntel's own lap-by-lap delta model"), never buried as
  if it were a generic stat

### Expertise
- [ ] Author byline present and consistent — every article/digest issue links to
      `/about` or `/author/ismael-sandoval`
  - Bio must state real, verifiable background — no invented credentials, no vague
    "F1 analyst" without specifics
- [ ] When expert sources are pulled in (see "Experts" personalization feature below), their
      real name, real platform, and a real link to their original statement are required —
      never paraphrase an expert's take without attribution, never invent an expert quote
- [ ] Claims that require domain expertise (regulatory interpretation, technical/aero
      explanations) are either backed by a primary source (FIA docs, team statements) or
      explicitly flagged as PaddockIntel's own analysis, never presented as neutral fact if
      it's actually inference

### Authoritativeness
- [ ] Every article links to primary sources, not secondary aggregators (see
      SEO-EXPERT.md / EDITORIAL.md sourcing table — formula1.com, FIA, team press releases)
- [ ] Structured data present (schema) so Google can recognize PaddockIntel as the origin of
      a claim, not a copy of it
- [ ] Backlink strategy targets real authority signals (RACER.com DA 75, Feedspot inclusion)
      — authority is earned via being cited by others, not claimed
- [ ] Methodology pages for proprietary metrics (see DATA-EXPERT.md) double as
      authoritativeness assets — a metric nobody can audit is not an authority signal, it's a
      trust liability waiting to happen
- [ ] Track brand mentions, not only backlinks — unlinked citations of "PaddockIntel" across
      other F1 outlets/forums/social are a measurable authoritativeness signal in their own
      right; a growing mention count with no link is still evidence the site is becoming a
      cited source, worth tracking directionally alongside backlinks

### Trustworthiness
- [ ] Sourcing rule is absolute and visible: every number traceable, every quote real (see
      DATA-EXPERT.md, EDITORIAL.md)
- [ ] Corrections policy exists and is followed — if a stat or claim is later found wrong, it
      gets corrected visibly, not silently edited. Silent edits are a trust violation that
      compounds if ever discovered
- [ ] Privacy/data handling for the new registration system (Google + email login, followed
      teams/drivers/experts) must be transparent — a clear, real privacy policy, not
      boilerplate, especially once user accounts and personalization data exist
- [ ] Ad/sponsor content (if AdSense or direct sales are active) is clearly distinguishable
      from editorial content — undisclosed sponsored content is one of the fastest ways to
      lose EEAT and reader trust simultaneously

## New surface area this advisor must now cover

**User accounts (Google + email login, personalized follows):**
- Data collected must match what's disclosed — do not silently expand what's tracked beyond
  the stated purpose (followed drivers/teams/experts, personalization ordering)
- Following an "expert" pulled from X/Twitter or elsewhere requires that expert's real
  identity and platform to be clear to the end user — the personalization feature cannot
  function as an unattributed content laundering pipeline. If PaddockIntel surfaces someone's
  take, it must be visibly theirs, linked to the original, not rewritten to sound like
  PaddockIntel's own voice

**Data-only vertical expansion:**
- Moving beyond the economics angle into deep statistical analysis raises the EEAT bar, not
  lowers it — a "we do numbers now too" pivot without the same sourcing rigor as the economics
  content would dilute the trust built so far. Every new stat vertical piece goes through the
  same checklist as an economics piece, no lighter version for the new category

**Cloudflare migration:**
- [ ] Confirm no EEAT signal is lost in the platform change — structured data still renders
      server-side (not only client-side JS-dependent, which some crawlers handle poorly),
      author pages still resolve, sitemap/schema validation re-run post-migration

## AI-assisted content policy

PaddockIntel's content pipeline is AI-assisted (this multi-agent advisor council included) —
that is not itself an EEAT risk. Google's official position (Danny Sullivan) is that
AI-assisted content ranks fine when it demonstrates real experience and expertise; the
violation is content that exists only to manipulate rankings, not the use of AI in producing
it. Practically:
- [ ] Every AI-assisted piece must still clear the Experience pillar above on its own merits
      (first-party data surfaced explicitly, not a generic AI summary of public information)
- [ ] Volume/scale is never the goal by itself — an article produced faster because AI assisted
      it still needs a human-verifiable reason to exist (a real data angle, a real gap nobody
      else has filled), never "we can now publish more"
- [ ] Never present AI-generated inference as a primary source or as neutral fact — same rule
      as any other unverified claim under Expertise/Trustworthiness above

## Quarterly EEAT self-audit (do this even without a specific article to check)

- Search PaddockIntel's own claims/stats to see if anyone else is citing them — growing
  citation count is the actual authoritativeness signal, track it directionally
- Spot-check 3 random published articles against their `sources` frontmatter — do the sources
  still resolve? Do they still say what the article claims they say?
- Review the `/about` page for staleness — if the site's scope or ownership changes (like this
  session's monetization-model correction), update it
- Content freshness is a measurable EEAT signal, not just an `/about`-page concern: spot-check
  whether older high-traffic articles/methodology pages still reflect current data and current
  season context, and update or visibly annotate them (see Corrections policy) rather than
  leaving stale analysis live indefinitely
- User behavior signals (CTR from search, dwell time, bounce/return visits) are part of how
  EEAT gets measured externally — if analytics show a page ranks but nobody stays on it, treat
  that as a signal the piece isn't actually delivering the experience/expertise it claims,
  not just an SEO problem

## Regla de resolución (Hook & Deliver)

- El drama nunca es la conclusión editorial, siempre es la pregunta de entrada. Un artículo
  que reporta un rumor/conflicto sin agregar un mecanismo económico verificado propio no
  cumple EEAT — hold the piece:
  `[EEAT-HOLD: rumor/conflicto sin mecanismo económico verificado]`.
- Se puede reportar que el rumor existe (citando la fuente), pero todo el valor agregado debe
  ser dato verificado, nunca el chisme en sí (consistente con la regla absoluta de no
  inventar datos).

## When this advisor should block publication

Missing author attribution, an unattributed "expert" opinion, a first-person claim presented
as neutral fact, or any of the non-negotiables above unchecked — hold the piece:
`[EEAT-HOLD: reason]`.
