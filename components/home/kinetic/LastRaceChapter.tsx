'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Link } from '@/lib/i18n/navigation';
import TrackDraw from './TrackDraw';
import { teamColor } from './teamColors';
import { fitToWidth, observeFit } from './fitText';
import type { HomeLastRaceData } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger, SplitText);

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

interface LastRaceChapterProps {
  race: HomeLastRaceData | null;
  motionOk: boolean;
}

export default function LastRaceChapter({ race, motionOk }: LastRaceChapterProps) {
  const t = useTranslations('hub.home');
  const rootRef  = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

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

      // Podium crosses the line one by one
      gsap.from('.lr-podium-row', {
        x: -32,
        autoAlpha: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.lr-podium', start: 'top 82%', once: true },
      });

      gsap.from('.lr-stat', {
        y: 20,
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.lr-stats', start: 'top 88%', once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, race]);

  if (!race) return null;

  return (
    <section ref={rootRef} className="border-t border-border px-5 md:px-10 py-10 md:py-16">

      {/* Chapter label */}
      <p className="font-mono text-[9px] md:text-[10px] text-text-2 uppercase tracking-[0.18em] mb-4">
        [ {t('lastRace').toUpperCase()} ] · RD.{String(race.round).padStart(2, '0')} · {formatDate(race.date)}
      </p>

      {/* Circuit name — kinetic */}
      <div className="kinetic-mask -my-[0.06em] py-[0.06em] mb-8 md:mb-12">
        <h2
          ref={titleRef}
          className="uppercase leading-[0.9] whitespace-nowrap text-[clamp(34px,6.5vw,92px)]"
          style={{
            fontFamily:    'var(--pi-display)',
            letterSpacing: '-0.03em',
            opacity:       motionOk ? 0 : 1,
          }}
        >
          {race.circuit_name}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-start">

        {/* The flying lap */}
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
              className="w-full flex items-center justify-center"
              style={{ height: 'clamp(180px, 30vw, 320px)', background: 'var(--surface-raised)' }}
            >
              <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.12em]">
                [ NO TRACK MAP ]
              </span>
            </div>
          )}
          <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.12em] mt-3">
            {race.name}
          </p>
        </div>

        {/* Podium + stats */}
        <div>
          <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.18em] mb-4">
            {t('podium').toUpperCase()}
          </p>

          <div className="lr-podium flex flex-col gap-2">
            {race.podium.map((p) => (
              <div
                key={p.position}
                className="lr-podium-row relative flex items-baseline gap-4 pl-4 py-1"
                style={{ background: `color-mix(in srgb, ${teamColor(p.constructor_ref)} 10%, transparent)` }}
              >
                <span
                  className="tabular-nums text-text-3 shrink-0 w-6"
                  style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(16px, 2vw, 24px)' }}
                >
                  {p.position}
                </span>
                <span
                  className="uppercase leading-none flex-1 min-w-0 truncate"
                  style={{
                    fontFamily:    'var(--pi-display)',
                    fontSize:      'clamp(20px, 3vw, 34px)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {p.surname}
                </span>
                {p.time && (
                  <span className="font-mono text-[10px] md:text-[11px] text-text-2 shrink-0 tabular-nums">
                    {p.time}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Fastest lap / pit */}
          <div className="lr-stats grid grid-cols-2 gap-6 mt-8 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {race.fastest_lap && (
              <div className="lr-stat">
                <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.18em] mb-1.5">
                  {t('fastestLap').toUpperCase()}
                </p>
                <p
                  className="uppercase leading-none truncate"
                  style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(15px, 1.8vw, 20px)' }}
                >
                  {race.fastest_lap.surname}
                </p>
                <p className="font-mono text-[12px] tabular-nums mt-1" style={{ color: 'var(--red)' }}>
                  {race.fastest_lap.time}
                </p>
              </div>
            )}
            {race.fastest_pit && (
              <div className="lr-stat">
                <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.18em] mb-1.5">
                  {t('fastestPit').toUpperCase()}
                </p>
                <p
                  className="uppercase leading-none truncate"
                  style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(15px, 1.8vw, 20px)' }}
                >
                  {race.fastest_pit.surname}
                </p>
                <p className="font-mono text-[12px] tabular-nums mt-1" style={{ color: 'var(--red)' }}>
                  {race.fastest_pit.duration}s
                </p>
              </div>
            )}
            {race.retirements.length > 0 && (
              <div className="lr-stat">
                <p className="font-mono text-[8px] text-text-3 uppercase tracking-[0.18em] mb-1.5">
                  {t('retirements').toUpperCase()}
                </p>
                <p
                  className="tabular-nums leading-none"
                  style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(15px, 1.8vw, 20px)' }}
                >
                  {race.retirements.length}
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
