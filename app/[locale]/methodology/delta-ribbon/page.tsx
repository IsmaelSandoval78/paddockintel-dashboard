import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { SITE_URL, localeUrl, hubLocaleUrl } from '@/lib/site-url';
import { teamColor } from '@/components/home/kinetic/teamColors';
import GapChart, { type GapEvent, type GapPoint } from './GapChart';
import { duskSans } from '../../(blog)/dusk-font';
import '../../(blog)/dusk.css';

export const revalidate = 3600;

type PageParams = Promise<{ locale: string }>;

const PATH = '/methodology/delta-ribbon/';
// The worked example stays pinned to the first race ever loaded (Belgian GP 2026, races.id 1178)
// so the walkthrough doesn't change under readers when another race is loaded; the coverage
// numbers above it are live across every load.
const EXAMPLE_RACE_ID = 1178;
// First published in #54 (git), rewritten in this pass.
const DATE_PUBLISHED = '2026-09-25';
const DATE_MODIFIED = '2026-10-13';

type Frame = { race_id: number; lap: number; path_percent: number; delta_seconds: number; leader_driver_id: number; corner_name: string | null };
type RibbonEvent = { race_id: number; lap: number; path_percent: number; event_type: 'snap' | 'defend' | 'braid_start' | 'braid_end'; corner_name: string | null };
type Driver = { id: number; forename: string; surname: string; code: string | null };
type Result = { driver_id: number; position: number | null; milliseconds: number | null; laps: number | null; constructor_id: number };

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'methodology' });
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localeUrl(l, PATH);
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: localeUrl(locale, PATH),
      languages: { ...languages, 'x-default': languages.en },
    },
  };
}

async function getData() {
  const supabase = createClient();

  // Coverage across every load. Frames are paged: PostgREST caps a read at 1,000 rows.
  const coverage: { race_id: number; driver_a_id: number; driver_b_id: number; lap: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from('delta_ribbon_frames')
      .select('race_id, driver_a_id, driver_b_id, lap')
      .order('id')
      .range(from, from + 999);
    coverage.push(...((data ?? []) as typeof coverage));
    if (!data || data.length < 1000) break;
  }
  const [{ data: allEvents }, { data: framesRaw }, { data: raceRow }] = await Promise.all([
    supabase.from('delta_ribbon_events').select('race_id, lap, path_percent, event_type, corner_name'),
    // id order is time order: the loader sorts frames by timestamp before inserting them.
    supabase
      .from('delta_ribbon_frames')
      .select('race_id, lap, path_percent, delta_seconds, leader_driver_id, corner_name, driver_a_id, driver_b_id')
      .eq('race_id', EXAMPLE_RACE_ID)
      .order('id'),
    supabase.from('races').select('name, year, circuit_id').eq('id', EXAMPLE_RACE_ID).maybeSingle(),
  ]);

  const events = (allEvents ?? []) as RibbonEvent[];
  const pairs = new Set(coverage.map((f) => `${f.race_id}|${f.driver_a_id}|${f.driver_b_id}`));
  const stats = {
    races: new Set(coverage.map((f) => f.race_id)).size,
    pairs: pairs.size,
    samples: coverage.length,
    laps: new Set(coverage.map((f) => `${f.race_id}|${f.lap}`)).size,
    snaps: events.filter((e) => e.event_type === 'snap').length,
    braids: events.filter((e) => e.event_type === 'braid_start').length,
    defends: events.filter((e) => e.event_type === 'defend').length,
  };

  const frames = (framesRaw ?? []) as (Frame & { driver_a_id: number; driver_b_id: number })[];
  const race = raceRow as { name: string; year: number; circuit_id: number } | null;
  if (!frames.length || !race) return { stats, example: null };

  const idA = frames[0].driver_a_id;
  const idB = frames[0].driver_b_id;
  const [{ data: drivers }, { data: results }, { data: circuit }, { data: pits }, { data: led }] = await Promise.all([
    supabase.from('drivers').select('id, forename, surname, code').in('id', [idA, idB]),
    supabase.from('results').select('driver_id, position, milliseconds, laps, constructor_id').eq('race_id', EXAMPLE_RACE_ID).in('driver_id', [idA, idB]),
    supabase.from('circuits').select('circuit_ref, name').eq('id', race.circuit_id).maybeSingle(),
    supabase.from('pit_stops').select('driver_id, lap, duration').eq('race_id', EXAMPLE_RACE_ID).in('driver_id', [idA, idB]),
    supabase.from('lap_times').select('lap').eq('race_id', EXAMPLE_RACE_ID).eq('position', 1).in('driver_id', [idA, idB]),
  ]);
  const res = (results ?? []) as Result[];
  const { data: constructors } = res.length
    ? await supabase.from('constructors').select('id, constructor_ref').in('id', res.map((r) => r.constructor_id))
    : { data: [] };

  const driverById = new Map(((drivers ?? []) as Driver[]).map((d) => [d.id, d]));
  const refById = new Map(((constructors ?? []) as { id: number; constructor_ref: string }[]).map((c) => [c.id, c.constructor_ref]));
  const colorOf = (id: number) => teamColor(refById.get(res.find((r) => r.driver_id === id)?.constructor_id ?? -1) ?? '');
  const a = driverById.get(idA);
  const b = driverById.get(idB);
  if (!a || !b) return { stats, example: null };

  return {
    stats,
    example: {
      race,
      circuit: circuit as { circuit_ref: string; name: string } | null,
      a: { ...a, color: colorOf(idA), result: res.find((r) => r.driver_id === idA) ?? null },
      b: { ...b, color: colorOf(idB), result: res.find((r) => r.driver_id === idB) ?? null },
      frames: frames as Frame[],
      events: events.filter((e) => e.race_id === EXAMPLE_RACE_ID),
      pits: (pits ?? []) as { driver_id: number; lap: number; duration: string | null }[],
      ledLaps: [...new Set(((led ?? []) as { lap: number }[]).map((l) => l.lap))].sort((m, n) => m - n),
    },
  };
}

// [19, 20, 23, 24, 25] -> "19–20, 23–25"
function lapRanges(laps: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < laps.length; i++) {
    const start = laps[i];
    while (i + 1 < laps.length && laps[i + 1] === laps[i] + 1) i++;
    out.push(start === laps[i] ? String(start) : `${start}–${laps[i]}`);
  }
  return out.join(', ');
}

const lapPos = (f: { lap: number; path_percent: number }) => f.lap - 1 + Number(f.path_percent) / 100;

export default async function DeltaRibbonMethodologyPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  const [t, tCrumbs, format, { stats, example }] = await Promise.all([
    getTranslations('methodology'),
    getTranslations('articleDusk'),
    getFormatter(),
    getData(),
  ]);

  const n = (v: number) => format.number(v);
  const secs = (v: number, digits = 3) => format.number(v, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const b = (chunks: ReactNode) => <strong>{chunks}</strong>;
  const prose = 'font-prose text-[clamp(17px,1.25vw,19px)] leading-[1.7] m-0 mb-4';
  const h2 = 'dusk-display m-0 mt-10 mb-3 text-[clamp(1.35rem,2vw,1.6rem)] leading-tight tracking-[-0.01em] scroll-mt-20';
  const no = 'dusk-mono text-[12px] tracking-[0.08em] text-[color:var(--accent)] mr-2.5 align-[3px]';
  const name = 'Ismael Sandoval';

  const statCards = [
    { v: n(stats.races), l: t('stats.races'), u: t('stats.racesUnit', { count: stats.pairs }) },
    { v: n(stats.samples), l: t('stats.samples'), u: t('stats.samplesUnit', { count: stats.laps }) },
    { v: n(stats.snaps), l: t('stats.snaps'), u: t('stats.snapsUnit', { count: stats.braids }) },
    { v: n(stats.defends), l: t('stats.defends'), u: t('stats.defendsUnit') },
  ];

  // Worked example, entirely derived from the stored rows.
  let ex = null;
  if (example) {
    const { frames, events, a, b: bDrv, race, pits, ledLaps } = example;
    const short = (d: { code: string | null; surname: string }) => d.code ?? d.surname;
    const full = (d: { forename: string; surname: string }) => `${d.forename} ${d.surname}`;
    const byId = (id: number) => (id === a.id ? a : bDrv);
    const totalLaps = Math.max(a.result?.laps ?? 0, bDrv.result?.laps ?? 0, ...frames.map((f) => f.lap));
    const frameAt = (e: RibbonEvent) =>
      frames.find((f) => f.lap === e.lap && Number(f.path_percent) === Number(e.path_percent)) ??
      frames.reduce((best, f) => (Math.abs(lapPos(f) - lapPos(e)) < Math.abs(lapPos(best) - lapPos(e)) ? f : best));
    const ordered = [...events].sort((m, k) => lapPos(m) - lapPos(k));

    const snaps = ordered.filter((e) => e.event_type === 'snap').map((e) => {
      const f = frameAt(e);
      const ahead = byId(f.leader_driver_id);
      const behind = ahead.id === a.id ? bDrv : a;
      // A swap caused by the driver who lost the lead stopping on this lap or the one before.
      const pit = pits.find((p) => p.driver_id === behind.id && (p.lap === e.lap || p.lap === e.lap - 1));
      return { lap: e.lap, ahead, corner: e.corner_name, gap: Math.abs(Number(f.delta_seconds)), pit, behind };
    });
    const defendLaps = new Map<number, number>();
    for (const e of ordered.filter((ev) => ev.event_type === 'defend')) defendLaps.set(e.lap, (defendLaps.get(e.lap) ?? 0) + 1);
    const defendCount = [...defendLaps.values()].reduce((m, k) => m + k, 0);

    const perLap = new Map<number, number>();
    for (const f of frames) perLap.set(f.lap, (perLap.get(f.lap) ?? 0) + 1);
    const ledCounts = ledLaps.map((l) => perLap.get(l) ?? 0);
    const otherCounts = [...perLap.entries()].filter(([l]) => !ledLaps.includes(l)).map(([, c]) => c);
    const missing = Array.from({ length: totalLaps }, (_, i) => i + 1).filter((l) => !perLap.has(l));

    const lastLap = Math.max(...frames.map((f) => f.lap));
    const lastFrame = frames.filter((f) => f.lap === lastLap).sort((m, k) => Number(m.path_percent) - Number(k.path_percent)).at(-1)!;
    const official =
      a.result?.milliseconds && bDrv.result?.milliseconds
        ? {
            leader: a.result.milliseconds < bDrv.result.milliseconds ? a : bDrv,
            gap: Math.abs(a.result.milliseconds - bDrv.result.milliseconds) / 1000,
            positions: [a.result.position, bDrv.result.position].filter((p): p is number => p !== null).sort((m, k) => m - k),
          }
        : null;

    const points: GapPoint[] = frames.map((f) => ({ lapPos: lapPos(f), delta: Number(f.delta_seconds) }));
    const markers: GapEvent[] = ordered
      .filter((e) => e.event_type === 'snap' || e.event_type === 'defend')
      .map((e) => ({ lapPos: lapPos(e), delta: Number(frameAt(e).delta_seconds), type: e.event_type as 'snap' | 'defend' }));

    ex = {
      a, b: bDrv, race, short, full, totalLaps, snaps, defendLaps, defendCount, ledLaps, ledCounts, otherCounts, missing,
      lastLap, lastFrame, official, points, markers, byId,
      maxAbs: Math.max(...frames.map((f) => Math.abs(Number(f.delta_seconds)))),
      circuit: example.circuit,
    };
  }

  const raceLabel = ex ? t('example.raceLabel', { race: ex.race.name, year: ex.race.year }) : '';
  const sections = [
    { id: 'm-01', no: '01', title: t('s1.heading') },
    { id: 'm-02', no: '02', title: t('s2.heading') },
    { id: 'm-03', no: '03', title: t('s3.heading') },
    ...(ex ? [{ id: 'm-04', no: '04', title: t('example.heading', { circuit: ex.circuit?.name ?? ex.race.name, year: ex.race.year }) }] : []),
    { id: 'm-05', no: '05', title: t('s5.heading') },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: t('metaTitle'),
    description: t('metaDescription'),
    inLanguage: locale,
    url: localeUrl(locale, PATH),
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    author: { '@type': 'Person', name, url: `${SITE_URL}/about/` },
    publisher: { '@type': 'Organization', name: 'PaddockIntel', url: SITE_URL },
    isBasedOn: { '@type': 'Dataset', name: 'OpenF1', url: 'https://openf1.org' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-6 pb-16 flex flex-col gap-4">
          <nav aria-label={tCrumbs('crumbsAria')} className="dusk-mono text-[11.5px] tracking-[0.04em] text-[color:var(--dusk-muted)]">
            <Link href="/" className="hover:text-[color:var(--dusk-ink)]">{t('crumbHome')}</Link>
            {' / '}
            <Link href="/about" className="hover:text-[color:var(--dusk-ink)]">{t('crumbAbout')}</Link>
            {` / ${t('kicker')} / ${t('headline')}`}
          </nav>

          {/* Cover */}
          <header className="dusk-card dusk-cover px-5 py-7 md:px-9 md:py-9 flex flex-col gap-4">
            <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)] m-0">{t('kicker')}</p>
            <h1 className="dusk-display m-0 text-[clamp(2.4rem,6vw,4.4rem)] leading-[0.95] tracking-[-0.03em]">{t('headline')}</h1>
            <p className="dusk-hero-dek m-0 text-[16px] md:text-[18.5px] leading-[1.55] max-w-[64ch]">{t('dek')}</p>
            <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 dusk-mono uppercase text-[11.5px] tracking-[0.05em] text-[#E2CEC6]">
              <span>
                {t('byline')}{' '}
                <Link href="/about" className="text-[color:var(--dusk-ink)] font-medium hover:text-[color:var(--dusk-peach)]">{name}</Link>
              </span>
              <span>{t('source')}</span>
              <span>{t('notProjection')}</span>
            </div>
          </header>

          {/* Coverage -- live across every load */}
          <section aria-label={t('stats.aria')} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statCards.map((s) => (
              <div key={s.l} className="dusk-card p-4 sm:p-6 flex flex-col gap-2.5 min-w-0">
                <p className="dusk-display tabular-nums text-[clamp(1.6rem,4vw,2.4rem)] leading-none tracking-[-0.03em] m-0">{s.v}</p>
                <p className="dusk-mono uppercase text-[11px] tracking-[0.07em] leading-[1.45] text-[color:var(--dusk-peach)] m-0">{s.l}</p>
                <p className="text-[13px] text-[color:var(--dusk-ink-2)] m-0">{s.u}</p>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
            <article className="dusk-sheet relative rounded-[24px] px-4 py-7 md:px-10 md:py-10 lg:px-14 lg:py-12 min-w-0">
              <div className="max-w-[64ch] mx-auto">
                <h2 id="m-01" className={`${h2} mt-0`}><span className={no}>01</span>{t('s1.heading')}</h2>
                <p className={prose}>{t.rich('s1.body', { b })}</p>

                <h2 id="m-02" className={h2}><span className={no}>02</span>{t('s2.heading')}</h2>
                <p className={prose}>{t('s2.p1')}</p>
                <p className={prose}>
                  {t('s2.p2')}{' '}
                  {ex && t('s2.capExample', { cap: secs(Math.max(ex.maxAbs, 8), 1), circuit: ex.circuit?.name ?? ex.race.name })}
                </p>
                <p className={prose}>{t('s2.p3')}</p>

                <h2 id="m-03" className={h2}><span className={no}>03</span>{t('s3.heading')}</h2>
                <p className={prose}>{t('s3.intro')}</p>
                <dl className="my-5 rounded-[14px] overflow-hidden border border-[color:var(--border)] bg-[color:var(--surface)] text-[15.5px] leading-[1.5]">
                  {(['snap', 'braid', 'defend'] as const).map((k) => (
                    <div key={k} className="grid grid-cols-[84px_minmax(0,1fr)] sm:grid-cols-[96px_minmax(0,1fr)] gap-3.5 px-3.5 py-3 border-t border-[color:var(--border)] first:border-t-0">
                      <dt className="dusk-mono uppercase text-[11px] tracking-[0.07em] text-[color:var(--accent)] pt-[3px]">{t(`s3.${k}Term`)}</dt>
                      <dd className="m-0">{t(`s3.${k}Def`)}</dd>
                    </div>
                  ))}
                </dl>
                <p className={prose}>{t('s3.note')}</p>

                {ex && (
                  <section aria-labelledby="m-04">
                    <h2 id="m-04" className={h2}><span className={no}>04</span>{t('example.heading', { circuit: ex.circuit?.name ?? ex.race.name, year: ex.race.year })}</h2>
                    <p className={prose}>{t('example.intro', { race: raceLabel, a: ex.full(ex.a), b: ex.full(ex.b) })}</p>

                    <figure className="my-5 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 m-0">
                      <div className="overflow-x-auto">
                        <GapChart
                          points={ex.points}
                          events={ex.markers}
                          ledLaps={ex.ledLaps}
                          totalLaps={ex.totalLaps}
                          colorA={ex.a.color}
                          colorB={ex.b.color}
                          labelA={t('example.ahead', { driver: ex.short(ex.a) })}
                          labelB={t('example.ahead', { driver: ex.short(ex.b) })}
                          ariaLabel={t('example.chartAria', { a: ex.full(ex.a), b: ex.full(ex.b), race: raceLabel })}
                        />
                      </div>
                      <ul className="m-0 mt-3 p-0 list-none flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[color:var(--text-2)]">
                        {[ex.a, ex.b].map((d) => (
                          <li key={d.id} className="flex items-center gap-1.5">
                            <svg width="10" height="10" aria-hidden="true"><rect width="10" height="10" rx="3" fill={d.color} /></svg>
                            {t('example.legendAhead', { driver: d.surname })}
                          </li>
                        ))}
                        <li className="flex items-center gap-1.5">
                          <svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--accent)" strokeWidth="2" /></svg>
                          {t('s3.snapTerm')}
                        </li>
                        <li className="flex items-center gap-1.5">
                          <svg width="12" height="12" aria-hidden="true"><rect x="2.5" y="2.5" width="7" height="7" fill="none" stroke="var(--text-1)" strokeWidth="1.5" transform="rotate(45 6 6)" /></svg>
                          {t('s3.defendTerm')}
                        </li>
                        {ex.ledLaps.length > 0 && (
                          <li className="flex items-center gap-1.5">
                            <svg width="10" height="10" aria-hidden="true"><rect width="10" height="10" rx="3" fill="var(--surface-raised)" stroke="var(--border)" /></svg>
                            {t('example.legendLed')}
                          </li>
                        )}
                      </ul>
                      <figcaption className="mt-2 text-[13.5px] leading-[1.5] text-[color:var(--text-2)]">
                        {t('example.caption', { a: ex.full(ex.a), b: ex.full(ex.b), race: raceLabel, count: ex.points.length })}
                      </figcaption>
                    </figure>

                    {ex.snaps.length > 0 && (
                      <>
                        <p className={prose}>{t('example.snapsIntro', { count: ex.snaps.length })}</p>
                        <ul className="m-0 mb-5 p-0 list-none">
                          {ex.snaps.map((s, i) => (
                            <li key={i} className="grid grid-cols-[70px_minmax(0,1fr)] gap-3 py-3 border-t border-[color:var(--border)] first:border-t-0 text-[15.5px] leading-[1.5]">
                              <span className="dusk-mono uppercase text-[11.5px] tracking-[0.05em] pt-0.5 tabular-nums">{t('example.lap', { n: s.lap })}</span>
                              <span>
                                {s.corner
                                  ? t('example.snapAt', { driver: s.ahead.surname, corner: s.corner, gap: secs(s.gap) })
                                  : t('example.snap', { driver: s.ahead.surname, gap: secs(s.gap) })}
                                {s.pit && (
                                  <>
                                    {' '}
                                    {s.pit.duration
                                      ? t('example.snapPit', { driver: s.behind.surname, lap: s.pit.lap, secs: secs(Number(s.pit.duration), 1) })
                                      : t('example.snapPitNoTime', { driver: s.behind.surname, lap: s.pit.lap })}
                                  </>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {ex.defendCount > 0 && (
                      <p className={prose}>
                        {t('example.defends', {
                          count: ex.defendCount,
                          laps: [...ex.defendLaps.entries()]
                            .sort(([m], [k]) => m - k)
                            .map(([lap, c]) => (c > 1 ? `${lap} (×${c})` : String(lap)))
                            .join(', '),
                        })}
                      </p>
                    )}

                    {ex.official && (
                      <>
                        <p className={prose}>{t('example.gapIntro')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                          <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-3">
                            <p className="dusk-mono uppercase text-[10.5px] tracking-[0.07em] text-[color:var(--text-3)] m-0 mb-1">{t('example.lastSample', { lap: ex.lastLap })}</p>
                            <p className="dusk-mono tabular-nums text-[20px] m-0">
                              {ex.short(ex.byId(ex.lastFrame.leader_driver_id))} +{secs(Math.abs(Number(ex.lastFrame.delta_seconds)))}s
                            </p>
                          </div>
                          <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-3">
                            <p className="dusk-mono uppercase text-[10.5px] tracking-[0.07em] text-[color:var(--text-3)] m-0 mb-1">{t('example.official')}</p>
                            <p className="dusk-mono tabular-nums text-[20px] m-0">
                              {ex.short(ex.official.leader)} +{secs(ex.official.gap)}s
                            </p>
                            {ex.official.positions.length === 2 && (
                              <p className="m-0 mt-1 text-[13px] text-[color:var(--text-2)]">
                                {t('example.officialSub', { p1: ex.official.positions[0], p2: ex.official.positions[1] })}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </section>
                )}

                <h2 id="m-05" className={h2}><span className={no}>05</span>{t('s5.heading')}</h2>
                <p className={prose}>{t('s5.intro')}</p>
                <ul className="m-0 mb-4 pl-5 list-disc font-prose text-[clamp(17px,1.25vw,19px)] leading-[1.7] marker:text-[color:var(--text-3)]">
                  <li className="mb-2">{t.rich('s5.since', { b })}</li>
                  <li className="mb-2">{t.rich('s5.onePair', { b })}</li>
                  <li className="mb-2">
                    {t.rich('s5.leader', { b })}
                    {ex && ex.ledLaps.length > 0 && ex.otherCounts.length > 0 && (
                      <>
                        {' '}
                        {t('s5.leaderExample', {
                          circuit: ex.circuit?.name ?? ex.race.name,
                          count: ex.ledLaps.length,
                          laps: lapRanges(ex.ledLaps),
                          minLed: Math.min(...ex.ledCounts),
                          maxLed: Math.max(...ex.ledCounts),
                          minOther: Math.min(...ex.otherCounts),
                          maxOther: Math.max(...ex.otherCounts),
                        })}
                        {ex.missing.length > 0 && <> {t('s5.leaderMissing', { count: ex.missing.length, laps: lapRanges(ex.missing) })}</>}
                      </>
                    )}{' '}
                    {t('s5.leaderEnd')}
                  </li>
                </ul>

                <div className="mt-8 rounded-[16px] bg-[color:var(--surface-raised)] border-l-4 border-[color:var(--accent)] px-5 py-4 text-[16.5px] leading-[1.55]">
                  <h2 className="dusk-mono uppercase text-[11px] tracking-[0.1em] text-[color:var(--accent)] font-normal m-0 mb-1.5">06 · {t('s6.heading')}</h2>
                  <p className="m-0">{t('s6.body')}</p>
                </div>
              </div>
            </article>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
              <section className="dusk-card p-5 hidden lg:flex flex-col gap-2" aria-labelledby="m-toc">
                <h2 id="m-toc" className="dusk-label m-0 font-normal">{t('rail.toc')}</h2>
                <ol className="m-0 p-0 list-none">
                  {sections.map((s) => (
                    <li key={s.id} className="border-t border-[color:var(--dusk-line)] first:border-t-0">
                      <a href={`#${s.id}`} className="grid grid-cols-[26px_minmax(0,1fr)] gap-1.5 py-2 text-[13.5px] leading-[1.35] text-[color:var(--dusk-ink-2)] hover:text-[color:var(--dusk-peach)]">
                        <span className="dusk-mono text-[11px] text-[color:var(--dusk-muted)]">{s.no}</span>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
              {ex?.circuit && (
                <section className="dusk-card p-5 flex flex-col gap-2" aria-labelledby="m-live">
                  <h2 id="m-live" className="dusk-label m-0 font-normal">{t('rail.liveTitle')}</h2>
                  <a href={hubLocaleUrl(locale, `/circuits/${ex.circuit.circuit_ref}/`)} className="text-[15px] font-semibold hover:text-[color:var(--dusk-peach)]">
                    {ex.circuit.name} →
                  </a>
                  <p className="m-0 text-[13.5px] text-[color:var(--dusk-ink-2)]">
                    {t('rail.liveBody', { a: ex.a.surname, b: ex.b.surname, race: raceLabel })}
                  </p>
                </section>
              )}
              <section className="dusk-card p-5 flex flex-col gap-2" aria-labelledby="m-error">
                <h2 id="m-error" className="dusk-label m-0 font-normal">{t('rail.errorTitle')}</h2>
                <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)]">{t('rail.errorBody')}</p>
                <Link href="/about" className="dusk-link text-[13px]">{t('rail.errorLink')}</Link>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
