import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';

type PageParams = Promise<{ locale: string; slug: string }>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTime(t: string): number {
  const parts = t.split(':');
  if (parts.length !== 2) return Infinity;
  const ms = parseInt(parts[0], 10) * 60000 + parseFloat(parts[1]) * 1000;
  return isNaN(ms) ? Infinity : ms;
}

function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns} · ${Math.abs(lng).toFixed(2)}°${ew}`;
}

// ─── Static generation ────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const supabase = createClient();
  const { data } = await supabase.from('circuits').select('circuit_ref');
  const slugs = (data ?? []).map((c) => c.circuit_ref as string).filter(Boolean);
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();
  const { data } = await supabase
    .from('circuits')
    .select('name, location, country')
    .eq('circuit_ref', slug)
    .single();
  if (!data) return { title: 'Circuit — PaddockIntel' };
  const name = data.name as string;
  const location = data.location as string;
  const country = data.country as string;
  return {
    title: `${name} — PaddockIntel`,
    description: `Full race history, lap records, and statistics for ${name} in ${location}, ${country}.`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CircuitDetailPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  const t = await getTranslations('circuitDetail');
  const supabase = createClient();

  // Batch 1 — circuit by slug
  const { data: circuitRaw } = await supabase
    .from('circuits')
    .select('id, name, location, country, lat, lng, circuit_ref')
    .eq('circuit_ref', slug)
    .single();

  if (!circuitRaw) notFound();

  const circuit = {
    id: circuitRaw.id as number,
    name: circuitRaw.name as string,
    location: circuitRaw.location as string,
    country: circuitRaw.country as string,
    lat: circuitRaw.lat as number,
    lng: circuitRaw.lng as number,
    circuit_ref: circuitRaw.circuit_ref as string,
  };

  // Batch 2 — all races at this circuit
  const { data: racesRaw } = await supabase
    .from('races')
    .select('id, year, round, name, date')
    .eq('circuit_id', circuit.id)
    .order('year', { ascending: true });

  const races = racesRaw ?? [];
  const raceIds = races.map((r) => r.id as number);
  const raceYearMap = new Map(races.map((r) => [r.id as number, r.year as number]));

  const years = races.map((r) => r.year as number);
  const firstYear = years.length ? Math.min(...years) : null;
  const totalRaces = races.length;

  // 2026 race for section 05
  const race2026 = races.find((r) => (r.year as number) === 2026);
  let nextRace: { name: string; round: number; date: string; daysAway: number } | null = null;
  if (race2026?.date) {
    const today = new Date('2026-06-01');
    const raceDate = new Date(race2026.date as string);
    const daysAway = Math.round((raceDate.getTime() - today.getTime()) / 86400000);
    nextRace = {
      name: race2026.name as string,
      round: race2026.round as number,
      date: race2026.date as string,
      daysAway,
    };
  }

  // No-races early return
  if (!raceIds.length) {
    return (
      <main className="flex flex-col">
        <div className="h-10 px-6 border-b border-border flex items-center gap-2 shrink-0">
          <Link href="/circuits" className="font-mono text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150">
            {t('breadcrumb.circuits')}
          </Link>
          <span className="font-mono text-[11px] text-text-3">·</span>
          <span className="font-mono text-[11px] text-text-2">{circuit.name}</span>
        </div>
        <div className="px-6 pt-8 pb-7">
          <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] mb-3">{t('hero.label')}</p>
          <h1 className="font-serif text-5xl text-text-1 leading-[1.1] mb-2">{circuit.name}</h1>
          <p className="text-[14px] text-text-2 mb-1">{circuit.location} · {circuit.country}</p>
          <p className="font-mono text-[12px] text-text-3">{formatCoord(circuit.lat, circuit.lng)}</p>
        </div>
        <div className="px-6 py-12 border-t border-border">
          <p className="font-mono text-[13px] text-text-3">{t('noData')}</p>
        </div>
      </main>
    );
  }

  // Batch 3 — race winners + all fastest laps (parallel)
  const [winnersRaw, fastLapsRaw] = await Promise.all([
    supabase
      .from('results')
      .select('race_id, driver_id, constructor_id')
      .in('race_id', raceIds)
      .eq('position', 1),
    supabase
      .from('results')
      .select('race_id, driver_id, fastest_lap_time')
      .in('race_id', raceIds)
      .not('fastest_lap_time', 'is', null)
      .neq('fastest_lap_time', '\\N')
      .gt('fastest_lap_time', ''),
  ]);

  const winners = winnersRaw.data ?? [];
  const fastLaps = fastLapsRaw.data ?? [];

  // Best (fastest) lap per race_id
  const bestLapByRace = new Map<number, { driverId: number; time: string; ms: number }>();
  for (const fl of fastLaps) {
    const raceId = fl.race_id as number;
    const ms = parseTime(fl.fastest_lap_time as string);
    if (!isFinite(ms)) continue;
    const cur = bestLapByRace.get(raceId);
    if (!cur || ms < cur.ms) {
      bestLapByRace.set(raceId, {
        driverId: fl.driver_id as number,
        time: fl.fastest_lap_time as string,
        ms,
      });
    }
  }

  // Collect all driver + constructor IDs
  const winnerDriverIds = winners.map((w) => w.driver_id as number);
  const winnerConstructorIds = winners.map((w) => w.constructor_id as number);
  const lapDriverIds = [...bestLapByRace.values()].map((v) => v.driverId);

  const allDriverIds = [...new Set([...winnerDriverIds, ...lapDriverIds])];
  const allConstructorIds = [...new Set(winnerConstructorIds)];

  // Batch 4 — driver + constructor names (parallel)
  const [driversRaw, constructorsRaw] = await Promise.all([
    allDriverIds.length
      ? supabase.from('drivers').select('id, forename, surname').in('id', allDriverIds)
      : Promise.resolve({ data: [] as Array<{ id: unknown; forename: unknown; surname: unknown }> }),
    allConstructorIds.length
      ? supabase.from('constructors').select('id, name').in('id', allConstructorIds)
      : Promise.resolve({ data: [] as Array<{ id: unknown; name: unknown }> }),
  ]);

  const driverMap = new Map(
    (driversRaw.data ?? []).map((d) => [
      d.id as number,
      { forename: d.forename as string, surname: d.surname as string },
    ])
  );
  const constructorMap = new Map(
    (constructorsRaw.data ?? []).map((c) => [c.id as number, c.name as string])
  );

  // ─── Assemble: winners table (most recent first) ─────────────────────────

  const winnerRows = winners
    .flatMap((w) => {
      const year = raceYearMap.get(w.race_id as number);
      const driver = driverMap.get(w.driver_id as number);
      const constructor = constructorMap.get(w.constructor_id as number);
      if (!year || !driver || !constructor) return [];
      const bestLap = bestLapByRace.get(w.race_id as number);
      return [{ year, forename: driver.forename, surname: driver.surname, constructor, fastestLap: bestLap?.time ?? null }];
    })
    .sort((a, b) => b.year - a.year);

  // ─── Assemble: decade dominance ─────────────────────────────────────────

  const decadeRaceCount = new Map<number, number>();
  for (const year of years) {
    const d = Math.floor(year / 10) * 10;
    decadeRaceCount.set(d, (decadeRaceCount.get(d) ?? 0) + 1);
  }
  const decadeConWins = new Map<number, Map<string, number>>();
  for (const w of winners) {
    const year = raceYearMap.get(w.race_id as number);
    const con = constructorMap.get(w.constructor_id as number);
    if (!year || !con) continue;
    const d = Math.floor(year / 10) * 10;
    if (!decadeConWins.has(d)) decadeConWins.set(d, new Map());
    const m = decadeConWins.get(d)!;
    m.set(con, (m.get(con) ?? 0) + 1);
  }
  const decadeDominance = [...decadeRaceCount.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, total]) => {
      const byDecade = decadeConWins.get(decade);
      if (!byDecade?.size) return { decade, topConstructor: null, wins: 0, total };
      const [topConstructor, wins] = [...byDecade.entries()].sort((a, b) => b[1] - a[1])[0];
      return { decade, topConstructor, wins, total };
    });

  // ─── Assemble: lap record evolution (chronological) ──────────────────────

  const lapEntries = [...bestLapByRace.entries()]
    .flatMap(([raceId, lap]) => {
      const year = raceYearMap.get(raceId);
      const driver = driverMap.get(lap.driverId);
      if (!year || !driver) return [];
      return [{ year, forename: driver.forename, surname: driver.surname, time: lap.time, ms: lap.ms }];
    })
    .sort((a, b) => a.year - b.year);

  const allTimeRecord = lapEntries.reduce<(typeof lapEntries)[0] | null>(
    (best, r) => (!best || r.ms < best.ms ? r : best),
    null
  );

  // ─── Assemble: constructor wins breakdown ────────────────────────────────

  const conWinsMap = new Map<string, number>();
  for (const w of winners) {
    const con = constructorMap.get(w.constructor_id as number);
    if (!con) continue;
    conWinsMap.set(con, (conWinsMap.get(con) ?? 0) + 1);
  }
  const constructorWins = [...conWinsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([constructor, wins]) => ({ constructor, wins }));
  const maxConWins = constructorWins[0]?.wins ?? 1;

  // ─── Locale-aware date formatter ─────────────────────────────────────────

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <main className="flex flex-col">

      {/* Breadcrumb */}
      <div className="h-10 px-6 border-b border-border flex items-center gap-2 shrink-0">
        <Link
          href="/circuits"
          className="font-mono text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150"
        >
          {t('breadcrumb.circuits')}
        </Link>
        <span className="font-mono text-[11px] text-text-3">·</span>
        <span className="font-mono text-[11px] text-text-2 truncate">{circuit.name}</span>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="px-6 pt-8 pb-7 border-b border-border">
        <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] mb-3">
          {t('hero.label')}
        </p>
        <h1 className="font-serif text-5xl text-text-1 leading-[1.1] mb-2">
          {circuit.name}
        </h1>
        <p className="text-[14px] text-text-2 mb-1">
          {circuit.location} · {circuit.country}
        </p>
        <p className="font-mono text-[12px] text-text-3 mb-7">
          {formatCoord(circuit.lat, circuit.lng)}
        </p>
        <div className="flex items-end gap-12">
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('hero.firstRace')}
            </p>
            <p className="font-serif text-[56px] text-text-1 leading-none tabular-nums">
              {firstYear ?? '—'}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('hero.totalRaces')}
            </p>
            <p className="font-serif text-[56px] text-text-1 leading-none tabular-nums">
              {totalRaces}
            </p>
          </div>
        </div>
      </div>

      {/* ── 01 · Race Winners ─────────────────────────────────────────── */}
      {winnerRows.length > 0 && (
        <section className="border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">01 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('winners.title')}</h2>
            <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">
              {winnerRows.length}
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="sticky top-0 bg-surface border-b border-border z-10">
                  <th className="px-6 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-16">
                    {t('winners.year')}
                  </th>
                  <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
                    {t('winners.driver')}
                  </th>
                  <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
                    {t('winners.constructor')}
                  </th>
                  <th className="px-6 py-2 text-right font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
                    {t('winners.fastestLap')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {winnerRows.map((row) => (
                  <tr
                    key={row.year}
                    className="border-b border-border last:border-b-0 hover:bg-surface transition-colors duration-100"
                  >
                    <td className="px-6 py-2.5 font-mono text-xs text-text-3 tabular-nums">
                      {row.year}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[13px] text-text-2">{row.forename[0]}. </span>
                      <span className="text-[13px] font-semibold text-text-1 uppercase tracking-[0.02em]">
                        {row.surname}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-text-2">
                      {row.constructor}
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
        </section>
      )}

      {/* ── 02 · Decade Dominance  |  03 · Lap Record Evolution ──────── */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">

        {/* 02 · Decade Dominance */}
        <section>
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">02 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('dominance.title')}</h2>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            {decadeDominance.map(({ decade, topConstructor, wins, total }) => (
              <div key={decade}>
                <div className="flex items-baseline gap-3 mb-1.5">
                  <span className="font-mono text-[11px] text-text-3 tabular-nums w-10 shrink-0">
                    {decade}s
                  </span>
                  {topConstructor ? (
                    <>
                      <span className="text-[13px] text-text-1 flex-1 min-w-0 truncate">
                        {topConstructor}
                      </span>
                      <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0">
                        {wins}/{total}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono text-[11px] text-text-3">—</span>
                  )}
                </div>
                {/* Bar: wins / total races in decade */}
                <div className="ml-[52px] h-px bg-border overflow-hidden">
                  <div
                    className="h-full bg-text-2"
                    style={{ width: topConstructor ? `${(wins / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 03 · Lap Record Evolution */}
        <section>
          <div className="px-6 py-3 border-b border-border flex items-center gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">03 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('lapRecord.title')}</h2>
            {allTimeRecord && (
              <span className="font-mono text-[11px] text-red ml-auto tabular-nums">
                {allTimeRecord.time}
              </span>
            )}
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {lapEntries.length > 0 ? (
              lapEntries.map((row) => (
                <div
                  key={row.year}
                  className="flex items-center gap-3 px-6 h-9 border-b border-border last:border-b-0"
                >
                  <span className="font-mono text-[11px] text-text-3 tabular-nums w-10 shrink-0">
                    {row.year}
                  </span>
                  <span
                    className={[
                      'font-mono text-[13px] tabular-nums shrink-0 w-20',
                      row.ms === allTimeRecord?.ms ? 'text-red' : 'text-text-1',
                    ].join(' ')}
                  >
                    {row.time}
                  </span>
                  <span className="text-[12px] text-text-2 flex-1 min-w-0 truncate">
                    {row.forename[0]}. {row.surname}
                  </span>
                  {row.ms === allTimeRecord?.ms && (
                    <span className="font-mono text-[9px] text-red uppercase tracking-[0.08em] shrink-0">
                      {t('lapRecord.allTime')}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="px-6 py-6">
                <span className="font-mono text-[13px] text-text-3">—</span>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ── 04 · Constructor Wins ─────────────────────────────────────── */}
      {constructorWins.length > 0 && (
        <section className="border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">04 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('constructors.title')}</h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-3 gap-x-8 gap-y-3">
            {constructorWins.map(({ constructor, wins }, idx) => (
              <div key={constructor} className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-text-3 tabular-nums w-5 shrink-0">
                  {idx + 1}
                </span>
                <span className="text-[13px] text-text-1 flex-1 min-w-0 truncate">
                  {constructor}
                </span>
                <div className="w-16 h-px bg-border overflow-hidden shrink-0">
                  <div
                    className="h-full bg-text-2"
                    style={{ width: `${(wins / maxConWins) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[13px] text-text-1 tabular-nums shrink-0 w-5 text-right">
                  {wins}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 05 · Next Race (2026 only) ────────────────────────────────── */}
      {nextRace && (
        <section>
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">05 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('nextRace.title')}</h2>
          </div>
          <div className="px-6 py-7 flex items-end gap-12">
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('nextRace.round')}
              </p>
              <p className="font-serif text-[48px] text-text-1 leading-none tabular-nums">
                Rd.{nextRace.round}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('nextRace.date')}
              </p>
              <p className="font-mono text-[18px] text-text-1 leading-none tabular-nums">
                {dateFormatter.format(new Date(nextRace.date))}
              </p>
            </div>
            <div>
              {nextRace.daysAway > 0 ? (
                <>
                  <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                    {t('nextRace.countdown')}
                  </p>
                  <p className="font-serif text-[48px] text-red leading-none tabular-nums">
                    {nextRace.daysAway}
                    <span className="font-mono text-[13px] text-text-3 ml-2">
                      {t('nextRace.days')}
                    </span>
                  </p>
                </>
              ) : nextRace.daysAway === 0 ? (
                <p className="font-mono text-[13px] text-red uppercase tracking-[0.06em]">
                  {t('nextRace.today')}
                </p>
              ) : (
                <p className="font-mono text-[12px] text-text-3">
                  {t('nextRace.past')}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}
