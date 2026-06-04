'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import type { HomeNextRace } from '@/lib/types';

const NEU_SHADOW = '6px 6px 12px rgba(5,5,5,0.12), -4px -4px 8px rgba(255,255,255,0.7)';

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
    days: Math.floor(totalMins / 1440),
    hours: Math.floor((totalMins % 1440) / 60),
    minutes: totalMins % 60,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function Divider() {
  return <div className="my-4" style={{ height: '1px', background: '#D4D0C8' }} />;
}

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
      <div
        className="rounded-xl p-6"
        style={{ background: 'var(--bg)', boxShadow: NEU_SHADOW }}
      >
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-4">
          [ NEXT RACE ]
        </p>
        <p className="font-mono text-[13px] text-text-3">{t('noRace')}</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-0"
      style={{ background: 'var(--bg)', boxShadow: NEU_SHADOW }}
    >
      {/* ── Existing content — do not modify ── */}

      {/* ASCII label */}
      <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-4">
        [ NEXT RACE ]
      </p>

      {/* Round */}
      <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] mb-1">
        RD.{String(race.round).padStart(2, '0')}
      </p>

      {/* Circuit name */}
      <h2
        className="text-[clamp(1.4rem,2.5vw,1.6rem)] uppercase leading-[0.92] tracking-[-0.02em] text-text-1"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        {race.circuit_name}
      </h2>

      {/* Location · Country */}
      <p className="font-mono text-[11px] text-text-2 mt-2">
        {race.location} · {race.country}
      </p>

      {/* Divider */}
      <div className="my-4" style={{ height: '1px', background: 'var(--border-subtle)' }} />

      {/* Date */}
      <p
        className="text-[20px] tabular-nums leading-none text-text-1"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        {formatDate(race.date)}
      </p>

      {/* Existing countdown text */}
      <p
        className="font-mono text-[11px] uppercase tracking-[0.06em] mt-1"
        style={{ color: 'var(--red)' }}
      >
        {race.days_remaining === 0
          ? t('raceDay').toUpperCase()
          : t('inDays', { days: race.days_remaining }).toUpperCase()}
      </p>

      {/* CTA */}
      <Link
        href={`/circuits/${race.circuit_ref}`}
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-100 mt-5 block"
      >
        [ {t('viewCircuit').toUpperCase()} → ]
      </Link>

      {/* ── NEW: whitespace fill ── */}

      {/* 1 · D / H / M countdown */}
      <div className="mt-5 grid grid-cols-3 text-center">
        {[
          { label: t('countdownDays'),    val: cd?.days    ?? null },
          { label: t('countdownHours'),   val: cd?.hours   ?? null },
          { label: t('countdownMinutes'), val: cd?.minutes ?? null },
        ].map(({ label, val }) => (
          <div key={label}>
            <p
              className="tabular-nums leading-none text-text-1 text-5xl"
              style={{ fontFamily: 'var(--pi-display)' }}
              suppressHydrationWarning
            >
              {val !== null ? pad(val) : '--'}
            </p>
            <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mt-1.5">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* 2 · Divider */}
      <Divider />

      {/* 3 · Last winner */}
      <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-2.5">
        {t('lastWinner')}
      </p>
      {race.last_winner ? (
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-mono text-[11px] text-text-2 tabular-nums shrink-0">
            {race.last_winner.year}
          </span>
          <span className="font-mono text-[10px] text-text-3 shrink-0">·</span>
          <span
            className="text-[13px] text-text-1 uppercase tracking-[0.02em] shrink-0"
            style={{ fontFamily: 'var(--pi-display)', fontWeight: 900 }}
          >
            {race.last_winner.forename[0]}. {race.last_winner.surname}
          </span>
          <span className="font-mono text-[10px] text-text-3 shrink-0">·</span>
          <span className="text-[12px] text-text-2 min-w-0 truncate">
            {race.last_winner.constructor}
          </span>
        </div>
      ) : (
        <span className="font-mono text-[13px] text-text-3">—</span>
      )}

      {/* 4 · Divider */}
      <Divider />

      {/* 5 · Circuit quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-0.5">
            {t('statLength')}
          </p>
          <p className="font-mono text-[12px] text-text-1 tabular-nums">
            {race.circuit_length_km != null ? `${race.circuit_length_km}km` : '—'}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-0.5">
            {t('statLaps')}
          </p>
          <p className="font-mono text-[12px] text-text-1 tabular-nums">
            {race.circuit_laps != null ? race.circuit_laps : '—'}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-0.5">
            {t('statLapRecord')}
          </p>
          {race.circuit_lap_record ? (
            <p className="font-mono text-[12px] tabular-nums leading-snug">
              <span style={{ color: '#E10600' }}>{race.circuit_lap_record.time}</span>
              <span className="text-text-3">
                {' '}· {race.circuit_lap_record.forename[0]}. {race.circuit_lap_record.surname}
              </span>
            </p>
          ) : (
            <p className="font-mono text-[12px] text-text-3">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
