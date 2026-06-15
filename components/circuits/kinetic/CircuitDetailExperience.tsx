'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from '@/lib/i18n/navigation';
import CircuitHero from './CircuitHero';
import TrackDominancePanel from './TrackDominancePanel';
import type { DriverSelectorRow } from '@/lib/types';

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
  winnerRows: WinnerRow[];
  decadeDominance: DecadeRow[];
  lapEntries: LapEntry[];
  allTimeRecord: LapEntry | null;
  constructorWins: ConstructorWin[];
  maxConWins: number;
  nextRace: NextRaceInfo | null;
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
  winnerRows,
  decadeDominance,
  lapEntries,
  allTimeRecord,
  constructorWins,
  maxConWins,
  nextRace,
}: CircuitDetailProps) {
  const t = useTranslations('circuitDetail');
  const format = useFormatter();
  const mainRef = useRef<HTMLElement>(null);

  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
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

      // Decade bars scaleX 0→1 on enter — the gap, visualized
      gsap.utils.toArray<HTMLElement>('.decade-bar').forEach((bar) => {
        gsap.fromTo(bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: 'left center',
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: bar, start: 'top 92%', once: true },
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

  const lastWinners = winnerRows.slice(0, 3);

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
        motionOk={motionOk}
      />

      {/* ── 01 · Race Winners ──────────────────────────────────── */}
      {winnerRows.length > 0 && (
        <section className="circuit-section border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">01 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('winners.title')}</h2>
            <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">
              {winnerRows.length}
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
            <table className="w-full min-w-[480px]">
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

      {/* ── 02 · Decade Dominance  |  03 · Lap Record Evolution ── */}
      <div className="circuit-section grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border">

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
                <div className="ml-[52px] h-px bg-border overflow-hidden">
                  <div
                    className="decade-bar h-full bg-text-2"
                    style={{
                      width: topConstructor ? `${(wins / total) * 100}%` : '0%',
                    }}
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
          <div className="lap-evo-list max-h-[480px] overflow-y-auto">
            {lapEntries.length > 0 ? (
              lapEntries.map((row) => (
                <div
                  key={row.year}
                  className="lap-evo-row flex items-center gap-3 px-6 h-9 border-b border-border last:border-b-0"
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

      {/* ── 04 · Constructor Wins ──────────────────────────────── */}
      {constructorWins.length > 0 && (
        <section className="circuit-section border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">04 ·</span>
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

      {/* ── 05 · Track Dominance ──────────────────────────────── */}
      <section className="circuit-section border-b border-border">
        <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
          <span className="font-mono text-xs text-text-2 leading-none">05 ·</span>
          <h2 className="text-[13px] font-medium text-text-2">Track Dominance</h2>
        </div>
        <TrackDominancePanel circuitId={circuit.id} drivers={drivers} />
      </section>

      {/* ── 06 · Next Race (2026) ──────────────────────────────── */}
      {nextRace && (
        <section className="circuit-section">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">06 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('nextRace.title')}</h2>
          </div>
          <div className="px-6 py-7 flex flex-wrap items-end gap-12">
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('nextRace.round')}
              </p>
              <p
                className="text-[48px] text-text-1 leading-none tabular-nums"
                style={{ fontFamily: 'var(--pi-display)' }}
              >
                Rd.{nextRace.round}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('nextRace.date')}
              </p>
              <p className="font-mono text-[18px] text-text-1 leading-none tabular-nums">
                {format.dateTime(new Date(nextRace.date), {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            {nextRace.daysAway > 0 && (
              <div>
                <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                  {t('nextRace.countdown')}
                </p>
                <p
                  className="text-[48px] leading-none tabular-nums"
                  style={{ fontFamily: 'var(--pi-display)', color: 'var(--red)' }}
                >
                  {nextRace.daysAway}
                  <span className="font-mono text-[13px] text-text-3 ml-2">
                    {t('nextRace.days')}
                  </span>
                </p>
              </div>
            )}
            {nextRace.daysAway === 0 && (
              <p className="font-mono text-[13px] uppercase tracking-[0.06em]" style={{ color: 'var(--red)' }}>
                {t('nextRace.today')}
              </p>
            )}
            {nextRace.daysAway < 0 && (
              <p className="font-mono text-[12px] text-text-3">
                {t('nextRace.past')}
              </p>
            )}
          </div>
        </section>
      )}

    </main>
  );
}
