-- DigOps queue holder. Not a new items table.
--
-- Candidates are digest_items on one draft issue, slug digops-queue,
-- series digops_queue. The writer creates that row. This file only
-- makes the series legal and keeps it off the publish gate.
--
-- Feed double-lock, verified in code 2026-09-23 and left unchanged:
--   app/[locale]/(digest)/feed/[slug]/page.tsx
--     slug match AND digest_issues.status = 'published'
--     AND digest_issues.series = 'newsletter'
--   app/[locale]/(digest)/feed/page.tsx, app/sitemap.ts,
--   magazine-home teaser and entity counts:
--     series = 'newsletter' AND status = 'published'
--   /weekly/[issue-slug] and getAttentionThisWeek() filter
--     series = 'newsletter' and do not filter status. A newsletter
--     draft would leak there. digops_queue does not.
--   /recaps filters series = 'recap'.
--   app/api/digest/send requires published, newsletter, sent_at null,
--     and published_at <= now().
--
-- The old check is series in ('newsletter','recap'). digops_queue
-- cannot be inserted until that list grows. newsletter and recap
-- rows are unchanged.

alter table public.digest_issues
  drop constraint if exists digest_issues_series_check;

alter table public.digest_issues
  add constraint digest_issues_series_check
  check (series in ('newsletter', 'recap', 'digops_queue'));

-- publish_digest.py sets status = 'published' by slug and does not look
-- at series. This check makes that update fail for the queue issue.
-- A digops_queue row also cannot carry published_at or sent_at, so the
-- send cron has nothing to mail.

alter table public.digest_issues
  drop constraint if exists digest_issues_digops_queue_stays_draft;

alter table public.digest_issues
  add constraint digest_issues_digops_queue_stays_draft
  check (
    series is distinct from 'digops_queue'
    or (
      status = 'draft'
      and published_at is null
      and sent_at is null
    )
  );

comment on constraint digest_issues_digops_queue_stays_draft
  on public.digest_issues is
  'DigOps queue issue stays draft. It is not a newsletter and cannot be published or emailed. docs/DIGOPS-QUEUE-V0.md.';
