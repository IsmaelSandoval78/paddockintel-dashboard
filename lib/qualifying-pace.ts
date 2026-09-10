import { createClient } from '@/lib/supabase/server';

// Qualifying Pace Delta — first metric of the "pure data" vertical (roadmap
// step 7 / docs/DECISIONS-2026-08-24-radical-pivot.md §4). Season aggregate
// only for v1: average % gap to session pole time, across every qualifying
// session a driver set a time in. Computed by the driver_qualifying_pace
// view (supabase/migrations/20260910200000_driver_qualifying_pace_view.sql)
// — descriptive, not predictive, see docs/advisors/DATA-EXPERT.md.

const CURRENT_SEASON = 2026;

export interface QualifyingPaceEntry {
  rank: number;
  driver_id: number;
  driver_ref: string | null;
  name: string;
  code: string | null;
  nationality: string | null;
  avgPctGap: number;
  sessions: number;
}

export async function fetchQualifyingPace(limit = 20): Promise<QualifyingPaceEntry[]> {
  const supabase = createClient();

  const { data: paceRows } = await supabase
    .from('driver_qualifying_pace')
    .select('driver_id, sessions, avg_pct_gap')
    .eq('year', CURRENT_SEASON)
    .order('avg_pct_gap', { ascending: true })
    .limit(limit);

  const rows = paceRows ?? [];
  if (!rows.length) return [];

  const driverIds = rows.map((r) => r.driver_id as number);
  const { data: driverRows } = await supabase
    .from('drivers')
    .select('id, forename, surname, driver_ref, code, nationality')
    .in('id', driverIds);

  const driverById = new Map((driverRows ?? []).map((d) => [d.id as number, d]));

  return rows.map((r, i) => {
    const driver = driverById.get(r.driver_id as number);
    const code = (driver?.code as string | null) ?? null;
    return {
      rank: i + 1,
      driver_id: r.driver_id as number,
      driver_ref: (driver?.driver_ref as string | null) ?? null,
      name: driver ? `${driver.forename as string} ${driver.surname as string}` : 'Unknown',
      code: code === '\\N' ? null : code,
      nationality: (driver?.nationality as string | null) ?? null,
      avgPctGap: Number(r.avg_pct_gap),
      sessions: Number(r.sessions),
    };
  });
}

// "+0.412%" style — always signed, 3 decimals matches qualifying-gap precision
export function formatPctGap(value: number, locale: string): string {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
  return `+${formatted}%`;
}
