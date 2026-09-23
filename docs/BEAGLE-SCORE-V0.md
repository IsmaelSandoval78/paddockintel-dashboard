# Beagle significance score v0

Schema and contract only. Nothing in this change scores a row, and nothing inserts into `digest_items`.

## Where the judgment lives

Scores go in **`beagle_item_scores`**, an auxiliary table. They do not become columns on `beagle_items`.

`beagle_items` is the raw ingest pool. `app/api/cron/refresh-beagle` upserts it on `link`, and `lib/beagleCounts.ts` counts it. Those paths need the pool intact: same columns, same `link` uniqueness, same `entity_tags`. A rescore must not rewrite a source row to store a judgment.

Migration: `supabase/migrations/20260923010000_beagle_item_scores.sql`.

| Column | Type | Role |
|---|---|---|
| `id` | `uuid` PK | Surrogate key |
| `beagle_item_id` | `uuid` FK → `beagle_items(id)` ON DELETE CASCADE | The pool row being judged |
| `independent_outlet_count` | `integer` ≥ 0 | Distinct outlets **after** syndication collapse. An input, not the score |
| `economic_payoff_flag` | `boolean` | Queue-sortable claim of a verifiable economic or data payoff |
| `score` | `numeric` | Rubric output. The scale belongs to `rubric_version`, not to this column |
| `signals` | `jsonb` object | Evidence behind the two columns above. Keys below |
| `rubric_version` | `text` | `v0` for this contract |
| `scored_at` | `timestamptz` | When this rubric version was last written |

Index: `(rubric_version, score desc)` for the queue.

### Why unique `(beagle_item_id, rubric_version)`

Not unique on `beagle_item_id` alone.

A later rubric has to sit next to v0 on the same item. DigOps compares versions; it does not lose the judgment it already queued the moment v1 is written. Rescoring **one** version updates that one row (`scored_at` moves). That is an upsert on the pair, not a log of every intermediate number. A full history of same-version rescores is a different table, and v0 does not create it.

Rows disappear only when the pool row is deleted (`ON DELETE CASCADE`). The cron does not delete pool rows today; the cascade is there so a future prune of `beagle_items` does not leave orphan judgments.

## What a scorer is allowed to read

The scorer reads **`beagle_items` rows the cron already stored**. It does not fetch RSS, and it does not grow a second `FEEDS` map beside `scripts/beagle.mjs` or `app/api/cron/refresh-beagle/route.ts`.

Those two feed lists already differ on purpose. The cron omits the non-English Motorsport.com locale feeds because they are one Motorsport Network story translated, and `beagle_items` is what `lib/beagleCounts.ts` counts. The radar script keeps them for a human reading the console. v0 does not "fix" that split by adding feeds to either list.

Columns the scorer uses from the pool: `id`, `source_name`, `title`, `link`, `entity_tags`, `published_at`, `fetched_at`. Nothing else is required to write a v0 row.

## Syndication collapse

`independent_outlet_count` counts **collapsed** outlets, not raw `source_name` strings.

Reuse the rule in `scripts/beagle.mjs`:

```js
const SYNDICATION_GROUPS = [[/^Motorsport\.com/, 'Motorsport Network']];
```

`outletOf` maps any `source_name` matching `/^Motorsport\.com/` to `Motorsport Network`. Every other `source_name` is its own outlet. Items stay stored under their own feed name; only the count collapses.

The cron route does not import that constant (the feed lists are copied by hand and already diverge). The scorer copies **this** collapse rule from `scripts/beagle.mjs`. It does not invent a third group list. If a new syndication family is real, it is added to `SYNDICATION_GROUPS` first, then the scorer follows.

When `signals.independent_outlets` is present it is that collapsed label list, and its length must equal `independent_outlet_count` (enforced in the migration).

## What the score is for

v0 boosts an item when two things are true together:

1. **Drama** — other newsrooms are actually on it, after the Motorsport Network collapse. One wire translated across locales is one outlet.
2. **A verifiable economic or data payoff** — cost cap, rights, prize money, a figure that can be checked against a primary source or against PaddockIntel's own tables. A title that merely sounds expensive is not that payoff.

Virality alone does not raise the score. `independent_outlet_count` is an input the rubric may use. It is not the ranking. This document does not set weights. Weights are the scoring job, and that job is not in this change.

`economic_title_hint.verified` is `false` until a human has checked the claim against the article. A keyword in the title is not verification. While that hint is the only evidence, `economic_payoff_flag` stays `false`. The same holds while `economic_mechanism` is `null`: v0 reserves the key and does not fill it.

`eeat_incomplete: true` means Journalism, SEO, and EEAT have not been passed. v0 does not set it to `false`. Those gates are the advisor files, not this table:

- `docs/advisors/SPORTS-JOURNALISM-EXPERT.md`
- `docs/advisors/SEO-EXPERT.md`
- `docs/advisors/EEAT-EXPERT.md`
- `docs/advisors/DATA-EXPERT.md`

## Who reads it

DigOps — the editorial queue — uses these rows to decide what a person should look at next.

A high score does not publish. It does not insert into `digest_items`, does not write `articles`, and does not flip any published flag. Publish still requires the advisor gates above, including an original `our_summary` where the digest requires one. The existing `significanceScore` in `lib/entityMentions.ts` (entity-mention counts on the public feed) is a different number. v0 does not replace it.

## `signals` keys (v0)

`signals` is a JSON object. The migration column comment names the first keys; this section is the shape. v0 reserves `primary_source`, `economic_mechanism`, `named_expert`, and `eeat_incomplete` even when the value is `null` or `true`/`false`. Those four keys are present on a v0 object. A missing key is not how v0 says "unknown."

| Key | v0 value | Shape when filled |
|---|---|---|
| `independent_outlets` | the collapsed list, or omit only if the count column stands alone | string array. Length matches `independent_outlet_count` |
| `syndication_collapse` | object, or omit when no group fired | Raw `source_name` values folded into a group. v0 group is Motorsport Network, e.g. `{ "Motorsport Network": ["Motorsport.com"] }` |
| `source_tier` | `null` until classified | string. Guidance below. Free text, not a database enum |
| `economic_title_hint` | `{ "verified": false }` | object. Optional short `hint` for the phrase the matcher saw. `verified` stays `false` until a human checks the article |
| `primary_source` | `null` | `{ "name": string, "url": string }` or `null`. The original document (an FIA release, a team statement, a Formula1.com page), not the RSS item that mentioned it |
| `economic_mechanism` | `null` | string or `null`. The mechanism itself (cost cap, prize money, contract cycle), distinct from a title keyword in `economic_title_hint` |
| `named_expert` | `null` | `{ "name": string, "platform": string, "link": string }` or `null`. All three together when set: real name, real platform, real link to the original statement (`docs/advisors/EEAT-EXPERT.md`). v0 does not invent a person from a headline |
| `eeat_incomplete` | `true` | boolean. Stays `true` on every row this pipeline writes. This table does not clear it |

`primary_source`, `economic_mechanism`, and `named_expert` are reserved so a later writer has a typed slot. v0 leaves them `null`. `eeat_incomplete` stays `true`.

Example, not a scored production row:

```json
{
  "independent_outlets": ["The Race", "BBC Sport", "Motorsport Network"],
  "syndication_collapse": { "Motorsport Network": ["Motorsport.com"] },
  "source_tier": null,
  "economic_title_hint": { "verified": false, "hint": "cost cap" },
  "primary_source": null,
  "economic_mechanism": null,
  "named_expert": null,
  "eeat_incomplete": true
}
```

`independent_outlet_count` for that object is `3`. `economic_payoff_flag` is `false` because the hint is unverified and `economic_mechanism` is null.

There is no `story_mode` key and no `drama_data_contradiction` key in this object. Both decisions are below.

### `source_tier` — first-party, syndicated, wire

v0 does not add a check constraint or a closed enum. `source_tier` stays a string or `null`. When a value is written, use one of these three labels, matched from the cron's `source_name` (the string `app/api/cron/refresh-beagle` stores), after syndication collapse:

| Label | What it means | Cron `source_name` examples |
|---|---|---|
| `first_party` | The organization speaking for itself | `FIA`, `Formula1.com`, `Liberty Media` |
| `syndicated` | One story repeated across a network, already collapsed | `Motorsport Network` (raw `source_name` `Motorsport.com`, and any future name matching `/^Motorsport\.com/` in `SYNDICATION_GROUPS`) |
| `wire` | Everyone else on the cron list: a newsroom or a wire. v0 does not split those two | `The Race`, `BBC Sport`, `RACER`, `Autosport`, `ESPN`, `Joe Saward` |

`Autosport` is its own cron `source_name`. `SYNDICATION_GROUPS` does not fold it into Motorsport Network, so it stays `wire` until that constant changes. The current cron list is covered by the three labels: the three first-party names, collapsed Motorsport Network, and `wire` for every other `source_name`. A feed added later that fits none of those readings stays `null` until this table of examples is extended. v0 does not invent a fourth label for a single feed.

### `story_mode` is a publish gate

`story_mode` (`fact` | `analysis` | `opinion`) is **not** a v0 scorer signal. It is entirely a publish gate.

`docs/advisors/SPORTS-JOURNALISM-EXPERT.md` requires the published piece to show the reader which sentence is reported fact, which is analysis, and which is opinion (opinion belongs in the Verdict). That label describes PaddockIntel's own copy. The cron pool only has `source_name`, `title`, `link`, and `entity_tags`. A scorer that wrote `fact` or `opinion` from a headline would be guessing, and a guess in `signals` would look like the gate had already been passed.

DigOps does not read `story_mode` off `beagle_item_scores`. The human applies it when writing, against the journalism advisor, before anything enters `digest_items` or `articles`.

### v0.1 optional signal — drama vs Hub data (out of this migration)

v0.1 may add an optional `signals` key, `drama_data_contradiction` (boolean or `null`). v0 does not write it, and this migration does not add a column for it.

The key means: the wire drama and PaddockIntel's own Hub history disagree. The press is repeating a row, a penalty, or a driver argument, and the career or season record (wins, championships, head-to-head, DNFs in `driver_stats` / `results`) says something else. That is the Feed rule already in force for humans: `EDITORIAL.md` "The drama rule" and `docs/ROADMAP-SEMANA.md` (16 Sep 2026) — an Alonso/Sainz argument still needs who is champion and who has the wins. The contradiction is the wedge. It is not a virality boost, and it is not required to queue a v0 row.

It sits in v0.1 because it needs a Hub read the v0 contract does not perform. Adding it later is a new `rubric_version` (or a doc revision that still does not publish), not a change to `beagle_items`.

## Access

RLS is on. There is no policy, and `anon` / `authenticated` have no grants. The public site does not read this table. `service_role` has `SELECT`, `INSERT`, `UPDATE`, `DELETE` for a future server-side scorer and for the queue. `service_role` bypasses RLS and still needs that grant — same failure mode as `beagle_items` on 2026-09-18. `DELETE` is granted up front so a replace-the-row writer does not discover the miss in production.

These rows are editorial judgments, not user data. No client bundle key should write them.

## Non-goals

- No scoring cron, script, or route that writes judgments.
- No auto-publish, and no insert into `digest_items` or `articles`.
- No change to either `FEEDS` list.
- No new columns on `beagle_items`.
- No numeric formula, weights, or threshold for "high enough to queue."
- No second syndication map.
- No change to `lib/entityMentions.ts` `significanceScore` or to the public feed badge.
- No `story_mode` on the score row. Fact, analysis, and opinion stay on the publish gate.
- No `drama_data_contradiction` key and no migration change for it. That signal is v0.1, optional, and unread here.
