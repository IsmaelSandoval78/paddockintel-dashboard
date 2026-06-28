# PaddockIntel — Editorial Guide

Read this before writing any article, digest issue, or newsletter copy.
This file is the source of truth for voice, structure, and process.
Update it when a piece doesn't land the way you wanted — the next session will start calibrated.

---

## The Reader

**El curioso inteligente.** Watches F1. Wants to win the conversation, not spread gossip.

Asks questions like:
- *"Why did Antonelli win the championship at 18?"* — and wants an answer better than "he's fast"
- *"Why does Alpine keep losing engineers?"* — and wants the business logic, not the drama
- *"What does Russell's Austria win actually mean for Mercedes?"* — contract, sponsor, budget

This is the person Google's "People Also Ask" is full of. They search the question genuinely.
They read Bloomberg and FT but also check the race standings on Sunday night.
**They want to be the smartest person at the dinner table about F1** — armed with data, not rumor.

**Who sponsors to reach them:** fintech platforms (eToro, trading apps), business travel (NetJets,
premium airlines), B2B SaaS, luxury automotive (not the F1 teams themselves — those are content).
Their income is high enough that these categories make sense as ads.

---

## Sourcing Rule — Non-Negotiable

**Verify before you write. Every time. No exceptions.**

Before stating any fact, number, or claim in an article or digest:

1. **Search for it.** Use WebSearch to find the primary source. Do not rely on training data
   for F1 statistics — race results change, standings change, contracts change.
2. **Cite the primary source.** Not a blog that cited the original — the original itself.
3. **If you can't find a source, you don't print the claim.** Write around it or flag it
   explicitly: *"[VERIFY: X — source needed before publishing]"*

**Primary sources by category:**

| Category | Source |
|---|---|
| Race results, standings, fastest laps | formula1.com official results |
| Qualifying, grid positions | formula1.com or FIA timing sheets |
| Regulations, cost cap rules | fia.com (technical/financial regulations PDF) |
| Team financials, valuations | FT, Bloomberg, Forbes (with date) |
| Contract news | Team press releases — never rumor sites |
| Historical data (pre-2026) | Supabase Hub (already verified Ergast data) |
| Live 2026 standings | Supabase Hub — query the DB, don't assume |

**This rule applies to Claude writing drafts too.** If a writing session produces a number
without a cited source in the `sources` frontmatter array, that number is not verified and
should not be published. The draft gets a `[VERIFY]` flag instead.

---

## The Line

Drama is the entry point. Economics and data are the payoff. Never let drama be the story itself.

| The hook (use it) | The chisme (never) | The PaddockIntel angle (always) |
|---|---|---|
| Russell beats Verstappen in Austria | "George finally proves himself" | What does a Russell win mean for Mercedes' next contract cycle and their cost-cap allocation? |
| Alpine loses another engineer | "Drama in the paddock" | Alpine has lost 8 key engineers in 18 months — what does that cost in development hours? |
| Antonelli leads the championship | "The new Senna" | At 18, Antonelli's points-per-race average (21.4) is statistically anomalous. Here's what the data says about his trajectory. |
| Verstappen's Red Bull dominance fades | "The empire is crumbling" | Red Bull allocated 94% of their cost cap to development — the math on how long that model works. |

**The test:** Could this line appear in Bloomberg Businessweek's sports section?
If yes → publish. If it sounds like a fan forum post → rewrite the angle.

---

## Voice Principles

**Directional, not neutral.** PaddockIntel has a point of view. "The data suggests X" is weaker than
"This is what the data says, and it points to X." Take a position. Back it with sources.

**Verified, not assumed.** Every number, every claim has a source. If you can't verify it, you don't
print it. No paraphrased stats from other blogs — trace it back to the primary source.

**Precise, not exhaustive.** One tight economic argument per article. Not five loosely connected ones.
The ECONOMIC IMPACT section is the core — everything else sets it up or lands it.

**Short sentences under pressure.** When making an argument, short sentences land harder than long ones.
Reserve long sentences for context. Never three clauses when one does the job.

**Never fan voice.** These words don't appear in PaddockIntel:
- "incredible," "amazing," "stunning," "iconic"
- "the GOAT," "legend," "all-time great" (use data instead)
- "drama," "chaos," "meltdown" as neutral descriptors
- Exclamation marks in body copy

---

## Article Structure — Five Sections (fixed)

Every article follows this structure. The H2 headings appear in the TOC and drive the schema markup.

```
## What Happened
2–3 paragraphs. The factual setup. No opinion yet. Set the scene with precision.
Answers: who, what, when, where. Not why — that's next.

## Why It Happened
2–3 paragraphs. The strategic or mechanical explanation.
Answers: the F1-specific reason behind the event. Teams, regulations, pace, strategy.
This section earns the right to the economic angle.

## Economic Impact
3–4 paragraphs. THIS IS THE CORE. The money, the contracts, the market signal.
Answers: what does this mean for the business of F1? Who wins, who loses, what changes?
This is where stat callout boxes live. This is what sponsors want to be near.

## The Framework
2–3 paragraphs. The bigger pattern. Zoom out.
Answers: what does this reveal about how F1 works as a business system?
Historical comparisons go here. Industry analogies go here.

## Verdict
1–2 paragraphs. Your conclusion. First person is allowed ("The data points to X.
My read: Y."). Short. Opinionated. Leaves the reader with one clean takeaway.
```

Newsletter card appears after **Economic Impact** and again at the end of **Verdict**.

---

## Stat Callout Boxes

Pull 3–5 numbers from the article that stand alone. These appear in the right sidebar on desktop
and a horizontal scroll strip on mobile. Each callout = `value + label + optional unit`.

Rules:
- Numbers only — no text sentences
- Each number must be sourced in the body
- Value should be dramatic on its own: `21.4` (pts/race) not `21.376`
- Label ≤ 5 words, uppercase: `POINTS PER RACE — 2026`

---

## FAQ Section

3–5 questions. Write for "People Also Ask" — the exact question someone types in Google.
Answers: 2–3 sentences, direct. No padding.

Structure each one as: [Question that exists in search] → [Answer that terminates the search]

Good FAQ question: *"Why is Antonelli leading the 2026 championship?"*
Bad FAQ question: *"What do you think about Antonelli's performance?"*

---

## Frontmatter Template

Every article lives as a `.md` file. Three locale files per article, same `translation_group_id`.
Ingested via: `npx ts-node --project scripts/tsconfig.json scripts/ingest-article.ts <path>`

```markdown
---
slug: austria-gp-2026-russell-win-economic-impact
title: "Russell's Austria Win and What It Means for Mercedes' Next Chapter"
locale: en
meta_description: "George Russell won the 2026 Austrian GP. Here's the economic and contractual significance for Mercedes — cost cap allocation, sponsor signals, and championship math."
tags:
  - 2026 Season
translation_group_id: "austria-gp-2026"   # same value across EN/ES/PT files
status: published                           # or "draft" while writing

stats:
  - value: "40"
    label: "PTS GAP — ANTONELLI VS RUSSELL"
    unit: "after Austria"
  - value: "2"
    label: "RUSSELL WINS — 2026"
  - value: "94%"
    label: "RED BULL COST CAP USAGE"
    unit: "est. 2025"

faq:
  - q: "Why did George Russell win the 2026 Austrian Grand Prix?"
    a: "Russell qualified on pole and controlled the race on a one-stop strategy, with Mercedes' upgraded power unit delivering a 0.3s advantage in the DRS zones over the Red Bull Ring's main straight."
  - q: "What does Russell's Austria win mean for the championship?"
    a: "With Antonelli finishing P3, the gap closed from 55 to 40 points. Eight rounds remain — Russell needs to win 5 of them to statistically threaten the lead."

sources:
  - name: "FIA Technical Regulations 2026 — Cost Cap Annex"
    url: "https://www.fia.com/..."
  - name: "Formula1.com — Official Race Results"
    url: "https://www.formula1.com/..."
---

## What Happened

(article body in markdown)
```

**Naming convention for files:**
```
articles/
  austria-gp-2026-russell-win-economic-impact.en.md
  austria-gp-2026-russell-win-economic-impact.es.md
  austria-gp-2026-russell-win-economic-impact.pt.md
```

**Ingest commands (run each locale separately):**
```bash
npx ts-node --project scripts/tsconfig.json scripts/ingest-article.ts articles/austria-gp-2026-russell-win-economic-impact.en.md
npx ts-node --project scripts/tsconfig.json scripts/ingest-article.ts articles/austria-gp-2026-russell-win-economic-impact.es.md
npx ts-node --project scripts/tsconfig.json scripts/ingest-article.ts articles/austria-gp-2026-russell-win-economic-impact.pt.md
```

---

## SEO Checklist — Per Article

Before setting `status: published`:

- [ ] Title ≤ 60 characters (check at [charactercounter.com](https://charactercounter.com))
- [ ] `meta_description` ≤ 145 characters, contains primary keyword
- [ ] Slug matches the question someone would Google — no filler words
- [ ] At least one FAQ question matches a real "People Also Ask" result
- [ ] All three locales have the same `translation_group_id`
- [ ] Sources array has primary sources (FIA, Formula1.com, FT) — not secondary blogs
- [ ] Stats values are verifiable from sources listed

---

## Translation Process

English is source of truth. ES and PT are parallel drafts — not machine translation.

**What to preserve across locales:**
- Same slug structure (translate words, keep format): `russell-austria-2026-impacto-economico`
- Same `translation_group_id` — exact same string across all three files
- Same stat values (numbers don't translate)
- Same source URLs

**What to adapt:**
- Title: natural phrasing in each language, not word-for-word
- `meta_description`: rewrite for local search behavior (ES/LATAM searches differently than EN)
- FAQ questions: write the question as someone from that market would type it

**ES audience:** Spain + LatAm. Use neutral Spanish — avoid voseo or heavy regionalism.
**PT audience:** primarily Brazil. `pt-BR` date formatting is already wired.

---

## The Writing Session Flow

1. **Research first.** Before opening a draft, verify: race results from Formula1.com,
   standings from Supabase Hub, economic claims from primary sources (FIA, team press releases,
   FT/Bloomberg if available). Never estimate a number.

2. **Angle before structure.** Write one sentence: *"This article argues that [X] because [Y]."*
   If you can't write that sentence, the angle isn't sharp enough yet.

3. **EN draft first.** Full five sections. Stat callouts. FAQ. Sources list.

4. **Critique gate.** Before translating, score against the six dimensions in SKILL.md §16.
   Minimum 4 on all six.

5. **Translate ES and PT.** Same `translation_group_id`. Adapt, don't just translate.

6. **Ingest all three.** Run the ingest command per locale. Verify the article renders at its slug.

7. **Validate schema.** Google Rich Results Test on the live URL before announcing.
