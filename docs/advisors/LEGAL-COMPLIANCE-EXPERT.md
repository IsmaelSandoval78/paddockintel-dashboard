# PaddockIntel — Legal & Compliance Expert (.md advisor)

Read this before shipping anything that touches user data (accounts, personalization,
analytics), before publishing anything that makes a claim about a real, named person (driver,
engineer, team executive), and before running any sponsored/ad content. A solo-founder
project has no in-house counsel, which means this checklist is the only thing standing between
a fast ship and a real liability — not a hypothetical one, a real one: GDPR-style regulators,
a defamation claim from someone with more lawyers than PaddockIntel has, or an FTC complaint
over undisclosed sponsorship.

---

## Non-negotiables (fail = do not ship / do not publish)

- [ ] Privacy policy is accurate and current — it states exactly what's collected (followed
      drivers/teams/experts, personalization state, account data) and nothing is collected
      that isn't disclosed there. This is the enforcement layer under EEAT-EXPERT.md's
      transparency requirement — that doc says it must be transparent, this one confirms it
      actually is, in writing, and stays that way as features ship
- [ ] Any factual claim about a real, named person's conduct (a contract dispute, an
      allegation, a conflict with a team) that isn't backed by a primary source or an
      on-record statement is labeled as reported-but-unconfirmed, never stated as fact — see
      DATA-EXPERT.md's sourcing rule and SPORTS-JOURNALISM-EXPERT.md's reporting-discipline
      section; this advisor is why those rules aren't optional, they're liability
- [ ] Opinion about a real person stays inside the Verdict section and reads as opinion
      (SPORTS-JOURNALISM-EXPERT.md's rule) — an unlabeled opinion stated as fact about a real
      person is the single highest-risk pattern this checklist exists to catch
- [ ] Sponsored/ad content carries disclosure language that actually meets the bar (a clearly
      visible "Sponsored" or "Paid Partnership" label on the piece itself, not just a
      differentiated font per EEAT-EXPERT.md) — "distinguishable to a careful reader" is not
      the same as "disclosed," and only the second one satisfies FTC-style requirements
- [ ] Every image/video/chart asset has a confirmed usage right before publishing — team press
      kit, licensed stock, or PaddockIntel's own — never an image pulled from a search result
      or another outlet's article with no rights check
- [ ] Data subject rights (access, export, deletion) are not just documented in the privacy
      policy — the actual request path is tested and works, before it's ever relied on in a
      real request

## User data and accounts (Google + email login, personalization)

- [ ] Data retention matches stated purpose — data isn't kept "just in case" once a user
      deletes their account or the stated purpose (personalization) no longer applies
- [ ] No dark patterns in consent flows — cookie/tracking consent, newsletter opt-in, and
      account creation must each be a real choice, not a pre-checked box or a flow designed to
      make declining harder than accepting
- [ ] If the audience plausibly includes minors (F1's fanbase skews younger than most
      finance/business media), account creation and data collection don't specifically target
      or knowingly collect from users under the applicable age threshold

## Third-party content ("Experts" personalization feature)

Cross-reference CYBERSECURITY-EXPERT.md (sanitization, injection risk) and
SPORTS-JOURNALISM-EXPERT.md / EEAT-EXPERT.md (attribution) — this advisor owns the rights
angle specifically:

- [ ] Quoting or embedding an external "expert's" post respects that platform's terms of
      service and fair-use bounds — a short, attributed excerpt with a link back is defensible;
      reproducing a post's full content as if it were PaddockIntel's own is not
- [ ] If a pulled "expert" account is later shown to be a parody/impersonation account (a real
      risk SPORTS-JOURNALISM-EXPERT.md already flags), the legal exposure is attributing a
      claim to a real named person who never made it — this is a correction-with-urgency case,
      not a routine edit

## Content risk (beyond the routine editorial checklist)

- [ ] A developing situation (injury, contract dispute, team conflict) gets the
      reported-but-unconfirmed treatment SPORTS-JOURNALISM-EXPERT.md already requires
      editorially — this advisor's version of the same rule is the liability reason it's
      non-negotiable, not just a craft preference
- [ ] Fair comment (a critical but clearly-opinion take on a public figure's public
      performance) is protected and fine; a factual assertion presented as fact without a
      source is not fair comment, it's an unsourced claim about a real person — know which one
      a given sentence actually is before it ships

## When this advisor should block publication or shipping

Any unsourced factual claim about a real person, any opinion about a real person presented as
fact outside the Verdict section, any sponsored content without real disclosure, any user-data
feature that collects beyond what the privacy policy states, or any asset without a confirmed
usage right — hold it: `[LEGAL-HOLD: reason]`.
