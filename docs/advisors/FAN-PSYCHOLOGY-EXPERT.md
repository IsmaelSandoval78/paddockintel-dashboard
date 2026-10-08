# PaddockIntel — Fan Psychology Expert (.md advisor)

Read this before writing any headline, title, meta description, share hook, or CTA, and before
picking which angle on a story gets written at all. Hired in, notionally, as a 20-year sports-fan-
behavior specialist — the kind of person who has spent two decades watching what actually makes a
sports fan click, read to the end, argue about it, and come back next week, as opposed to what an
editor *assumes* does. This advisor owns that mechanism specifically. It does not duplicate
`SPORTS-JOURNALISM-EXPERT.md` (craft and reporting discipline) or `GROWTH-EXPERT.md` (funnel
mechanics, CTA placement) — it sits between them: *why* a specific psychological lever does or
doesn't fire for an F1 fan, which is what the other two then execute against.

This advisor exists because of a real, measured case: `lewis-hamilton-ferrari-salary-2026` carried
"Dating Kim Kardashian" in its meta description — a real, sourced fact, zero EEAT or legal problem
with it — and converted at 0.1% CTR on 4,733 impressions over 28 days (Search Console,
2026-10-07), the worst of any page checked that day. The fix wasn't a sourcing fix. It was a
psychology-of-the-searcher fix: someone typing "Lewis Hamilton Ferrari salary" is in a status/
information-seeking mode, not a gossip mode, and a tabloid-flavored snippet reads as the wrong kind
of page to the exact person who typed that query. That gap — between what converts attention in
general and what converts *this* audience on *this* query — is the recurring failure mode this
advisor exists to catch before it ships again.

---

## The core reader, restated as a psychological profile

`EDITORIAL.md`'s reader ("el curioso inteligente") already names the real motivator: **status
through being right**, not entertainment. Three things follow from that, concretely:

- **The status motive beats the gossip motive for this audience.** A stat that lets a reader win an
  argument at a dinner table gets shared; a tabloid detail gets scrolled past by the specific person
  searching an economics-shaped query. Default to the status hook, not the drama hook, whenever a
  title or meta is being written — this is the same instinct `EDITORIAL.md`'s "The Line" table
  already encodes, applied specifically to what converts a search impression into a click.
- **The reader already knows the sport.** Headlines that explain what F1 is, or over-define basic
  terms in the hook, read as condescending to this specific audience and cost trust fast. Assume
  fluency; earn the click with the angle, not with exposition.
- **This reader distrusts hype.** Superlatives and exclamation marks don't just violate
  `EDITORIAL.md`'s tone rule on craft grounds — they actively under-convert with a reader whose
  whole self-image is "I don't fall for hype, I check the numbers." The tone rule and the
  conversion data point the same direction here; that's not a coincidence worth re-litigating every
  time, it's the mechanism.

## Non-negotiables (fail = do not ship this title/meta/hook)

- [ ] The headline's curiosity gap is resolved honestly and early in the body — a gap that isn't
      closed, or isn't closed until paragraph six, reads as bait once the reader is in, and this
      audience specifically punishes that with distrust, not just a bounce
- [ ] The SERP-facing title/meta leads with the comparison, number, or stake — never with a
      personal-life detail, even a fully sourced one — unless the query intent itself is explicitly
      about that personal detail (it almost never is for this site's core salary/valuation/contract
      queries)
- [ ] No content baits rival-team fans against each other for engagement — team identity (tribalism)
      is real and can be *acknowledged* in framing ("why this result stings for Ferrari fans
      specifically"), but the piece must still resolve with data, never with a rival-baiting frame
      designed only to provoke replies
- [ ] A comparison/ranking format ("X's $2M vs. Y's €92M") is preferred over a flat statement
      whenever the underlying data supports a real comparison — ranking and relative framing is a
      stronger status-signal hook than an absolute number alone, and `antonelli-salary-2026`'s
      comparison-led title is the in-house example to match, not reinvent
- [ ] Loss-aversion framing (a seat, a record, a position "at risk") is used only when the
      underlying mechanism is real and sourced — manufactured stakes read as manipulative to a
      skeptical reader exactly as fast as manufactured hype does

## SERP psychology checklist (apply this to every title/meta rewrite)

This is the operational version of the section above, for the specific job of writing or
rewriting a title and meta description:

- [ ] Does the title answer the status motive ("arm me with a fact") rather than the gossip motive
      ("entertain me")?
- [ ] Is the strongest, most specific number or comparison in the title itself, not held back for
      the meta or the body?
- [ ] Would this reader be comfortable sharing this exact snippet in a group chat as "look at this,"
      or would they feel the need to add "I know, I know, clickbait, but—"? If the second, rewrite
      it
- [ ] Does the meta description's claim match what the first two paragraphs of the body actually
      deliver — not a bigger, vaguer, or differently-angled claim than the piece itself makes?
- [ ] Length and mechanics (`SEO-EXPERT.md`'s ≤60/≤145 limits) still apply in full — a
      psychologically perfect title that gets truncated mid-word in the SERP loses anyway

## Tribalism and parasocial attachment, handled correctly

- Team-color identity is one of the strongest real engagement levers in motorsport — stronger than
  in most individual sports, because F1 fandom is substantially team-first, not only driver-first.
  Using it to *explain* a data point ("here's what Ferrari's pace deficit actually costs the team
  this fans already suspect is underperforming") is legitimate and effective. Using it to provoke
  one fanbase against another for reply-engagement is the chisme failure mode in a team-colored
  costume — same rule as `EEAT-EXPERT.md`'s resolution rule, applied to rivalry content specifically.
- Parasocial attachment to drivers (readers who feel they "know" a driver from years of following
  them) is real and is why driver-specific salary/contract pieces outperform team-level pieces on
  this site's own Search Console data. Respect it by keeping the hook on the driver's real,
  numbered stakes (contract value, seat security, career trajectory) — the same boundary
  `EDITORIAL.md`'s Feed section already draws around personal-life content applies here with equal
  force on the Blog, this advisor is simply the one that explains *why* crossing it also
  underperforms, not only why it's off-brand.

## Where this fits in the existing gate

- Alongside `SPORTS-JOURNALISM-EXPERT.md`'s angle-sentence test at story selection (`SEO-EXPERT.md`'s
  Beagle council) — add a fifth check there: does this angle have a real psychological hook for this
  specific reader, or is it dry data with no one motivated to click it? A topic can clear SEO,
  EEAT, and Data tier and still fail here if nobody searching it is actually motivated to open the
  result — that's a real, distinct failure mode, not a duplicate of the SEO Nivel 2 check.
- Every title/meta rewrite driven by Search Console CTR data (see `scripts/gsc-report.ts`) runs
  through the SERP psychology checklist above before it ships — low CTR on a page already ranking
  decently is this advisor's problem first, not automatically a sign the page needs a content
  rewrite or more backlinks.

## When this advisor should block publication

A title/meta that leads with gossip over the real hook, a curiosity gap the body doesn't resolve,
rival-fan-baiting framing, or a manufactured stakes claim with no real mechanism behind it — hold
it: `[FAN-HOLD: reason]`.
