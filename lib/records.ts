import { createClient } from '@/lib/supabase/server';

// ─── Record categories (v1 — drivers only, driver_stats/driver_win_streaks) ──

export const RECORD_SLUGS = [
  'most-wins',
  'most-poles',
  'most-podiums',
  'most-fastest-laps',
  'most-championships',
  'most-points',
  'longest-win-streak',
] as const;

export type RecordSlug = (typeof RECORD_SLUGS)[number];

export function isRecordSlug(slug: string): slug is RecordSlug {
  return (RECORD_SLUGS as readonly string[]).includes(slug);
}

// driver_stats column each stat-based category ranks by
const STAT_COLUMN: Record<Exclude<RecordSlug, 'longest-win-streak'>, string> = {
  'most-wins': 'wins',
  'most-poles': 'poles',
  'most-podiums': 'podiums',
  'most-fastest-laps': 'fastest_laps',
  'most-championships': 'championships',
  'most-points': 'total_points',
};

export interface RecordEntry {
  rank: number;
  driver_id: number;
  driver_ref: string | null;
  name: string;
  code: string | null;
  nationality: string | null;
  value: number;
  // stat categories: career span "1950–1958" · streak: end year "2023"
  era: string | null;
}

async function fetchDriverRefs(
  driverIds: number[]
): Promise<Map<number, { driver_ref: string; code: string | null; nationality: string | null }>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('drivers')
    .select('id, driver_ref, code, nationality')
    .in('id', driverIds);
  return new Map(
    (data ?? []).map((d) => [
      d.id as number,
      {
        driver_ref: d.driver_ref as string,
        code: (d.code as string | null) === '\\N' ? null : ((d.code as string | null) ?? null),
        nationality: (d.nationality as string | null) ?? null,
      },
    ])
  );
}

async function fetchStatRecord(slug: Exclude<RecordSlug, 'longest-win-streak'>, limit: number): Promise<RecordEntry[]> {
  const supabase = createClient();
  const col = STAT_COLUMN[slug];
  let query = supabase
    .from('driver_stats')
    .select(`driver_id, name, code, nationality, first_year, last_year, ${col}`)
    .order(col, { ascending: false })
    .order('driver_id', { ascending: true })
    .limit(limit);
  if (slug === 'most-championships') query = query.gt('championships', 0);
  const { data } = await query;

  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const refs = await fetchDriverRefs(rows.map((r) => r.driver_id as number));

  return rows.map((r, i) => {
    const first = r.first_year as number | null;
    const last = r.last_year as number | null;
    return {
      rank: i + 1,
      driver_id: r.driver_id as number,
      driver_ref: refs.get(r.driver_id as number)?.driver_ref ?? null,
      name: r.name as string,
      code: (r.code as string | null) === '\\N' ? null : ((r.code as string | null) ?? null),
      nationality: (r.nationality as string | null) ?? null,
      value: Number(r[col]),
      era: first && last ? `${first}–${last}` : null,
    };
  });
}

async function fetchStreakRecord(limit: number): Promise<RecordEntry[]> {
  const supabase = createClient();
  // View has no code/nationality — join drivers by driver_id (see RECORDS-HUB-SPEC.md)
  const { data } = await supabase
    .from('driver_win_streaks')
    .select('driver_id, forename, surname, streak_len, end_year')
    .order('streak_len', { ascending: false })
    .order('end_year', { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const refs = await fetchDriverRefs([...new Set(rows.map((r) => r.driver_id as number))]);

  return rows.map((r, i) => {
    const extra = refs.get(r.driver_id as number);
    return {
      rank: i + 1,
      driver_id: r.driver_id as number,
      driver_ref: extra?.driver_ref ?? null,
      name: `${r.forename as string} ${r.surname as string}`,
      code: extra?.code ?? null,
      nationality: extra?.nationality ?? null,
      value: r.streak_len as number,
      era: r.end_year != null ? String(r.end_year) : null,
    };
  });
}

export async function fetchRecord(slug: RecordSlug, limit = 10): Promise<RecordEntry[]> {
  return slug === 'longest-win-streak' ? fetchStreakRecord(limit) : fetchStatRecord(slug, limit);
}

export async function fetchAllRecords(limit = 3): Promise<Record<RecordSlug, RecordEntry[]>> {
  const results = await Promise.all(RECORD_SLUGS.map((slug) => fetchRecord(slug, limit)));
  return Object.fromEntries(RECORD_SLUGS.map((slug, i) => [slug, results[i]])) as Record<
    RecordSlug,
    RecordEntry[]
  >;
}

// Locale-aware value formatting — points carry decimals (e.g. 4405.5), rest are integers
export function formatRecordValue(slug: RecordSlug, value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: slug === 'most-points' ? 1 : 0,
  }).format(value);
}
