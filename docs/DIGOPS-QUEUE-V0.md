# DigOps editorial queue v0

Candidates only. Nothing in this change publishes, and nothing becomes a public Feed item until a person promotes it later. This change does not build that promote step.

Scores come from `beagle_item_scores` (`docs/BEAGLE-SCORE-V0.md`). The queue copies the top 25 rubric `v0` rows into `digest_item_candidates`. Ismael accepts or rejects those rows. `accepted` stays on this table. It is not a published issue and it is not a `/feed/[slug]` page.

## Run order

Publish stays manual. The score cron is unchanged and does not call this queue. There is no queue cron.

1. Apply `supabase/migrations/20260923010000_beagle_item_scores.sql` if it is not already on the project, then apply `supabase/migrations/20260923020000_digest_item_candidates.sql`. Both are hand-run in the Supabase SQL editor. Neither script applies them.
2. Write scores. Dry-run first. `--apply` upserts `beagle_item_scores` only.

```bash
node scripts/score-beagle-v0.mjs
node scripts/score-beagle-v0.mjs --apply
```

`GET /api/cron/score-beagle` already exists and stays off unless `BEAGLE_SCORE_CRON=1`. It scores. It does not queue. The script is the path DigOps runs. On 2026-09-23 `beagle_item_scores` had no rows — the scorer had not been applied yet. The queue writer is ready either way: with no v0 scores it prints the score command and writes nothing.

3. Queue candidates. Dry-run is the default. `--apply` upserts `digest_item_candidates` only.

```bash
node scripts/queue-digest-candidates-v0.mjs --self-test
node scripts/queue-digest-candidates-v0.mjs
node scripts/queue-digest-candidates-v0.mjs --apply
```

4. A person reviews `status = 'queued'` (SQL below). They may fill `editor_note`, `editor_take`, `stats`, `slug`, and `faq`. They set `status` to `accepted` or `rejected`.
5. Publish is still a separate command on a real digest issue, after the advisor gates: `python scripts/publish_digest.py <slug>`. The queue never calls it. `accepted` does not make that command run.

Both scripts read `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the environment or from `.env.local`. The queue script refuses to run when that key is the anon key. Neither script fetches RSS.

## Why this is not a draft issue

`/feed`, `/feed/[slug]`, the sitemap, and the magazine Feed teaser only read `digest_items` whose parent `digest_issues` row is `status = 'published'` and `series = 'newsletter'`. That filter is real, and it is not a safe bin for candidates.

- `digest_items.issue_id`, `headline`, `our_summary`, `source_name`, `source_url`, and `published_at` are `NOT NULL`. A candidate with empty editorial slots cannot be inserted there. The queue must not invent `our_summary` or `editor_take`.
- `digest_items` has no `queued|accepted|rejected` column. `scripts/publish_digest.py` sets the parent issue to `published`, and every child row goes public with it. On 2026-09-23 the project had one draft issue and 14 published. Attaching the top 25 to that draft would publish them the next time that draft is published.
- `app/[locale]/(digest)/weekly/[issue-slug]/page.tsx` loads a newsletter issue by slug with no status check, then loads every `digest_items` row on it. A draft issue with a known slug is already a page.
- `getAttentionThisWeek()` in `app/[locale]/(blog)/magazine-home/data.ts` counts `digest_items` for every `series = 'newsletter'` issue, drafts included. Candidate rows on a draft issue would move the public "Attention This Week" counts.

`digest_item_candidates` is a different table. No page, sitemap entry, or Feed query selects it. The draft slug column on a candidate is a label for a person. It is not a route.

## What the writer copies

The cut is `beagle_item_scores` where `rubric_version = 'v0'`, ordered by `score` descending, then `independent_outlet_count` descending, then `scored_at` descending, then `beagle_item_id` ascending, limit 25. The score column is numeric. The order is the database order, not a string sort.

One row per `beagle_item_id`. `--apply` upserts on that key.

| Existing row | What `--apply` does |
|---|---|
| None | Insert. `status` defaults to `queued`. Editorial slots stay null. `queued_at` defaults to `now()`. |
| `queued` | Refresh the score snapshot (`score_id`, `score`, `independent_outlet_count`, `economic_payoff_flag`, `signals`, `scored_at`, `updated_at`). Status and editorial slots stay as they are. |
| `accepted` or `rejected` | Leave the row untouched, including the snapshot the person decided against. |
| Anything else | Leave it untouched. |

Rows that fall out of a later top 25 stay in the table. The writer does not delete them. It does not insert a second row for the same pool item.

The snapshot is a copy. A later rescore does not move an accepted or rejected row. It does refresh a row that is still `queued`, on the next `--apply`.

The write payload is only the snapshot columns. It has no `editor_note`, `editor_take`, `stats`, `slug`, `faq`, `status`, `headline`, or `our_summary`. `economic_payoff_flag` is copied from the score row. This writer does not set it to true and does not clear it.

`rubric_version` on the candidate is checked to `'v0'`. A later rubric needs a new migration before it can be queued. This script refuses any other version.

## Schema

Migration: `supabase/migrations/20260923020000_digest_item_candidates.sql`.

| Column | Type | Role |
|---|---|---|
| `id` | `uuid` PK | Surrogate key |
| `beagle_item_id` | `uuid` FK → `beagle_items(id)` ON DELETE CASCADE | The pool row. Unique |
| `score_id` | `uuid` FK → `beagle_item_scores(id)` ON DELETE SET NULL | Which score row was copied. The numbers below remain if that row is deleted |
| `rubric_version` | `text` | `'v0'` only, for this queue |
| `score` | `numeric` | Snapshot |
| `independent_outlet_count` | `integer` ≥ 0 | Snapshot |
| `economic_payoff_flag` | `boolean` | Snapshot |
| `signals` | `jsonb` object | Snapshot |
| `scored_at` | `timestamptz` | Snapshot of when the score was written |
| `status` | `queued` \| `accepted` \| `rejected` | Default `queued` |
| `editor_note` | `text` null | Human slot. Writer leaves it null |
| `editor_take` | `text` null | Human slot. Writer leaves it null |
| `stats` | `jsonb` array or null | Human slot. Writer leaves it null |
| `slug` | `text` null | Human slot. Not a public route. Unique when set |
| `faq` | `jsonb` array or null | Human slot. Writer leaves it null |
| `queued_at` | `timestamptz` | Set on insert. Not moved on refresh |
| `updated_at` | `timestamptz` | Moved when the writer refreshes a queued snapshot |

Title, link, and `source_name` stay on `beagle_items`. The queue does not copy them into headline columns.

The slug unique index does not look at `digest_items.slug`. A future promote step, which this change does not include, has to check that itself.

## Access

RLS is on. There is no policy. `anon`, `authenticated`, and `public` have no grants. `service_role` has `SELECT`, `INSERT`, `UPDATE`, `DELETE`. `service_role` bypasses RLS and still needs the grant — same failure mode as `beagle_items` on 2026-09-18.

`accepted` does not add a read for `anon` or `authenticated`. The row is still an unpublished candidate.

These rows are editorial judgments, not user data. The script uses the service role locally. It does not ship the key to the browser. No client component imports it.

## How a person reviews

Service role in the SQL editor. This select does not publish.

```sql
select
  c.status,
  c.score,
  c.independent_outlet_count,
  c.economic_payoff_flag,
  c.editor_note,
  c.editor_take,
  c.slug,
  c.queued_at,
  c.updated_at,
  i.source_name,
  i.title,
  i.link,
  i.entity_tags
from public.digest_item_candidates c
join public.beagle_items i on i.id = c.beagle_item_id
where c.status = 'queued'
order by c.score desc, c.independent_outlet_count desc;
```

Setting `status` and filling the slots is a manual update. Example shape, not a command this repo runs:

```sql
update public.digest_item_candidates
set status = 'accepted', updated_at = now()
where beagle_item_id = '<uuid from the select>';
```

`editor_take` is the person's sentence, written after they have read the piece, against `docs/advisors/SPORTS-JOURNALISM-EXPERT.md`, `docs/advisors/SEO-EXPERT.md`, `docs/advisors/EEAT-EXPERT.md`, and `docs/advisors/DATA-EXPERT.md`. The queue does not draft it. `story_mode` is still a publish gate on the eventual Feed copy, not a column here (`docs/BEAGLE-SCORE-V0.md`).

## Non-goals

- No auto-publish. `accepted` is not published.
- No insert into `digest_items` or `articles`.
- No update of `digest_issues.status`, `published_at`, or `sent_at`.
- No call to `scripts/publish_digest.py` or `scripts/generate_digest_draft.py`.
- No `editor_take`, `editor_note`, `stats`, `slug`, or `faq` written by the script.
- No public route, no sitemap URL, no change to `/feed` or `/feed/[slug]`.
- No FEEDS change, and no RSS fetch.
- No Living Archive work.
- No queue cron. Scoring cron stays as it is and does not enqueue.
- No promote step that copies an accepted candidate onto an issue. That is a later change, and it still would not publish by itself.
- No second score formula. The queue does not recompute `score`.
