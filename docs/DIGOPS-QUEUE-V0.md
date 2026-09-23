# DigOps editorial queue v0

Candidates only. The writer inserts `digest_items` under one draft issue. It does not publish, and it does not fill a public slug.

The publish gate is `digest_issues.status`. This issue is also `series = 'digops_queue'`, not `newsletter`, because two public reads filter on series and not on status. A newsletter draft would show up there. This series does not.

## Feed double-lock

Verified in code on 2026-09-23. This change does not edit those queries.

`/feed/[slug]` loads a row only when all of these hold (`app/[locale]/(digest)/feed/[slug]/page.tsx`):

- `digest_items.slug` equals the URL slug
- `digest_issues.status = 'published'`
- `digest_issues.series = 'newsletter'`

The same pair, `status = 'published'` and `series = 'newsletter'`, gates the Feed index, the sitemap's item URLs, the magazine Feed teaser, and the magazine entity-count badges.

These reads filter `series = 'newsletter'` and do not filter status:

- `app/[locale]/(digest)/weekly/[issue-slug]/page.tsx`
- `getAttentionThisWeek()` in `app/[locale]/(blog)/magazine-home/data.ts`

`/recaps` filters `series = 'recap'`. `app/api/digest/send` requires `status = 'published'`, `series = 'newsletter'`, `sent_at` null, and `published_at <= now()`.

A `digops_queue` draft misses every one of those. The item `slug` is left null, so there is still no `/feed/[slug]` URL if a later query forgot a filter. The sitemap also drops rows whose slug is null.

`digest_items` and `digest_issues` already have RLS on and no policies. The site reads them with the service role, then applies the filters above. The anon key is not a reader. The queue script uses the service role and refuses the anon key.

## Why this shape

An earlier draft of this work used a separate `digest_item_candidates` table. DigOps rejected that. Candidates are `digest_items`, and the issue status is the gate.

Attaching them to an existing newsletter draft was also rejected. `/weekly/[issue-slug]` and Attention This Week would count or render them, and `scripts/publish_digest.py` would publish that issue's children with it. On 2026-09-23 the project had one draft issue and 14 published. The queue does not touch those rows.

`series` was checked to `newsletter` or `recap` only. `digops_queue` cannot be inserted until `supabase/migrations/20260923020000_digest_issues_digops_queue_series.sql` is applied by hand in the SQL editor. That migration also requires a `digops_queue` issue to stay `status = 'draft'` with `published_at` and `sent_at` null. `publish_digest.py digops-queue` updates status to `published` and then fails that check. The script is not modified.

## Run order

Publish stays manual. The score cron is unchanged and does not enqueue. There is no queue cron. The score script still does not insert into `digest_items`.

1. Apply `supabase/migrations/20260923020000_digest_issues_digops_queue_series.sql` in the Supabase SQL editor. The queue script does not apply it.
2. Write scores. Dry-run first.

```bash
node scripts/score-beagle-v0.mjs
node scripts/score-beagle-v0.mjs --apply
```

`GET /api/cron/score-beagle` stays off unless `BEAGLE_SCORE_CRON=1`. It scores. It does not publish and it does not queue. On 2026-09-23 `beagle_item_scores` had no rows.

3. Queue. Dry-run is the default.

```bash
node scripts/queue-digest-candidates-v0.mjs --self-test
node scripts/queue-digest-candidates-v0.mjs
node scripts/queue-digest-candidates-v0.mjs --apply
```

4. A person rewrites `our_summary` on the rows they want. That edit still does not publish. Moving a rewritten row onto a real newsletter issue is a later step. This change does not do it.
5. Publishing a real issue is still `python scripts/publish_digest.py <slug>` after the advisor gates. Do not pass `digops-queue`.

Both scripts read `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the environment or `.env.local`. Neither fetches RSS.

## The holder issue

`--apply` inserts this row only when it is missing and at least one new item will be inserted. It never updates an issue. If `digops-queue` already exists and is not a holdable draft, the script stops before any insert.

| Column | Value |
|---|---|
| `slug` | `digops-queue` |
| `series` | `digops_queue` |
| `status` | `draft` |
| `published_at` | null |
| `sent_at` | null |
| `intro_synthesis` | `[DIGOPS DRAFT] Holder issue for the score queue. Not a newsletter. Do not publish.` |

One stable slug, not `digops-queue-YYYY-WW`. A weekly slug would open a new draft every run. Dedup is by `source_url` on this one issue.

## What each item contains

Source: top 25 `beagle_item_scores` where `rubric_version = 'v0'`, joined to `beagle_items` in the script, ordered by `score` descending, then `independent_outlet_count` descending, then `scored_at` descending, then `beagle_item_id` ascending.

| Column | Value |
|---|---|
| `issue_id` | the holder |
| `source_name` | `beagle_items.source_name` |
| `source_url` | `beagle_items.link` |
| `headline` | `beagle_items.title` (the wire headline, not a rewrite) |
| `our_summary` | `[DIGOPS DRAFT] Pending human rewrite — do not publish.` |
| `published_at` | `coalesce(beagle.published_at, beagle.fetched_at, now())` |
| `entity_tags` | `beagle_items.entity_tags` |
| `editor_note` | `digops-queue` |
| `stats` | trace object below |
| `slug`, `faq`, `meta_description`, `meta_description_es` | null |
| `editor_take`, `editor_take_es` | null |
| `internal_link_slug` | null |
| `headline_es`, `our_summary_es`, `editor_note_es` | null |

The em dash in `our_summary` is U+2014. The stub is exact. The wire title is not copied into `our_summary`.

`stats` is not the public stat-array shape. It is traceability, because `digest_items` has no `beagle_item_id` column and this change does not add one:

```json
{
  "digops_candidate": true,
  "beagle_item_id": "<uuid>",
  "score": 0,
  "rubric_version": "v0",
  "economic_payoff_flag": false
}
```

`economic_payoff_flag` is copied from the score row. The v0 scorer writes `false`. This writer does not set it to `true` and does not add a verified payoff. `score` is the number on that row. The writer does not recompute it.

Dedup is `source_url`. A URL already on the holder is skipped, and a repeated URL inside the same top 25 keeps the higher score. Existing rows are not updated, so a human rewrite of `our_summary` survives the next `--apply`. Rows that fall out of a later top 25 stay on the issue. The writer does not delete them.

`/feed/[slug]` calls `.map` on `stats`. That expects an array. These rows never reach that page: the slug is null, the issue is not published, and the series is not `newsletter`. Do not render this `stats` object as a stat block.

## How a person reviews

Service role in the SQL editor. This select does not publish.

```sql
select
  i.headline,
  i.source_name,
  i.source_url,
  i.our_summary,
  i.editor_note,
  i.editor_take,
  i.slug,
  i.stats,
  i.published_at
from public.digest_items i
join public.digest_issues s on s.id = i.issue_id
where s.slug = 'digops-queue'
  and s.series = 'digops_queue'
  and s.status = 'draft'
order by (i.stats->>'score')::numeric desc nulls last;
```

Replacing `our_summary` is the human rewrite. `editor_take` stays empty until that person writes it, against `docs/advisors/SPORTS-JOURNALISM-EXPERT.md`, `docs/advisors/SEO-EXPERT.md`, `docs/advisors/EEAT-EXPERT.md`, and `docs/advisors/DATA-EXPERT.md`. The queue does not draft it. `story_mode` is still a publish gate on the eventual newsletter copy, not a column here.

## Non-goals

- No auto-publish. The holder cannot leave `draft`.
- No update of any existing issue, published or draft.
- No call to `scripts/publish_digest.py` or `scripts/generate_digest_draft.py`.
- No `editor_take` / `editor_take_es`. No `internal_link_slug`.
- No `slug`, `faq`, or `meta_description` (+ `_es`). Nothing new on `/feed/[slug]`.
- No FEEDS change, and no RSS fetch.
- No new column on `beagle_items`, `articles`, or `digest_items`.
- No change to the score cron. Scoring is not publishing.
- No second score formula, and no invented economic payoff.
- No Living Archive work.
- No promote step that copies a rewritten row onto a newsletter issue.
