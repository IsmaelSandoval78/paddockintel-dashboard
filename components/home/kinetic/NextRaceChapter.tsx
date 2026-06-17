'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Link } from '@/lib/i18n/navigation';
import TrackDraw from './TrackDraw';
import { fitToWidth, observeFit } from './fitText';
import type { HomeNextRace } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger, SplitText);

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

interface NextRaceChapterProps {
  race: HomeNextRace | null;
  motionOk: boolean;
}

export default function NextRaceChapter({ race, motionOk }: NextRaceChapterProps) {
  const t = useTranslations('hub.home');
  const rootRef  = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [cd, setCd] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  useEffect(() => {
    if (!race) return;
    const tick = () => setCd(getCountdown(race.date));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [race?.date]);

  // Fit circuit name to one line — runs regardless of motion
  useEffect(() => {
    if (!race) return;
    let cleanup: (() => void) | undefined;
    document.fonts.ready.then(() => {
      if (!titleRef.current) return;
      fitToWidth(titleRef.current);
      cleanup = observeFit(titleRef.current);
    });
    return () => cleanup?.();
  }, [race]);

  useEffect(() => {
    if (!motionOk || !race) return;
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        if (!titleRef.current) return;
        const split = new SplitText(titleRef.current, { type: 'chars' });
        gsap.set(split.chars, { yPercent: 110 });
        gsap.set(titleRef.current, { opacity: 1 });
        gsap.to(split.chars, {
          yPercent: 0,
          duration: 0.9,
          stagger: 0.025,
          ease: 'power4.out',
          scrollTrigger: { trigger: titleRef.current, start: 'top 85%', once: true },
        });
      });

      // Countdown cells drop into place like grid slots
      gsap.from('.nr-cd-cell', {
        y: 36,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power4.out',
        scrollTrigger: { trigger: '.nr-cd', start: 'top 85%', once: true },
      });

      gsap.from('.nr-stat', {
        y: 20,
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.nr-stats', start: 'top 88%', once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, race]);

  if (!race) return null;

  return (
    <section
      ref={rootRef}
      className="border-t border-border px-5 md:px-10 py-10 md:py-16"
      style={{ background: 'var(--surface-raised)' }}
    >
      {/* Chapter label */}
      <p className="font-mono text-[9px] md:text-[10px] text-text-2 uppercase tracking-[0.18em] mb-4">
        [ {t('nextRaceCard').toUpperCase()} ] · RD.{String(race.round).padStart(2, '0')} · {formatDate(race.date)}
        <span className="ml-3" style={{ color: 'var(--red)' }}>
          {race.days_remaining === 0
            ? t('raceDay').toUpperCase()
            : t('inDays', { days: race.days_remaining }).toUpperCase()}
        </span>
      </p>

      {/* Circuit name */}
      <div className="kinetic-mask -my-[0.06em] py-[0.06em] mb-2">
        <h2
          ref={titleRef}
          className="uppercase leading-[0.9] whitespace-nowrap"
          style={{
            fontFamily:    'var(--pi-display)',
            fontSize:      'clamp(34px, 6.5vw, 92px)',
            letterSpacing: '-0.03em',
            opacity:       motionOk ? 0 : 1,
          }}
        >
          {race.circuit_name}
        </h2>
      </div>
      <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-8 md:mb-12">
        {race.location} · {race.country}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-start">

        {/* Track draws itself */}
        <div>
          {race.circuit_svg ? (
            <TrackDraw
              pathData={race.circuit_svg.path}
              viewBox={race.circuit_svg.viewBox}
              circuitName={race.circuit_name}
              motionOk={motionOk}
            />
          ) : (
            <div
              className="w-full flex items-center justify-center border border-border-subtle"
              style={{ height: 'clamp(180px, 30vw, 320px)' }}
            >
              <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.12em]">
                [ NO TRACK MAP ]
              </span>
            </div>
          )}
        </div>

        {/* Countdown + intel */}
        <div>
          <div className="nr-cd grid grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
            {[
              { label: t('countdownDays'),    val: cd?.days    ?? null },
              { label: t('countdownHours'),   val: cd?.hours   ?? null },
              { label: t('countdownMinutes'), val: cd?.minutes ?? null },
            ].map(({ label, val }) => (
              <div key={label} className="nr-cd-cell flex flex-col items-center py-5 md:py-7" style={{ background: 'var(--bg)' }}>
                <span
                  className="tabular-nums leading-none"
                  style={{
                    fontFamily:    'var(--pi-display)',
                    fontSize:      'clamp(44px, 7vw, 96px)',
                    letterSpacing: '-0.04em',
                  }}
                  suppressHydrationWarning
                >
                  {val !== null ? pad(val) : '--'}
                </span>
                <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.2em] mt-2">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Intel grid */}
          <div className="nr-stats grid grid-cols-2 gap-6 mt-8 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="nr-stat">
              <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.18em] mb-1.5">
                {t('lastWinner').toUpperCase()}
              </p>
              {race.last_winner ? (
                <>
                  <p
                    className="uppercase leading-none truncate"
                    style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(15px, 1.8vw, 20px)' }}
                  >
                    {race.last_winner.forename[0]}. {race.last_winner.surname}
                  </p>
                  <p className="font-mono text-[9px] text-text-3 mt-1 tabular-nums">
                    {race.last_winner.year} · {race.last_winner.constructor}
                  </p>
                </>
              ) : (
                <p className="font-mono text-[12px] text-text-3">—</p>
              )}
            </div>

            <div className="nr-stat">
              <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.18em] mb-1.5">
                {t('statLapRecord').toUpperCase()}
              </p>
              {race.circuit_lap_record ? (
                <>
                  <p className="font-mono text-[14px] tabular-nums" style={{ color: 'var(--red)' }}>
                    {race.circuit_lap_record.time}
                  </p>
                  <p className="font-mono text-[9px] text-text-3 mt-1">
                    {race.circuit_lap_record.forename[0]}. {race.circuit_lap_record.surname} · {race.circuit_lap_record.year}
                  </p>
                </>
              ) : (
                <p className="font-mono text-[12px] text-text-3">—</p>
              )}
            </div>

            {race.circuit_laps != null && (
              <div className="nr-stat">
                <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.18em] mb-1.5">
                  {t('statLaps').toUpperCase()}
                </p>
                <p
                  className="tabular-nums leading-none"
                  style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(15px, 1.8vw, 20px)' }}
                >
                  {race.circuit_laps}
                </p>
              </div>
            )}
          </div>

          <Link
            href={`/circuits/${race.circuit_ref}`}
            data-cursor
            className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-2 hover:text-red transition-colors duration-150 inline-block mt-8"
          >
            [ {t('viewCircuit').toUpperCase()} → ]
          </Link>
        </div>
      </div>
    </section>
  );
}
