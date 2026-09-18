// Shared by app/[locale]/(digest)/feed/page.tsx ("most mentioned this week" +
// each item's significance score) and magazine-home's "Most Covered" panel.
// Pure function, no DB access — callers fetch their own rows (Feed needs
// full item objects, magazine-home only needs entity_tags/published_at).

export type EntityCount = { entity: string; count: number };

/** Entity mention counts for items published in [startMs, endMs). */
export function entityCountsInWindow(
  items: { entity_tags: string[]; published_at: string }[],
  startMs: number,
  endMs: number
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const t = new Date(item.published_at).getTime();
    if (t < startMs || t >= endMs) continue;
    for (const entity of item.entity_tags) {
      counts.set(entity, (counts.get(entity) ?? 0) + 1);
    }
  }
  return counts;
}

export function weeklyEntityCounts(items: { entity_tags: string[]; published_at: string }[]): Map<string, number> {
  return entityCountsInWindow(items, Date.now() - 7 * 24 * 60 * 60 * 1000, Date.now());
}

export function topEntity(counts: Map<string, number>): EntityCount | null {
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  return top ? { entity: top[0], count: top[1] } : null;
}

/** An item's significance = the highest count among its own entity_tags in `counts` --
 * shared by app/[locale]/(digest)/feed/page.tsx's per-card badge and magazine-home's
 * Feed teaser, so both surfaces score the same item identically. */
export function significanceScore(item: { entity_tags: string[] }, counts: Map<string, number>): number {
  if (item.entity_tags.length === 0) return 1;
  return Math.max(1, ...item.entity_tags.map((tag) => counts.get(tag) ?? 1));
}
