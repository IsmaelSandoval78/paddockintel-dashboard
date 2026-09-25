# PaddockIntel — Growth Expert (.md advisor)

Read this before shipping anything that touches the subscribe flow, the paywall, a CTA, an
email, or a distribution decision — and monthly for a real look at the funnel numbers. The
other eight advisors build the product (content, SEO, data integrity, security,
performance, authority, legal footing); this one owns turning the traffic they earn into
subscribers, and the subscriber base into revenue. Nobody else has that job. Digital PR
earns links; SEO earns rankings; this advisor owns what happens after someone actually
lands on the page.

**The number, stated plainly:** as of this advisor's creation, PaddockIntel has 6 email
subscribers, first one on 2026-08-12. The stated target — 1,000,000 views and 50,000
subscribers in a month — is roughly 8,300x current subscriber count. Nothing below is
written to make that number feel achievable on the stated timeline; it isn't, and pretending
otherwise would be exactly the kind of unverified claim DATA-EXPERT.md exists to block. What
follows is the honest version: the levers that compound, in the order that actually moves a
6-subscriber list, not a growth-hacking checklist copied from a company with a different
starting point.

---

## Non-negotiables (fail = do not ship)

- [ ] Every article and Feed item has a real, visible subscribe CTA — not buried, not only in
      the nav. A reader who finishes an article and has no path to subscribing is a lost
      reader, not a "later" reader
- [ ] The welcome email (`emails/WelcomeEmail.tsx`, sent via `app/api/subscribe/route.ts`)
      sets expectations accurately — cadence, what's free vs. `paywalled: true`, and delivers
      real value in the first email, not just a confirmation
- [ ] `paywalled` content never gates the thing that's supposed to convert a stranger into a
      subscriber — the free tier must contain enough real, sourced analysis to demonstrate
      EEAT-EXPERT.md's whole thesis (verifiable authority beats engagement-bait), or nobody
      converts on trust they never got to see
- [ ] No dark patterns in the subscribe/unsubscribe flow — LEGAL-COMPLIANCE-EXPERT.md's
      consent rules apply here directly, and a forced-friction unsubscribe destroys more trust
      than it retains subscribers
- [ ] Every growth claim in a planning doc or pitch is checked against real numbers from
      Supabase (`subscribers`, `digest_items` open/click if tracked) — never against a vibe

## The funnel (own this end to end)

1. **Acquisition** — not this advisor's job to generate (that's SEO/Digital-PR/the content
   itself), but it IS this advisor's job to make sure acquisition isn't leaking value:
   every organic visit that doesn't at least see a subscribe offer is a wasted acquisition
   cost, even though it cost nothing in ad spend
2. **Conversion (visitor → subscriber)** — the single highest-leverage number to move from 6.
   Concretely: subscribe widget placement (after Economic Impact section, per EDITORIAL.md's
   "newsletter card appears after Economic Impact and again at the end of Verdict" — confirm
   this is actually implemented, not just documented), a real value proposition in the CTA
   copy (not "Subscribe" — "Get the numbers before anyone else does"), and friction removed
   (email-only, no forced account creation to just get the newsletter)
3. **Activation** — does a new subscriber's first digest actually deliver on what got them to
   subscribe? A mismatch here is why acquisition doesn't compound into retention
4. **Retention** — open rate, click rate, and unsubscribe rate per issue are the real health
   metrics, not raw subscriber count. A list that churns as fast as it grows never reaches
   50,000 no matter how good acquisition is
5. **Distribution loop** — does a subscriber have a real, low-friction way to share an issue
   or article (share buttons, forward-friendly email format, a genuinely quotable stat
   callout)? Growth that depends only on new organic discovery is linear; growth with a
   working share loop compounds

## Monetization (the actual end goal, not subscriber count for its own sake)

- [ ] Every monetization decision is checked against EDITORIAL.md's own audience definition
      ("fintech platforms, business travel, B2B SaaS, luxury automotive... their income is
      high enough that these categories make sense") — sell against that audience
      specifically, not generic F1-fan ad inventory, which pays a fraction as much
- [ ] Sponsor/ad content is priced and packaged around what PaddockIntel actually has that a
      generic F1 blog doesn't: the proprietary data (Delta Ribbon, methodology pages),
      the economics angle, the engaged high-income reader — sell the differentiation, not
      pageviews alone
- [ ] Paywall strategy (`paywalled: true`) is a real lever, not a switch flipped per-article
      on instinct — track which paywalled pieces actually convert a reader into a subscriber
      or a payer, and let that data decide what gets paywalled next, not a guess
- [ ] Any sponsored content meets LEGAL-COMPLIANCE-EXPERT.md's real disclosure bar before it
      ships — a monetization win that costs EEAT is a loss, since the whole positioning is
      "verifiable authority beats engagement-bait"

## Reality-check ritual (monthly, do this even when it's uncomfortable)

- Pull the real subscriber count and its growth rate from Supabase. Compare it to the
  previous month's rate, not to the aspirational target. A list growing 20% month-over-month
  from a small base is a genuinely good number that a "50,000 in a month" framing makes
  invisible
- Identify the single biggest funnel leak (usually conversion, not acquisition, for a site
  with real organic traffic and a tiny subscriber base) and fix that one thing before adding
  a new acquisition channel
- If a growth tactic under consideration would compromise EEAT, SEO, or Legal compliance to
  hit a number faster, it fails this advisor's own non-negotiables — a shortcut that costs
  the site's actual differentiation is not growth, it's borrowing against the thing that was
  supposed to make growth durable

## When this advisor should block a decision

Any dark pattern in subscribe/unsubscribe flow, any monetization move that gates the content
needed to build the trust EEAT depends on, or any growth claim presented as fact without a
real Supabase number behind it — hold it: `[GROWTH-HOLD: reason]`.
