// Shared by app/[locale]/(digest)/feed/page.tsx ("most mentioned this week" +
// each item's significance score) and magazine-home's "Most Covered" panel.
// Pure function, no DB access — callers fetch their own rows (Feed needs
// full item objects, magazine-home only needs entity_tags/published_at).

export type EntityCount = { entity: string; count: number };

export function weeklyEntityCounts(items: { entity_tags: string[]; published_at: string }[]): Map<string, number> {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const counts = new Map<string, number>();
  for (const item of items) {
    if (new Date(item.published_at).getTime() < cutoff) continue;
    for (const entity of item.entity_tags) {
      counts.set(entity, (counts.get(entity) ?? 0) + 1);
    }
  }
  return counts;
}

export function topEntity(counts: Map<string, number>): EntityCount | null {
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  return top ? { entity: top[0], count: top[1] } : null;
}
