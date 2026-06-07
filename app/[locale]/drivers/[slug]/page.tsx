import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { DriverScorecardButton } from '@/components/scorecards/DriverScorecard';
import CircuitRecordSection, { type CircuitRecord } from '@/components/drivers/CircuitRecordSection';
import { flagGradient } from '@/lib/flagGradient';

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

// ─── Flag gradient (nationality → 3-stripe) ───────────────────────

// ─── Team hex values for color pills ──────────────────────────────
const TEAM_HEX: Record<string, string> = {
  mercedes:     '#00D2BE',
  mclaren:      '#FF8700',
  red_bull:     '#3671C6',
  ferrari:      '#E8002D',
  alpine:       '#FF87BC',
  aston_martin: '#358C75',
  haas:         '#B6BABD',
  williams:     '#64C4FF',
  sauber:       '#52E252',
  kick_sauber:  '#52E252',
  rb:           '#6692FF',
  alphatauri:   '#6692FF',
  toro_rosso:   '#469BFF',
  renault:      '#FFD700',
  benetton:     '#00964B',
  jordan:       '#FFB800',
  brawn:        '#B0FF00',
};

function teamHex(ref: string): string {
  return TEAM_HEX[ref] ?? '#B0AFA8';
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
      .select('race_id, constructor_id, position, points, fastest_lap_time, rank, status_id')
      .eq('driver_id', driver.id)
      .limit(500),
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

  // Batch 3 — race metadata (circuit_id included for §06 circuit record)
  const { data: racesRaw } = await supabase
    .from('races')
    .select('id, year, round, name, circuit_id')
    .in('id', allRaceIds)
    .order('year', { ascending: true })
    .order('round', { ascending: true });

  // Build race → circuit map for §06
  const raceCircuitMap = new Map(
    (racesRaw ?? [])
      .filter((r) => r.circuit_id != null)
      .map((r) => [r.id as number, r.circuit_id as number])
  );
  const uniqueCircuitIds = [...new Set(raceCircuitMap.values())];

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

  // Batch 4 — standings + constructors + circuits (§06) + status table (§06)
  const [standingsRes, constructorsRes, circuitsRes, finishedStatusRes] = await Promise.all([
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
    uniqueCircuitIds.length
      ? supabase
          .from('circuits')
          .select('id, name, location, country')
          .in('id', uniqueCircuitIds)
          .limit(500)
      : Promise.resolve({
          data: [] as { id: unknown; name: unknown; location: unknown; country: unknown }[],
          error: null,
        }),
    supabase.from('status').select('id').eq('status', 'Finished').limit(1),
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

  // ─── Assemble: §06 circuit records ────────────────────────────────────────

  const finishedStatusId =
    ((finishedStatusRes.data ?? []) as Array<{ id: number }>)[0]?.id ?? 1;

  const circuitInfoMap = new Map(
    ((circuitsRes.data ?? []) as Array<{
      id: number;
      name: string;
      location: string;
      country: string;
    }>).map((c) => [c.id, c])
  );

  // Aggregate per-circuit from results
  const circuitStatsMap = new Map<
    number,
    { starts: number; wins: number; podiums: number; best: number | null; dnfs: number; fl: number }
  >();

  for (const r of allResults) {
    const circuitId = raceCircuitMap.get(r.race_id as number);
    if (!circuitId) continue;
    const pos      = r.position !== null ? Number(r.position) : null;
    const statusId = r.status_id as number | null;
    const cur = circuitStatsMap.get(circuitId) ?? { starts: 0, wins: 0, podiums: 0, best: null, dnfs: 0, fl: 0 };
    cur.starts += 1;
    if (pos === 1) cur.wins += 1;
    if (pos !== null && pos <= 3) cur.podiums += 1;
    if (cur.best === null || (pos !== null && pos < cur.best)) cur.best = pos;
    if (pos === null && statusId !== null && statusId !== finishedStatusId) cur.dnfs += 1;
    if (Number(r.rank) === 1) cur.fl += 1;
    circuitStatsMap.set(circuitId, cur);
  }

  // Aggregate poles from qualifying
  const circuitPolesMap = new Map<number, number>();
  for (const q of allQuali) {
    if (Number(q.position) !== 1) continue;
    const circuitId = raceCircuitMap.get(q.race_id as number);
    if (!circuitId) continue;
    circuitPolesMap.set(circuitId, (circuitPolesMap.get(circuitId) ?? 0) + 1);
  }

  const circuitRecords: CircuitRecord[] = [];
  for (const [circuitId, s] of circuitStatsMap.entries()) {
    const info = circuitInfoMap.get(circuitId);
    if (!info) continue;
    const poles   = circuitPolesMap.get(circuitId) ?? 0;
    const winPct  = s.starts > 0 ? Math.round((s.wins / s.starts) * 1000) / 10 : 0;
    circuitRecords.push({
      circuit_id:   circuitId,
      circuit_name: info.name,
      location:     info.location,
      country:      info.country,
      starts:       s.starts,
      wins:         s.wins,
      podiums:      s.podiums,
      best_result:  s.best,
      dnfs:         s.dnfs,
      fastest_laps: s.fl,
      poles,
      win_pct:      winPct,
    });
  }

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
    constructorRef: string;
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
          constructorRef: con?.ref ?? '',
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
        <Link href="/drivers" className="font-mono text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150">
          {t('breadcrumb.drivers')}
        </Link>
        <span className="font-mono text-[11px] text-text-3">·</span>
        <span className="font-mono text-[11px] text-text-2 truncate">{driver.surname}</span>
      </div>

      {/* ── Hero: two-column ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row border-b border-border">

        {/* Left 60%: flag + name + meta */}
        <div className="md:w-[60%] px-8 py-10 flex flex-col justify-center gap-5">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em]">
            {t('hero.label')}
          </p>
          <div
            aria-hidden="true"
            style={{ width: 48, height: 32, background: flagGradient(driver.nationality) }}
          />
          <h1
            className="font-serif leading-[0.92] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', color: '#050505' }}
          >
            <span style={{ fontWeight: 400 }}>{driver.forename} </span>
            <span style={{ fontWeight: 700 }}>{driver.surname.toUpperCase()}</span>
          </h1>
          <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em]">
            {[
              driver.code,
              driver.number ? `#${driver.number}` : null,
              driver.nationality,
              driver.dob ? formatDob(driver.dob, locale) : null,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Right 40%: dark stat band */}
        <div
          className="md:w-[40%] flex items-center justify-center py-10"
          style={{ background: '#0A0A0A' }}
        >
          <div className="grid grid-cols-3 w-full text-center">
            {[
              { label: t('hero.races'),   value: stats.races   as number },
              { label: t('hero.wins'),    value: stats.wins    as number },
              { label: t('hero.podiums'), value: stats.podiums as number },
            ].map(({ label, value }, i) => (
              <div
                key={label}
                className="flex flex-col items-center px-4 py-6"
                style={{ borderLeft: i > 0 ? '1px solid #2A2A2A' : undefined }}
              >
                <p
                  className="font-serif tabular-nums leading-none mb-2"
                  style={{ fontSize: 'clamp(2.5rem,4vw,4rem)', color: '#F4F4F0' }}
                >
                  {value}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: '#6B6B6B' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 01 · Stat band ───────────────────────────────────────── */}
      <div className="border-b border-border" style={{ background: '#1A1A1A' }}>
        <div className="grid grid-cols-3 md:grid-cols-6">
          {[
            {
              label: t('stats.championships'),
              value: String(championshipYears.length),
              sub:   championshipYears.length ? championshipYears.join(' · ') : null,
              red:   false,
            },
            { label: t('stats.poles'),            value: String(stats.poles         as number), sub: null, red: false },
            { label: t('stats.fastestLaps'),       value: String(stats.fastest_laps  as number), sub: null, red: false },
            { label: t('stats.dnfs'),             value: String(stats.dnfs          as number), sub: null, red: false },
            { label: t('stats.winPct'),           value: `${winPct}%`,                          sub: null, red: parseFloat(winPct) > 20 },
            { label: t('qualifying.avgPosition'), value: avgQuali !== null ? `P${avgQuali}` : '—', sub: null, red: false },
          ].map(({ label, value, sub, red }, i) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center py-6 px-3 text-center"
              style={{ borderLeft: i > 0 ? '1px solid #2A2A2A' : undefined }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-2" style={{ color: '#6B6B6B' }}>
                {label}
              </p>
              <p
                className="font-sans font-black tabular-nums leading-none"
                style={{ fontSize: '2rem', color: red ? '#E10600' : '#F4F4F0' }}
              >
                {value}
              </p>
              {sub && (
                <p className="font-mono text-[10px] mt-1.5 leading-relaxed" style={{ color: '#6B6B6B' }}>
                  {sub}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-column grid: Seasons | Win History + Qualifying ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border" style={{ borderTop: '1px solid #D4D0C8' }}>

        {/* LEFT: 02 · Season by Season */}
        {seasonRows.length > 0 && (
          <section style={{ borderRight: '1px solid #D4D0C8' }}>
            <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
              <span className="font-mono text-xs text-text-2 leading-none">02 ·</span>
              <h2 className="text-[13px] font-medium text-text-2">{t('seasons.title')}</h2>
              <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">{seasonRows.length}</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="sticky top-0 bg-surface border-b border-border z-10">
                    <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('seasons.year')}</th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('seasons.constructor')}</th>
                    <th className="px-3 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-12">{t('seasons.pos')}</th>
                    <th className="px-3 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('seasons.pts')}</th>
                    <th className="px-3 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10">{t('seasons.wins')}</th>
                    <th className="px-3 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-10">{t('seasons.pod')}</th>
                    <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-12">{t('seasons.races')}</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonRows.map((row) => {
                    const isChamp = championshipYears.includes(row.year);
                    return (
                      <tr
                        key={row.year}
                        style={{
                          borderBottom: '1px solid #D4D0C8',
                          height: 40,
                          background: isChamp ? '#F0EDE6' : undefined,
                        }}
                        className="hover:bg-surface transition-colors duration-100"
                      >
                        <td className="px-4 font-mono text-xs tabular-nums">
                          <span className={isChamp ? 'text-gold' : 'text-text-3'}>{row.year}</span>
                          {isChamp && <span className="font-mono text-[9px] text-gold ml-2">★</span>}
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: teamColor(row.constructorRef) }} />
                            <span className="text-[12px] text-text-2 truncate">{row.constructorName}</span>
                          </div>
                        </td>
                        <td className="px-3 text-right font-mono text-[12px] text-text-1 tabular-nums">{row.position !== null ? `P${row.position}` : '—'}</td>
                        <td className="px-3 text-right font-mono text-[12px] text-text-1 tabular-nums">{row.points}</td>
                        <td className="px-3 text-right font-mono text-[12px] text-text-2 tabular-nums">{row.wins}</td>
                        <td className="px-3 text-right font-mono text-[12px] text-text-2 tabular-nums">{row.podiums}</td>
                        <td className="px-4 text-right font-mono text-[12px] text-text-3 tabular-nums">{row.races}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* RIGHT: 03 Win History + 04 Qualifying stacked */}
        <div className="flex flex-col divide-y divide-border">

          {/* 03 · Win History */}
          <section>
            <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
              <span className="font-mono text-xs text-text-2 leading-none">03 ·</span>
              <h2 className="text-[13px] font-medium text-text-2">{t('winsSection.title')}</h2>
              <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">{winRows.length}</span>
            </div>
            {winRows.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-surface border-b border-border">
                    <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('winsSection.year')}</th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('winsSection.race')}</th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('winsSection.constructor')}</th>
                    <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('winsSection.fastestLap')}</th>
                  </tr>
                </thead>
                <tbody>
                  {winRows.map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid #D4D0C8',
                        borderLeft: `3px solid ${teamHex(row.constructorRef)}`,
                      }}
                      className="hover:bg-surface transition-colors duration-100"
                    >
                      <td className="px-4 py-2 font-mono text-xs text-text-3 tabular-nums">{row.year}</td>
                      <td className="px-3 py-2 text-[12px] text-text-1 max-w-[140px] truncate">{row.raceName}</td>
                      <td className="px-3 py-2 text-[12px] text-text-2 truncate">{row.constructorName}</td>
                      <td className="px-4 py-2 text-right font-mono text-[12px] tabular-nums">
                        {row.fastestLap
                          ? <span style={{ color: '#E10600' }}>{row.fastestLap}</span>
                          : <span className="text-text-3">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-6"><span className="font-mono text-[13px] text-text-3">—</span></div>
            )}
          </section>

          {/* 04 · Qualifying Record */}
          <section>
            <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
              <span className="font-mono text-xs text-text-2 leading-none">04 ·</span>
              <h2 className="text-[13px] font-medium text-text-2">{t('qualifying.title')}</h2>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
              <div className="px-5 py-4">
                <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">{t('qualifying.poles')}</p>
                <p className="font-serif text-[32px] text-text-1 leading-none tabular-nums">{poleRows.length}</p>
              </div>
              <div className="px-5 py-4">
                <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">{t('qualifying.frontRow')}</p>
                <p className="font-serif text-[32px] text-text-1 leading-none tabular-nums">{frontRowCount}</p>
              </div>
              <div className="px-5 py-4">
                <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">{t('qualifying.avgPosition')}</p>
                <p className="font-serif text-[32px] text-text-1 leading-none tabular-nums">{avgQuali !== null ? `P${avgQuali}` : '—'}</p>
              </div>
            </div>
            {poleRows.length > 0 && (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('qualifying.year')}</th>
                      <th className="px-3 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('qualifying.race')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poleRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #D4D0C8' }} className="hover:bg-surface transition-colors duration-100">
                        <td className="px-4 py-2 font-mono text-xs text-text-3 tabular-nums">{row.year}</td>
                        <td className="px-3 py-2 text-[12px] text-text-1 truncate">{row.raceName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>

      </div>

      {/* ── 05 · Constructors ─────────────────────────────────────── */}
      {constructorRows.length > 0 && (
        <section className="border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">05 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('constructors.title')}</h2>
          </div>
          <div className="px-6 py-5 flex flex-col gap-3">
            {constructorRows.map((row) => {
              const hex = teamHex(row.ref);
              return (
                <div key={row.constructorId} className="flex items-center gap-4">
                  <div
                    className="flex items-center gap-2 px-3 py-1 shrink-0"
                    style={{ background: `${hex}1A`, borderLeft: `3px solid ${hex}`, minWidth: 144 }}
                  >
                    <span className="text-[13px] font-medium text-text-1 truncate">{row.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0">
                    {row.firstYear === row.lastYear ? String(row.firstYear) : `${row.firstYear}–${row.lastYear}`}
                  </span>
                  <div className="flex-1 h-px overflow-hidden" style={{ background: '#D4D0C8' }}>
                    <div className="h-full" style={{ width: `${(row.races / maxConRaces) * 100}%`, background: hex }} />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[11px] text-text-1 tabular-nums w-12 text-right">
                      {row.races}<span className="text-text-3 ml-1">{t('constructors.races')}</span>
                    </span>
                    <span className="font-mono text-[11px] tabular-nums w-10 text-right" style={{ color: hex }}>
                      {row.wins}<span className="text-text-3 ml-1">{t('constructors.wins')}</span>
                    </span>
                    <span className="font-mono text-[11px] text-text-2 tabular-nums w-12 text-right">
                      {row.podiums}<span className="text-text-3 ml-1">{t('constructors.podiums')}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 06 · Circuit Record — DO NOT MODIFY ──────────────── */}
      {circuitRecords.length > 0 && (
        <CircuitRecordSection
          records={circuitRecords}
          driver={{
            forename:   driver.forename,
            surname:    driver.surname,
            code:       driver.code,
            driver_ref: driver.driver_ref,
          }}
        />
      )}

      {/* ── Share scorecard ───────────────────────────────────── */}
      <div className="px-6 py-3 border-t border-border">
        <DriverScorecardButton
          data={{
            forename:       driver.forename,
            surname:        driver.surname,
            code:           driver.code,
            nationality:    driver.nationality,
            firstYear:      stats.first_year as number,
            lastYear:       stats.last_year  as number,
            races:          stats.races       as number,
            wins:           stats.wins        as number,
            podiums:        stats.podiums     as number,
            poles:          stats.poles       as number,
            fastestLaps:    stats.fastest_laps as number,
            championships:  championshipYears.length,
            constructorRef: seasonRows[0]?.constructorRef ?? '',
          }}
        />
      </div>

    </main>
  );
}
