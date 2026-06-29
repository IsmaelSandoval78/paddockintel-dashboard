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
  const lapTimeRef   = useRef<HTMLSpanElement>(null);
  const firstYearRef = useRef<HTMLParagraphElement>(null);
  const totalRef     = useRef<HTMLParagraphElement>(null);
  const drawPathRef  = useRef<SVGPathElement>(null);

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

        gsap.to(metaRef.current, {
          duration: 1.0,
          scrambleText: {
            text: `${t('hero.label').toUpperCase()} · ${country.toUpperCase()}`,
            chars: '0123456789·/|—',
            speed: 0.5,
          },
          ease: 'none',
        });

        const split = new SplitText(nameRef.current, { type: 'chars' });
        gsap.set(nameRef.current, { visibility: 'visible' });
        gsap.from(split.chars, {
          yPercent: 110,
          duration: 1.0,
          stagger: { each: Math.min(0.04, 0.28 / split.chars.length) },
          ease: 'power4.out',
          delay: 0.15,
        });

        if (lapTimeRef.current && rankLapRecord) {
          gsap.to(lapTimeRef.current, {
            duration: 0.9,
            scrambleText: { text: rankLapRecord.time, chars: '0123456789.:', speed: 0.7 },
            ease: 'none',
            delay: 0.8,
          });
        }

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

        if (drawPathRef.current) {
          gsap.fromTo(drawPathRef.current,
            { drawSVG: '0%' },
            { drawSVG: '100%', duration: 2.0, ease: 'expo.inOut', delay: 0.55 },
          );
        }

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

      {/* ── Meta + Circuit name ──────────────────────────── */}
      <div className="px-6 pt-8 pb-6 border-b border-border">
        <p
          ref={metaRef}
          className="font-mono text-[11px] text-text-3 uppercase tracking-[0.06em] mb-3"
        >
          {`${t('hero.label').toUpperCase()} · ${country.toUpperCase()}`}
        </p>
        <div className="kinetic-mask">
          <h1
            ref={nameRef}
            className="uppercase leading-none tracking-[-0.03em] text-text-1 whitespace-nowrap"
            style={{
              fontFamily: 'var(--pi-display)',
              fontSize: 'clamp(3rem, 12vw, 7rem)',
              visibility: motionOk ? 'hidden' : 'visible',
            }}
          >
            {name}
          </h1>
        </div>
        <p className="font-mono text-[12px] text-text-2 mt-3">
          {location} · {country}
          <span className="text-text-3 ml-3 hidden sm:inline">{formatCoord(lat, lng)}</span>
        </p>
      </div>

      {/* ── Middle: winners left | track map right ───────── */}
      <div className="flex flex-col md:flex-row border-b border-border">

        {/* Left column — last winners + counters */}
        <div className="flex-1 flex flex-col px-6 py-6 md:border-r border-border">

          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-5">
            {t('hero.lastWinners')}
          </p>

          {lastWinners.length > 0 ? (
            <div className="flex flex-col gap-4 mb-auto">
              {lastWinners.map((w) => (
                <div key={w.year} className="circuit-winner-row flex items-center gap-4">
                  <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0 w-9 leading-none">
                    {w.year}
                  </span>
                  <p
                    className="uppercase leading-none tracking-[-0.02em] text-text-1 shrink-0"
                    style={{
                      fontFamily: 'var(--pi-display)',
                      fontSize: 'clamp(1.4rem, 2.8vw, 2rem)',
                    }}
                  >
                    {w.forename[0]}. {w.surname}
                  </p>
                  <span className="font-mono text-[11px] text-text-3 min-w-0 truncate">
                    {w.constructor}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="font-mono text-[13px] text-text-3 mb-auto">—</span>
          )}

          {/* First Race + Total Races */}
          <div className="flex items-end gap-12 pt-6 mt-6 border-t border-border">
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('hero.firstRace')}
              </p>
              <p
                ref={firstYearRef}
                className="leading-none tabular-nums text-text-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2.8rem, 6vw, 4rem)' }}
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
                className="leading-none tabular-nums text-text-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2.8rem, 6vw, 4rem)' }}
              >
                {totalRaces}
              </p>
            </div>
          </div>
        </div>

        {/* Right column — dark track SVG panel, full height */}
        <div
          className="md:w-[360px] lg:w-[460px] xl:w-[520px] shrink-0 flex flex-col min-h-[280px] md:min-h-0"
          style={{ background: 'var(--text-1)' }}
        >
          {trackPathData ? (
            <div className="flex-1 flex flex-col p-8">
              <svg
                viewBox={trackPathData.viewBox}
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full block flex-1"
                role="img"
                aria-label={`Track map — ${name}`}
              >
                <path
                  d={trackPathData.path}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  ref={drawPathRef}
                  d={trackPathData.path}
                  stroke="var(--red)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p
                className="font-mono text-[9px] uppercase tracking-[0.14em] mt-4 shrink-0"
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
                TRACK MAP · {name.toUpperCase()}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span
                className="font-mono text-[11px] uppercase tracking-[0.1em]"
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
                [ NO TRACK DATA ]
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ── Bottom strip: laps · lap record · DRS ────────── */}
      <div className="flex flex-wrap items-end gap-x-10 gap-y-3 px-6 py-5">
        <div>
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
            {t('hero.laps')}
          </p>
          <p
            className="leading-none tabular-nums text-text-1"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}
          >
            {standardLaps ?? '—'}
          </p>
        </div>

        {rankLapRecord ? (
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('hero.lapRecord')}
            </p>
            <p className="font-mono leading-none tabular-nums" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
              <span ref={lapTimeRef} style={{ color: 'var(--red)' }}>
                {rankLapRecord.time}
              </span>
              <span className="font-mono text-[12px] text-text-3 ml-2">
                {rankLapRecord.forename[0]}. {rankLapRecord.surname}
              </span>
              <span className="font-mono text-[12px] text-text-3 ml-1.5">{rankLapRecord.year}</span>
            </p>
          </div>
        ) : (
          <div>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
              {t('hero.lapRecord')}
            </p>
            <p className="font-mono text-text-3 tabular-nums" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>—</p>
          </div>
        )}

        <div>
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
            {t('hero.drsZones')}
          </p>
          <p
            className="leading-none tabular-nums text-text-3"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}
          >
            —
          </p>
        </div>
      </div>

    </div>
  );
}
