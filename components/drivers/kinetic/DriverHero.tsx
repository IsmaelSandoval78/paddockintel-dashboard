'use client';

import { useEffect, useRef } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { fitToWidth, observeFit } from '@/components/home/kinetic/fitText';
import { teamColor } from '@/components/home/kinetic/teamColors';
import { flagGradient } from '@/lib/flagGradient';

gsap.registerPlugin(SplitText, ScrambleTextPlugin);

export interface DriverHeroProps {
  forename: string;
  surname: string;
  code: string | null;
  number: number | null;
  nationality: string;
  dob: string | null;
  championshipYears: number[];
  currentTeamRef: string;
  races: number;
  wins: number;
  podiums: number;
  motionOk: boolean;
}

export default function DriverHero({
  forename, surname, code, number, nationality, dob,
  championshipYears, currentTeamRef,
  races, wins, podiums, motionOk,
}: DriverHeroProps) {
  const t = useTranslations('driverDetail');
  const format = useFormatter();

  const rootRef     = useRef<HTMLDivElement>(null);
  const metaRef     = useRef<HTMLParagraphElement>(null);
  const nameRef     = useRef<HTMLHeadingElement>(null);
  const racesRef    = useRef<HTMLParagraphElement>(null);
  const winsRef     = useRef<HTMLParagraphElement>(null);
  const podiumsRef  = useRef<HTMLParagraphElement>(null);

  const accent = teamColor(currentTeamRef);

  const metaText = [
    t('hero.label').toUpperCase(),
    nationality.toUpperCase(),
    code,
    number !== null ? `#${number}` : null,
  ].filter(Boolean).join(' · ');

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    document.fonts.ready.then(() => {
      if (!nameRef.current) return;
      fitToWidth(nameRef.current);
      cleanup = observeFit(nameRef.current);
    });
    return () => cleanup?.();
  }, [surname]);

  useEffect(() => {
    if (!motionOk) return;
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        if (!nameRef.current) return;

        // Timing-monitor meta line
        gsap.to(metaRef.current, {
          duration: 1.0,
          scrambleText: { text: metaText, chars: '0123456789·/|—', speed: 0.5 },
          ease: 'none',
        });

        // Lights out — surname rises from below the mask
        const split = new SplitText(nameRef.current, { type: 'chars' });
        gsap.set(nameRef.current, { visibility: 'visible' });
        gsap.from(split.chars, {
          yPercent: 110,
          duration: 1.0,
          stagger: { each: Math.min(0.04, 0.28 / split.chars.length) },
          ease: 'power4.out',
          delay: 0.15,
        });

        // Ghost number drifts in behind the name
        gsap.from('.driver-ghost-number', {
          xPercent: 10,
          autoAlpha: 0,
          duration: 1.4,
          ease: 'power3.out',
          delay: 0.35,
        });

        // Championship stars — lights out, one per title
        gsap.from('.champ-star', {
          yPercent: 120,
          autoAlpha: 0,
          duration: 0.5,
          stagger: 0.09,
          ease: 'power3.out',
          delay: 0.75,
        });

        // Career counters — gap closing
        const counters: Array<[HTMLElement | null, number, number]> = [
          [racesRef.current, races, 0.55],
          [winsRef.current, wins, 0.65],
          [podiumsRef.current, podiums, 0.75],
        ];
        for (const [el, target, delay] of counters) {
          if (!el) continue;
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target,
            duration: 1.6,
            ease: 'expo.out',
            delay,
            onUpdate() { el.textContent = String(Math.round(obj.v)); },
          });
        }
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, metaText, races, wins, podiums]);

  const counterCells: Array<{ label: string; value: number; ref: React.RefObject<HTMLParagraphElement | null>; red?: boolean }> = [
    { label: t('hero.races'),   value: races,   ref: racesRef },
    { label: t('hero.wins'),    value: wins,    ref: winsRef, red: wins > 0 },
    { label: t('hero.podiums'), value: podiums, ref: podiumsRef },
  ];

  return (
    <div ref={rootRef} className="border-b border-border relative overflow-hidden">

      {/* Ghost car number — team-tinted numeral behind the name */}
      {number !== null && (
        <span
          aria-hidden="true"
          className="driver-ghost-number absolute -top-6 right-0 leading-none tabular-nums select-none pointer-events-none z-0"
          style={{
            fontFamily: 'var(--pi-display)',
            fontSize: 'clamp(9rem, 26vw, 24rem)',
            letterSpacing: '-0.05em',
            color: accent,
            opacity: 0.08,
          }}
        >
          {number}
        </span>
      )}

      {/* ── Title card ────────────────────────────────────────── */}
      <div className="px-6 pt-8 pb-6 relative z-10">
        <p
          ref={metaRef}
          className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] mb-3"
        >
          {metaText}
        </p>

        <p className="font-mono text-[13px] text-text-2 uppercase tracking-[0.2em] mb-1">
          {forename}
        </p>

        <div className="kinetic-mask">
          <h1
            ref={nameRef}
            className="uppercase leading-none tracking-[-0.03em] text-text-1 whitespace-nowrap text-[clamp(3rem,14vw,10rem)]"
            style={{
              fontFamily: 'var(--pi-display)',
              visibility: motionOk ? 'hidden' : 'visible',
            }}
          >
            {surname}
          </h1>
        </div>

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <span
            aria-hidden="true"
            className="shrink-0"
            style={{ width: 42, height: 8, background: flagGradient(nationality) }}
          />
          <p className="font-mono text-[12px] text-text-2">
            {nationality}
            {dob && (
              <span className="text-text-3">
                {' · '}
                {format.dateTime(new Date(dob + 'T12:00:00'), { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </p>
          {championshipYears.length > 0 && (
            <p className="font-mono text-[12px] tracking-[0.06em] tabular-nums flex gap-3 flex-wrap">
              {championshipYears.map((y) => (
                <span key={y} className="champ-star inline-block" style={{ color: 'var(--gold)' }}>
                  ★ {y}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      {/* ── Career counter band — team hairline on top ────────── */}
      <div
        className="grid grid-cols-3 border-t border-border relative z-10"
        style={{ boxShadow: `inset 0 3px 0 0 ${accent}` }}
      >
        {counterCells.map(({ label, value, ref, red }, i) => (
          <div
            key={label}
            className={`flex flex-col items-start px-4 sm:px-6 py-5 sm:py-6 min-w-0${i > 0 ? ' border-l border-border' : ''}`}
          >
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] mb-2 truncate w-full">
              {label}
            </p>
            <p
              ref={ref}
              className="leading-none tabular-nums"
              style={{
                fontFamily: 'var(--pi-display)',
                fontSize: 'clamp(1.7rem, 6vw, 4.5rem)',
                color: red ? 'var(--red)' : 'var(--text-1)',
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
