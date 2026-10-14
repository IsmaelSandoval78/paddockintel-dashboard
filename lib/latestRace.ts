import type { createClient } from '@/lib/supabase/server';
import { editorialToday } from '@/lib/dates';

type Client = ReturnType<typeof createClient>;

// The most recent races (by year, round) that a standings table has rows for, newest first.
// Not max race_id: ids aren't calendar order (2026 Bahrain R16 is id 1191, Singapore R17 is
// 1184), and not `races` by date alone — a race can exist before its results are imported.
export async function latestStandingsRaceIds(
  supabase: Client,
  count = 1,
  table: 'driver_standings' | 'constructor_standings' = 'driver_standings',
): Promise<number[]> {
  const { data: recentRaces } = await supabase
    .from('races')
    .select('id')
    .lte('date', editorialToday())
    .order('year', { ascending: false })
    .order('round', { ascending: false })
    .limit(30);
  const ids = (recentRaces ?? []).map((r) => r.id as number);
  if (!ids.length) return [];
  const { data: rows } = await supabase.from(table).select('race_id').in('race_id', ids);
  const withStandings = new Set((rows ?? []).map((r) => r.race_id as number));
  return ids.filter((id) => withStandings.has(id)).slice(0, count);
}

export async function getLatestStandingsRaceId(
  supabase: Client,
  table: 'driver_standings' | 'constructor_standings' = 'driver_standings',
): Promise<number | null> {
  return (await latestStandingsRaceIds(supabase, 1, table))[0] ?? null;
}
