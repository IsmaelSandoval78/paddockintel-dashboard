import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';

type PageParams = Promise<{ locale: string; slug: string }>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEAM_COLORS: Record<string, string> = {
  mercedes:     'var(--team-mercedes)',
  mclaren:      'var(--team-mclaren)',
  red_bull:     'var(--team-redbull)',
  ferrari:      'var(--team-ferrari)',
  alpine:       'var(--team-alpine)',
  aston_martin: 'var(--team-aston)',
  haas:         'var(--team-haas)',
  williams:     'var(--team-williams)',
  sauber:       'var(--team-sauber)',
  kick_sauber:  'var(--team-sauber)',
  rb:           'var(--team-rb)',
  alphatauri:   'var(--team-rb)',
};

function teamColor(ref: string): string {
  return TEAM_COLORS[ref] ?? 'var(--text-3)';
}

function cleanLapTime(t: string | null | undefined): string | null {
  if (!t || t === '\\N' || t.trim() === '') return null;
  return t;
}

// ─── Static generation ────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const supabase = createClient();
  const { data } = await supabase.from('constructors').select('constructor_ref');
  const slugs = (data ?? []).map((c) => c.constructor_ref as string).filter(Boolean);
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();
  const { data } = await supabase
    .from('constructors')
    .select('name, nationality')
    .eq('constructor_ref', slug)
    .single();
  if (!data) return { title: 'Constructor — PaddockIntel' };
  const name = data.name as string;
  return {
    title: `${name} — PaddockIntel`,
    description: `Season records, win history, and driver roster for ${name} (${data.nationality as string}).`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ConstructorDetailPage({ params }: { params: PageParams }) {
  const { slug } = await params;
  const t = await getTranslations('constructorDetail');
  const supabase = createClient();

  // Batch 1 — constructor by slug
  const { data: constructorRaw } = await supabase
    .from('constructors')
    .select('id, constructor_ref, name, nationality')
    .eq('constructor_ref', slug)
    .single();

  if (!constructorRaw) notFound();

  const constructor = {
    id: constructorRaw.id as number,
    constructor_ref: constructorRaw.constructor_ref as string,
    name: constructorRaw.name as string,
    nationality: constructorRaw.nationality as string,
  };

  const color = teamColor(constructor.constructor_ref);

  // Batch 2 — career stats + all results (parallel)
  const [statsRes, resultsRes] = await Promise.all([
    supabase
      .from('constructor_stats')
      .select('races, wins, first_year, last_year')
      .eq('constructor_id', constructor.id)
      .single(),
    supabase
      .from('results')
      .select('race_id, driver_id, position, points, fastest_lap, fastest_lap_time')
      .eq('constructor_id', constructor.id),
  ]);

  const stats = statsRes.data;
  const allResults = resultsRes.data ?? [];

  const allRaceIds = [...new Set(allResults.map((r) => r.race_id as number))];
  const allDriverIds = [...new Set(allResults.map((r) => r.driver_id as number))];

  // Early return — no race data
  if (!allRaceIds.length || !stats) {
    return (
      <main className="flex flex-col">
        <div className="h-10 px-6 border-b border-border flex items-center gap-2 shrink-0">
          <Link
            href="/constructors"
            className="font-mono text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150"
          >
            {t('breadcrumb.constructors')}
          </Link>
          <span className="font-mono text-[11px] text-text-3">·</span>
          <span className="font-mono text-[11px] text-text-2">{constructor.name}</span>
        </div>
        <div
          className="px-6 pt-8 pb-7 border-b border-border"
          style={{ borderLeft: `3px solid ${color}`, paddingLeft: '21px' }}
        >
          <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] mb-3">
            {t('hero.label')}
          </p>
          <h1 className="font-serif text-5xl text-text-1 leading-[1.1] mb-2">
            {constructor.name}
          </h1>
          <p className="font-mono text-[12px] text-text-3">{constructor.nationality}</p>
        </div>
        <div className="px-6 py-12">
          <p className="font-mono text-[13px] text-text-3">{t('noData')}</p>
        </div>
      </main>
    );
  }

  // Batch 3 — race metadata + driver names + qualifying (parallel)
  const [racesRes, driversRes, qualiRes] = await Promise.all([
    supabase
      .from('races')
      .select('id, year, round, name')
      .in('id', allRaceIds)
      .order('year', { ascending: true })
      .order('round', { ascending: true }),
    supabase
      .from('drivers')
      .select('id, forename, surname, driver_ref')
      .in('id', allDriverIds),
    allDriverIds.length
      ? supabase
          .from('qualifying')
          .select('race_id, driver_id, position')
          .in('driver_id', allDriverIds)
      : Promise.resolve({
          data: [] as { race_id: unknown; driver_id: unknown; position: unknown }[],
          error: null,
        }),
  ]);

  const raceById = new Map(
    (racesRes.data ?? []).map((r) => [
      r.id as number,
      { year: r.year as number, round: r.round as number, name: r.name as string },
    ])
  );

  const driverById = new Map(
    (driversRes.data ?? []).map((d) => [
      d.id as number,
      {
        forename: d.forename as string,
        surname: d.surname as string,
        driverRef: d.driver_ref as string,
      },
    ])
  );

  // Set of "race_id_driver_id" pairs — used to verify qualifying poles belonged to this constructor
  const constructorDriverRaceSet = new Set<string>();
  for (const r of allResults) {
    constructorDriverRaceSet.add(`${r.race_id as number}_${r.driver_id as number}`);
  }

  // Find last race per year (highest round among this constructor's races)
  const lastRacePerYear = new Map<number, number>(); // year → race_id
  for (const r of allResults) {
    const raceId = r.race_id as number;
    const race = raceById.get(raceId);
    if (!race) continue;
    const cur = lastRacePerYear.get(race.year);
    if (cur === undefined) {
      lastRacePerYear.set(race.year, raceId);
    } else {
      const curRace = raceById.get(cur);
      if (curRace && race.round > curRace.round) {
        lastRacePerYear.set(race.year, raceId);
      }
    }
  }

  const lastRaceIds = [...lastRacePerYear.values()];

  // Batch 4 — championship standings at season-end races
  const { data: standingsRaw } = lastRaceIds.length
    ? await supabase
        .from('constructor_standings')
        .select('race_id, position, points, wins')
        .eq('constructor_id', constructor.id)
        .in('race_id', lastRaceIds)
    : {
        data: [] as {
          race_id: unknown;
          position: unknown;
          points: unknown;
          wins: unknown;
        }[],
      };

  const standingsByRaceId = new Map(
    (standingsRaw ?? []).map((s) => [
      s.race_id as number,
      {
        position: s.position as number,
        points: s.points as number,
        wins: s.wins as number,
      },
    ])
  );

  // ─── Championships ────────────────────────────────────────────────────────

  const championshipYears: number[] = [];
  for (const [year, raceId] of lastRacePerYear.entries()) {
    const standing = standingsByRaceId.get(raceId);
    if (standing?.position === 1) championshipYears.push(year);
  }
  championshipYears.sort((a, b) => a - b);

  // ─── Single-pass aggregation over allResults ──────────────────────────────

  let totalPodiums = 0;
  let totalFastestLaps = 0;

  type SeasonEntry = { races: number; wins: number; podiums: number };
  const seasonMap = new Map<number, SeasonEntry>();

  type DriverEntry = { races: number; wins: number; podiums: number; years: Set<number> };
  const driverStatsMap = new Map<number, DriverEntry>();

  for (const r of allResults) {
    const raceId = r.race_id as number;
    const driverId = r.driver_id as number;
    const race = raceById.get(raceId);
    if (!race) continue;

    const rawPos = r.position;
    const pos =
      rawPos !== null && rawPos !== undefined
        ? (() => { const n = Number(rawPos); return isNaN(n) ? null : n; })()
        : null;

    // Season totals
    const season = seasonMap.get(race.year) ?? { races: 0, wins: 0, podiums: 0 };
    season.races += 1;
    if (pos === 1) season.wins += 1;
    if (pos !== null && pos <= 3) season.podiums += 1;
    seasonMap.set(race.year, season);

    // Driver totals
    const dEntry = driverStatsMap.get(driverId) ?? {
      races: 0,
      wins: 0,
      podiums: 0,
      years: new Set<number>(),
    };
    dEntry.races += 1;
    if (pos === 1) dEntry.wins += 1;
    if (pos !== null && pos <= 3) dEntry.podiums += 1;
    dEntry.years.add(race.year);
    driverStatsMap.set(driverId, dEntry);

    // Career totals
    if (pos !== null && pos <= 3) totalPodiums += 1;
    if (r.fastest_lap !== null && r.fastest_lap !== undefined) totalFastestLaps += 1;
  }

  // Pole count — qualifying P1s cross-referenced with constructor race entries
  let poleCount = 0;
  for (const q of (qualiRes.data ?? [])) {
    const rawPos = q.position;
    const pos =
      rawPos !== null && rawPos !== undefined ? Number(rawPos) : null;
    if (pos !== 1) continue;
    if (constructorDriverRaceSet.has(`${q.race_id as number}_${q.driver_id as number}`)) {
      poleCount++;
    }
  }

  const winPct =
    (stats.races as number) > 0
      ? (((stats.wins as number) / (stats.races as number)) * 100).toFixed(1)
      : '0.0';

  // ─── Season rows (desc) ───────────────────────────────────────────────────

  type SeasonRow = {
    year: number;
    position: number | null;
    points: number;
    wins: number;
    podiums: number;
    races: number;
  };

  const seasonRows: SeasonRow[] = [...seasonMap.entries()]
    .map(([year, s]) => {
      const lastRaceId = lastRacePerYear.get(year);
      const standing = lastRaceId ? standingsByRaceId.get(lastRaceId) : undefined;
      return {
        year,
        position: standing?.position ?? null,
        points: standing?.points ?? 0,
        wins: s.wins,
        podiums: s.podiums,
        races: s.races,
      };
    })
    .sort((a, b) => b.year - a.year);

  // ─── Win rows (desc) ──────────────────────────────────────────────────────

  type WinRow = {
    year: number;
    raceName: string;
    driverName: string;
    fastestLap: string | null;
  };

  const winRows: WinRow[] = allResults
    .flatMap((r) => {
      const rawPos = r.position;
      if (rawPos === null || rawPos === undefined || Number(rawPos) !== 1) return [];
      const race = raceById.get(r.race_id as number);
      if (!race) return [];
      const driver = driverById.get(r.driver_id as number);
      return [
        {
          year: race.year,
          raceName: race.name,
          driverName: driver ? `${driver.forename} ${driver.surname}` : '—',
          fastestLap: cleanLapTime(r.fastest_lap_time as string | null),
        },
      ];
    })
    .sort((a, b) => b.year - a.year || a.raceName.localeCompare(b.raceName));

  // ─── Driver rows (desc by races) ──────────────────────────────────────────

  type DriverRow = {
    driverId: number;
    name: string;
    firstYear: number;
    lastYear: number;
    races: number;
    wins: number;
    podiums: number;
  };

  const driverRows: DriverRow[] = [...driverStatsMap.entries()]
    .flatMap(([driverId, s]) => {
      const d = driverById.get(driverId);
      if (!d) return [];
      const years = [...s.years].sort((a, b) => a - b);
      return [
        {
          driverId,
          name: `${d.forename} ${d.surname}`,
          firstYear: years[0],
          lastYear: years[years.length - 1],
          races: s.races,
          wins: s.wins,
          podiums: s.podiums,
        },
      ];
    })
    .sort((a, b) => b.races - a.races);

  const maxDriverRaces = driverRows[0]?.races ?? 1;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="flex flex-col">

      {/* Breadcrumb */}
      <div className="h-10 px-6 border-b border-border flex items-center gap-2 shrink-0">
        <Link
          href="/constructors"
          className="font-mono text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150"
        >
          {t('breadcrumb.constructors')}
        </Link>
        <span className="font-mono text-[11px] text-text-3">·</span>
        <span className="font-mono text-[11px] text-text-2 truncate">
          {constructor.name}
        </span>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div
        className="pt-8 pb-7 border-b border-border"
        style={{ borderLeft: `3px solid ${color}`, paddingLeft: '21px', paddingRight: '24px' }}
      >
        <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] mb-3">
          {t('hero.label')}
        </p>
        <h1 className="font-serif text-5xl text-text-1 leading-[1.1] mb-2">
          {constructor.name}
        </h1>
        <p className="font-mono text-[12px] text-text-3 mb-7">
          {constructor.nationality}
          <span className="mx-2">·</span>
          {stats.first_year as number}–{stats.last_year as number}
        </p>
        <div className="flex items-end gap-12">
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('hero.races')}
            </p>
            <p className="font-serif text-[56px] text-text-1 leading-none tabular-nums">
              {stats.races as number}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('hero.wins')}
            </p>
            <p className="font-serif text-[56px] text-text-1 leading-none tabular-nums">
              {stats.wins as number}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('hero.championships')}
            </p>
            <p className="font-serif text-[56px] text-text-1 leading-none tabular-nums">
              {championshipYears.length}
            </p>
          </div>
        </div>
      </div>

      {/* ── 01 · Career Stats ─────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
          <span className="font-mono text-xs text-text-2 leading-none">01 ·</span>
          <h2 className="text-[13px] font-medium text-text-2">{t('stats.title')}</h2>
        </div>
        <div className="grid grid-cols-5 divide-x divide-border">
          {[
            {
              label: t('stats.championships'),
              value: String(championshipYears.length),
              sub: championshipYears.length ? championshipYears.join(' · ') : null,
            },
            { label: t('stats.podiums'), value: String(totalPodiums) },
            { label: t('stats.fastestLaps'), value: String(totalFastestLaps) },
            { label: t('stats.poles'), value: String(poleCount) },
            { label: t('stats.winPct'), value: `${winPct}%` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="px-6 py-5">
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {label}
              </p>
              <p className="font-serif text-[40px] text-text-1 leading-none tabular-nums">
                {value}
              </p>
              {sub && (
                <p className="font-mono text-[10px] text-text-3 mt-1 leading-relaxed">
                  {sub}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 02 · Season by Season ─────────────────────────────────────── */}
      {seasonRows.length > 0 && (
        <section className="border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">02 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('seasons.title')}</h2>
            <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">
              {seasonRows.length}
            </span>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="sticky top-0 bg-surface border-b border-border z-10">
                  <th className="px-6 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-20">
                    {t('seasons.year')}
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">
                    {t('seasons.pos')}
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-16">
                    {t('seasons.pts')}
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-12">
                    {t('seasons.wins')}
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-12">
                    {t('seasons.pod')}
                  </th>
                  <th className="px-6 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">
                    {t('seasons.races')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {seasonRows.map((row) => {
                  const isChamp = championshipYears.includes(row.year);
                  return (
                    <tr
                      key={row.year}
                      className={[
                        'border-b border-border last:border-b-0 transition-colors duration-100',
                        isChamp ? 'bg-gold-dim' : 'hover:bg-surface',
                      ].join(' ')}
                    >
                      <td className="px-6 py-2.5 font-mono text-xs tabular-nums">
                        <span className={isChamp ? 'text-gold' : 'text-text-3'}>
                          {row.year}
                        </span>
                        {isChamp && (
                          <span className="font-mono text-[9px] text-gold uppercase tracking-[0.08em] ml-2">
                            ★
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[13px] text-text-1 tabular-nums">
                        {row.position !== null ? `P${row.position}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[13px] text-text-1 tabular-nums">
                        {row.points}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[13px] text-text-2 tabular-nums">
                        {row.wins}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[13px] text-text-2 tabular-nums">
                        {row.podiums}
                      </td>
                      <td className="px-6 py-2.5 text-right font-mono text-[13px] text-text-3 tabular-nums">
                        {row.races}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── 03 · Win History  |  04 · Drivers ────────────────────────── */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">

        {/* 03 · Win History */}
        <section>
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">03 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">
              {t('winsSection.title')}
            </h2>
            <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">
              {winRows.length}
            </span>
          </div>
          {winRows.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="sticky top-0 bg-surface border-b border-border z-10">
                    <th className="px-6 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">
                      {t('winsSection.year')}
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
                      {t('winsSection.race')}
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
                      {t('winsSection.driver')}
                    </th>
                    <th className="px-6 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
                      {t('winsSection.fastestLap')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {winRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-b-0 hover:bg-surface transition-colors duration-100"
                    >
                      <td className="px-6 py-2.5 font-mono text-xs text-text-3 tabular-nums">
                        {row.year}
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-text-1 max-w-[120px] truncate">
                        {row.raceName}
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-text-2 max-w-[120px] truncate">
                        {row.driverName}
                      </td>
                      <td className="px-6 py-2.5 text-right font-mono text-[13px] tabular-nums">
                        {row.fastestLap ? (
                          <span className="text-text-1">{row.fastestLap}</span>
                        ) : (
                          <span className="text-text-3">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8">
              <span className="font-mono text-[13px] text-text-3">—</span>
            </div>
          )}
        </section>

        {/* 04 · Drivers */}
        <section>
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">04 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">
              {t('drivers.title')}
            </h2>
            <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">
              {driverRows.length}
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <div className="px-6 py-5 flex flex-col gap-4">
              {driverRows.map((row) => (
                <div key={row.driverId} className="flex items-center gap-4">
                  {/* Name + year range */}
                  <div className="w-40 shrink-0">
                    <span className="text-[13px] font-medium text-text-1 block truncate">
                      {row.name}
                    </span>
                    <span className="font-mono text-[10px] text-text-3">
                      {row.firstYear === row.lastYear
                        ? String(row.firstYear)
                        : `${row.firstYear}–${row.lastYear}`}
                    </span>
                  </div>

                  {/* Bar proportional to races */}
                  <div className="flex-1 h-px bg-border overflow-hidden">
                    <div
                      className="h-full bg-text-2"
                      style={{ width: `${(row.races / maxDriverRaces) * 100}%` }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-[11px] text-text-1 tabular-nums w-12 text-right">
                      {row.races}
                      <span className="text-text-3 ml-1">{t('drivers.races')}</span>
                    </span>
                    <span className="font-mono text-[11px] text-text-2 tabular-nums w-10 text-right">
                      {row.wins}
                      <span className="text-text-3 ml-1">{t('drivers.wins')}</span>
                    </span>
                    <span className="font-mono text-[11px] text-text-2 tabular-nums w-12 text-right">
                      {row.podiums}
                      <span className="text-text-3 ml-1">{t('drivers.podiums')}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

    </main>
  );
}
