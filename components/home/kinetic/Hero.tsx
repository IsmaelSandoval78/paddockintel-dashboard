'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { teamColor } from './teamColors';
import { fitToWidth, observeFit } from './fitText';
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
  const rootRef     = useRef<HTMLElement>(null);
  const metaRef     = useRef<HTMLParagraphElement>(null);
  const numberRef   = useRef<HTMLSpanElement>(null);
  const forenameRef = useRef<HTMLParagraphElement>(null);
  const surnameRef  = useRef<HTMLHeadingElement>(null);
  const ptsRef      = useRef<HTMLSpanElement>(null);
  const winsRef     = useRef<HTMLSpanElement>(null);
  const statsRef    = useRef<HTMLDivElement>(null);
  const cueRef      = useRef<HTMLDivElement>(null);

  const color = teamColor(leader.constructor_ref);
  const metaText = `F1 INTELLIGENCE · ${year} CHAMPIONSHIP · RD.${String(round).padStart(2, '0')}`;
  const leaderNumber = leader.number ?? leader.position;

  // Fit surname to one line — layout concern, runs regardless of motion
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    document.fonts.ready.then(() => {
      if (!surnameRef.current) return;
      fitToWidth(surnameRef.current);
      cleanup = observeFit(surnameRef.current);
    });
    return () => cleanup?.();
  }, [leader.surname]);

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

        // Championship number — swells in at low opacity
        gsap.fromTo(numberRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 0.22, scale: 1, duration: 1.4, ease: 'power3.out', delay: 0.3 },
        );

        // Forename rises
        gsap.fromTo(forenameRef.current,
          { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', delay: 0.1 },
        );

        // Surname — lights out, one char at a time.
        // Total lead-in capped so long names don't drag.
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
        const nums = { pts: 0, wins: 0 };
        gsap.to(nums, {
          pts: leader.points,
          wins: leader.wins,
          duration: 1.8,
          ease: 'expo.out',
          delay: 0.6,
          onUpdate() {
            if (ptsRef.current)  ptsRef.current.textContent  = String(Math.round(nums.pts));
            if (winsRef.current) winsRef.current.textContent = String(Math.round(nums.wins));
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

  // Multi-layer mouse parallax — deepest layer moves most (desktop only)
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
        <div className="flex items-center justify-between">
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

        {/* Car number — occupies centre space, team colour at low opacity */}
        <div
          className="flex-1 flex items-center justify-center pointer-events-none select-none"
          aria-hidden="true"
        >
          <span
            ref={numberRef}
            className="tabular-nums leading-none"
            style={{
              fontFamily:    'var(--pi-display)',
              fontSize:      'clamp(96px, 24vw, 340px)',
              letterSpacing: '-0.06em',
              color:         color,
              opacity:       motionOk ? 0 : 0.22,
            }}
          >
            {leaderNumber}
          </span>
        </div>

        {/* Name block */}
        <div>
          <p
            ref={forenameRef}
            className="font-mono uppercase tracking-[0.3em] mb-2 text-text-2"
            style={{ fontSize: 'clamp(10px, 1.4vw, 15px)' }}
          >
            {leader.forename} · {leader.constructor_name}
          </p>
          <div className="kinetic-mask -my-[0.06em] py-[0.06em]">
            <h1
              ref={surnameRef}
              className="uppercase leading-[0.85] whitespace-nowrap will-change-transform"
              style={{
                fontFamily:    'var(--pi-display)',
                fontSize:      'clamp(64px, 17vw, 250px)',
                letterSpacing: '-0.04em',
                color:         'var(--text-1)',
                opacity:       motionOk ? 0 : 1,
              }}
            >
              {leader.surname}
            </h1>
          </div>
        </div>

        {/* Stats band */}
        <div
          ref={statsRef}
          className="flex items-end gap-8 md:gap-14 mt-6 md:mt-8 pt-5 will-change-transform"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div>
            <span
              ref={ptsRef}
              className="tabular-nums leading-none block"
              style={{
                fontFamily:    'var(--pi-display)',
                fontSize:      'clamp(40px, 7vw, 88px)',
                letterSpacing: '-0.03em',
              }}
            >
              {leader.points}
            </span>
            <span className="font-mono text-[8px] md:text-[9px] text-text-3 uppercase tracking-[0.2em] mt-1.5 block">
              POINTS
            </span>
          </div>

          <div>
            <span
              ref={winsRef}
              className="tabular-nums leading-none block"
              style={{
                fontFamily:    'var(--pi-display)',
                fontSize:      'clamp(40px, 7vw, 88px)',
                letterSpacing: '-0.03em',
              }}
            >
              {leader.wins}
            </span>
            <span className="font-mono text-[8px] md:text-[9px] text-text-3 uppercase tracking-[0.2em] mt-1.5 block">
              WINS
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
