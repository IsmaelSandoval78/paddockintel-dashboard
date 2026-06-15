'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { fitToWidth, observeFit } from '@/components/home/kinetic/fitText';

gsap.registerPlugin(SplitText, DrawSVGPlugin, ScrambleTextPlugin);

function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns} · ${Math.abs(lng).toFixed(2)}°${ew}`;
}

interface LastWinner {
  year: number;
  forename: string;
  surname: string;
  constructor: string;
}

interface CircuitHeroProps {
  name: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  standardLaps: number | null;
  rankLapRecord: { time: string; forename: string; surname: string; year: number } | null;
  firstYear: number | null;
  totalRaces: number;
  lastWinners: LastWinner[];
  trackPathData: { path: string; viewBox: string } | null;
  motionOk: boolean;
}

export default function CircuitHero({
  name, location, country, lat, lng,
  standardLaps, rankLapRecord,
  firstYear, totalRaces, lastWinners,
  trackPathData, motionOk,
}: CircuitHeroProps) {
  const t = useTranslations('circuitDetail');

  const rootRef      = useRef<HTMLDivElement>(null);
  const metaRef      = useRef<HTMLParagraphElement>(null);
  const nameRef      = useRef<HTMLHeadingElement>(null);
  const locationRef  = useRef<HTMLParagraphElement>(null);
  const statsRef     = useRef<HTMLDivElement>(null);
  const lapTimeRef   = useRef<HTMLSpanElement>(null);
  const firstYearRef = useRef<HTMLParagraphElement>(null);
  const totalRef     = useRef<HTMLParagraphElement>(null);
  const drawPathRef  = useRef<SVGPathElement>(null);

  // Fit circuit name to one line — layout concern regardless of motion
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    document.fonts.ready.then(() => {
      if (!nameRef.current) return;
      fitToWidth(nameRef.current);
      cleanup = observeFit(nameRef.current);
    });
    return () => cleanup?.();
  }, [name]);

  useEffect(() => {
    if (!motionOk) return;
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        if (!nameRef.current) return;

        // Meta tag: timing-screen scramble — scanning for circuit data
        gsap.to(metaRef.current, {
          duration: 1.0,
          scrambleText: {
            text: `${t('hero.label').toUpperCase()} · ${country.toUpperCase()}`,
            chars: '0123456789·/|—',
            speed: 0.5,
          },
          ease: 'none',
        });

        // Name: chars rise from below — lights going green
        const split = new SplitText(nameRef.current, { type: 'chars' });
        gsap.set(nameRef.current, { visibility: 'visible' });
        gsap.from(split.chars, {
          yPercent: 110,
          duration: 1.0,
          stagger: { each: Math.min(0.04, 0.28 / split.chars.length) },
          ease: 'power4.out',
          delay: 0.15,
        });

        // Location + stats strip
        gsap.fromTo(locationRef.current,
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', delay: 0.5 },
        );
        gsap.fromTo(statsRef.current,
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', delay: 0.65 },
        );

        // Lap record time: timing-display scramble
        if (lapTimeRef.current && rankLapRecord) {
          gsap.to(lapTimeRef.current, {
            duration: 0.9,
            scrambleText: { text: rankLapRecord.time, chars: '0123456789.:', speed: 0.7 },
            ease: 'none',
            delay: 0.8,
          });
        }

        // firstYear and totalRaces count up — like a race lap counter
        if (firstYearRef.current && firstYear !== null) {
          const start = Math.max(firstYear - 20, 1950);
          const obj = { v: start };
          gsap.to(obj, {
            v: firstYear,
            duration: 1.3,
            ease: 'expo.out',
            delay: 0.7,
            onUpdate() {
              if (firstYearRef.current) firstYearRef.current.textContent = String(Math.round(obj.v));
            },
          });
        }
        if (totalRef.current) {
          const obj = { v: 0 };
          gsap.to(obj, {
            v: totalRaces,
            duration: 1.4,
            ease: 'expo.out',
            delay: 0.75,
            onUpdate() {
              if (totalRef.current) totalRef.current.textContent = String(Math.round(obj.v));
            },
          });
        }

        // Track draw: the flying lap — circuit outline draws itself on load
        if (drawPathRef.current) {
          gsap.fromTo(drawPathRef.current,
            { drawSVG: '0%' },
            { drawSVG: '100%', duration: 2.0, ease: 'expo.inOut', delay: 0.55 },
          );
        }

        // Last winners slide in from left, staggered
        gsap.from('.circuit-winner-row', {
          x: -24,
          autoAlpha: 0,
          duration: 0.5,
          stagger: 0.07,
          ease: 'power3.out',
          delay: 0.9,
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, name, country, firstYear, totalRaces, rankLapRecord, t]);

  return (
    <div ref={rootRef} className="border-b border-border">

      {/* Name + location */}
      <div className="px-6 pt-8 pb-5">
        <p
          ref={metaRef}
          className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] mb-3"
        >
          {`${t('hero.label').toUpperCase()} · ${country.toUpperCase()}`}
        </p>

        {/* kinetic-mask: overflow-hidden so chars animate up from inside */}
        <div className="kinetic-mask">
          <h1
            ref={nameRef}
            className="text-[clamp(3rem,12vw,7rem)] uppercase leading-none tracking-[-0.03em] text-text-1 whitespace-nowrap"
            style={{
              fontFamily: 'var(--pi-display)',
              visibility: motionOk ? 'hidden' : 'visible',
            }}
          >
            {name}
          </h1>
        </div>

        <p ref={locationRef} className="font-mono text-[12px] text-text-2 mt-3 mb-0.5">
          {location} · {country}
        </p>
        <p className="font-mono text-[11px] text-text-3">
          {formatCoord(lat, lng)}
        </p>
      </div>

      {/* Meta strip: length / laps / lap record / DRS */}
      <div ref={statsRef} className="border-t border-border px-6 py-4 flex flex-wrap gap-x-10 gap-y-3">
        <div>
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-0.5">
            {t('hero.length')}
          </p>
          <p className="font-mono text-[13px] text-text-3 tabular-nums">—</p>
        </div>
        <div>
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-0.5">
            {t('hero.laps')}
          </p>
          <p className="font-mono text-[13px] text-text-1 tabular-nums">
            {standardLaps ?? '—'}
          </p>
        </div>
        {rankLapRecord && (
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-0.5">
              {t('hero.lapRecord')}
            </p>
            <p className="font-mono text-[13px] tabular-nums">
              <span ref={lapTimeRef} style={{ color: 'var(--red)' }}>
                {rankLapRecord.time}
              </span>
              <span className="text-text-3 ml-1.5">
                {rankLapRecord.forename[0]}. {rankLapRecord.surname}
              </span>
              <span className="text-text-3 ml-1.5">{rankLapRecord.year}</span>
            </p>
          </div>
        )}
        {!rankLapRecord && (
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-0.5">
              {t('hero.lapRecord')}
            </p>
            <p className="font-mono text-[13px] text-text-3 tabular-nums">—</p>
          </div>
        )}
        <div>
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-0.5">
            {t('hero.drsZones')}
          </p>
          <p className="font-mono text-[13px] text-text-3 tabular-nums">—</p>
        </div>
      </div>

      {/* Stats column + Track SVG */}
      <div className="flex flex-col md:flex-row border-t border-border">

        {/* Left: last winners + firstYear/totalRaces */}
        <div className="px-6 py-6 flex flex-col md:w-auto md:shrink-0">
          <div className="mb-6">
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-3">
              {t('hero.lastWinners')}
            </p>
            {lastWinners.length > 0 ? (
              <div>
                {lastWinners.map((w) => (
                  <div key={w.year} className="circuit-winner-row flex items-baseline gap-1.5 mb-2.5 last:mb-0">
                    <span className="font-mono text-[11px] text-text-2 tabular-nums shrink-0 w-9">
                      {w.year}
                    </span>
                    <span className="font-mono text-[10px] text-text-3 shrink-0">·</span>
                    <span
                      className="text-[13px] text-text-1 uppercase tracking-[0.02em] shrink-0"
                      style={{ fontFamily: 'var(--pi-display)' }}
                    >
                      {w.forename[0]}. {w.surname}
                    </span>
                    <span className="font-mono text-[10px] text-text-3 shrink-0">·</span>
                    <span className="text-[12px] text-text-2 truncate min-w-0">
                      {w.constructor}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="font-mono text-[13px] text-text-3">—</span>
            )}
          </div>

          {/* firstYear + totalRaces — large kinetic numbers */}
          <div className="flex items-end gap-12 mt-auto">
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('hero.firstRace')}
              </p>
              <p
                ref={firstYearRef}
                className="text-[56px] text-text-1 leading-none tabular-nums"
                style={{ fontFamily: 'var(--pi-display)' }}
              >
                {firstYear ?? '—'}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('hero.totalRaces')}
              </p>
              <p
                ref={totalRef}
                className="text-[56px] text-text-1 leading-none tabular-nums"
                style={{ fontFamily: 'var(--pi-display)' }}
              >
                {totalRaces}
              </p>
            </div>
          </div>
        </div>

        {/* Right: TrackDraw SVG */}
        <div className="md:ml-auto md:border-l border-border px-6 py-6 w-full md:w-[280px] lg:w-[340px] shrink-0">
          {trackPathData ? (
            <div
              className="w-full aspect-square border border-border"
              style={{ background: 'var(--bg)' }}
            >
              <svg
                viewBox={trackPathData.viewBox}
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full block"
                role="img"
                aria-label={`Track map — ${name}`}
                style={{ padding: '8px' }}
              >
                {/* Ghost outline: always visible */}
                <path
                  d={trackPathData.path}
                  stroke="var(--border-subtle)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Animated draw path — DrawSVG starts at 0% and animates to 100% */}
                <path
                  ref={drawPathRef}
                  d={trackPathData.path}
                  stroke="var(--text-1)"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : (
            <div
              className="w-full aspect-square border border-border flex items-center justify-center"
              style={{ background: 'var(--bg)' }}
              aria-label={`Track map unavailable — ${name}`}
            >
              <span className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">
                [ TRACK MAP NOT YET AVAILABLE ]
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
