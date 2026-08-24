'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from '@/lib/i18n/navigation';
import { teamColor } from '@/components/home/kinetic/teamColors';
import DriverHero from './DriverHero';
import WinHistory, { type WinRow } from './WinHistory';
import CareerArc from '@/components/drivers/CareerArc';
import CircuitRecordSection, { type CircuitRecord } from '@/components/drivers/CircuitRecordSection';
import CareerPathTimeline, { type CareerStageRow } from '@/components/drivers/CareerPathTimeline';
import { DriverScorecardButton } from '@/components/scorecards/DriverScorecard';

gsap.registerPlugin(ScrollTrigger);

// ─── Types ─────────────────────────────────────────────────────────

export interface SeasonRow {
  year: number;
  constructorName: string;
  constructorRef: string;
  position: number | null;
  points: number;
  wins: number;
  podiums: number;
  races: number;
}

export interface PoleRow {
  year: number;
  raceName: string;
}

export interface ConstructorRow {
  constructorId: number;
  name: string;
  ref: string;
  firstYear: number;
  lastYear: number;
  races: number;
  wins: number;
  podiums: number;
}

export interface DriverDetailProps {
  driver: {
    forename: string;
    surname: string;
    code: string | null;
    number: number | null;
    nationality: string;
    dob: string | null;
    driver_ref: string;
  };
  stats: {
    races: number;
    wins: number;
    podiums: number;
    poles: number;
    fastestLaps: number;
    dnfs: number;
    firstYear: number;
    lastYear: number;
  };
  winPct: string;
  avgQuali: number | null;
  frontRowCount: number;
  championshipYears: number[];
  seasonRows: SeasonRow[];
  winRows: WinRow[];
  poleRows: PoleRow[];
  constructorRows: ConstructorRow[];
  maxConRaces: number;
  circuitRecords: CircuitRecord[];
  careerHistory: CareerStageRow[];
}

// ─── Orchestrator ──────────────────────────────────────────────────

export default function DriverDetailExperience({
  driver,
  stats,
  winPct,
  avgQuali,
  frontRowCount,
  championshipYears,
  seasonRows,
  winRows,
  poleRows,
  constructorRows,
  maxConRaces,
  circuitRecords,
  careerHistory,
}: DriverDetailProps) {
  const t = useTranslations('driverDetail');
  const mainRef = useRef<HTMLElement>(null);

  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    // Must run post-mount: matching SSR's default here would mismatch the client's real preference.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotionOk(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Section reveals + stat counters — scoped to main
  useEffect(() => {
    if (!motionOk) return;
    const id = setTimeout(() => ScrollTrigger.refresh(), 400);

    const ctx = gsap.context(() => {

      // Every .driver-section fades + rises on viewport enter
      gsap.utils.toArray<HTMLElement>('.driver-section').forEach((section) => {
        gsap.from(section, {
          y: 28,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 86%', once: true },
        });
      });

      // Career stat cells — counters fire on enter (gap closing)
      gsap.utils.toArray<HTMLElement>('.stat-counter').forEach((el) => {
        const target = parseFloat(el.dataset.val ?? '0');
        const prefix = el.dataset.prefix ?? '';
        const suffix = el.dataset.suffix ?? '';
        const decimals = el.dataset.decimals === '1' ? 1 : 0;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate() {
            el.textContent = `${prefix}${obj.v.toFixed(decimals)}${suffix}`;
          },
        });
      });

      // Constructor bars launch from left
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

      // Win rows launch from left — grid forming
      gsap.from('.win-row', {
        x: -32,
        autoAlpha: 0,
        duration: 0.55,
        stagger: 0.03,
        ease: 'power4.out',
        scrollTrigger: { trigger: '.win-history-section', start: 'top 82%', once: true },
      });

    }, mainRef);

    return () => {
      clearTimeout(id);
      ctx.revert();
    };
  }, [motionOk]);

  const currentTeamRef = seasonRows[0]?.constructorRef ?? '';

  const statCells: Array<{
    label: string;
    value: string;
    val: number;
    prefix: string;
    suffix: string;
    decimals: boolean;
    sub: string | null;
    color?: string;
  }> = [
    {
      label: t('stats.championships'),
      value: String(championshipYears.length),
      val: championshipYears.length,
      prefix: '',
      suffix: '',
      decimals: false,
      sub: championshipYears.length ? championshipYears.join(' · ') : null,
      color: championshipYears.length ? 'var(--gold)' : undefined,
    },
    { label: t('stats.poles'),            value: String(stats.poles),       val: stats.poles,       prefix: '', suffix: '',  decimals: false, sub: null },
    { label: t('stats.fastestLaps'),      value: String(stats.fastestLaps), val: stats.fastestLaps, prefix: '', suffix: '',  decimals: false, sub: null },
    { label: t('stats.dnfs'),             value: String(stats.dnfs),        val: stats.dnfs,        prefix: '', suffix: '',  decimals: false, sub: null },
    {
      label: t('stats.winPct'),
      value: `${winPct}%`,
      val: parseFloat(winPct),
      prefix: '',
      suffix: '%',
      decimals: true,
      sub: null,
      color: parseFloat(winPct) > 20 ? 'var(--red)' : undefined,
    },
    {
      label: t('qualifying.avgPosition'),
      value: avgQuali !== null ? `P${avgQuali}` : '—',
      val: avgQuali ?? 0,
      prefix: 'P',
      suffix: '',
      decimals: true,
      sub: null,
    },
  ];

  return (
    <main ref={mainRef} className="flex flex-col bg-bg">

      {/* Breadcrumb */}
      <div className="h-10 px-6 border-b border-border flex items-center gap-2 shrink-0">
        <Link
          href="/drivers"
          className="font-mono text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150"
        >
          {t('breadcrumb.drivers')}
        </Link>
        <span className="font-mono text-[11px] text-text-3">·</span>
        <span className="font-mono text-[11px] text-text-2 truncate">{driver.surname}</span>
      </div>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <DriverHero
        forename={driver.forename}
        surname={driver.surname}
        code={driver.code}
        number={driver.number}
        nationality={driver.nationality}
        dob={driver.dob}
        driverRef={driver.driver_ref}
        championshipYears={championshipYears}
        currentTeamRef={currentTeamRef}
        races={stats.races}
        wins={stats.wins}
        podiums={stats.podiums}
        motionOk={motionOk}
      />

      {/* ── 01 · Career stat band ──────────────────────────────── */}
      <section className="driver-section border-b border-border">
        <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
          <span className="font-mono text-xs text-text-2 leading-none">01 ·</span>
          <h2 className="text-[13px] font-medium text-text-2">{t('stats.title')}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {statCells.map(({ label, value, val, prefix, suffix, decimals, sub, color }, i) => (
            <div
              key={label}
              className={`flex flex-col px-6 py-5 border-border${i > 0 ? ' border-l max-sm:odd:border-l-0 max-lg:[&:nth-child(4)]:border-l-0' : ''}${i >= 2 ? ' max-sm:border-t' : ''}${i >= 3 ? ' max-lg:border-t' : ''}`}
            >
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] mb-2">
                {label}
              </p>
              <p
                className={value !== '—' ? 'stat-counter leading-none tabular-nums' : 'leading-none tabular-nums'}
                data-val={val}
                data-prefix={prefix}
                data-suffix={suffix}
                data-decimals={decimals ? '1' : '0'}
                style={{
                  fontFamily: 'var(--pi-display)',
                  fontSize: 'clamp(1.6rem, 2.6vw, 2.2rem)',
                  color: color ?? 'var(--text-1)',
                }}
              >
                {value}
              </p>
              {sub && (
                <p className="font-mono text-[10px] mt-2 leading-relaxed tabular-nums" style={{ color: 'var(--gold)' }}>
                  {sub}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Career arc — the shape of a career ─────────────────── */}
      {seasonRows.length > 1 && (
        <div className="driver-section border-b border-border px-6 py-6">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] mb-3">
            {t('careerArc.title')}
          </p>
          <CareerArc
            data={[...seasonRows].reverse().map((r) => ({
              year: r.year,
              points: r.points,
              position: r.position,
            }))}
            variant="full"
            championshipYears={championshipYears}
          />
        </div>
      )}

      {/* ── Two-column grid: Seasons | Win History + Qualifying ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">

        {/* LEFT: 02 · Season by Season */}
        {seasonRows.length > 0 && (
          <section className="driver-section md:border-r border-border-subtle">
            <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
              <span className="font-mono text-xs text-text-2 leading-none">02 ·</span>
              <h2 className="text-[13px] font-medium text-text-2">{t('seasons.title')}</h2>
              <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">{seasonRows.length}</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="sticky top-0 bg-surface border-b border-border z-10">
                    <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-16">{t('seasons.year')}</th>
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
                        className="border-b border-border-subtle h-10 hover:bg-surface-raised transition-colors duration-100"
                        style={isChamp ? { background: 'var(--gold-dim)' } : undefined}
                      >
                        <td className="px-4 font-mono text-xs tabular-nums whitespace-nowrap">
                          <span className={isChamp ? 'text-gold' : 'text-text-3'}>{row.year}</span>
                          {isChamp && <span className="font-mono text-[9px] text-gold ml-1.5">★</span>}
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-1.5 h-1.5 shrink-0"
                              style={{ backgroundColor: teamColor(row.constructorRef) }}
                            />
                            <span className="text-[12px] text-text-2 truncate">{row.constructorName}</span>
                          </div>
                        </td>
                        <td
                          className="px-3 text-right font-mono text-[12px] tabular-nums"
                          style={{ color: row.position === 1 ? 'var(--gold)' : 'var(--text-1)' }}
                        >
                          {row.position !== null ? `P${row.position}` : '—'}
                        </td>
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
          <section className="driver-section win-history-section">
            <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
              <span className="font-mono text-xs text-text-2 leading-none">03 ·</span>
              <h2 className="text-[13px] font-medium text-text-2">{t('winsSection.title')}</h2>
              <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">{winRows.length}</span>
            </div>
            <WinHistory rows={winRows} />
          </section>

          {/* 04 · Qualifying Record */}
          <section className="driver-section">
            <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
              <span className="font-mono text-xs text-text-2 leading-none">04 ·</span>
              <h2 className="text-[13px] font-medium text-text-2">{t('qualifying.title')}</h2>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
              {[
                { label: t('qualifying.poles'),       value: String(poleRows.length) },
                { label: t('qualifying.frontRow'),    value: String(frontRowCount) },
                { label: t('qualifying.avgPosition'), value: avgQuali !== null ? `P${avgQuali}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="px-5 py-4">
                  <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">{label}</p>
                  <p
                    className="text-text-1 leading-none tabular-nums"
                    style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.5rem, 2.4vw, 2rem)' }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
            {poleRows.length > 0 && (
              <div className="max-h-[320px] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="sticky top-0 bg-surface border-b border-border z-10">
                      <th className="px-4 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] w-14">{t('qualifying.year')}</th>
                      <th className="px-3 py-2 text-left font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('qualifying.race')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poleRows.map((row, i) => (
                      <tr key={i} className="border-b border-border-subtle hover:bg-surface-raised transition-colors duration-100">
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
        <section className="driver-section border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">05 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('constructors.title')}</h2>
          </div>
          <div className="px-6 py-5 flex flex-col gap-3">
            {constructorRows.map((row) => {
              const color = teamColor(row.ref);
              return (
                <div key={row.constructorId} className="flex items-center gap-4">
                  <div
                    className="flex items-center gap-2 px-3 py-1 shrink-0"
                    style={{ background: `${color}14`, minWidth: 144 }}
                  >
                    <span className="text-[13px] font-medium text-text-1 truncate">{row.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0">
                    {row.firstYear === row.lastYear ? String(row.firstYear) : `${row.firstYear}–${row.lastYear}`}
                  </span>
                  <div className="flex-1 h-[3px] overflow-hidden bg-surface-raised">
                    <div
                      className="constructor-bar h-full"
                      style={{ width: `${(row.races / maxConRaces) * 100}%`, background: color }}
                    />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[11px] text-text-1 tabular-nums w-14 text-right">
                      {row.races}<span className="text-text-3 ml-1">{t('constructors.races')}</span>
                    </span>
                    <span className="font-mono text-[11px] tabular-nums w-12 text-right" style={{ color }}>
                      {row.wins}<span className="text-text-3 ml-1">{t('constructors.wins')}</span>
                    </span>
                    <span className="font-mono text-[11px] text-text-2 tabular-nums w-14 text-right hidden sm:inline">
                      {row.podiums}<span className="text-text-3 ml-1">{t('constructors.podiums')}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 06 · Circuit Record ───────────────────────────────── */}
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
      {/* ── 07 · Career Path ───────────────────────────────────── */}
      {careerHistory.length > 0 && (
        <section className="driver-section border-b border-border">
          <div className="px-6 py-3 border-b border-border flex items-baseline gap-2">
            <span className="font-mono text-xs text-text-2 leading-none">07 ·</span>
            <h2 className="text-[13px] font-medium text-text-2">{t('careerPath.title')}</h2>
            <span className="font-mono text-[11px] text-text-3 ml-1 tabular-nums">{careerHistory.length}</span>
          </div>
          <CareerPathTimeline rows={careerHistory} />
        </section>
      )}


      {/* ── Share scorecard ───────────────────────────────────── */}
      <div className="px-6 py-3 border-t border-border">
        <DriverScorecardButton
          data={{
            forename:       driver.forename,
            surname:        driver.surname,
            code:           driver.code,
            nationality:    driver.nationality,
            firstYear:      stats.firstYear,
            lastYear:       stats.lastYear,
            races:          stats.races,
            wins:           stats.wins,
            podiums:        stats.podiums,
            poles:          stats.poles,
            fastestLaps:    stats.fastestLaps,
            championships:  championshipYears.length,
            constructorRef: currentTeamRef,
          }}
        />
      </div>

    </main>
  );
}
