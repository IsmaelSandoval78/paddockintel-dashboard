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
export async function getBeagleEntityCounts(supabase: SupabaseClient): Promise<Map<string, number>> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('beagle_items')
    .select('entity_tags, published_at, fetched_at')
    .gte('fetched_at', sevenDaysAgo);

  const rows = (data ?? []) as { entity_tags: string[]; published_at: string | null; fetched_at: string }[];
  const items = rows.map((r) => ({ entity_tags: r.entity_tags, published_at: r.published_at ?? r.fetched_at }));

  return entityCountsInWindow(items, Date.now() - 7 * 24 * 60 * 60 * 1000, Date.now());
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
