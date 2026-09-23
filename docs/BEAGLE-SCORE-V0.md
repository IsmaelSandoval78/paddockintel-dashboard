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

`economic_title_hint.verified` is `false` until a human has checked the claim against the article. A keyword in the title is not verification. While that hint is the only evidence, `economic_payoff_flag` stays `false`.

`eeat_incomplete: true` means Journalism, SEO, and EEAT have not been passed. v0 does not set it to `false`. Those gates are the advisor files, not this table:

- `docs/advisors/SPORTS-JOURNALISM-EXPERT.md`
- `docs/advisors/SEO-EXPERT.md`
- `docs/advisors/EEAT-EXPERT.md`
- `docs/advisors/DATA-EXPERT.md`

## Who reads it

DigOps — the editorial queue — uses these rows to decide what a person should look at next.

A high score does not publish. It does not insert into `digest_items`, does not write `articles`, and does not flip any published flag. Publish still requires the advisor gates above, including an original `our_summary` where the digest requires one. The existing `significanceScore` in `lib/entityMentions.ts` (entity-mention counts on the public feed) is a different number. v0 does not replace it.

## `signals` keys (v0)

`signals` is a JSON object. Unknown keys may be added later; v0 readers must understand these:

| Key | Shape | Meaning |
|---|---|---|
| `independent_outlets` | string array | Collapsed outlet labels that were counted. Length matches `independent_outlet_count` |
| `syndication_collapse` | object | Raw `source_name` values folded into a group. v0 group is Motorsport Network, e.g. `{ "Motorsport Network": ["Motorsport.com"] }`. Omit groups that did not fire |
| `source_tier` | string or null | Only a label that already exists in the feed notes (`scripts/beagle.mjs`, `docs/advisors/SEO-EXPERT.md`). v0 does not invent a tier enum. `null` if none is recorded |
| `economic_title_hint` | object | `{ "verified": false }` in v0. Optional short `hint` string for the phrase the matcher saw. `verified` stays `false` until a human checks the article |
| `eeat_incomplete` | boolean | `true` on every v0 row this pipeline writes. This table does not clear it |

Example, not a scored production row:

```json
{
  "independent_outlets": ["The Race", "BBC Sport", "Motorsport Network"],
  "syndication_collapse": { "Motorsport Network": ["Motorsport.com"] },
  "source_tier": null,
  "economic_title_hint": { "verified": false, "hint": "cost cap" },
  "eeat_incomplete": true
}
```

`independent_outlet_count` for that object is `3`. `economic_payoff_flag` is `false` because the hint is unverified.

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
