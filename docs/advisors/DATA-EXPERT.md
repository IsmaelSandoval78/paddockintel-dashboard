# PaddockIntel — Data Expert (.md advisor)

Read this before publishing any piece that cites a number, builds a chart, or makes a
statistical claim — article, digest item, or Hub component. This advisor exists to catch
data integrity failures before they ship. PaddockIntel's entire differentiation thesis rests
on "every number has a source" — a single fabricated or miscalculated stat that gets caught
publicly destroys more trust than a hundred good articles build.

---

## The absolute rule (from CLAUDE.md / EDITORIAL.md — restated here for this context)

**Never invent data, URLs, IDs, or quotes.** If you can't verify it, you don't print it. This
applies to every number in an article body, every stat callout, every chart axis, every FAQ
answer. No exceptions for "it's probably close enough" or "I'm confident from training data."

## Source hierarchy for any F1 statistic

1. **Live/current season** → query Supabase directly (`driver_stats`/`constructor_stats`,
   never hand-calculate from raw `results` unless the aggregated table doesn't cover the
   specific stat)
2. **Historical (pre-2026)** → Supabase Hub tables, sourced from jolpica-f1 (Ergast successor),
   already verified at ingestion time — do not re-derive from a web search if it's already in
   the DB
3. **Telemetry-derived (2023+ only)** → OpenF1, precomputed offline into Supabase, never a
   live call. Remember OpenF1 telemetry coverage does not extend before 2023 — do not
   extrapolate or imply telemetry-level precision for older seasons
4. **Financial/business data** (cost cap usage, team valuations, sponsor deals) → FT,
   Bloomberg, Forbes, FIA technical/financial regulations PDF — always with a date, financial
   figures age fast
5. **Anything not covered by 1–4** → flag explicitly: `[VERIFY: X — source needed]`, do not
   estimate a number to fill the gap

## Before any stat becomes a headline number or chart

- [ ] Recompute it independently from the underlying table, don't trust a cached/remembered
      figure from a prior article — season-to-date numbers change every race
- [ ] Check units and scope match what's claimed (per-race average vs. season total; wins vs.
      podiums; is "fastest lap" the race's fastest lap or the historical circuit record — these
      get confused constantly and are two different claims)
- [ ] Sample size sanity check before calling anything "statistically anomalous" or a "record"
      — a rookie's first 6 races is not enough data to claim a career trend, say so if that's
      the actual sample
- [ ] Cross-check any dramatic number against a second angle before publishing (if a stat
      seems too clean or too extreme, verify it isn't a query bug — e.g. `fastest_lap_time`
      being parsed as text instead of time, a known historical bug class in this codebase)

## Chart/visualization integrity

- [ ] Never a pie chart (project-wide rule) — ranked lists or proportional bars instead
- [ ] Axis scales start at zero unless truncation is explicitly labeled and justified —
      truncated axes exaggerate small deltas and are a common bad-faith dataviz pattern
- [ ] If a chart implies certainty (a trend line, a projection), the uncertainty must be shown
      — this is the same principle behind the Delta Ribbon's projection cone (widens with
      distance) instead of a fake-precision percentage gauge. Never present a projection with
      the same visual confidence as a historical fact
- [ ] Color/encoding must be explained in a legend if it isn't self-evident from labels

## The new data-only vertical (beyond economics)

PaddockIntel is expanding past the economic-angle-only positioning into deep statistical/data
analysis as its own pillar — this is a real product bet, not a features add-on, and it raises
the bar on this advisor's checks because the entire credibility of the pillar rests on rigor:

- Every new statistical metric introduced (any "proprietary index," pace metric, or derived
  stat) needs a documented methodology page before it's cited in an article — readers and
  competitors alike need to be able to check the math. This is also an EEAT asset, not just
  data hygiene: see EEAT-EXPERT.md
- Before shipping a new metric, sanity-check it against known outcomes (does the metric agree
  with who actually won, or does it contradict on-track results in ways that need explaining?)
- Label clearly whether a metric is descriptive (what happened) or predictive (a forecast) —
  never blur the two
- No metric ships as "the first/only site doing X" without an actual competitive search
  confirming that claim — see SEO-EXPERT.md competitive positioning section

## Data pipeline integrity (project-wide, not per-article)

- [ ] `scripts/load_race.py` run after every race weekend before any article citing that
      race's results — never write an article assuming results without confirming the load
      completed (`SELECT round, name FROM races WHERE year = 2026 ORDER BY round`)
- [ ] Never call OpenF1 or jolpica-f1 directly from a request path — Supabase is the only
      runtime source of truth, this is a hard architectural rule, not a suggestion
- [ ] Any new derived table/materialized view gets a one-paragraph note on what it computes
      and from which source tables — future-you (or future Claude Code session) should not
      have to reverse-engineer a SQL view to know what it means
- [ ] `results.status_id` (populated verbatim from FastF1's `Status` field) does not reliably
      distinguish a crash from other generic retirement causes — `"Retired"` covers both. FastF1
      does not always generate a `race_control_messages` entry tied to the specific car when an
      incident ends in an immediate red flag. To confirm the real cause of a dramatic DNF, cross-
      check `race_control_messages` (look for `RED FLAG` near the retirement's lap) and external
      sources — never take `status_id`'s category as the full story. Verified case: Zandvoort
      2026, Verstappen — `status_id` said generic "Retired," the real event was a crash under red
      flag (confirmed against Formula1.com, Sky Sports, and other independent sources).

## When this advisor should block publication

Any unchecked non-negotiable, any number without a traceable source in the `sources`
frontmatter array, or any chart that could visually mislead — hold the piece:
`[DATA-HOLD: reason]`.
