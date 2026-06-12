'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import type { HomeNextRace } from '@/lib/types';

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function getCountdown(dateStr: string): { days: number; hours: number; minutes: number } {
  const race = new Date(dateStr + 'T00:00:00');
  const diffMs = race.getTime() - Date.now();
  if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0 };
  const totalMins = Math.floor(diffMs / 60000);
  return {
    days:    Math.floor(totalMins / 1440),
    hours:   Math.floor((totalMins % 1440) / 60),
    minutes: totalMins % 60,
  };
}

function pad(n: number): string { return String(n).padStart(2, '0'); }

export default function NextRaceCard({ race }: { race: HomeNextRace | null }) {
  const t = useTranslations('hub.home');
  const [cd, setCd] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  useEffect(() => {
    if (!race) return;
    const tick = () => setCd(getCountdown(race.date));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [race?.date]);

  if (!race) {
    return (
      <div className="px-5 md:px-6 py-5">
        <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em]">[ NEXT RACE ]</p>
        <p className="font-mono text-[12px] text-text-3 mt-3">{t('noRace')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-5 md:px-6 pt-5 pb-4">
        <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em] mb-3">
          [ {t('nextRaceCard').toUpperCase()} ] · RD.{String(race.round).padStart(2, '0')} · {formatDate(race.date)}
        </p>
        <h2
          className="uppercase leading-[0.9] text-text-1"
          style={{
            fontFamily:    'var(--pi-display)',
            fontSize:      'clamp(26px, 3.5vw, 40px)',
            letterSpacing: '-0.025em',
          }}
        >
          {race.circuit_name}
        </h2>
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.08em] mt-1.5">
          {race.location} · {race.country}
        </p>
      </div>

      {/* ── Track SVG — full-width editorial strip ──────────── */}
      {race.circuit_svg ? (
        <div
          className="w-full flex items-center justify-center border-y border-border"
          style={{ height: '148px', background: 'var(--bg)' }}
        >
          <svg
            viewBox={race.circuit_svg.viewBox}
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%', padding: '12px' }}
            role="img"
            aria-label={`Track map — ${race.circuit_name}`}
          >
            <path
              d={race.circuit_svg.path}
              stroke="var(--text-2)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        <div
          className="w-full border-y border-border flex items-center justify-center"
          style={{ height: '148px', background: 'var(--bg)' }}
        >
          <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.1em]">
            [ NO TRACK MAP ]
          </span>
        </div>
      )}

      {/* ── Countdown ──────────────────────────────────────── */}
      <div className="px-5 md:px-6 pt-4 pb-4">
        <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em] mb-3">
          {race.days_remaining === 0
            ? t('raceDay').toUpperCase()
            : t('inDays', { days: race.days_remaining }).toUpperCase()}
        </p>
        <div className="grid grid-cols-3 gap-px bg-border">
          {[
            { label: t('countdownDays'),    val: cd?.days    ?? null },
            { label: t('countdownHours'),   val: cd?.hours   ?? null },
            { label: t('countdownMinutes'), val: cd?.minutes ?? null },
          ].map(({ label, val }) => (
            <div key={label} className="bg-surface-raised flex flex-col items-center py-3">
              <span
                className="tabular-nums leading-none text-text-1"
                style={{
                  fontFamily:    'var(--pi-display)',
                  fontSize:      'clamp(36px, 5vw, 52px)',
                  letterSpacing: '-0.03em',
                }}
                suppressHydrationWarning
              >
                {val !== null ? pad(val) : '--'}
              </span>
              <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.16em] mt-1.5">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Last winner + lap record ────────────────────────── */}
      <div className="px-5 md:px-6 pt-3 pb-4 border-t border-border grid grid-cols-2 gap-x-4 gap-y-3 mt-auto">

        <div>
          <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.14em] mb-1">
            {t('lastWinner')}
          </p>
          {race.last_winner ? (
            <>
              <p
                className="uppercase leading-none text-text-1 truncate"
                style={{ fontFamily: 'var(--pi-display)', fontSize: '14px' }}
              >
                {race.last_winner.forename[0]}. {race.last_winner.surname}
              </p>
              <p className="font-mono text-[9px] text-text-3 mt-0.5 tabular-nums">
                {race.last_winner.year} · {race.last_winner.constructor}
              </p>
            </>
          ) : (
            <p className="font-mono text-[12px] text-text-3">—</p>
          )}
        </div>

        <div>
          <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.14em] mb-1">
            {t('statLapRecord')}
          </p>
          {race.circuit_lap_record ? (
            <>
              <p className="font-mono text-[13px] tabular-nums" style={{ color: 'var(--red)' }}>
                {race.circuit_lap_record.time}
              </p>
              <p className="font-mono text-[9px] text-text-3 mt-0.5">
                {race.circuit_lap_record.forename[0]}. {race.circuit_lap_record.surname}
                {' '}· {race.circuit_lap_record.year}
              </p>
            </>
          ) : (
            <p className="font-mono text-[12px] text-text-3">—</p>
          )}
        </div>

        {race.circuit_laps != null && (
          <div>
            <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.14em] mb-1">
              {t('statLaps')}
            </p>
            <p className="font-mono text-[13px] text-text-1 tabular-nums">
              {race.circuit_laps}
            </p>
          </div>
        )}

      </div>

      {/* ── CTA ────────────────────────────────────────────── */}
      <div className="px-5 md:px-6 pb-5 border-t border-border pt-3">
        <Link
          href={`/circuits/${race.circuit_ref}`}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-3 hover:text-text-1 transition-colors duration-100"
        >
          [ {t('viewCircuit').toUpperCase()} → ]
        </Link>
      </div>

    </div>
  );
}
