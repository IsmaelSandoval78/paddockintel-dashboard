import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { fetchTrackPathData } from '@/lib/trackSvg';
import { getFormatter } from 'next-intl/server';
import { teamColor } from '@/components/home/kinetic/teamColors';
import type { RibbonFrame } from '@/components/circuits/kinetic/deltaRibbon/geometry';
import DeltaRibbonSection, { type DeltaRibbonEventRow, type DeltaRibbonDriver } from '@/components/circuits/kinetic/DeltaRibbonSection';
import { getCircuitStory, type Era } from '@/lib/circuitStory';
import { getHubSeason } from '@/lib/hubSeason';
import { Section, Stat } from '@/components/hub-dusk/Blocks';
import { teamVar } from '@/components/home-dusk/StandingsCard';
import EraTimeline from '@/components/circuit-dusk/EraTimeline';
import WinnerGrid from '@/components/circuit-dusk/WinnerGrid';
import RankBars from '@/components/circuit-dusk/RankBars';
import { duskSans } from '../../../(blog)/dusk-font';
import '../../../(blog)/dusk.css';
import { HUB_URL, localeUrl as siteLocaleUrl } from '@/lib/site-url';
import { HUB_TWITTER, openGraphFor } from '@/lib/seo';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string; slug: string }>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// trailingSlash: true -- a URL without the final slash 308s, so canonical/hreflang/JSON-LD carry it.
function localeUrl(locale: string, path: string): string {
  const p = path.endsWith('/') ? path : `${path}/`;
  return locale === 'en' ? `${HUB_URL}${p}` : `${HUB_URL}/${locale}${p}`;
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
  const { locale, slug } = await params;
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
  const canonical = localeUrl(locale, `/circuits/${slug}`);
  return {
    title: `${name} — PaddockIntel`,
    description: `Full race history, lap records, and statistics for ${name} in ${location}, ${country}.`,
    alternates: {
      canonical,
      languages: {
        en: localeUrl('en', `/circuits/${slug}`),
        es: localeUrl('es', `/circuits/${slug}`),
        'x-default': localeUrl('en', `/circuits/${slug}`),
      },
    },
    openGraph: openGraphFor(canonical),
    twitter: HUB_TWITTER,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
// "The story of a track" in the Telemetry at Dusk look (docs/DECISION-2026-10-11-home-dusk.md,
// circuit section): what the place is, its eras, who rules it, how races are won there, the records
// on today's layout, this weekend when it hosts the next race, every winner, and PaddockIntel's own
// telemetry where we have it. Every chapter hides when its data is missing.

export default async function CircuitDetailPage({ params }: { params: PageParams }) {
  const { slug, locale } = await params;
  const [t, tRibbon, format, story] = await Promise.all([
    getTranslations('circuitStory'),
    getTranslations('circuitDetail.deltaRibbon'),
    getFormatter(),
    getCircuitStory(slug),
  ]);
  if (!story) notFound();
  const supabase = createClient();
  const { circuit, editions, eras, upcoming, altitude, records } = story;

  const circuitUrl = localeUrl(locale, `/circuits/${circuit.ref}`);
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: localeUrl(locale, '/') },
      { '@type': 'ListItem', position: 2, name: 'Circuits', item: localeUrl(locale, '/circuits') },
      { '@type': 'ListItem', position: 3, name: circuit.name },
    ],
  };
  const placeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: circuit.name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: circuit.location,
      addressCountry: circuit.country,
    },
    ...(circuit.lat != null && circuit.lng != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: circuit.lat, longitude: circuit.lng } }
      : {}),
    url: circuitUrl,
  };

  // Calendar dates are date-only values: format them in UTC so the day never shifts.
  const day = (iso: string) => format.dateTime(new Date(`${iso}T12:00:00Z`), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const trackPathData = await fetchTrackPathData(circuit.ref);

  // Delta Ribbon (PaddockIntel telemetry) for the latest race here that has it.
  const { data: racesRaw } = await supabase.from('races').select('id, year, name').eq('circuit_id', circuit.id);
  const races = racesRaw ?? [];
  const raceIds = races.map((r) => r.id as number);
  const raceYearMap = new Map(races.map((r) => [r.id as number, r.year as number]));
  // Batch 2b — Delta Ribbon existence check for this circuit (generic by circuit, not
  // hardcoded — extends automatically as more races get loaded via scripts/load-delta-ribbon.ts)
  const { data: ribbonRaceRows } = await supabase
    .from('delta_ribbon_frames')
    .select('race_id')
    .in('race_id', raceIds)
    .limit(2000);
  const ribbonRaceIds = [...new Set((ribbonRaceRows ?? []).map((r) => r.race_id as number))];
  const deltaRibbonRaceId = ribbonRaceIds.length
    ? ribbonRaceIds.sort((a, b) => (raceYearMap.get(b) ?? 0) - (raceYearMap.get(a) ?? 0))[0]
    : null;

  let deltaRibbon: {
    raceName: string;
    frames: RibbonFrame[];
    events: DeltaRibbonEventRow[];
    driverA: DeltaRibbonDriver;
    driverB: DeltaRibbonDriver;
  } | null = null;

  if (deltaRibbonRaceId) {
    const [{ data: framesRaw }, { data: eventsRaw }] = await Promise.all([
      supabase
        .from('delta_ribbon_frames')
        .select('driver_a_id, driver_b_id, path_percent, lap, delta_seconds, leader_driver_id')
        .eq('race_id', deltaRibbonRaceId)
        .order('lap', { ascending: true })
        .order('path_percent', { ascending: true }),
      supabase
        .from('delta_ribbon_events')
        .select('path_percent, lap, event_type, corner_name')
        .eq('race_id', deltaRibbonRaceId)
        .order('lap', { ascending: true })
        .order('path_percent', { ascending: true }),
    ]);

    const ribbonFrames = framesRaw ?? [];
    if (ribbonFrames.length) {
      const idA = ribbonFrames[0].driver_a_id as number;
      const idB = ribbonFrames[0].driver_b_id as number;

      const [{ data: ribbonResultsRaw }, { data: ribbonDriversRaw }] = await Promise.all([
        supabase
          .from('results')
          .select('driver_id, constructor_id')
          .eq('race_id', deltaRibbonRaceId)
          .in('driver_id', [idA, idB]),
        supabase
          .from('drivers')
          .select('id, forename, surname, code')
          .in('id', [idA, idB]),
      ]);

      const constructorIdByDriver = new Map(
        (ribbonResultsRaw ?? []).map((r) => [r.driver_id as number, r.constructor_id as number])
      );
      const ribbonConstructorIds = [...new Set([...constructorIdByDriver.values()])];
      const { data: ribbonConstructorsRaw } = ribbonConstructorIds.length
        ? await supabase.from('constructors').select('id, constructor_ref').in('id', ribbonConstructorIds)
        : { data: [] as Array<{ id: unknown; constructor_ref: unknown }> };
      const constructorRefById = new Map(
        (ribbonConstructorsRaw ?? []).map((c) => [c.id as number, c.constructor_ref as string])
      );
      const ribbonDriverById = new Map((ribbonDriversRaw ?? []).map((d) => [d.id as number, d]));

      const buildRibbonDriver = (id: number): DeltaRibbonDriver | null => {
        const d = ribbonDriverById.get(id);
        if (!d) return null;
        const conRef = constructorRefById.get(constructorIdByDriver.get(id) ?? -1);
        return {
          id,
          code: (d.code as string | null) ?? null,
          forename: d.forename as string,
          surname: d.surname as string,
          teamColor: teamColor(conRef ?? ''),
        };
      };

      const ribbonDriverA = buildRibbonDriver(idA);
      const ribbonDriverB = buildRibbonDriver(idB);
      const ribbonRaceName = races.find((r) => (r.id as number) === deltaRibbonRaceId)?.name as string | undefined;

      if (ribbonDriverA && ribbonDriverB && ribbonRaceName) {
        deltaRibbon = {
          raceName: ribbonRaceName,
          frames: ribbonFrames.map((f) => ({
            lap: f.lap as number,
            path_percent: f.path_percent as number,
            delta_seconds: f.delta_seconds as number,
            leader_driver_id: f.leader_driver_id as number,
          })),
          events: (eventsRaw ?? []).map((e) => ({
            path_percent: e.path_percent as number,
            lap: e.lap as number,
            event_type: e.event_type as DeltaRibbonEventRow['event_type'],
            corner_name: e.corner_name as string | null,
          })),
          driverA: ribbonDriverA,
          driverB: ribbonDriverB,
        };
      }
    }
  }

  // Title stakes, only when this circuit hosts the next Grand Prix.
  const season = upcoming?.isNext ? await getHubSeason(locale) : null;

  const first = editions[0]?.year ?? null;
  const last = editions[editions.length - 1]?.year ?? null;
  const multiEra = eras.length > 1;
  const currentEra: Era | undefined = eras[eras.length - 1];
  const earlier = eras.slice(0, -1).flatMap((e) => e.editions);
  const earlierStarters = earlier.reduce((s, e) => s + e.starters, 0);
  const earlierPct = earlierStarters > 0 ? Math.round((100 * earlier.reduce((s, e) => s + e.retirements, 0)) / earlierStarters) : null;
  const allStarters = editions.reduce((s, e) => s + e.starters, 0);
  const allPct = allStarters > 0 ? Math.round((100 * editions.reduce((s, e) => s + e.retirements, 0)) / allStarters) : null;
  const deepest = [...editions].filter((e) => e.winner.grid > 0).sort((a, b) => b.winner.grid - a.winner.grid)[0];
  const comeback = deepest && deepest.winner.grid >= 4 ? deepest : null;
  const currentBack = currentEra && currentEra.editions.length >= 3 ? Math.max(...currentEra.editions.map((e) => e.winner.grid)) : null;
  const eraName = (i: number) => (i === 0 ? t('eras.original') : i === eras.length - 1 ? t('eras.current') : t('eras.nth', { n: i + 1 }));
  const lastEdition = editions[editions.length - 1];
  const topDriver = story.topDrivers[0];
  const topTied = story.topDrivers.filter((d) => d.wins === topDriver?.wins);

  const dek = [
    first !== null ? t('hero.editions', { n: editions.length, first }) + (multiEra ? t('hero.layouts', { k: eras.length }) : '') + '.' : '',
    altitude?.highestOnCalendar
      ? altitude.highestOnCalendar.next
        ? t('hero.highest', {
            metres: format.number(altitude.metres),
            year: altitude.highestOnCalendar.year,
            next: altitude.highestOnCalendar.next.location,
            nextMetres: format.number(altitude.highestOnCalendar.next.metres),
          })
        : t('hero.highestAlone', { metres: format.number(altitude.metres), year: altitude.highestOnCalendar.year })
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const stripLine = upcoming
    ? upcoming.isNext && upcoming.daysUntil <= 6
      ? t('strip.thisWeek', { name: upcoming.name, date: day(upcoming.date), round: upcoming.round, total: upcoming.seasonRounds })
      : t('strip.next', { year: upcoming.year, name: upcoming.name, date: day(upcoming.date) })
    : last !== null
      ? t('strip.lastRaced', { year: last })
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-7 pb-16 flex flex-col gap-4">
          {/* Strip: where the circuit sits on the calendar */}
          <div className="dusk-card soft-card border-l-[3px] border-l-[color:var(--dusk-warm)] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="dusk-label">
                <Link href="/circuits" className="no-underline hover:text-[color:var(--dusk-sunset)]">{t('strip.kicker', { country: circuit.country })}</Link>
              </div>
              {stripLine && <div className="text-[17px] font-semibold mt-1">{stripLine}</div>}
            </div>
            {season && season.title.state === 'clinchable' && (
              <Link href="/" className="dusk-link no-underline dusk-mono text-[12px] uppercase tracking-[0.06em]">{t('strip.season')} →</Link>
            )}
          </div>

          {/* 01 · Cover */}
          <section className="dusk-card dusk-hero p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
            <div className="flex flex-col gap-3 min-w-0">
              <span className="dusk-label text-[color:var(--dusk-sunset)]">{t('hero.kicker', { location: circuit.location })}</span>
              <h1 className="dusk-display m-0 text-[clamp(34px,4.6vw,60px)] leading-none tracking-[-0.02em]">{circuit.name}</h1>
              {dek && <p className="dusk-hero-dek m-0 text-[clamp(15px,1.5vw,18px)] max-w-[52ch]">{dek}</p>}
              {altitude && (
                <span className="dusk-insight-chip inline-flex items-baseline gap-2 self-start mt-2">
                  <span className="dusk-label">{t('hero.altitude')}</span>
                  <span className="dusk-display text-[24px] text-[color:var(--dusk-ink)]">{format.number(altitude.metres)} m</span>
                </span>
              )}
            </div>
            {trackPathData && (
              <svg viewBox={trackPathData.viewBox} role="img" aria-label={t('hero.trackAria', { name: circuit.name })} className="block w-full max-h-[340px]">
                <path
                  d={trackPathData.path}
                  fill="none"
                  stroke="var(--dusk-sunset)"
                  strokeWidth={7}
                  strokeLinejoin="round"
                  className="[filter:drop-shadow(0_0_10px_var(--dusk-warm))]"
                />
              </svg>
            )}
          </section>

          {editions.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat
                kicker={t('kpi.editions')}
                big={editions.length}
                text={upcoming ? t('kpi.editionsNext', { first: first!, n: editions.length + 1, date: day(upcoming.date) }) : t('kpi.editionsSince', { first: first! })}
                tone="warm"
              />
              <Stat kicker={t('kpi.fromPole')} big={`${story.poleWins}/${editions.length}`} text={t('kpi.fromPoleSub')} />
              {topDriver && (
                <Stat kicker={t('kpi.mostWins')} big={topDriver.wins} text={t('kpi.mostWinsSub', { names: format.list(topTied.map((d) => d.surname)) })} />
              )}
              {multiEra && currentEra?.retirementPct != null && earlierPct !== null ? (
                <Stat kicker={t('kpi.retireCurrent')} big={`${currentEra.retirementPct}%`} text={t('kpi.retireVs', { old: earlierPct })} />
              ) : (
                allPct !== null && <Stat kicker={t('kpi.retire')} big={`${allPct}%`} text={t('kpi.retireAll')} />
              )}
            </div>
          )}

          {/* 02 · Eras */}
          {editions.length > 1 && (
            <Section n="02" title={multiEra ? t('eras.titleMany', { k: eras.length }) : t('eras.titleOne')} sub={t('eras.sub')}>
              <div className="dusk-card soft-card p-4 sm:p-5">
                <EraTimeline
                  eras={eras}
                  labels={{
                    aria: t('eras.aria'),
                    gap: (n) => t('eras.gap', { n }),
                    missing: t('eras.missing'),
                    winner: (year, name) => t('eras.winner', { year, name }),
                  }}
                />
              </div>
              {multiEra && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {eras.map((era, i) => (
                    <div key={`${era.from}-${era.layout}`} className="dusk-card soft-card p-5 flex flex-col gap-3">
                      <span className="dusk-label">{`${era.from === era.to ? era.from : `${era.from}–${era.to}`} · ${eraName(i)}`}</span>
                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <div className="dusk-display text-[28px] leading-none">{era.editions.length}</div>
                          <p className="m-0 mt-1 text-[12.5px] text-[color:var(--dusk-ink-2)]">{t('eras.gps')}</p>
                        </div>
                        <div>
                          <div className="dusk-display text-[28px] leading-none">{`${era.poleWins}/${era.editions.length}`}</div>
                          <p className="m-0 mt-1 text-[12.5px] text-[color:var(--dusk-ink-2)]">{t('eras.fromPole')}</p>
                        </div>
                        {era.retirementPct !== null && (
                          <div>
                            <div className="dusk-display text-[28px] leading-none">{era.retirementPct}%</div>
                            <p className="m-0 mt-1 text-[12.5px] text-[color:var(--dusk-ink-2)]">{t('eras.retire')}</p>
                          </div>
                        )}
                      </div>
                      {era.topWinners && (
                        <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)]">
                          {t('eras.top', { names: format.list(era.topWinners.surnames), n: era.topWinners.wins })}
                        </p>
                      )}
                      <ul className="list-none m-0 p-0 flex flex-wrap gap-1.5">
                        {era.editions.map((e) => (
                          <li
                            key={e.raceId}
                            className="dusk-mono text-[12px] inline-flex items-baseline gap-1.5 px-2 py-1 rounded-lg border-l-2"
                            style={{ borderColor: teamVar(e.winner.teamRef), background: `color-mix(in srgb, ${teamVar(e.winner.teamRef)} 20%, transparent)` }}
                          >
                            <span className="text-[color:var(--dusk-muted)]">{e.year}</span>
                            <Link href={`/drivers/${e.winner.ref}/`} className="no-underline hover:text-[color:var(--dusk-sunset)]">{e.winner.surname}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* 03 · Who rules here */}
          {story.topDrivers.length > 0 && first !== null && last !== null && (
            <Section n="03" title={t('rule.title')} sub={t('rule.sub', { from: first, to: last })}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <div className="dusk-card soft-card p-5 flex flex-col gap-2">
                  <span className="dusk-label">{t('rule.drivers')}</span>
                  <RankBars rows={story.topDrivers.map((d) => ({ key: d.surname + d.years[0], label: d.surname, value: d.wins, colour: teamVar(d.teamRef) }))} />
                  {topDriver && topDriver.wins > 1 && (
                    <p className="m-0 mt-1 text-[14px] text-[color:var(--dusk-ink-2)]">
                      {t('rule.note', { name: topDriver.surname, years: format.list(topDriver.years.map(String)) })}
                    </p>
                  )}
                </div>
                <div className="dusk-card soft-card p-5 flex flex-col gap-2">
                  <span className="dusk-label">{t('rule.teams')}</span>
                  <RankBars rows={story.topTeams.map((c) => ({ key: c.ref, label: c.name, value: c.wins, colour: teamVar(c.ref) }))} />
                </div>
              </div>
            </Section>
          )}

          {/* 04 · How races are won here */}
          {editions.length > 1 && (
            <Section n="04" title={t('win.title')} sub={t('win.sub')}>
              <div className="dusk-card soft-card p-5 flex flex-col gap-3">
                <WinnerGrid
                  editions={editions}
                  deepestRaceId={comeback?.raceId ?? null}
                  labels={{
                    aria: t('win.aria'),
                    bar: (year, name, grid) => t('win.bar', { year, name, grid }),
                    pitLane: t('win.pitLane'),
                  }}
                />
                <p className="dusk-mono m-0 text-[11px] text-[color:var(--dusk-muted)]">{t('win.legend')}</p>
                {(comeback || (multiEra && currentBack !== null)) && (
                  <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)]">
                    {[
                      comeback ? t('win.comeback', { name: comeback.winner.surname, year: comeback.year, grid: comeback.winner.grid }) : '',
                      multiEra && currentBack !== null ? t('win.current', { grid: currentBack }) : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                )}
              </div>
            </Section>
          )}

          {/* 05 · Records on the current layout */}
          {records && currentEra && (
            <Section n="05" title={t('rec.title')} sub={t('rec.sub', { year: currentEra.from })}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {records.raceLap && (
                  <Stat kicker={t('rec.raceLap')} big={<span className="dusk-mono">{records.raceLap.time}</span>} text={t('rec.holder', { name: records.raceLap.surname, year: records.raceLap.year })} />
                )}
                {records.pole && (
                  <Stat kicker={t('rec.pole')} big={<span className="dusk-mono">{records.pole.time}</span>} text={t('rec.holder', { name: records.pole.surname, year: records.pole.year })} />
                )}
                {records.fastestQuali && (
                  <Stat
                    kicker={t('rec.quali')}
                    big={<span className="dusk-mono">{records.fastestQuali.time}</span>}
                    text={
                      records.fastestQuali.pole
                        ? t('rec.qualiNote', { name: records.fastestQuali.surname, year: records.fastestQuali.year, pole: records.fastestQuali.pole })
                        : t('rec.holder', { name: records.fastestQuali.surname, year: records.fastestQuali.year })
                    }
                  />
                )}
              </div>
            </Section>
          )}

          {/* 06 · This weekend */}
          {upcoming?.isNext && lastEdition && (
            <Section n="06" title={t('weekend.title')} sub={t('weekend.sub', { round: upcoming.round, date: day(upcoming.date) })}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <div className="dusk-card soft-card p-5">
                  <span className="dusk-label">{t('weekend.last', { year: lastEdition.year })}</span>
                  <ol className="list-none m-0 mt-2 p-0">
                    {lastEdition.podium.map((p) => (
                      <li key={p.position} className="grid grid-cols-[36px_4px_1fr] items-center gap-2.5 py-2 border-t border-[color:var(--dusk-line)] text-[14px]">
                        <span className="dusk-mono text-[color:var(--dusk-muted)]">P{p.position}</span>
                        <span className="h-4 rounded-sm" style={{ background: teamVar(p.teamRef) }} />
                        <span>{p.surname}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                {season && season.title.state === 'clinchable' && (
                  <div className="dusk-card soft-card p-5 flex flex-col gap-1.5">
                    <span className="dusk-label">{t('weekend.titleKicker')}</span>
                    <span className="dusk-display text-[clamp(28px,3.2vw,40px)] leading-none mt-1 text-[color:var(--dusk-sunset)]">
                      {t('weekend.clinch', { points: season.title.points })}
                    </span>
                    <p className="m-0 text-[13.5px] text-[color:var(--dusk-ink-2)]">{t('weekend.clinchText', { name: season.leader.surname })}</p>
                    <Link href="/" className="dusk-link no-underline dusk-mono text-[12px] uppercase tracking-[0.06em] mt-2">{t('strip.season')} →</Link>
                  </div>
                )}
                {season && season.title.state === 'open' && season.rival && (
                  <Stat
                    kicker={t('weekend.titleKicker')}
                    big={`+${season.leader.points - season.rival.points}`}
                    text={t('weekend.lead', { name: season.leader.surname, left: season.pointsLeft })}
                    tone="warm"
                  />
                )}
              </div>
            </Section>
          )}

          {/* 07 · Every winner */}
          {editions.length > 0 && (
            <Section n="07" title={t('all.title')} sub={t('all.sub', { n: editions.length })}>
              <div className="dusk-card soft-card p-5 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-[14px]">
                  <thead>
                    <tr className="dusk-label text-left">
                      <th className="py-2 pr-3 font-normal">{t('all.year')}</th>
                      <th className="py-2 pr-3 font-normal">{t('all.winner')}</th>
                      <th className="py-2 pr-3 font-normal">{t('all.team')}</th>
                      <th className="py-2 pr-3 font-normal">{t('all.start')}</th>
                      <th className="py-2 pr-3 font-normal">{t('all.pole')}</th>
                      <th className="py-2 font-normal">{t('all.fastest')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...editions].reverse().map((e) => (
                      <tr key={e.raceId} className="border-t border-[color:var(--dusk-line)]">
                        <td className="dusk-mono py-2 pr-3 text-[color:var(--dusk-muted)]">{e.year}</td>
                        <td className="py-2 pr-3">
                          <span className="inline-block w-1 h-3.5 rounded-sm mr-2 align-[-2px]" style={{ background: teamVar(e.winner.teamRef) }} />
                          <Link href={`/drivers/${e.winner.ref}/`} className="no-underline hover:text-[color:var(--dusk-sunset)]">{e.winner.surname}</Link>
                        </td>
                        <td className="py-2 pr-3 text-[color:var(--dusk-ink-2)]">{e.winner.teamName}</td>
                        <td className="dusk-mono py-2 pr-3">{e.winner.grid > 0 ? `P${e.winner.grid}` : t('win.pitLane')}</td>
                        <td className="py-2 pr-3 text-[color:var(--dusk-ink-2)]">{e.pole?.surname ?? ''}</td>
                        <td className="dusk-mono py-2 text-[color:var(--dusk-ink-2)]">{e.fastestLap ? `${e.fastestLap.surname} ${e.fastestLap.time}` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* 08 · PaddockIntel telemetry */}
          {deltaRibbon && (
            <Section n="08" title={t('telemetry.title')} sub={t('telemetry.sub', { race: deltaRibbon.raceName })}>
              <div className="dusk-card soft-card p-5 flex flex-col gap-3">
                <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)]">
                  {tRibbon('methodology', {
                    driverA: deltaRibbon.driverA.code ?? deltaRibbon.driverA.surname,
                    driverB: deltaRibbon.driverB.code ?? deltaRibbon.driverB.surname,
                    raceName: deltaRibbon.raceName,
                  })}{' '}
                  <a className="dusk-link" href={siteLocaleUrl(locale, '/methodology/delta-ribbon/')}>{tRibbon('title')}</a>
                </p>
                <DeltaRibbonSection
                  trackPathData={trackPathData}
                  frames={deltaRibbon.frames}
                  events={deltaRibbon.events}
                  driverA={deltaRibbon.driverA}
                  driverB={deltaRibbon.driverB}
                />
              </div>
            </Section>
          )}
        </div>
      </main>
    </>
  );
}
