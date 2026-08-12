'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { teamColor } from './teamColors';
import type { HomeDriverRow } from '@/lib/types';

gsap.registerPlugin(SplitText, ScrambleTextPlugin);

const WarpField = dynamic(() => import('./WarpField'), { ssr: false });

interface HeroProps {
  leader: HomeDriverRow;
  round: number;
  year: number;
  motionOk: boolean;
  isMobile: boolean;
}

export default function Hero({ leader, round, year, motionOk, isMobile }: HeroProps) {
  const t = useTranslations('hub');
  const rootRef      = useRef<HTMLElement>(null);
  const metaRef      = useRef<HTMLParagraphElement>(null);
  const taglineRef   = useRef<HTMLParagraphElement>(null);
  const numberRef    = useRef<HTMLSpanElement>(null);
  const surnameRef   = useRef<HTMLHeadingElement>(null);
  const constructorRef = useRef<HTMLParagraphElement>(null);
  const statsRef     = useRef<HTMLDivElement>(null);
  const ptsRef       = useRef<HTMLSpanElement>(null);
  const winsRef      = useRef<HTMLSpanElement>(null);
  const polesRef     = useRef<HTMLSpanElement>(null);
  const cueRef       = useRef<HTMLDivElement>(null);

  const color = teamColor(leader.constructor_ref);
  const metaText = `F1 INTELLIGENCE · ${year} CHAMPIONSHIP · RD.${String(round).padStart(2, '0')}`;
  const leaderNumber = leader.number ?? leader.position;

  useEffect(() => {
    if (!motionOk) return;
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        if (!surnameRef.current) return;

        // Meta line — timing-monitor scramble
        gsap.to(metaRef.current, {
          duration: 1.1,
          scrambleText: { text: metaText, chars: '0123456789·/|', speed: 0.4 },
          ease: 'none',
        });

        // Car number — swells in at ghost opacity
        gsap.fromTo(numberRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 0.22, scale: 1, duration: 1.4, ease: 'power3.out', delay: 0.3 },
        );

        // Tagline rises — the "why" registers before the "who"
        gsap.fromTo(taglineRef.current,
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', delay: 0.05 },
        );

        // Constructor name rises
        gsap.fromTo(constructorRef.current,
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', delay: 0.1 },
        );

        // Surname — chars rise from below kinetic-mask
        const split = new SplitText(surnameRef.current, { type: 'chars' });
        gsap.set(split.chars, { yPercent: 110 });
        gsap.set(surnameRef.current, { opacity: 1 });
        gsap.to(split.chars, {
          yPercent: 0,
          duration: 1.0,
          stagger: { each: Math.min(0.035, 0.26 / split.chars.length) },
          ease: 'power4.out',
          delay: 0.18,
        });

        // Stats rise + counters close the gap
        gsap.fromTo(statsRef.current,
          { y: 28, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', delay: 0.55 },
        );
        const nums = { pts: 0, wins: 0, poles: 0 };
        gsap.to(nums, {
          pts:   leader.points,
          wins:  leader.wins,
          poles: leader.poles_2026,
          duration: 1.8,
          ease: 'expo.out',
          delay: 0.6,
          onUpdate() {
            if (ptsRef.current)   ptsRef.current.textContent   = String(Math.round(nums.pts));
            if (winsRef.current)  winsRef.current.textContent  = String(Math.round(nums.wins));
            if (polesRef.current) polesRef.current.textContent = String(Math.round(nums.poles));
          },
        });

        // Scroll cue — looping descent
        gsap.fromTo(cueRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, delay: 1.25 });
        gsap.to('.hero-cue-line', {
          scaleY: 1,
          transformOrigin: 'top',
          duration: 1.2,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true,
        });
      });
    }, rootRef);
    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionOk]);

  // Mouse parallax — surname layer and stats layer (desktop only)
  useEffect(() => {
    if (!motionOk || isMobile) return;
    const xTitle = gsap.quickTo(surnameRef.current, 'x', { duration: 0.9, ease: 'power2.out' });
    const yTitle = gsap.quickTo(surnameRef.current, 'y', { duration: 0.9, ease: 'power2.out' });
    const xStats = gsap.quickTo(statsRef.current,   'x', { duration: 0.9, ease: 'power2.out' });
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      xTitle(nx * -18);
      yTitle(ny * -8);
      xStats(nx * -7);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [motionOk, isMobile]);

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden flex flex-col"
      style={{ minHeight: '72svh' }}
    >
      {motionOk && <WarpField teamColor={color} density={isMobile ? 100 : 320} />}

      {/* Team hairline */}
      <div className="absolute top-0 left-0 right-0 h-px z-10" style={{ backgroundColor: color }} />

      <div className="relative z-10 flex flex-col flex-1 px-5 md:px-10 pt-6 pb-8">

        {/* Meta — scrambles in like a timing monitor */}
        <div className="flex items-center justify-between shrink-0">
          <p
            ref={metaRef}
            className="font-mono text-[9px] md:text-[10px] text-text-2 uppercase tracking-[0.18em]"
          >
            {motionOk ? '' : metaText}
          </p>
          <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.12em] hidden sm:flex items-center gap-1.5">
            <span className="pulse-red inline-block w-1.5 h-1.5 rounded-full bg-red" />
            LIVE
          </span>
        </div>

        {/* Tagline — the product promise, ahead of any single driver's stats */}
        <p
          ref={taglineRef}
          className="font-sans text-text-1 mt-3 max-w-[36ch]"
          style={{
            fontSize: 'clamp(14px, 1.6vw, 18px)',
            lineHeight: 1.4,
            opacity: motionOk ? 0 : 1,
          }}
        >
          {t('tagline')}
        </p>

        {/* Two-column layout: number left, name + stats right */}
        <div className="flex-1 flex items-center gap-0 mt-4">

          {/* Left column — car number (ghost, team colour) */}
          <div
            className="flex items-center justify-center shrink-0 pointer-events-none select-none"
            style={{ width: 'clamp(72px, 20vw, 220px)' }}
            aria-hidden="true"
          >
            <span
              ref={numberRef}
              className="tabular-nums leading-none"
              style={{
                fontFamily:    'var(--pi-display)',
                fontSize:      'clamp(80px, 18vw, 260px)',
                letterSpacing: '-0.06em',
                color:         color,
                opacity:       motionOk ? 0 : 0.22,
              }}
            >
              {leaderNumber}
            </span>
          </div>

          {/* Vertical divider */}
          <div
            className="self-stretch shrink-0"
            style={{ width: '1px', background: 'var(--border)' }}
          />

          {/* Right column — name block + stats */}
          <div className="flex-1 min-w-0 flex flex-col justify-center pl-6 md:pl-10">

            {/* Surname + Constructor — same line */}
            <div className="flex items-baseline justify-between gap-3 min-w-0">
              <div className="kinetic-mask -my-[0.06em] py-[0.06em] min-w-0">
                <h1
                  ref={surnameRef}
                  className="uppercase leading-[0.85] whitespace-nowrap will-change-transform"
                  style={{
                    fontFamily:    'var(--pi-display)',
                    fontSize:      'clamp(40px, 8vw, 130px)',
                    letterSpacing: '-0.04em',
                    color:         'var(--text-1)',
                    opacity:       motionOk ? 0 : 1,
                  }}
                >
                  {leader.surname}
                </h1>
              </div>
              <p
                ref={constructorRef}
                className="font-mono uppercase tracking-[0.16em] text-text-2 shrink-0 hidden sm:block"
                style={{
                  fontSize: 'clamp(9px, 1vw, 12px)',
                  opacity: motionOk ? 0 : 1,
                }}
              >
                {leader.constructor_name}
              </p>
            </div>

            {/* Nationality */}
            <p
              className="font-mono text-[9px] text-text-3 uppercase tracking-[0.18em] mt-2"
            >
              {leader.nationality}
            </p>

            {/* Stats band */}
            <div
              ref={statsRef}
              className="flex items-end gap-6 md:gap-10 mt-5 md:mt-6 pt-4 md:pt-5 will-change-transform"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <div>
                <span
                  ref={ptsRef}
                  className="tabular-nums leading-none block"
                  style={{
                    fontFamily:    'var(--pi-display)',
                    fontSize:      'clamp(32px, 5vw, 72px)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {leader.points}
                </span>
                <span className="font-mono text-[8px] md:text-[9px] text-text-3 uppercase tracking-[0.2em] mt-1.5 block">
                  PTS
                </span>
              </div>

              <div>
                <span
                  ref={winsRef}
                  className="tabular-nums leading-none block"
                  style={{
                    fontFamily:    'var(--pi-display)',
                    fontSize:      'clamp(32px, 5vw, 72px)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {leader.wins}
                </span>
                <span className="font-mono text-[8px] md:text-[9px] text-text-3 uppercase tracking-[0.2em] mt-1.5 block">
                  WINS
                </span>
              </div>

              <div>
                <span
                  ref={polesRef}
                  className="tabular-nums leading-none block"
                  style={{
                    fontFamily:    'var(--pi-display)',
                    fontSize:      'clamp(32px, 5vw, 72px)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {leader.poles_2026}
                </span>
                <span className="font-mono text-[8px] md:text-[9px] text-text-3 uppercase tracking-[0.2em] mt-1.5 block">
                  POLES
                </span>
              </div>

              <div className="ml-auto hidden md:flex flex-col items-end gap-1 pb-1">
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.16em] px-2 py-1 leading-none"
                  style={{ background: color, color: 'var(--bg)' }}
                >
                  P1 · CHAMPIONSHIP LEADER
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        ref={cueRef}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-2 hidden md:flex"
        style={{ opacity: motionOk ? 0 : 1 }}
      >
        <div className="w-px h-8 overflow-hidden">
          <div className="hero-cue-line w-px h-full bg-red" style={{ transform: 'scaleY(0.2)' }} />
        </div>
      </div>
    </section>
  );
}
