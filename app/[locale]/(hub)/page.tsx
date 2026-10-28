export const revalidate = 3600;

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import { localizedPageMeta } from '@/lib/seo';
import { localeUrl } from '@/lib/site-url';
import { getHubSeason } from '@/lib/hubSeason';
import SeasonTerrain from '@/components/hub-dusk/SeasonTerrain';
import SeasonStrip from '@/components/hub-dusk/SeasonStrip';
import TitleRace from '@/components/hub-dusk/TitleRace';
import FormBars from '@/components/hub-dusk/FormBars';
import GridToFlag, { type GridToFlagRow } from '@/components/home-dusk/GridToFlag';
import { teamVar } from '@/components/home-dusk/StandingsCard';
import { duskSans } from '../(blog)/dusk-font';
import '../(blog)/dusk.css';

// Hub home, "the season so far" in the Telemetry at Dusk look (docs/DECISION-2026-10-11-home-dusk.md,
// Hub section): the title fight, how the season got here, the last race, what's at stake next, who's
// in form, the standings, and the way into the archive. Server-rendered; every chapter hides when
// its data is missing.

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return localizedPageMeta(locale, '/', 'hub');
}

function Section({ n, title, sub, children }: { n: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 mt-7">
        <span className="dusk-label">{n}</span>
        <h2 className="m-0 text-[clamp(22px,2.6vw,30px)] leading-[1.15] font-semibold tracking-[-0.01em]">{title}</h2>
        {sub && <span className="text-[14px] text-[color:var(--dusk-muted)]">{sub}</span>}
      </div>
      {children}
    </section>
  );
}

function Stat({ kicker, big, text, tone }: { kicker: string; big: ReactNode; text: ReactNode; tone?: 'warm' | 'good' }) {
  return (
    <div className="dusk-card soft-card p-5 flex flex-col gap-1.5">
      <span className="dusk-label">{kicker}</span>
      <span
        className={`dusk-display text-[clamp(28px,3.2vw,40px)] leading-none mt-1 ${
          tone === 'warm' ? 'text-[color:var(--dusk-sunset)]' : tone === 'good' ? 'text-[color:var(--dusk-good)]' : ''
        }`}
      >
        {big}
      </span>
      <p className="m-0 text-[13.5px] text-[color:var(--dusk-ink-2)]">{text}</p>
    </div>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, tFlag, format, season] = await Promise.all([
    getTranslations('hubSeason'),
    getTranslations('articleDusk.flag'),
    getFormatter(),
    getHubSeason(locale),
  ]);
  // Calendar dates are date-only values: format them in UTC so the day never shifts.
  const day = (iso: string) => format.dateTime(new Date(`${iso}T12:00:00Z`), { day: 'numeric', month: 'short', timeZone: 'UTC' });

  if (!season) {
    return (
      <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
        <h1 className="sr-only">{t('srTitle', { year: new Date().getFullYear() })}</h1>
      </main>
    );
  }

  const { leader, rival, nextRace, lastRace, year, lastRound, totalRounds, pointsLeft } = season;
  const gap = rival ? leader.points - rival.points : 0;
  const rivalMax = rival && pointsLeft > 0 ? rival.points + pointsLeft : null;

  const headline =
    season.title.state === 'decided'
      ? t('hero.titleDecided', { name: leader.surname, year })
      : season.title.state === 'clinchable' && nextRace
        ? season.title.points === 25
          ? t('hero.titleNeedsWin', { name: leader.surname, location: nextRace.location })
          : t('hero.titleClinchable', { name: leader.surname, points: season.title.points })
        : gap > 0
          ? t('hero.titleOpen', { name: leader.surname, gap })
          : t('hero.titleTied', { name: leader.surname });
  const dek = [
    rival && gap > 0 ? t('hero.dekLead', { since: leader.leadSince, gap, rival: rival.surname }) : '',
    rival && rivalMax !== null && season.title.state !== 'decided' ? t('hero.dekCeiling', { left: pointsLeft, rival: rival.surname, max: rivalMax }) : '',
    season.title.state === 'clinchable' && season.title.points < 25 && nextRace
      ? t('hero.dekClinch', { location: nextRace.location, points: season.title.points })
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  // ── 03 · Last race ──
  const flagRows: GridToFlagRow[] = [];
  let climber: { surname: string; from: number; to: number } | null = null;
  let fastest: { surname: string; time: string } | null = null;
  let winnerRow: NonNullable<typeof lastRace>['rows'][number] | null = null;
  let secondRow: NonNullable<typeof lastRace>['rows'][number] | null = null;
  if (lastRace) {
    const slot = new Map(
      [...lastRace.rows]
        .sort((a, b) => (a.grid || 1000 + a.positionOrder) - (b.grid || 1000 + b.positionOrder))
        .map((r, i) => [r.code, i + 1]),
    );
    for (const r of lastRace.rows) {
      flagRows.push({
        code: r.code,
        grid: slot.get(r.code) ?? r.positionOrder,
        gridLabel: r.grid > 0 ? `P${r.grid}` : tFlag('pitLane'),
        finish: r.positionOrder,
        finishLabel: r.classified
          ? `P${r.positionOrder}`
          : tFlag(r.positionText === 'D' ? 'dsq' : r.positionText === 'W' ? 'dns' : 'dnf'),
        classified: r.classified,
        colour: teamVar(r.teamRef),
      });
    }
    const best = lastRace.rows
      .filter((r) => r.classified && r.grid > 0)
      .sort((a, b) => b.grid - b.positionOrder - (a.grid - a.positionOrder))[0];
    if (best && best.grid > best.positionOrder) climber = { surname: best.surname, from: best.grid, to: best.positionOrder };
    const fl = lastRace.rows.find((r) => r.rank === 1 && r.fastestLap);
    if (fl) fastest = { surname: fl.surname, time: fl.fastestLap! };
    winnerRow = lastRace.rows.find((r) => r.positionOrder === 1 && r.classified) ?? null;
    secondRow = lastRace.rows.find((r) => r.positionOrder === 2 && r.classified) ?? null;
  }
  const retired = lastRace ? lastRace.rows.filter((r) => r.positionText === 'R').length : 0;

  // ── 04 · Stakes: the next five behind the leader ──
  const rivals = season.standings.slice(1, 6).map((s) => ({ surname: s.surname, teamRef: s.teamRef, points: s.points }));

  // ── 05 · Form ──
  const formTop = season.form.slice(0, 6);
  const formLeader = season.form.find((f) => f.code === leader.code);
  const constructorTies = new Set(
    season.constructors.filter((c, _, all) => all.some((o) => o.ref !== c.ref && o.points === c.points)).map((c) => c.ref),
  );

  return (
    <main className={`theme-dusk ${duskSans.variable} min-h-screen`}>
      <h1 className="sr-only">{t('srTitle', { year })}</h1>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-5 pt-7 pb-16 flex flex-col gap-4">
        {/* Strip: where the season stands */}
        <div className="dusk-card soft-card border-l-[3px] border-l-[color:var(--dusk-warm)] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="dusk-label">{t('strip.season', { year, round: lastRound, total: totalRounds })}</div>
            {nextRace && (
              <div className="text-[17px] font-semibold mt-1">
                {t('strip.next', { name: nextRace.name, location: nextRace.location, date: day(nextRace.date) })}
              </div>
            )}
          </div>
          <div className="dusk-mono text-[13px] text-[color:var(--dusk-ink-2)]">
            {season.racesLeft > 0 ? t('strip.left', { races: season.racesLeft, points: pointsLeft }) : t('strip.over', { races: totalRounds })}
          </div>
        </div>

        {/* 01 · Hero: the title fight as terrain */}
        <section className="dusk-card dusk-hero p-5 sm:p-8 pb-4 flex flex-col gap-3">
          <span className="dusk-label text-[color:var(--dusk-sunset)]">{t('hero.kicker')}</span>
          <p className="dusk-display m-0 text-[clamp(34px,5vw,64px)] leading-none tracking-[-0.02em] max-w-[16ch]">{headline}</p>
          {dek && <p className="dusk-hero-dek m-0 text-[clamp(15px,1.5vw,18px)] max-w-[60ch]">{dek}</p>}
          <SeasonTerrain
            series={season.series}
            totalRounds={totalRounds}
            leaderCode={leader.code}
            rivalCode={rival?.code ?? null}
            rivalMax={rivalMax}
            labels={{
              aria: t('hero.aria'),
              ceiling: rival && rivalMax !== null ? t('hero.ceiling', { code: rival.code, max: rivalMax }) : '',
              pending: t('hero.pending'),
              round: (n) => t('hero.round', { n }),
            }}
          />
          <p className="dusk-mono dusk-terrain-caption m-0 text-[10.5px] tracking-[0.06em] uppercase">{t('hero.source', { round: lastRound })}</p>
        </section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat kicker={t('kpi.points')} big={leader.points} text={t('kpi.pointsSub', { name: leader.surname })} tone="warm" />
          {rival && <Stat kicker={t('kpi.lead')} big={`+${gap}`} text={t('kpi.leadSub', { rival: rival.surname })} />}
          <Stat
            kicker={t('kpi.wins')}
            big={<>{leader.wins}<span className="text-[0.5em] text-[color:var(--dusk-muted)]"> / {lastRound}</span></>}
            text={rival ? t('kpi.winsSub', { rival: rival.surname, n: rival.wins }) : ''}
          />
          <Stat
            kicker={t('kpi.led')}
            big={<>{leader.roundsLed}<span className="text-[0.5em] text-[color:var(--dusk-muted)]"> / {lastRound}</span></>}
            text={rival && rival.roundsLed > 0 ? t('kpi.ledSub', { rival: rival.surname, n: rival.roundsLed }) : t('kpi.ledSince', { n: leader.leadSince })}
          />
        </div>

        {/* 02 · How we got here */}
        <Section n="02" title={t('story.title')} sub={t('story.sub')}>
          <div className="dusk-card soft-card p-4 sm:p-5">
            <SeasonStrip
              rounds={season.rounds}
              lastRound={lastRound}
              leaderCode={leader.code}
              labels={{
                round: (n) => t('story.round', { n }),
                date: day,
                fromPole: t('story.fromPole'),
                ledBy: (code) => t('story.ledBy', { code }),
                winner: (name, round) => t('story.winner', { name, round }),
              }}
            />
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-[12px] text-[color:var(--dusk-muted)]">
              <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-[color:var(--dusk-sunset)]" />{t('story.fromPole')}</span>
              <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-[color:var(--dusk-warm)]" />{t('story.leader', { code: leader.code })}</span>
              <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-[color:var(--dusk-ice)]" />{t('story.otherLeader')}</span>
              <span>{t('story.teamNote')}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              kicker={t('story.leadKicker', { n: leader.leadSince, location: season.rounds[leader.leadSince - 1]?.location ?? '' })}
              big={t('story.leadBig')}
              text={t('story.leadText', { name: leader.surname })}
            />
            {season.facts.deepest && (
              <Stat
                kicker={t('story.deepKicker', { n: season.facts.deepest.round, location: season.facts.deepest.location })}
                big={`P${season.facts.deepest.grid} → P1`}
                text={t('story.deepText', { name: season.facts.deepest.surname, grid: season.facts.deepest.grid })}
              />
            )}
            {season.facts.topTeam && (
              <Stat
                kicker={t('story.winnersKicker')}
                big={season.facts.winners}
                text={t('story.winnersText', { team: season.facts.topTeam.name, wins: season.facts.topTeam.wins, total: lastRound })}
              />
            )}
            <Stat kicker={t('story.poleKicker')} big={`${season.facts.poleWins}/${lastRound}`} text={t('story.poleText')} />
          </div>
        </Section>

        {/* 03 · The last race */}
        {lastRace && flagRows.length > 1 && (
          <Section n="03" title={t('last.title', { name: lastRace.name })} sub={`${day(lastRace.date)} · ${lastRace.location}`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-7 [&>figure]:my-0">
                <GridToFlag
                  rows={flagRows}
                  labels={{
                    title: tFlag('title'),
                    sub: tFlag('sub'),
                    badge: retired ? tFlag('badge', { n: retired }) : null,
                    grid: tFlag('grid'),
                    flag: tFlag('flag'),
                    caption: '',
                    aria: tFlag('aria', { n: flagRows.length }),
                    source: tFlag('source'),
                  }}
                />
              </div>
              <div className="lg:col-span-5 grid gap-4">
                {winnerRow && (
                  <Stat
                    kicker={t('last.winner')}
                    big={winnerRow.surname}
                    text={
                      secondRow?.time
                        ? t('last.winnerText', { grid: winnerRow.grid, gap: secondRow.time, p2: secondRow.surname })
                        : `P${winnerRow.grid}`
                    }
                  />
                )}
                {climber && (
                  <Stat
                    kicker={t('last.climber')}
                    big={`+${climber.from - climber.to}`}
                    text={t('last.climberText', { name: climber.surname, from: climber.from, to: climber.to })}
                    tone="good"
                  />
                )}
                {fastest && <Stat kicker={t('last.fastest')} big={<span className="dusk-mono">{fastest.time}</span>} text={fastest.surname} />}
                <div className="flex flex-wrap gap-x-5 gap-y-2 dusk-mono text-[12px] uppercase tracking-[0.06em]">
                  {lastRace.report && (
                    <a className="dusk-link no-underline" href={localeUrl(locale, `/${lastRace.report.slug}/`)}>{t('last.report')} →</a>
                  )}
                  {lastRace.circuitRef && (
                    <Link className="dusk-link no-underline" href={`/circuits/${lastRace.circuitRef}/`}>{t('last.circuit')} →</Link>
                  )}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* 04 · What's at stake next */}
        {nextRace && (
          <Section
            n="04"
            title={t('stakes.title', { location: nextRace.location })}
            sub={t('stakes.sub', { date: day(nextRace.date), races: season.racesLeft })}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {rivals.length > 0 && (
                <div className="dusk-card soft-card p-5 lg:col-span-7 flex flex-col gap-3">
                  <span className="dusk-label">{t('stakes.kicker', { name: leader.surname })}</span>
                  <TitleRace
                    leaderPoints={leader.points}
                    pointsLeft={pointsLeft}
                    rivals={rivals}
                    labels={{
                      gap: (n) => t('stakes.gap', { n }),
                      alive: (max) => t('stakes.alive', { max }),
                      out: (max) => t('stakes.out', { max }),
                    }}
                  />
                  <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)]">{t('stakes.note', { name: leader.surname, points: leader.points })}</p>
                  <p className="dusk-mono m-0 text-[10.5px] tracking-[0.04em] uppercase text-[color:var(--dusk-muted)]">{t('stakes.source', { round: lastRound })}</p>
                </div>
              )}
              {nextRace.editions > 0 && (
                <div className="dusk-card soft-card p-5 lg:col-span-5 flex flex-col gap-3">
                  <span className="dusk-label">{t('stakes.circuitKicker', { name: nextRace.circuitName })}</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="dusk-display text-[34px] leading-none">{nextRace.editions}</div>
                      <p className="m-0 mt-1 text-[13px] text-[color:var(--dusk-ink-2)]">
                        {t('stakes.editions', { n: nextRace.editions, year: nextRace.sinceYear ?? '' })}
                      </p>
                    </div>
                    {nextRace.topWinners[0] && (
                      <div>
                        <div className="dusk-display text-[34px] leading-none">{nextRace.topWinners[0].wins}</div>
                        <p className="m-0 mt-1 text-[13px] text-[color:var(--dusk-ink-2)]">
                          {t('stakes.topWins', { n: nextRace.topWinners[0].wins, names: format.list(nextRace.topWinners[0].surnames) })}
                        </p>
                      </div>
                    )}
                  </div>
                  {nextRace.recentWinners.length > 0 && (
                    <>
                      <span className="dusk-label mt-2">{t('stakes.recent')}</span>
                      <ul className="list-none m-0 p-0 dusk-mono text-[13px] leading-[1.9]">
                        {nextRace.recentWinners.map((w) => (
                          <li key={w.year}>{t('stakes.recentRow', { year: w.year, name: w.surname, grid: w.grid })}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  <Link className="dusk-link no-underline dusk-mono text-[12px] uppercase tracking-[0.06em]" href={`/circuits/${nextRace.circuitRef}/`}>
                    {t('last.circuit')} →
                  </Link>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* 05 · Who's in form */}
        {formTop.length > 1 && (
          <Section
            n="05"
            title={t('form.title')}
            sub={t('form.sub', { n: lastRound - season.formFrom + 1, from: season.formFrom, to: lastRound })}
          >
            <div className="dusk-card soft-card p-5 flex flex-col gap-3">
              <FormBars rows={formTop} resultsLabel={t('form.results')} />
              <p className="m-0 text-[14px] text-[color:var(--dusk-ink-2)]">
                {formTop[0].code === leader.code
                  ? t('form.summaryLeader', { best: formTop[0].surname, points: formTop[0].points })
                  : t('form.summaryOther', { best: formTop[0].surname, points: formTop[0].points, leaderPoints: formLeader?.points ?? 0 })}
              </p>
            </div>
          </Section>
        )}

        {/* 06 · The grid */}
        <Section n="06" title={t('grid.title')}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="dusk-card soft-card p-5 lg:col-span-7">
              <span className="dusk-label">{t('grid.drivers')}</span>
              <ol className="list-none m-0 mt-2 p-0">
                {season.standings.slice(0, 10).map((s, i) => (
                  <li key={s.id} className="border-t border-[color:var(--dusk-line)]">
                    <Link
                      href={`/drivers/${s.ref}/`}
                      className="grid grid-cols-[28px_4px_minmax(0,1fr)_56px_48px] items-center gap-2.5 py-2 text-[14px] no-underline hover:text-[color:var(--dusk-sunset)]"
                    >
                      <span className="dusk-mono text-[color:var(--dusk-muted)]">{String(s.position).padStart(2, '0')}</span>
                      <span className="h-4 rounded-sm" style={{ background: teamVar(s.teamRef) }} />
                      <span className="truncate">{s.surname}</span>
                      <span className="dusk-mono text-right text-[color:var(--dusk-muted)]">{i === 0 ? '' : `−${leader.points - s.points}`}</span>
                      <span className="dusk-mono text-right">{s.points}</span>
                    </Link>
                  </li>
                ))}
              </ol>
              <Link className="dusk-link no-underline dusk-mono text-[12px] uppercase tracking-[0.06em] inline-block mt-3" href="/drivers/">
                {t('grid.allDrivers')} →
              </Link>
            </div>
            <div className="dusk-card soft-card p-5 lg:col-span-5">
              <span className="dusk-label">{t('grid.constructors')}</span>
              <ol className="list-none m-0 mt-2 p-0">
                {season.constructors.slice(0, 6).map((c, i) => (
                  <li key={c.ref} className="border-t border-[color:var(--dusk-line)]">
                    <Link
                      href={`/constructors/${c.ref}/`}
                      className="grid grid-cols-[28px_4px_minmax(0,1fr)_56px_48px] items-center gap-2.5 py-2 text-[14px] no-underline hover:text-[color:var(--dusk-sunset)]"
                    >
                      <span className="dusk-mono text-[color:var(--dusk-muted)]">{String(c.position).padStart(2, '0')}</span>
                      <span className="h-4 rounded-sm" style={{ background: teamVar(c.ref) }} />
                      <span className="truncate">
                        {c.name}
                        {constructorTies.has(c.ref) && (
                          <em className="dusk-mono not-italic uppercase text-[10px] ml-2 text-[color:var(--dusk-sunset)]">{t('grid.tied')}</em>
                        )}
                      </span>
                      <span className="dusk-mono text-right text-[color:var(--dusk-muted)]">{i === 0 ? '' : `−${season.constructors[0].points - c.points}`}</span>
                      <span className="dusk-mono text-right">{c.points}</span>
                    </Link>
                  </li>
                ))}
              </ol>
              <Link className="dusk-link no-underline dusk-mono text-[12px] uppercase tracking-[0.06em] inline-block mt-3" href="/constructors/">
                {t('grid.allConstructors')} →
              </Link>
            </div>
          </div>
        </Section>

        {/* 07 · Explore the archive */}
        {season.archive && (
          <Section
            n="07"
            title={t('explore.title', { n: season.archive.seasons })}
            sub={t('explore.sub', {
              races: format.number(season.archive.races),
              year: season.archive.firstYear,
              results: format.number(season.archive.results),
            })}
          >
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { href: '/circuits/', kicker: t('explore.circuits'), big: format.number(season.archive.circuits), text: t('explore.circuitsText') },
                { href: '/drivers/', kicker: t('explore.drivers'), big: format.number(season.archive.drivers), text: t('explore.driversText') },
                {
                  href: '/constructors/',
                  kicker: t('explore.constructors'),
                  big: format.number(season.archive.constructors),
                  text: t('explore.constructorsText', { year: season.archive.firstYear }),
                },
                ...(rival
                  ? [{ href: `/compare/?type=drivers&a=${leader.ref}&b=${rival.ref}`, kicker: t('explore.compare'), big: `${leader.code} vs ${rival.code}`, text: t('explore.compareText') }]
                  : []),
                { href: '/records/', kicker: t('explore.records'), big: `${season.archive.firstYear}–${year}`, text: t('explore.recordsText') },
              ].map((c) => (
                <Link key={c.href} href={c.href} className="no-underline hover:[&_.dusk-label]:text-[color:var(--dusk-sunset)]">
                  <Stat kicker={c.kicker} big={c.big} text={c.text} />
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>
    </main>
  );
}
