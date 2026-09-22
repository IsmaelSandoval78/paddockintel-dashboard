import type { SupabaseClient } from '@supabase/supabase-js';
import { entityCountsInWindow } from '@/lib/entityMentions';

// Wide-pool sibling to lib/entityMentions.ts's digest_items-based counts. beagle_items
// (app/api/cron/refresh-beagle) tags every RSS item across ~15 feeds, not just the ~8
// curated digest_items/week -- a real "how much is the press actually covering this"
// signal instead of "how much did PaddockIntel choose to curate."
//
// published_at is nullable on beagle_items (some RSS entries lack a parseable pubDate) --
// coalesce to fetched_at (never null) so those items still count toward "this week"
// instead of silently dropping out of the window.
type BeagleRow = { entity_tags: string[]; published_at: string | null; fetched_at: string };

// PostgREST caps every response on this project at 1,000 rows and returns a short list
// rather than an error, so an unpaged 7-day select would score off an arbitrary slice
// once the pool outgrows the cap. Ordered by the `id` primary key because a whole cron
// run shares one fetched_at, which is not a stable order to page through.
const PAGE_SIZE = 1000;

export async function getBeagleEntityCounts(supabase: SupabaseClient): Promise<Map<string, number>> {
  const now = Date.now();
  const windowStart = now - 7 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(windowStart).toISOString();

  const rows: BeagleRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await supabase
      .from('beagle_items')
      .select('entity_tags, published_at, fetched_at')
      .or(`published_at.gte.${cutoff},and(published_at.is.null,fetched_at.gte.${cutoff})`)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    const page = (data ?? []) as BeagleRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  const items = rows.map((r) => ({ entity_tags: r.entity_tags, published_at: r.published_at ?? r.fetched_at }));

  return entityCountsInWindow(items, windowStart, now);
}

/** Merges two entity-count maps by taking the larger count per entity -- the two sources
 * count different things (curated digest_items vs. the raw press pool), so summing would
 * double-count overlap; the max is "whichever pool shows more real attention." */
export function mergeEntityCounts(a: Map<string, number>, b: Map<string, number>): Map<string, number> {
  const merged = new Map(a);
  for (const [entity, count] of b) {
    merged.set(entity, Math.max(merged.get(entity) ?? 0, count));
  }
  return merged;
}
