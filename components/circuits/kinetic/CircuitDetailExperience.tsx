'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from '@/lib/i18n/navigation';
import CircuitHero from './CircuitHero';
import CircuitTimeline from './CircuitTimeline';
import CircuitIntelGrid from './CircuitIntelGrid';
import TrackDominancePanel from './TrackDominancePanel';
import DeltaRibbonSection from './DeltaRibbonSection';
import InfoTooltip from './InfoTooltip';
import type { IntelData } from './CircuitIntelGrid';
import type { DriverSelectorRow, CircuitCorner } from '@/lib/types';
import type { RibbonFrame } from './deltaRibbon/geometry';
import type { DeltaRibbonEventRow, DeltaRibbonDriver } from './DeltaRibbonSection';

gsap.registerPlugin(ScrollTrigger);

// ─── Local types ───────────────────────────────────────────────────

interface WinnerRow {
  year: number;
  forename: string;
  surname: string;
  constructor: string;
  fastestLap: string | null;
}

interface DecadeRow {
  decade: number;
  topConstructor: string | null;
  wins: number;
  total: number;
}

interface LapEntry {
  year: number;
  forename: string;
  surname: string;
  time: string;
  ms: number;
}

interface ConstructorWin {
  constructor: string;
  wins: number;
}

interface NextRaceInfo {
  name: string;
  round: number;
  date: string;
  daysAway: number;
}

interface PoleRow {
  time: string;
  ms: number;
  forename: string;
  surname: string;
  constructor: string;
  year: number;
}

interface Race2026Row {
  position: number;
  forename: string;
  surname: string;
  constructor: string;
  points: number;
}

interface DeltaRibbonData {
  raceName: string;
  frames: RibbonFrame[];
  events: DeltaRibbonEventRow[];
  driverA: DeltaRibbonDriver;
  driverB: DeltaRibbonDriver;
}

export interface CircuitDetailProps {
  circuit: {
    id: number;
    name: string;
    location: string;
    country: string;
    lat: number;
    lng: number;
    circuit_ref: string;
  };
  drivers: DriverSelectorRow[];
  firstYear: number | null;
  totalRaces: number;
  standardLaps: number | null;
  rankLapRecord: { time: string; forename: string; surname: string; year: number } | null;
  trackPathData: { path: string; viewBox: string } | null;
  corners: CircuitCorner[];
  winnerRows: WinnerRow[];
  decadeDominance: DecadeRow[];
  lapEntries: LapEntry[];
  allTimeRecord: LapEntry | null;
  constructorWins: ConstructorWin[];
  maxConWins: number;
  nextRace: NextRaceInfo | null;
  race2026Result: Race2026Row[];
  allTimePole: PoleRow | null;
  recentPoles: PoleRow[];
  intelData: IntelData;
  deltaRibbon: DeltaRibbonData | null;
}

// ─── Orchestrator ──────────────────────────────────────────────────

export default function CircuitDetailExperience({
  circuit,
  drivers,
  firstYear,
  totalRaces,
  standardLaps,
  rankLapRecord,
  trackPathData,
  corners,
  winnerRows,
  decadeDominance,
  lapEntries,
  allTimeRecord,
  constructorWins,
  maxConWins,
  nextRace,
  race2026Result,
  allTimePole,
  recentPoles,
  intelData,
  deltaRibbon,
}: CircuitDetailProps) {
  const t = useTranslations('circuitDetail');
  const format = useFormatter();
  const mainRef = useRef<HTMLElement>(null);

  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    // Must run post-mount: matching SSR's default here would mismatch the client's real preference.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotionOk(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Section reveals + bar animations — scoped to main
  useEffect(() => {
    if (!motionOk) return;
    const id = setTimeout(() => ScrollTrigger.refresh(), 400);

    const ctx = gsap.context(() => {

      // Every .circuit-section fades + rises on viewport enter
      gsap.utils.toArray<HTMLElement>('.circuit-section').forEach((section) => {
        gsap.from(section, {
          y: 28,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 86%', once: true },
        });
      });

      // Era wall — year cells scale in per row, left to right, like a season unfolding
      gsap.utils.toArray<HTMLElement>('.era-row').forEach((row) => {
        const cells = row.querySelectorAll('.era-cell');
        if (!cells.length) return;
        gsap.fromTo(cells,
          { scale: 0, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            duration: 0.3,
            stagger: 0.02,
            ease: 'power2.out',
            scrollTrigger: { trigger: row, start: 'top 88%', once: true },
          },
        );
      });

      // Constructor bars
      gsap.utils.toArray<HTMLElement>('.constructor-bar').forEach((bar) => {
        gsap.fromTo(bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: 'left center',
            duration: 0.8,
            ease: 'expo.out',
            scrollTrigger: { trigger: bar, start: 'top 92%', once: true },
          },
        );
      });

      // Lap evolution rows stagger in
      gsap.from('.lap-evo-row', {
        x: -16,
        autoAlpha: 0,
        duration: 0.45,
        stagger: 0.025,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.lap-evo-list', start: 'top 84%', once: true },
      });

    }, mainRef);

    return () => {
      clearTimeout(id);
      ctx.revert();
    };
  }, [motionOk]);

  const lastWinners = winnerRows.slice(0, 5);

  // Group winners by decade for the era wall's year-cell strip — same source data
  // as decadeDominance, just kept at year granularity for the visual texture.
  const winnersByDecade = new Map<number, WinnerRow[]>();
  for (const w of winnerRows) {
    const d = Math.floor(w.year / 10) * 10;
    if (!winnersByDecade.has(d)) winnersByDecade.set(d, []);
    winnersByDecade.get(d)!.push(w);
  }

  return (
    <main ref={mainRef} className="flex flex-col bg-bg">

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

      {/* ── Hero ───────────────────────────────────────────────── */}
      <CircuitHero
        name={circuit.name}
        location={circuit.location}
        country={circuit.country}
        lat={circuit.lat}
        lng={circuit.lng}
        standardLaps={standardLaps}
        rankLapRecord={rankLapRecord}
        firstYear={firstYear}
        totalRaces={totalRaces}
        lastWinners={lastWinners}
        trackPathData={trackPathData}
        corners={corners}
        motionOk={motionOk}
      />

      {/* ── 01 · Decade Dominance ──────────────────────────────── */}
      <section className="circuit-section border-b border-border">
        <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
          <span className="font-mono text-xs text-text-2 leading-none">01 ·</span>
          <h2 className="text-[13px] font-medium text-text-2">{t('dominance.title')}</h2>
        </div>
        <div className="px-6">
          {decadeDominance.map(({ decade, topConstructor, wins, total }) => {
            const winShare = total > 0 ? wins / total : 0;
            const isDominant = winShare >= 0.7 && total >= 3;
            const decadeWinners = (winnersByDecade.get(decade) ?? []).slice().sort((a, b) => a.year - b.year);
            const vwSize = (2 + winShare * 7).toFixed(1);
            const remCap = (2.4 + winShare * 4.4).toFixed(2);
            return (
              <div key={decade} className="era-row py-5 border-b border-border-subtle last:border-b-0">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] tabular-nums">
                    {decade}s
                  </span>
                  {topConstructor && (
                    <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0">
                      {wins}/{total} · {(winShare * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                {topConstructor ? (
                  <>
                    <p
                      className="era-name uppercase leading-[0.92] tracking-[-0.02em] mb-3"
                      style={{
                        fontFamily: 'var(--pi-display)',
                        fontSize: `clamp(1.6rem, ${vwSize}vw, ${remCap}rem)`,
                        color: isDominant ? 'var(--terracotta)' : 'var(--text-1)',
                      }}
                    >
                      {topConstructor}
                    </p>
                    <div className="flex gap-[3px] flex-wrap">
                      {decadeWinners.map((w) => (
                        <span
                          key={w.year}
                          className="era-cell shrink-0"
                          title={`${w.year} · ${w.constructor}`}
                          style={{
                            width: '13px',
                            height: '13px',
                            background: w.constructor === topConstructor
                              ? (isDominant ? 'var(--terracotta)' : 'var(--text-1)')
                              : 'var(--border-subtle)',
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="font-mono text-[13px] text-text-3">—</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 02 · Constructor Wins ──────────────────────────────── */}
      {constructorWins.length > 0 && (
        <section className="circuit-section border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">02 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('constructors.title')}</h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
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
                    className="constructor-bar h-full bg-text-2"
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

      {/* ── 03 · Qualifying record ─────────────────────────────── */}
      {(allTimePole || recentPoles.length > 0) && (
        <section className="circuit-section border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">03 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('qualifying.title')}</h2>
          </div>

          {/* All-time pole callout */}
          {allTimePole && (
            <div className="px-6 py-6 border-b border-border">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-3 mb-3">
                {t('qualifying.allTimePole')}
              </p>
              <p
                className="tabular-nums leading-none tracking-[-0.03em]"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', color: 'var(--terracotta)' }}
              >
                {allTimePole.time}
              </p>
              <p className="font-mono text-[11px] text-text-2 mt-3">
                {allTimePole.forename[0]}. {allTimePole.surname}
                <span className="text-text-3"> · </span>
                {allTimePole.constructor}
                <span className="text-text-3"> · </span>
                {allTimePole.year}
              </p>
            </div>
          )}

          {/* Recent poles strip */}
          {recentPoles.length > 0 && (
            <div>
              <p className="px-6 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 border-b border-border-subtle">
                {t('qualifying.recentPoles')}
              </p>
              {recentPoles.map((pole) => (
                <div
                  key={pole.year}
                  className="flex items-center gap-3 px-6 h-9 border-b border-border last:border-b-0"
                >
                  <span className="font-mono text-[11px] text-text-3 tabular-nums w-10 shrink-0">{pole.year}</span>
                  <span
                    className="font-mono text-[13px] tabular-nums w-20 shrink-0"
                    style={{ color: pole.ms === allTimePole?.ms ? 'var(--terracotta)' : 'var(--text-1)' }}
                  >
                    {pole.time}
                  </span>
                  <span className="text-[12px] text-text-2 flex-1 min-w-0 truncate">
                    {pole.forename[0]}. {pole.surname}
                  </span>
                  <span className="font-mono text-[11px] text-text-3 shrink-0 hidden sm:block">{pole.constructor}</span>
                  {pole.ms === allTimePole?.ms && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.08em] shrink-0" style={{ color: 'var(--terracotta)' }}>
                      {t('lapRecord.allTime')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── 04 · Race 2026 result ──────────────────────────────── */}
      {nextRace && (
        <section className="circuit-section">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">04 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('nextRace.title')}</h2>
            <span className="font-mono text-[11px] text-text-3 ml-auto tabular-nums">
              Rd.{nextRace.round}
            </span>
          </div>

          {/* Countdown — upcoming race */}
          {nextRace.daysAway > 0 && (
            <div className="px-6 py-7 flex flex-wrap items-end gap-12">
              <div>
                <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                  {t('nextRace.date')}
                </p>
                <p className="font-mono text-[18px] text-text-1 leading-none tabular-nums">
                  {format.dateTime(new Date(nextRace.date), { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                  {t('nextRace.countdown')}
                </p>
                <p className="text-[48px] leading-none tabular-nums" style={{ fontFamily: 'var(--pi-display)', color: 'var(--terracotta)' }}>
                  {nextRace.daysAway}
                  <span className="font-mono text-[13px] text-text-3 ml-2">{t('nextRace.days')}</span>
                </p>
              </div>
            </div>
          )}

          {nextRace.daysAway === 0 && (
            <div className="px-6 py-6">
              <p className="font-mono text-[13px] uppercase tracking-[0.06em]" style={{ color: 'var(--terracotta)' }}>
                {t('nextRace.today')}
              </p>
            </div>
          )}

          {/* Race result — past race with data */}
          {nextRace.daysAway < 0 && race2026Result.length > 0 && (
            <>
              {/* Podium — P1 / P2 / P3 */}
              <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                {race2026Result.slice(0, 3).map((r) => (
                  <div
                    key={r.position}
                    className="px-5 py-5"
                    style={r.position === 1 ? { background: 'var(--surface-raised)' } : {}}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mb-2">
                      P{r.position}
                    </p>
                    <p
                      className="uppercase text-text-1 leading-none tracking-[-0.02em] mb-2"
                      style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1rem, 2.2vw, 1.6rem)' }}
                    >
                      {r.surname}
                    </p>
                    <p className="font-mono text-[10px] text-text-2">{r.constructor}</p>
                    <p className="font-mono text-[13px] text-text-1 tabular-nums mt-1.5">
                      {r.points} <span className="text-text-3 text-[10px]">{t('raceResult.pts')}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* P4–P10 compact strip */}
              <div>
                {race2026Result.slice(3).map((r) => (
                  <div
                    key={r.position}
                    className="flex items-center gap-4 px-6 h-8 border-b border-border last:border-b-0"
                  >
                    <span className="font-mono text-[11px] text-text-3 tabular-nums w-6 shrink-0">
                      P{r.position}
                    </span>
                    <span className="text-[13px] text-text-2 flex-1 min-w-0 truncate">
                      {r.forename[0]}. <strong className="text-text-1 font-semibold">{r.surname}</strong>
                    </span>
                    <span className="font-mono text-[11px] text-text-2 shrink-0 hidden sm:block w-24 truncate">
                      {r.constructor}
                    </span>
                    <span className="font-mono text-[12px] text-text-1 tabular-nums shrink-0 w-8 text-right">
                      {r.points}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Past race with no result data yet */}
          {nextRace.daysAway < 0 && race2026Result.length === 0 && (
            <div className="px-6 py-6">
              <p className="font-mono text-[12px] text-text-3">{t('nextRace.past')}</p>
            </div>
          )}
        </section>
      )}

      {/* ── 05 · Circuit Intelligence ──────────────────────────── */}
      <section className="circuit-section border-b border-border">
        <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
          <span className="font-mono text-xs text-text-2 leading-none">05 ·</span>
          <h2 className="text-[13px] font-medium text-text-2">{t('intel.title')}</h2>
        </div>
        <CircuitIntelGrid
          intelData={intelData}
          lapEntries={lapEntries}
          motionOk={motionOk}
        />
      </section>

      {/* ── 06 · Champions Timeline ────────────────────────────── */}
      {winnerRows.length > 0 && (
        <section className="circuit-section border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">06 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('winners.title')}</h2>
            <span className="font-mono text-[11px] text-text-3 tabular-nums ml-auto">{winnerRows.length}</span>
          </div>
          <CircuitTimeline winnerRows={winnerRows} motionOk={motionOk} />
        </section>
      )}

      {/* ── 07 · Head to Head ──────────────────────────────────── */}
      {drivers.length > 0 && (
        <section className="circuit-section">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">07 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('headToHead.title')}</h2>
          </div>
          <TrackDominancePanel circuitId={circuit.id} drivers={drivers} />
        </section>
      )}

      {/* ── 08 · Delta Ribbon ───────────────────────────────────── */}
      {deltaRibbon && (
        <section className="circuit-section">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">08 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('deltaRibbon.title')}</h2>
            <InfoTooltip
              text={t('deltaRibbon.methodology', {
                driverA: deltaRibbon.driverA.code ?? deltaRibbon.driverA.surname,
                driverB: deltaRibbon.driverB.code ?? deltaRibbon.driverB.surname,
                raceName: deltaRibbon.raceName,
              })}
            />
          </div>
          <DeltaRibbonSection
            trackPathData={trackPathData}
            frames={deltaRibbon.frames}
            events={deltaRibbon.events}
            driverA={deltaRibbon.driverA}
            driverB={deltaRibbon.driverB}
          />
        </section>
      )}

    </main>
  );
}
