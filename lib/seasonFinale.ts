// Year -> race id of that season's finale: the highest round on the calendar, including rounds
// not run yet. A title counts only when the standings row *at that race* says P1, so a season
// still in progress (no standings at its finale yet) is never counted as a championship.
// Same rule as the driver_stats / constructor_stats views (migration 20261013160000).
export function finaleRaceIdByYear(races: { id: unknown; year: unknown; round: unknown }[]): Map<number, number> {
  const best = new Map<number, { id: number; round: number }>();
  for (const r of races) {
    const year = r.year as number;
    const round = r.round as number;
    const cur = best.get(year);
    if (!cur || round > cur.round) best.set(year, { id: r.id as number, round });
  }
  return new Map([...best].map(([year, v]) => [year, v.id]));
}
