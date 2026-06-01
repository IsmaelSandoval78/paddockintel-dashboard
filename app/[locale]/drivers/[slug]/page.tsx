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

function formatDob(dob: string | null, locale: string): string {
  if (!dob) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dob + 'T12:00:00'));
  } catch {
    return dob;
  }
}

// ─── Static generation ────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const supabase = createClient();
  const { data } = await supabase.from('drivers').select('driver_ref');
  const slugs = (data ?? []).map((d) => d.driver_ref as string).filter(Boolean);
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();
  const { data } = await supabase
    .from('drivers')
    .select('forename, surname, nationality')
    .eq('driver_ref', slug)
    .single();
  if (!data) return { title: 'Driver — PaddockIntel' };
  const name = `${data.forename as string} ${data.surname as string}`;
  return {
    title: `${name} — PaddockIntel`,
    description: `Career statistics, season records, and win history for ${name} (${data.nationality as string}).`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DriverDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('driverDetail');
  const supabase = createClient();

  // Batch 1 — driver by slug
  const { data: driverRaw } = await supabase
    .from('drivers')
    .select('id, driver_ref, forename, surname, code, number, nationality, dob')
    .eq('driver_ref', slug)
    .single();

  if (!driverRaw) notFound();

  const driver = {
    id: driverRaw.id as number,
    driver_ref: driverRaw.driver_ref as string,
    forename: driverRaw.forename as string,
    surname: driverRaw.surname as string,
    code: (driverRaw.code as string | null) ?? null,
    number: (driverRaw.number as number | null) ?? null,
    nationality: driverRaw.nationality as string,
    dob: (driverRaw.dob as string | null) ?? null,
  };

  // Batch 2 — career stats + all results + all qualifying (parallel)
  const [statsRes, resultsRes, qualiRes] = await Promise.all([
    supabase
      .from('driver_stats')
      .select(
        'races, wins, podiums, poles, fastest_laps, dnfs, first_year, last_year'
      )
      .eq('driver_id', driver.id)
      .single(),
    supabase
      .from('results')
      .select('race_id, constructor_id, position, points, fastest_lap_time')
      .eq('driver_id', driver.id),
    supabase
      .from('qualifying')
      .select('race_id, position')
      .eq('driver_id', driver.id),
  ]);

  const stats = statsRes.data;
  const allResults = resultsRes.data ?? [];
  const allQuali = qualiRes.data ?? [];

  // Collect race IDs from both results and qualifying
  const resultRaceIds = allResults.map((r) => r.race_id as number);
  const qualiRaceIds = allQuali.map((q) => q.race_id as number);
  const allRaceIds = [...new Set([...resultRaceIds, ...qualiRaceIds])];

  // Early return if no data
  if (!allRaceIds.length || !stats) {
    return (
      <main className="flex flex-col">
        <div className="h-10 px-6 border-b border-border flex items-center gap-2 shrink-0">
          <Link
            href="/drivers"
            className="font-mono text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150"
          >
            {t('breadcrumb.drivers')}
          </Link>
          <span className="font-mono text-[11px] text-text-3">·</span>
          <span className="font-mono text-[11px] text-text-2">{driver.surname}</span>
        </div>
        <div className="px-6 pt-8 pb-7">
          <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] mb-3">
            {t('hero.label')}
          </p>
          <h1 className="font-serif text-5xl text-text-1 leading-[1.1] mb-2">
            {driver.surname}
          </h1>
          <p className="text-[14px] text-text-2">{driver.forename} · {driver.nationality}</p>
        </div>
        <div className="px-6 py-12 border-t border-border">
          <p className="font-mono text-[13px] text-text-3">{t('noData')}</p>
        </div>
      </main>
    );
  }

  // Batch 3 — race metadata for all race IDs
  const { data: racesRaw } = await supabase
    .from('races')
    .select('id, year, round, name')
    .in('id', allRaceIds)
    .order('year', { ascending: true })
    .order('round', { ascending: true });

  const races = racesRaw ?? [];
  const raceById = new Map(
    races.map((r) => [
      r.id as number,
      { year: r.year as number, round: r.round as number, name: r.name as string },
    ])
  );

  // Find last raced round per year (from results only)
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
  const uniqueConstructorIds = [
    ...new Set(allResults.map((r) => r.constructor_id as number)),
  ];

  // Batch 4 — standings at season-end races + constructor names (parallel)
  const [standingsRes, constructorsRes] = await Promise.all([
    lastRaceIds.length
      ? supabase
          .from('driver_standings')
          .select('race_id, position, points, wins')
          .eq('driver_id', driver.id)
          .in('race_id', lastRaceIds)
      : Promise.resolve({
          data: [] as {
            race_id: unknown;
            position: unknown;
            points: unknown;
            wins: unknown;
          }[],
          error: null,
        }),
    uniqueConstructorIds.length
      ? supabase
          .from('constructors')
          .select('id, name, constructor_ref')
          .in('id', uniqueConstructorIds)
      : Promise.resolve({
          data: [] as { id: unknown; name: unknown; constructor_ref: unknown }[],
          error: null,
        }),
  ]);

  const standingsByRaceId = new Map(
    (standingsRes.data ?? []).map((s) => [
      s.race_id as number,
      {
        position: s.position as number,
        points: s.points as number,
        wins: s.wins as number,
      },
    ])
  );

  const constructorById = new Map(
    (constructorsRes.data ?? []).map((c) => [
      c.id as number,
      { name: c.name as string, ref: c.constructor_ref as string },
    ])
  );

  // ─── Assemble: championships ─────────────────────────────────────────────

  const championshipYears: number[] = [];
  for (const [year, raceId] of lastRacePerYear.entries()) {
    const standing = standingsByRaceId.get(raceId);
    if (standing?.position === 1) championshipYears.push(year);
  }
  championshipYears.sort((a, b) => a - b);

  // ─── Assemble: season-by-season rows ─────────────────────────────────────

  type SeasonRow = {
    year: number;
    constructorName: string;
    constructorRef: string;
    position: number | null;
    points: number;
    wins: number;
    podiums: number;
    races: number;
  };

  const seasonMap = new Map<
    number,
    { races: number; wins: number; podiums: number; lastConstructorId: number | null }
  >();

  for (const r of allResults) {
    const raceId = r.race_id as number;
    const race = raceById.get(raceId);
    if (!race) continue;
    const year = race.year;
    const pos = r.position !== null ? Number(r.position) : null;
    const isLastRace = lastRacePerYear.get(year) === raceId;

    const cur = seasonMap.get(year) ?? {
      races: 0,
      wins: 0,
      podiums: 0,
      lastConstructorId: null,
    };
    cur.races += 1;
    if (pos === 1) cur.wins += 1;
    if (pos !== null && pos <= 3) cur.podiums += 1;
    if (isLastRace) cur.lastConstructorId = r.constructor_id as number;
    seasonMap.set(year, cur);
  }

  const seasonRows: SeasonRow[] = [...seasonMap.entries()]
    .map(([year, s]) => {
      const lastRaceId = lastRacePerYear.get(year);
      const standing = lastRaceId ? standingsByRaceId.get(lastRaceId) : undefined;
      const con = s.lastConstructorId
        ? constructorById.get(s.lastConstructorId)
        : null;
      return {
        year,
        constructorName: con?.name ?? '—',
        constructorRef: con?.ref ?? '',
        position: standing?.position ?? null,
        points: standing?.points ?? 0,
        wins: s.wins,
        podiums: s.podiums,
        races: s.races,
      };
    })
    .sort((a, b) => b.year - a.year);

  // ─── Assemble: win history ────────────────────────────────────────────────

  type WinRow = {
    year: number;
    raceName: string;
    constructorName: string;
    fastestLap: string | null;
  };

  const winRows: WinRow[] = allResults
    .flatMap((r) => {
      if (Number(r.position) !== 1) return [];
      const raceId = r.race_id as number;
      const race = raceById.get(raceId);
      if (!race) return [];
      const con = constructorById.get(r.constructor_id as number);
      return [
        {
          year: race.year,
          raceName: race.name,
          constructorName: con?.name ?? '—',
          fastestLap: cleanLapTime(r.fastest_lap_time as string | null),
        },
      ];
    })
    .sort((a, b) => b.year - a.year || a.raceName.localeCompare(b.raceName));

  // ─── Assemble: qualifying record ─────────────────────────────────────────

  type PoleRow = { year: number; raceName: string };

  let qualiSum = 0;
  let qualiCount = 0;
  let frontRowCount = 0;
  const poleRows: PoleRow[] = [];

  for (const q of allQuali) {
    const pos = q.position !== null ? Number(q.position) : null;
    if (pos === null || isNaN(pos)) continue;
    qualiSum += pos;
    qualiCount += 1;
    if (pos <= 2) frontRowCount += 1;
    if (pos === 1) {
      const race = raceById.get(q.race_id as number);
      if (race) poleRows.push({ year: race.year, raceName: race.name });
    }
  }

  poleRows.sort((a, b) => b.year - a.year);
  const avgQuali =
    qualiCount > 0 ? Math.round((qualiSum / qualiCount) * 10) / 10 : null;

  // ─── Assemble: constructors section ──────────────────────────────────────

  type ConstructorRow = {
    constructorId: number;
    name: string;
    ref: string;
    firstYear: number;
    lastYear: number;
    races: number;
    wins: number;
    podiums: number;
  };

  const conStatsMap = new Map<
    number,
    { races: number; wins: number; podiums: number; years: Set<number> }
  >();

  for (const r of allResults) {
    const conId = r.constructor_id as number;
    const raceId = r.race_id as number;
    const race = raceById.get(raceId);
    if (!race) continue;
    const pos = r.position !== null ? Number(r.position) : null;
    const cur = conStatsMap.get(conId) ?? {
      races: 0,
      wins: 0,
      podiums: 0,
      years: new Set<number>(),
    };
    cur.races += 1;
    if (pos === 1) cur.wins += 1;
    if (pos !== null && pos <= 3) cur.podiums += 1;
    cur.years.add(race.year);
    conStatsMap.set(conId, cur);
  }

  const constructorRows: ConstructorRow[] = [...conStatsMap.entries()]
    .flatMap(([conId, s]) => {
      const con = constructorById.get(conId);
      if (!con) return [];
      const years = [...s.years].sort((a, b) => a - b);
      return [
        {
          constructorId: conId,
          name: con.name,
          ref: con.ref,
          firstYear: years[0],
          lastYear: years[years.length - 1],
          races: s.races,
          wins: s.wins,
          podiums: s.podiums,
        },
      ];
    })
    .sort((a, b) => b.races - a.races);

  const maxConRaces = constructorRows[0]?.races ?? 1;

  // ─── Win % ────────────────────────────────────────────────────────────────

  const winPct =
    stats.races > 0
      ? ((stats.wins as number / stats.races as number) * 100).toFixed(1)
      : '0.0';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="flex flex-col">

      {/* Breadcrumb */}
      <div className="h-10 px-6 border-b border-border flex items-center gap-2 shrink-0">
        <Link
          href="/drivers"
          className="font-mono text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150"
        >
          {t('breadcrumb.drivers')}
        </Link>
        <span className="font-mono text-[11px] text-text-3">·</span>
        <span className="font-mono text-[11px] text-text-2 truncate">
          {driver.surname}
        </span>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="px-6 pt-8 pb-7 border-b border-border">
        <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] mb-3">
          {t('hero.label')}
        </p>
        <h1 className="font-serif text-5xl text-text-1 leading-[1.1] mb-2">
          {driver.surname}
        </h1>
        <p className="text-[14px] text-text-2 mb-0.5">
          {driver.forename}
          {driver.code && (
            <span className="font-mono text-text-3 ml-2">{driver.code}</span>
          )}
          {driver.number && (
            <span className="font-mono text-text-3 ml-2">#{driver.number}</span>
          )}
          <span className="text-text-3 mx-2">·</span>
          {driver.nationality}
        </p>
        {driver.dob && (
          <p className="font-mono text-[12px] text-text-3 mb-7">
            {formatDob(driver.dob, locale)}
          </p>
        )}
        {!driver.dob && <div className="mb-7" />}
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
              {t('hero.podiums')}
            </p>
            <p className="font-serif text-[56px] text-text-1 leading-none tabular-nums">
              {stats.podiums as number}
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
        <div className="grid grid-cols-5 divide-x divide-border px-0">
          {[
            {
              label: t('stats.championships'),
              value: String(championshipYears.length),
              sub: championshipYears.length
                ? championshipYears.join(' · ')
                : null,
            },
            { label: t('stats.poles'), value: String(stats.poles as number) },
            {
              label: t('stats.fastestLaps'),
              value: String(stats.fastest_laps as number),
            },
            { label: t('stats.dnfs'), value: String(stats.dnfs as number) },
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
            <h2 className="text-[13px] font-medium text-text-2">
              {t('seasons.title')}
            </h2>
            <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">
              {seasonRows.length}
            </span>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="sticky top-0 bg-surface border-b border-border z-10">
                  <th className="px-6 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-16">
                    {t('seasons.year')}
                  </th>
                  <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
                    {t('seasons.constructor')}
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
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: teamColor(row.constructorRef) }}
                          />
                          <span className="text-[13px] text-text-2 truncate">
                            {row.constructorName}
                          </span>
                        </div>
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

      {/* ── 03 · Win History  |  04 · Qualifying Record ───────────────── */}
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
                    <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
                      {t('winsSection.race')}
                    </th>
                    <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
                      {t('winsSection.constructor')}
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
                      <td className="px-4 py-2.5 text-[13px] text-text-1 max-w-[160px] truncate">
                        {row.raceName}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-text-2 truncate">
                        {row.constructorName}
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

        {/* 04 · Qualifying Record */}
        <section>
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">04 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">
              {t('qualifying.title')}
            </h2>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            <div className="px-6 py-5">
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('qualifying.poles')}
              </p>
              <p className="font-serif text-[40px] text-text-1 leading-none tabular-nums">
                {poleRows.length}
              </p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('qualifying.frontRow')}
              </p>
              <p className="font-serif text-[40px] text-text-1 leading-none tabular-nums">
                {frontRowCount}
              </p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('qualifying.avgPosition')}
              </p>
              <p className="font-serif text-[40px] text-text-1 leading-none tabular-nums">
                {avgQuali !== null ? `P${avgQuali}` : '—'}
              </p>
            </div>
          </div>

          {/* Poles list */}
          {poleRows.length > 0 && (
            <div className="max-h-[280px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="sticky top-0 bg-surface border-b border-border z-10">
                    <th className="px-6 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">
                      {t('qualifying.year')}
                    </th>
                    <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
                      {t('qualifying.race')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {poleRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-b-0 hover:bg-surface transition-colors duration-100"
                    >
                      <td className="px-6 py-2 font-mono text-xs text-text-3 tabular-nums">
                        {row.year}
                      </td>
                      <td className="px-4 py-2 text-[13px] text-text-1 truncate">
                        {row.raceName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>

      {/* ── 05 · Constructors ─────────────────────────────────────────── */}
      {constructorRows.length > 0 && (
        <section>
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">05 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">
              {t('constructors.title')}
            </h2>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {constructorRows.map((row) => (
              <div key={row.constructorId} className="flex items-center gap-4">
                {/* Color dot + name */}
                <div className="flex items-center gap-2 w-44 shrink-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: teamColor(row.ref) }}
                  />
                  <span className="text-[13px] font-medium text-text-1 truncate">
                    {row.name}
                  </span>
                </div>

                {/* Years */}
                <span className="font-mono text-[11px] text-text-3 tabular-nums w-20 shrink-0">
                  {row.firstYear === row.lastYear
                    ? String(row.firstYear)
                    : `${row.firstYear}–${row.lastYear}`}
                </span>

                {/* Bar */}
                <div className="flex-1 h-px bg-border overflow-hidden">
                  <div
                    className="h-full bg-text-2"
                    style={{ width: `${(row.races / maxConRaces) * 100}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono text-[11px] text-text-1 tabular-nums w-12 text-right">
                    {row.races}
                    <span className="text-text-3 ml-1">{t('constructors.races')}</span>
                  </span>
                  <span className="font-mono text-[11px] text-text-2 tabular-nums w-10 text-right">
                    {row.wins}
                    <span className="text-text-3 ml-1">{t('constructors.wins')}</span>
                  </span>
                  <span className="font-mono text-[11px] text-text-2 tabular-nums w-12 text-right">
                    {row.podiums}
                    <span className="text-text-3 ml-1">{t('constructors.podiums')}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}
