'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import InfoTooltip from './InfoTooltip';
import LapRecordArc from './LapRecordArc';

gsap.registerPlugin(ScrollTrigger);

export interface IntelData {
  dnfRate: number;
  dnfTotal: number;
  totalEntries: number;
  dnfCauses: { cause: string; count: number }[];
  poleWins: number;
  poleTotal: number;
  topDriverStreaks: { name: string; count: number; startYear: number; endYear: number }[];
  topConStreaks: { name: string; count: number; startYear: number; endYear: number }[];
  youngestWinner: { forename: string; surname: string; year: number; ageYears: number } | null;
  oldestWinner: { forename: string; surname: string; year: number; ageYears: number } | null;
  avgGridDelta: number | null;
  overallAvgPitSec: number | null;
  pitByDecade: { decade: number; avgSec: number }[];
  natWins: { nationality: string; wins: number }[];
  fastestPitByConstructor: { constructor: string; avgBestSec: number; raceCount: number }[];
  podNoWin: { forename: string; surname: string; podiums: number }[];
}

export interface LapEntry {
  year: number;
  time: string;
  ms: number;
  forename: string;
  surname: string;
}

interface Props {
  intelData: IntelData;
  lapEntries: LapEntry[];
  motionOk: boolean;
}

function CellHeader({ num, title, tooltip }: { num: string; title: string; tooltip: string }) {
  return (
    <div className="px-5 py-3 border-b border-border flex items-center gap-2">
      <span className="font-mono text-[10px] text-text-3 leading-none shrink-0">{num}</span>
      <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 flex-1 min-w-0">{title}</h3>
      <InfoTooltip text={tooltip} />
    </div>
  );
}

export default function CircuitIntelGrid({ intelData, lapEntries, motionOk }: Props) {
  const t = useTranslations('circuitDetail.intel');
  const rootRef = useRef<HTMLDivElement>(null);

  const {
    dnfRate, dnfTotal, totalEntries, dnfCauses,
    poleWins, poleTotal,
    topDriverStreaks, topConStreaks,
    youngestWinner, oldestWinner,
    avgGridDelta,
    overallAvgPitSec, pitByDecade,
    natWins,
    fastestPitByConstructor,
    podNoWin,
  } = intelData;

  const maxNatWins = natWins[0]?.wins ?? 1;
  const maxPodNoWin = podNoWin[0]?.podiums ?? 1;
  const poleConvPct = poleTotal > 0 ? (poleWins / poleTotal) * 100 : null;
  const maxPitDecadeAvg = Math.max(...pitByDecade.map((d) => d.avgSec), 0.01);
  const maxFastPit = fastestPitByConstructor[0]?.avgBestSec ?? 0.01;
  const worstFastPit = fastestPitByConstructor[fastestPitByConstructor.length - 1]?.avgBestSec ?? maxFastPit;

  useEffect(() => {
    if (!motionOk) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.intel-bar').forEach((bar) => {
        gsap.fromTo(bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: 'left center',
            duration: 0.65,
            ease: 'expo.out',
            scrollTrigger: { trigger: bar, start: 'top 94%', once: true },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>('.intel-stat').forEach((el, i) => {
        gsap.from(el, {
          y: 12, autoAlpha: 0, duration: 0.5, ease: 'power3.out', delay: i * 0.04,
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk]);

  return (
    <div ref={rootRef} className="grid grid-cols-1 md:grid-cols-12 border-b border-border">

      {/* ── 1 · DNF Rate ─── md:col-span-5 ─────────────────────────── */}
      <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-border">
        <CellHeader num="1" title={t('dnf.title')} tooltip={t('dnf.info')} />
        <div className="px-5 py-5">
          <div className="intel-stat flex items-end gap-4 mb-5">
            <p
              className="leading-none tabular-nums"
              style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(3rem, 8vw, 5rem)', color: dnfRate > 0.3 ? 'var(--red)' : 'var(--text-1)' }}
            >
              {(dnfRate * 100).toFixed(1)}%
            </p>
            <p className="font-mono text-[11px] text-text-3 mb-2 leading-tight">
              {dnfTotal} / {totalEntries}<br />{t('dnf.label')}
            </p>
          </div>
          {dnfCauses.length > 0 && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-3 mb-3">{t('dnf.cause')}</p>
              <div className="flex flex-col gap-2">
                {dnfCauses.map(({ cause, count }) => (
                  <div key={cause}>
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-[10px] text-text-2 truncate pr-2">{cause}</span>
                      <span className="font-mono text-[10px] text-text-3 tabular-nums shrink-0">{count}</span>
                    </div>
                    <div className="h-px bg-border overflow-hidden">
                      <div
                        className="intel-bar h-full bg-text-2"
                        style={{ width: `${(count / dnfCauses[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2 · Pole → Win ─── md:col-span-4 ───────────────────────── */}
      <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-border">
        <CellHeader num="2" title={t('poleWin.title')} tooltip={t('poleWin.info')} />
        <div className="px-5 py-5">
          {poleTotal > 0 ? (
            <>
              <div className="intel-stat mb-4">
                <p
                  className="leading-none tabular-nums"
                  style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2.8rem, 6vw, 4rem)', color: 'var(--text-1)' }}
                >
                  {poleConvPct?.toFixed(1)}%
                </p>
                <p className="font-mono text-[11px] text-text-3 mt-1">{t('poleWin.conversion')}</p>
              </div>
              <div className="h-px bg-border overflow-hidden mb-4">
                <div
                  className="intel-bar h-full bg-text-1"
                  style={{ width: `${poleConvPct ?? 0}%` }}
                />
              </div>
              <p className="font-mono text-[11px] text-text-3 tabular-nums">
                {poleWins} / {poleTotal} <span className="text-text-3">{t('poleWin.poles')}</span>
              </p>
            </>
          ) : (
            <p className="font-mono text-[13px] text-text-3">—</p>
          )}
        </div>
      </div>

      {/* ── 3 · Grid Δ ─── md:col-span-3 ───────────────────────────── */}
      <div className="md:col-span-3 border-b md:border-b-0 border-border">
        <CellHeader num="3" title={t('gridDelta.title')} tooltip={t('gridDelta.info')} />
        <div className="px-5 py-5">
          {avgGridDelta !== null ? (
            <div className="intel-stat">
              <p
                className="leading-none tabular-nums"
                style={{
                  fontFamily: 'var(--pi-display)',
                  fontSize: 'clamp(2.6rem, 5vw, 3.8rem)',
                  color: avgGridDelta > 0 ? 'var(--text-1)' : 'var(--red)',
                }}
              >
                {avgGridDelta > 0 ? '+' : ''}{avgGridDelta.toFixed(1)}
              </p>
              <p className="font-mono text-[11px] text-text-3 mt-2 leading-snug">
                {t('gridDelta.label')}
              </p>
            </div>
          ) : (
            <p className="font-mono text-[13px] text-text-3">—</p>
          )}
        </div>
      </div>

      {/* ── 4 · Win Streaks ─── md:col-span-4 ──────────────────────── */}
      <div className="md:col-span-4 border-b md:border-r border-border">
        <CellHeader num="4" title={t('streaks.title')} tooltip={t('streaks.info')} />
        <div className="px-5 py-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-3 mb-2">{t('streaks.driver')}</p>
          <div className="flex flex-col gap-2 mb-5">
            {topDriverStreaks.length > 0 ? topDriverStreaks.map((s) => (
              <div key={`${s.name}-${s.startYear}`} className="intel-stat flex items-baseline gap-2">
                <span
                  className="text-[20px] tabular-nums leading-none shrink-0"
                  style={{ fontFamily: 'var(--pi-display)' }}
                >
                  {s.count}
                </span>
                <div className="min-w-0">
                  <span className="font-mono text-[11px] text-text-1 block truncate">{s.name}</span>
                  <span className="font-mono text-[10px] text-text-3 tabular-nums">
                    {s.startYear}{s.count > 1 ? `–${s.endYear}` : ''}
                  </span>
                </div>
              </div>
            )) : <span className="font-mono text-[12px] text-text-3">—</span>}
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-3 mb-2">{t('streaks.constructor')}</p>
          <div className="flex flex-col gap-2">
            {topConStreaks.length > 0 ? topConStreaks.map((s) => (
              <div key={`${s.name}-${s.startYear}`} className="intel-stat flex items-baseline gap-2">
                <span
                  className="text-[20px] tabular-nums leading-none shrink-0"
                  style={{ fontFamily: 'var(--pi-display)' }}
                >
                  {s.count}
                </span>
                <div className="min-w-0">
                  <span className="font-mono text-[11px] text-text-1 block truncate">{s.name}</span>
                  <span className="font-mono text-[10px] text-text-3 tabular-nums">
                    {s.startYear}{s.count > 1 ? `–${s.endYear}` : ''}
                  </span>
                </div>
              </div>
            )) : <span className="font-mono text-[12px] text-text-3">—</span>}
          </div>
        </div>
      </div>

      {/* ── 5 · Youngest / Oldest Winner ─── md:col-span-4 ─────────── */}
      <div className="md:col-span-4 border-b md:border-r border-border">
        <CellHeader num="5" title={t('age.title')} tooltip={t('age.info')} />
        <div className="px-5 py-4 flex flex-col gap-5">
          {youngestWinner ? (
            <div className="intel-stat">
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-3 mb-2">{t('age.youngest')}</p>
              <p
                className="leading-none tabular-nums mb-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}
              >
                {youngestWinner.ageYears.toFixed(1)}
                <span className="font-mono text-[13px] text-text-3 ml-1">{t('age.yearsOld')}</span>
              </p>
              <p className="font-mono text-[11px] text-text-2">
                {youngestWinner.forename[0]}. {youngestWinner.surname}
                <span className="text-text-3"> · {youngestWinner.year}</span>
              </p>
            </div>
          ) : (
            <p className="font-mono text-[12px] text-text-3">—</p>
          )}
          <div className="h-px bg-border" />
          {oldestWinner ? (
            <div className="intel-stat">
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-3 mb-2">{t('age.oldest')}</p>
              <p
                className="leading-none tabular-nums mb-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}
              >
                {oldestWinner.ageYears.toFixed(1)}
                <span className="font-mono text-[13px] text-text-3 ml-1">{t('age.yearsOld')}</span>
              </p>
              <p className="font-mono text-[11px] text-text-2">
                {oldestWinner.forename[0]}. {oldestWinner.surname}
                <span className="text-text-3"> · {oldestWinner.year}</span>
              </p>
            </div>
          ) : (
            <p className="font-mono text-[12px] text-text-3">—</p>
          )}
        </div>
      </div>

      {/* ── 6 · Wins by Nationality ─── md:col-span-4 ──────────────── */}
      <div className="md:col-span-4 border-b border-border">
        <CellHeader num="6" title={t('natWins.title')} tooltip={t('natWins.info')} />
        <div className="px-5 py-4 flex flex-col gap-2">
          {natWins.length > 0 ? natWins.map(({ nationality, wins }) => (
            <div key={nationality} className="intel-stat">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] text-text-2 flex-1 min-w-0 truncate">{nationality}</span>
                <span className="font-mono text-[11px] text-text-1 tabular-nums shrink-0">{wins}</span>
              </div>
              <div className="h-px bg-border overflow-hidden">
                <div
                  className="intel-bar h-full bg-text-2"
                  style={{ width: `${(wins / maxNatWins) * 100}%` }}
                />
              </div>
            </div>
          )) : (
            <p className="font-mono text-[12px] text-text-3">—</p>
          )}
        </div>
      </div>

      {/* ── 7 · Pit Strategy ─── md:col-span-5 ─────────────────────── */}
      <div className="md:col-span-5 border-b md:border-r border-border">
        <CellHeader num="7" title={t('pitStrategy.title')} tooltip={t('pitStrategy.info')} />
        <div className="px-5 py-5">
          {overallAvgPitSec !== null ? (
            <>
              <div className="intel-stat mb-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-3 mb-1">{t('pitStrategy.overall')}</p>
                <p
                  className="leading-none tabular-nums"
                  style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2.2rem, 5vw, 3.2rem)' }}
                >
                  {overallAvgPitSec.toFixed(2)}
                  <span className="font-mono text-[13px] text-text-3 ml-1">s</span>
                </p>
              </div>
              {pitByDecade.length > 0 && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-3 mb-3">{t('pitStrategy.byDecade')}</p>
                  <div className="flex flex-col gap-2">
                    {pitByDecade.map(({ decade, avgSec }) => (
                      <div key={decade}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] text-text-3 tabular-nums w-10 shrink-0">{decade}s</span>
                          <span className="font-mono text-[11px] text-text-1 tabular-nums shrink-0 w-14">{avgSec.toFixed(2)}s</span>
                        </div>
                        <div className="ml-24 h-px bg-border overflow-hidden">
                          <div
                            className="intel-bar h-full bg-text-2"
                            style={{ width: `${(avgSec / maxPitDecadeAvg) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="font-mono text-[12px] text-text-3">—</p>
          )}
        </div>
      </div>

      {/* ── 8 · Fastest Pit · Constructor ─── md:col-span-7 ────────── */}
      <div className="md:col-span-7 border-b border-border">
        <CellHeader num="8" title={t('fastPit.title')} tooltip={t('fastPit.info')} />
        <div className="px-5 py-5">
          {fastestPitByConstructor.length > 0 ? (
            <div className="flex flex-col gap-3">
              {fastestPitByConstructor.map(({ constructor: con, avgBestSec, raceCount }, idx) => {
                const barPct = worstFastPit > maxFastPit
                  ? (1 - (avgBestSec - maxFastPit) / (worstFastPit - maxFastPit)) * 100
                  : 100;
                return (
                  <div key={con} className="intel-stat">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[10px] text-text-3 tabular-nums w-4 shrink-0">{idx + 1}</span>
                      <span className="font-mono text-[11px] text-text-1 flex-1 min-w-0 truncate">{con}</span>
                      <span className="font-mono text-[12px] text-text-1 tabular-nums shrink-0">
                        {avgBestSec.toFixed(2)}s
                      </span>
                      <span className="font-mono text-[10px] text-text-3 tabular-nums shrink-0 w-12 text-right">
                        {raceCount}r
                      </span>
                    </div>
                    <div className="ml-7 h-px bg-border overflow-hidden">
                      <div
                        className="intel-bar h-full"
                        style={{
                          width: `${barPct}%`,
                          background: idx === 0 ? 'var(--red)' : 'var(--text-2)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="font-mono text-[9px] text-text-3 mt-1">{t('fastPit.avgStop')}</p>
            </div>
          ) : (
            <p className="font-mono text-[12px] text-text-3">—</p>
          )}
        </div>
      </div>

      {/* ── 9 · Most Podiums Without Win ─── full width ─────────────── */}
      <div className="md:col-span-12 border-b border-border">
        <CellHeader num="9" title={t('podNoWin.title')} tooltip={t('podNoWin.info')} />
        <div className="px-5 py-4 flex flex-wrap gap-x-10 gap-y-3">
          {podNoWin.length > 0 ? podNoWin.map(({ forename, surname, podiums }, idx) => (
            <div key={`${forename}-${surname}`} className="intel-stat flex items-baseline gap-2">
              <span className="font-mono text-[11px] text-text-3 tabular-nums w-4 shrink-0">{idx + 1}</span>
              <span
                className="uppercase tracking-[0.02em] text-text-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)' }}
              >
                {forename[0]}. {surname}
              </span>
              <span className="font-mono text-[20px] tabular-nums leading-none" style={{ fontFamily: 'var(--pi-display)' }}>
                {podiums}
              </span>
              <span className="font-mono text-[10px] text-text-3">{t('podNoWin.podiums')}</span>
            </div>
          )) : (
            <p className="font-mono text-[12px] text-text-3">—</p>
          )}
        </div>
      </div>

      {/* ── 10 · Lap Time Evolution (animated) ─── full width ──────── */}
      <div className="md:col-span-12">
        <CellHeader num="10" title={t('lapEvo.title')} tooltip={t('lapEvo.info')} />
        {lapEntries.length > 1 ? (
          <div className="px-5 py-5">
            <LapRecordArc data={lapEntries} />
          </div>
        ) : (
          <div className="px-5 py-5">
            <p className="font-mono text-[12px] text-text-3">—</p>
          </div>
        )}
      </div>

    </div>
  );
}
