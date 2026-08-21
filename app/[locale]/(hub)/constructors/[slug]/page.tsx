import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { ConstructorScorecardButton } from '@/components/scorecards/ConstructorScorecard';
import { flagGradient } from '@/lib/flagGradient';
import FollowButton from '@/components/ui/FollowButton';

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

  // Batch 2 — career stats + standings (two era splits) + podium results + fastest laps count
  //
  // The Supabase anon key enforces a server-side max-rows=1000 cap. Constructor standings
  // and results for long-running teams (Ferrari: 1087 standings, 2497 results) exceed this.
  // We avoid the cap by:
  //   • Splitting constructor_standings at race_id 908 (the boundary between the 2009-back-to-1950
  //     era and the 2014-onward era in this DB export). Each half stays under 1000 rows.
  //   • Fetching only podium results (position ≤ 3) instead of all results — max 852 rows.
  //   • Using a count-only query for fastest_laps (returns zero data rows).
  const [statsRes, standingsLegacyRes, standingsModernRes, podiumResultsRes, fastestLapsCountRes] =
    await Promise.all([
      supabase
        .from('constructor_stats')
        .select('races, wins, first_year, last_year')
        .eq('constructor_id', constructor.id)
        .single(),
      // race_id < 908: 2009 back to 1950 (≤ 838 rows for Ferrari, ≤ 709 for McLaren)
      supabase
        .from('constructor_standings')
        .select('race_id, position, points')
        .eq('constructor_id', constructor.id)
        .lt('race_id', 908),
      // race_id >= 908: 2014 onward (≤ 249 rows for any current team)
      supabase
        .from('constructor_standings')
        .select('race_id, position, points')
        .eq('constructor_id', constructor.id)
        .gte('race_id', 908),
      // Podium results only (≤ 852 rows for Ferrari, ≤ 545 for McLaren)
      supabase
        .from('results')
        .select('race_id, driver_id, position, fastest_lap_time')
        .eq('constructor_id', constructor.id)
        .lte('position', 3)
        .not('position', 'is', null),
      // Count query — returns no rows, bypasses the row cap
      supabase
        .from('results')
        .select('id', { count: 'exact', head: true })
        .eq('constructor_id', constructor.id)
        .not('fastest_lap', 'is', null),
    ]);

  const stats = statsRes.data;
  const allStandings = [
    ...(standingsLegacyRes.data ?? []),
    ...(standingsModernRes.data ?? []),
  ];
  const allPodiumResults = podiumResultsRes.data ?? [];
  const totalFastestLaps = fastestLapsCountRes.count ?? 0;

  const allDriverIds = [...new Set(allPodiumResults.map((r) => r.driver_id as number))];

  // Early return — no race data
  if (!allStandings.length || !stats) {
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
  //
  // Races: fetch ALL races in two era splits (no IN clause) to avoid the 1000-row cap.
  // race_id < 908 covers 1-907 (≤ 907 rows); race_id >= 908 covers 2014-onward (≤ 270 rows).
  // Qualifying: filter to position = 1 only — reduces ~10k rows to ~hundreds.
  const [racesLegacyRes, racesModernRes, driversRes, qualiRes] = await Promise.all([
    supabase
      .from('races')
      .select('id, year, round, name')
      .lt('id', 908),
    supabase
      .from('races')
      .select('id, year, round, name')
      .gte('id', 908),
    supabase
      .from('drivers')
      .select('id, forename, surname, driver_ref')
      .in('id', allDriverIds),
    allDriverIds.length
      ? supabase
          .from('qualifying')
          .select('race_id, driver_id')
          .in('driver_id', allDriverIds)
          .eq('position', 1)
      : Promise.resolve({
          data: [] as { race_id: unknown; driver_id: unknown }[],
          error: null,
        }),
  ]);

  const raceById = new Map(
    [...(racesLegacyRes.data ?? []), ...(racesModernRes.data ?? [])].map((r) => [
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

  // Poles: cross-reference qualifying P1s against races where the driver drove for this constructor.
  // Source is podium results (not all results), so drivers who had poles but never a podium are
  // missed — an accepted trade-off given the row-cap constraint.
  const constructorDriverRaceSet = new Set<string>();
  for (const r of allPodiumResults) {
    constructorDriverRaceSet.add(`${r.race_id as number}_${r.driver_id as number}`);
  }

  // Find last race per year from constructor_standings (one row per race participated in)
  const lastRacePerYear = new Map<number, number>(); // year → race_id
  for (const s of allStandings) {
    const raceId = s.race_id as number;
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

  // Build standings lookup from the already-fetched allStandings — no Batch 4 needed
  const standingsByRaceId = new Map(
    allStandings.map((s) => [
      s.race_id as number,
      {
        position: s.position as number,
        points: s.points as number,
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

  // ─── Aggregation ──────────────────────────────────────────────────────────

  // Career fastest_laps comes from the count query (totalFastestLaps set above).
  // Career podiums = all podium result rows.
  const totalPodiums = allPodiumResults.length;

  // Season races: one standings row = one race round
  type SeasonEntry = { races: number; wins: number; podiums: number };
  const seasonMap = new Map<number, SeasonEntry>();

  for (const s of allStandings) {
    const race = raceById.get(s.race_id as number);
    if (!race) continue;
    const season = seasonMap.get(race.year) ?? { races: 0, wins: 0, podiums: 0 };
    season.races += 1;
    seasonMap.set(race.year, season);
  }

  // Season wins + podiums from podium results; driver roster from the same source
  type DriverEntry = { wins: number; podiums: number; years: Set<number> };
  const driverStatsMap = new Map<number, DriverEntry>();

  for (const r of allPodiumResults) {
    const raceId = r.race_id as number;
    const driverId = r.driver_id as number;
    const race = raceById.get(raceId);
    if (!race) continue;

    const rawPos = r.position;
    const pos =
      rawPos !== null && rawPos !== undefined
        ? (() => { const n = Number(rawPos); return isNaN(n) ? null : n; })()
        : null;

    // Add to season wins/podiums
    const season = seasonMap.get(race.year) ?? { races: 0, wins: 0, podiums: 0 };
    if (pos === 1) season.wins += 1;
    if (pos !== null && pos <= 3) season.podiums += 1;
    seasonMap.set(race.year, season);

    // Driver roster (podium-scoring drivers only)
    const dEntry = driverStatsMap.get(driverId) ?? {
      wins: 0,
      podiums: 0,
      years: new Set<number>(),
    };
    if (pos === 1) dEntry.wins += 1;
    if (pos !== null && pos <= 3) dEntry.podiums += 1;
    dEntry.years.add(race.year);
    driverStatsMap.set(driverId, dEntry);
  }

  // Pole count — qualifying P1s already filtered server-side; cross-reference with constructor races
  let poleCount = 0;
  for (const q of (qualiRes.data ?? [])) {
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
        races: s.races, // rounds contested (1 standings row = 1 round)
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

  const winRows: WinRow[] = allPodiumResults
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

  // ─── Driver rows (desc by podiums) ───────────────────────────────────────
  // Shows drivers who scored podiums for this constructor.
  // Bar is proportional to podiums (not total races) given the row-cap constraint.

  type DriverRow = {
    driverId: number;
    name: string;
    firstYear: number;
    lastYear: number;
    podiums: number;
    wins: number;
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
          podiums: s.podiums,
          wins: s.wins,
        },
      ];
    })
    .sort((a, b) => b.podiums - a.podiums);

  const maxDriverPodiums = driverRows[0]?.podiums ?? 1;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="flex flex-col">

      {/* Breadcrumb */}
      <div className="h-10 px-6 border-b border-border flex items-center gap-2 shrink-0">
        <Link href="/constructors" className="font-mono text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150">
          {t('breadcrumb.constructors')}
        </Link>
        <span className="font-mono text-[11px] text-text-3">·</span>
        <span className="font-mono text-[11px] text-text-2 truncate">{constructor.name}</span>
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
            style={{ width: 48, height: 32, background: flagGradient(constructor.nationality) }}
          />
          <h1
            className="font-serif leading-[0.92] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', color: 'var(--text-1)' }}
          >
            <span style={{ fontWeight: 700 }}>{constructor.name.toUpperCase()}</span>
          </h1>
          <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em]">
            {[
              constructor.nationality,
              `${stats.first_year as number}–${stats.last_year as number}`,
            ].join(' · ')}
          </p>
          <div>
            <FollowButton
              kind="constructor"
              reference={constructor.constructor_ref}
              color={color}
              idleBorderColor="#D4D0C8"
              idleTextColor="#6B6B6B"
            />
          </div>
        </div>

        {/* Right 40%: dark stat band */}
        <div
          className="md:w-[40%] flex items-center justify-center py-10"
          style={{ background: '#0A0A0A' }}
        >
          <div className="grid grid-cols-3 w-full text-center">
            {[
              { label: t('hero.races'),         value: stats.races as number },
              { label: t('hero.wins'),          value: stats.wins  as number },
              { label: t('hero.championships'), value: championshipYears.length },
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
        <div className="grid grid-cols-3 md:grid-cols-5">
          {[
            {
              label: t('stats.championships'),
              value: String(championshipYears.length),
              sub:   championshipYears.length ? championshipYears.join(' · ') : null,
              red:   false,
            },
            { label: t('stats.podiums'),     value: String(totalPodiums),        sub: null, red: false },
            { label: t('stats.fastestLaps'), value: String(totalFastestLaps),    sub: null, red: false },
            { label: t('stats.poles'),       value: String(poleCount),           sub: null, red: false },
            { label: t('stats.winPct'),      value: `${winPct}%`,                sub: null, red: parseFloat(winPct) > 20 },
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
                style={{ fontSize: '2rem', color: red ? '#E61919' : '#F4F4F0' }}
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

      {/* ── Two-column grid: Seasons | Win History ────────────── */}
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
                    <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-16">{t('seasons.year')}</th>
                    <th className="px-3 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-12">{t('seasons.pos')}</th>
                    <th className="px-3 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-16">{t('seasons.pts')}</th>
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

        {/* RIGHT: 03 · Win History */}
        <section>
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">03 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('winsSection.title')}</h2>
            <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">{winRows.length}</span>
          </div>
          {winRows.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="sticky top-0 bg-surface border-b border-border z-10">
                    <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('winsSection.year')}</th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('winsSection.race')}</th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('winsSection.driver')}</th>
                    <th className="px-4 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('winsSection.fastestLap')}</th>
                  </tr>
                </thead>
                <tbody>
                  {winRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #D4D0C8' }} className="hover:bg-surface transition-colors duration-100">
                      <td className="px-4 py-2 font-mono text-xs text-text-3 tabular-nums">{row.year}</td>
                      <td className="px-3 py-2 text-[12px] text-text-1 max-w-[120px] truncate">{row.raceName}</td>
                      <td className="px-3 py-2 text-[12px] text-text-2 max-w-[120px] truncate">{row.driverName}</td>
                      <td className="px-4 py-2 text-right font-mono text-[12px] tabular-nums">
                        {row.fastestLap
                          ? <span style={{ color: '#E61919' }}>{row.fastestLap}</span>
                          : <span className="text-text-3">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8"><span className="font-mono text-[13px] text-text-3">—</span></div>
          )}
        </section>

      </div>

      {/* ── 04 · Drivers ─────────────────────────────────────────── */}
      {driverRows.length > 0 && (
        <section className="border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">04 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('drivers.title')}</h2>
            <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">{driverRows.length}</span>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {driverRows.map((row) => (
              <div key={row.driverId} className="flex items-center gap-4">
                <div className="w-40 shrink-0">
                  <span className="text-[13px] font-medium text-text-1 block truncate">{row.name}</span>
                  <span className="font-mono text-[10px] text-text-3">
                    {row.firstYear === row.lastYear ? String(row.firstYear) : `${row.firstYear}–${row.lastYear}`}
                  </span>
                </div>
                <div className="flex-1 h-px overflow-hidden" style={{ background: '#D4D0C8' }}>
                  <div className="h-full bg-text-2" style={{ width: `${(row.podiums / maxDriverPodiums) * 100}%` }} />
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono text-[11px] text-text-1 tabular-nums w-12 text-right">
                    {row.wins}<span className="text-text-3 ml-1">{t('drivers.wins')}</span>
                  </span>
                  <span className="font-mono text-[11px] text-text-2 tabular-nums w-12 text-right">
                    {row.podiums}<span className="text-text-3 ml-1">{t('drivers.podiums')}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Share scorecard ───────────────────────────────────── */}
      <div className="px-6 py-3 border-t border-border">
        <ConstructorScorecardButton
          data={{
            name:           constructor.name,
            constructorRef: constructor.constructor_ref,
            nationality:    constructor.nationality,
            firstYear:      stats.first_year as number,
            lastYear:       stats.last_year  as number,
            races:          stats.races       as number,
            wins:           stats.wins        as number,
            podiums:        totalPodiums,
            fastestLaps:    totalFastestLaps,
            championships:  championshipYears.length,
          }}
        />
      </div>

    </main>
  );
}
