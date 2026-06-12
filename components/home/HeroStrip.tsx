'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import dynamic from 'next/dynamic';

gsap.registerPlugin(SplitText);

const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });

// Darkened for visibility on light (#EAE8E3) background
const TEAM_COLORS: Record<string, string> = {
  mercedes:     '#00B8A8',
  mclaren:      '#E57700',
  red_bull:     '#2A5DB0',
  ferrari:      '#D00020',
  alpine:       '#C04080',
  aston_martin: '#2D7A65',
  haas:         '#6A6E70',
  williams:     '#2A7CB0',
  sauber:       '#259825',
  kick_sauber:  '#259825',
  rb:           '#3A5EC4',
  alphatauri:   '#3A5EC4',
};

interface HeroStripProps {
  forename: string;
  surname: string;
  constructor_ref: string;
  constructor_name: string;
  points: number;
  wins: number;
  round: number;
  year: number;
  raceName: string;
}

export default function HeroStrip({
  forename, surname, constructor_ref, constructor_name,
  points, wins, round, year, raceName,
}: HeroStripProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const forenameRef   = useRef<HTMLParagraphElement>(null);
  const titleRef      = useRef<HTMLHeadingElement>(null);
  const statsRef      = useRef<HTMLDivElement>(null);
  const metaRef       = useRef<HTMLDivElement>(null);

  const [displayPoints, setDisplayPoints] = useState(0);
  const [displayWins,   setDisplayWins]   = useState(0);

  const teamColor = TEAM_COLORS[constructor_ref] ?? '#C0000A';

  // ── Mount animation + GSAP counters ─────────────────────────────
  useEffect(() => {
    if (!titleRef.current || !forenameRef.current || !statsRef.current || !metaRef.current) return;

    const ctx = gsap.context(() => {
      // Meta row fades in
      gsap.from(metaRef.current, {
        y: -12, opacity: 0,
        duration: 0.5, ease: 'power3.out', delay: 0,
      });

      // Forename rises gently
      gsap.from(forenameRef.current, {
        y: 16, opacity: 0,
        duration: 0.6, ease: 'power3.out', delay: 0.1,
      });

      // Surname: per-character stagger reveal
      const split = new SplitText(titleRef.current!, { type: 'chars' });
      gsap.from(split.chars, {
        y: 72,
        opacity: 0,
        stagger: 0.04,
        duration: 1.0,
        ease: 'power4.out',
        delay: 0.2,
      });

      // Stats row rises after surname settles
      gsap.from(statsRef.current, {
        y: 20, opacity: 0,
        duration: 0.7, ease: 'power3.out', delay: 0.65,
      });

      // Dramatic number counters
      const obj = { pts: 0, w: 0 };
      gsap.to(obj, {
        pts: points, w: wins,
        duration: 1.8,
        ease: 'expo.out',
        delay: 0.7,
        onUpdate() {
          setDisplayPoints(Math.round(obj.pts));
          setDisplayWins(Math.round(obj.w));
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [points, wins, surname]);

  // ── Multi-layer mouse parallax ───────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth  - 0.5) * 2; // -1..1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2; // -1..1

      // Surname: deepest layer — most movement
      if (titleRef.current) {
        gsap.to(titleRef.current, {
          x: nx * -14, y: ny * -7,
          duration: 0.9, ease: 'power2.out', overwrite: 'auto',
        });
      }
      // Forename: mid layer
      if (forenameRef.current) {
        gsap.to(forenameRef.current, {
          x: nx * -8, y: ny * -4,
          duration: 0.9, ease: 'power2.out', overwrite: 'auto',
        });
      }
      // Stats: shallowest text layer
      if (statsRef.current) {
        gsap.to(statsRef.current, {
          x: nx * -5, y: ny * -2.5,
          duration: 0.9, ease: 'power2.out', overwrite: 'auto',
        });
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden border-b border-border"
      style={{ background: 'var(--surface-raised)', minHeight: '54vh' }}
    >
      {/* Three.js particle field */}
      <HeroScene teamColor={teamColor} />

      {/* Team color hairline at top */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: teamColor }} />

      {/* Content — z-10 sits above canvas */}
      <div className="relative z-10 flex flex-col h-full px-6 md:px-10 pt-6 pb-7" style={{ minHeight: '54vh' }}>

        {/* ── Meta row ─────────────────────────────────────────── */}
        <div ref={metaRef} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[9px] uppercase tracking-[0.16em] px-2 py-0.5 leading-none"
              style={{ background: teamColor, color: '#fff' }}
            >
              P1
            </span>
            <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.12em]">
              {year} · {constructor_name}
            </span>
          </div>
          <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.1em] hidden sm:block">
            RD.{String(round).padStart(2, '0')} · {raceName}
          </span>
        </div>

        {/* ── Name block ───────────────────────────────────────── */}
        <div className="mt-auto">
          <p
            ref={forenameRef}
            className="font-mono uppercase tracking-[0.22em] mb-1 will-change-transform"
            style={{ fontSize: 'clamp(9px, 1.1vw, 13px)', color: 'var(--text-3)' }}
          >
            {forename}
          </p>
          <h1
            ref={titleRef}
            className="uppercase leading-none will-change-transform"
            style={{
              fontFamily:    'var(--pi-display)',
              fontSize:      'clamp(68px, 13.5vw, 168px)',
              letterSpacing: '-0.03em',
              color:         'var(--text-1)',
            }}
          >
            {surname}
          </h1>
        </div>

        {/* ── Stats row ────────────────────────────────────────── */}
        <div
          ref={statsRef}
          className="flex items-end gap-6 md:gap-10 pt-5 mt-4 will-change-transform"
          style={{ borderTop: `1px solid var(--border-subtle)` }}
        >
          {/* Points */}
          <div className="flex flex-col">
            <span
              className="tabular-nums leading-none"
              style={{
                fontFamily:    'var(--pi-display)',
                fontSize:      'clamp(36px, 5.5vw, 64px)',
                letterSpacing: '-0.03em',
                color:         'var(--text-1)',
              }}
            >
              {displayPoints}
            </span>
            <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.16em] mt-1.5">
              PTS
            </span>
          </div>

          <div className="w-px h-10 self-start mt-1" style={{ backgroundColor: 'var(--border-subtle)' }} />

          {/* Wins */}
          <div className="flex flex-col">
            <span
              className="tabular-nums leading-none"
              style={{
                fontFamily:    'var(--pi-display)',
                fontSize:      'clamp(36px, 5.5vw, 64px)',
                letterSpacing: '-0.03em',
                color:         'var(--text-1)',
              }}
            >
              {displayWins}
            </span>
            <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.16em] mt-1.5">
              WINS
            </span>
          </div>

          {/* Wordmark — right-aligned, desktop only */}
          <div className="hidden md:block ml-auto self-end pb-0.5">
            <span className="font-mono text-[8px] text-text-3 uppercase tracking-[0.14em]">
              CHAMPIONSHIP LEADER · F1 WORLD CHAMPIONSHIP {year}
            </span>
          </div>
        </div>

      </div>

      {/* Team color left accent bar (subtle, 3px) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: teamColor }}
      />
    </div>
  );
}
