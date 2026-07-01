'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { fitToWidth, observeFit } from '@/components/home/kinetic/fitText';
import type { CircuitCorner } from '@/lib/types';

gsap.registerPlugin(SplitText, DrawSVGPlugin, ScrambleTextPlugin);

// ─── Flag colors by country ──────────────────────────────────────
const FLAG_COLORS: Record<string, string[]> = {
  'Austria':          ['#ED2939', '#FFFFFF', '#ED2939'],
  'Italy':            ['#009246', '#FFFFFF', '#CE2B37'],
  'UK':               ['#012169', '#C8102E', '#FFFFFF'],
  'United Kingdom':   ['#012169', '#C8102E', '#FFFFFF'],
  'Great Britain':    ['#012169', '#C8102E', '#FFFFFF'],
  'Monaco':           ['#CE1126', '#FFFFFF', '#CE1126'],
  'Spain':            ['#AA151B', '#F1BF00', '#AA151B'],
  'Brazil':           ['#009C3B', '#FFDF00', '#009C3B'],
  'USA':              ['#BF0A30', '#FFFFFF', '#002868'],
  'United States':    ['#BF0A30', '#FFFFFF', '#002868'],
  'Japan':            ['#FFFFFF', '#BC002D', '#FFFFFF'],
  'Singapore':        ['#EF3340', '#FFFFFF', '#EF3340'],
  'Australia':        ['#012169', '#CC0000', '#FFFFFF'],
  'Canada':           ['#FF0000', '#FFFFFF', '#FF0000'],
  'Mexico':           ['#006847', '#FFFFFF', '#CE1126'],
  'France':           ['#002395', '#FFFFFF', '#ED2939'],
  'Germany':          ['#555555', '#DD0000', '#FFCE00'],
  'Hungary':          ['#CE2939', '#FFFFFF', '#477050'],
  'Belgium':          ['#444444', '#FAE042', '#EF3340'],
  'Netherlands':      ['#AE1C28', '#FFFFFF', '#21468B'],
  'Saudi Arabia':     ['#006C35', '#FFFFFF', '#006C35'],
  'UAE':              ['#009A44', '#FFFFFF', '#EF3340'],
  'United Arab Emirates': ['#009A44', '#FFFFFF', '#EF3340'],
  'China':            ['#DE2910', '#FFDE00', '#DE2910'],
  'Bahrain':          ['#CE1126', '#FFFFFF', '#CE1126'],
  'Azerbaijan':       ['#0092BC', '#EF3340', '#00B050'],
  'Argentina':        ['#74ACDF', '#FFFFFF', '#74ACDF'],
  'South Africa':     ['#007A4D', '#FFB81C', '#DE3831'],
  'Portugal':         ['#006600', '#FFFFFF', '#FF0000'],
  'Sweden':           ['#006AA7', '#FECC02', '#006AA7'],
  'Switzerland':      ['#FF0000', '#FFFFFF', '#FF0000'],
  'Morocco':          ['#C1272D', '#006233', '#C1272D'],
  'Turkey':           ['#E30A17', '#FFFFFF', '#E30A17'],
  'Korea':            ['#FFFFFF', '#003478', '#FFFFFF'],
  'India':            ['#FF9933', '#FFFFFF', '#138808'],
  'Russia':           ['#FFFFFF', '#0039A6', '#D52B1E'],
  'Qatar':            ['#8D1B3D', '#FFFFFF', '#8D1B3D'],
};

function getFlagColors(country: string): string[] {
  return FLAG_COLORS[country] ?? ['#E61919', '#FFFFFF', '#E61919'];
}

// ─────────────────────────────────────────────────────────────────

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
  corners: CircuitCorner[];
  motionOk: boolean;
}

export default function CircuitHero({
  name, location, country, lat, lng,
  standardLaps, rankLapRecord,
  firstYear, totalRaces, lastWinners,
  trackPathData, corners, motionOk,
}: CircuitHeroProps) {
  const t = useTranslations('circuitDetail');

  const rootRef      = useRef<HTMLDivElement>(null);
  const metaRef      = useRef<HTMLParagraphElement>(null);
  const nameRef      = useRef<HTMLHeadingElement>(null);
  const lapTimeRef   = useRef<HTMLParagraphElement>(null);
  const firstYearRef = useRef<HTMLParagraphElement>(null);
  const totalRef     = useRef<HTMLParagraphElement>(null);
  const drawPathRef  = useRef<SVGPathElement>(null);

  const [markerPoints, setMarkerPoints] = useState<{ x: number; y: number }[]>([]);
  const [hoveredCorner, setHoveredCorner] = useState<number | null>(null);

  const cornersWithPercent = corners.filter(c => c.path_percent !== null);
  const activeCorner = hoveredCorner !== null ? cornersWithPercent[hoveredCorner] : null;
  const drsCount = corners.length > 0 ? corners.filter(c => c.is_drs_zone).length : null;

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

  // Compute SVG corner marker positions using path.getPointAtLength().
  // Cannot use drawPathRef because GSAP DrawSVGPlugin adds vector-effect:non-scaling-stroke
  // to that element, which causes getTotalLength() to return 0 when the SVG is CSS-scaled.
  // Instead, measure a temporary off-screen path with only the d attribute.
  useEffect(() => {
    if (!trackPathData || cornersWithPercent.length === 0) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svgEl = document.createElementNS(ns, 'svg');
    svgEl.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden';
    const pathEl = document.createElementNS(ns, 'path');
    pathEl.setAttribute('d', trackPathData.path);
    svgEl.appendChild(pathEl);
    document.body.appendChild(svgEl);
    const totalLen = pathEl.getTotalLength();
    if (totalLen > 0) {
      const points = cornersWithPercent.map(c => {
        const pt = pathEl.getPointAtLength((c.path_percent! / 100) * totalLen);
        return { x: pt.x, y: pt.y };
      });
      setMarkerPoints(points);
    }
    document.body.removeChild(svgEl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corners, trackPathData]);

  // Staggered marker appearance after DrawSVG finishes (2.55s total)
  useEffect(() => {
    if (!motionOk || markerPoints.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.corner-marker',
        { scale: 0, autoAlpha: 0, transformOrigin: 'center center' },
        { scale: 1, autoAlpha: 1, duration: 0.2, stagger: 0.04, ease: 'power2.out', delay: 2.6 },
      );
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, markerPoints]);

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
      <div className="flex flex-col md:flex-row">

        {/* Left section — 3 sub-columns: winners | primera+total | vueltas+record+drs */}
        <div className="flex-1 flex flex-col md:flex-row md:border-r border-border divide-y md:divide-y-0 md:divide-x divide-border">

          {/* Sub-col 1 — últimos ganadores */}
          <div className="md:w-[38%] flex flex-col px-6 py-6">
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-5">
              {t('hero.lastWinners')}
            </p>
            {lastWinners.length > 0 ? (
              <div className="flex flex-col gap-4">
                {lastWinners.map((w) => (
                  <div key={w.year} className="circuit-winner-row flex items-center gap-4">
                    <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0 w-9 leading-none">
                      {w.year}
                    </span>
                    <p
                      className="uppercase leading-none tracking-[-0.02em] text-text-1 shrink-0"
                      style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.2rem, 2.2vw, 1.8rem)' }}
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
              <span className="font-mono text-[13px] text-text-3">—</span>
            )}
          </div>

          {/* Sub-col 2 — primera carrera + total de carreras */}
          <div className="md:w-[24%] flex flex-col px-6 py-6 gap-6">
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('hero.firstRace')}
              </p>
              <p
                ref={firstYearRef}
                className="leading-none tabular-nums text-text-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}
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
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}
              >
                {totalRaces}
              </p>
            </div>
          </div>

          {/* Sub-col 3 — vueltas + récord + drs */}
          <div className="md:w-[38%] flex flex-col px-6 py-6 gap-5">
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('hero.laps')}
              </p>
              <p
                className="leading-none tabular-nums text-text-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}
              >
                {standardLaps ?? '—'}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('hero.lapRecord')}
              </p>
              {rankLapRecord ? (
                <>
                  <p
                    ref={lapTimeRef}
                    className="font-mono leading-none tabular-nums"
                    style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', color: 'var(--red)' }}
                  >
                    {rankLapRecord.time}
                  </p>
                  <p className="font-mono text-[11px] text-text-3 mt-1">
                    {rankLapRecord.forename[0]}. {rankLapRecord.surname} · {rankLapRecord.year}
                  </p>
                </>
              ) : (
                <p className="font-mono text-text-3 tabular-nums" style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)' }}>—</p>
              )}
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('hero.drsZones')}
              </p>
              <p
                className="leading-none tabular-nums text-text-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}
              >
                {drsCount !== null ? drsCount : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Right column — dark track SVG panel, full height */}
        <div
          className="md:w-[360px] lg:w-[460px] xl:w-[520px] shrink-0 flex flex-col min-h-[280px] md:min-h-0"
          style={{ background: '#555555' }}
        >
          {trackPathData ? (() => {
            const flagColors = getFlagColors(country);
            const vbNums = trackPathData.viewBox.split(' ').map(Number);
            const [vx, , vw] = vbNums;
            const markerHalf = vw * 0.009;
            const hitHalf = vw * 0.026;
            return (
            <div className="flex-1 flex flex-col p-8">
              <svg
                viewBox={trackPathData.viewBox}
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full block flex-1"
                role="img"
                aria-label={`Track map — ${name}`}
              >
                <defs>
                  <linearGradient
                    id="track-flag-grad"
                    gradientUnits="userSpaceOnUse"
                    x1={vx}
                    y1={0}
                    x2={vx + vw}
                    y2={0}
                  >
                    {flagColors.map((color, i) => (
                      <stop
                        key={i}
                        offset={`${(i / (flagColors.length - 1)) * 100}%`}
                        stopColor={color}
                      />
                    ))}
                  </linearGradient>
                </defs>
                {/* Ghost — shape reference */}
                <path
                  d={trackPathData.path}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Animated — flag gradient */}
                <path
                  ref={drawPathRef}
                  d={trackPathData.path}
                  stroke="url(#track-flag-grad)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Corner markers — appear after DrawSVG completes */}
                {cornersWithPercent.map((corner, i) => {
                  const pt = markerPoints[i];
                  if (!pt) return null;
                  const isActive = hoveredCorner === i;
                  return (
                    <g
                      key={corner.corner_number}
                      className="corner-marker"
                      style={{ cursor: 'crosshair' }}
                      onMouseEnter={() => setHoveredCorner(i)}
                      onMouseLeave={() => setHoveredCorner(null)}
                    >
                      {/* Enlarged hit area */}
                      <rect
                        x={pt.x - hitHalf}
                        y={pt.y - hitHalf}
                        width={hitHalf * 2}
                        height={hitHalf * 2}
                        fill="transparent"
                      />
                      {/* Visible square marker */}
                      <rect
                        x={pt.x - markerHalf}
                        y={pt.y - markerHalf}
                        width={markerHalf * 2}
                        height={markerHalf * 2}
                        style={{
                          fill: corner.is_drs_zone ? 'var(--red)' : 'white',
                          opacity: isActive ? 1 : (corner.is_drs_zone ? 0.85 : 0.65),
                        }}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Hover detail — 1-line label + optional description */}
              <div className="shrink-0 mt-4" style={{ minHeight: '2.5rem' }}>
                {activeCorner ? (
                  <>
                    <p
                      className="font-mono text-[9px] uppercase tracking-[0.1em] mb-1"
                      style={{ color: 'rgba(255,255,255,0.85)' }}
                    >
                      T{activeCorner.corner_number}
                      {activeCorner.name ? ` · ${activeCorner.name}` : ''}
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {' · '}{activeCorner.type.replace(/_/g, ' ')}
                      </span>
                      {activeCorner.is_drs_zone && (
                        <span style={{ color: 'var(--red)' }}>{' · DRS'}</span>
                      )}
                    </p>
                    {activeCorner.description && (
                      <p
                        className="font-mono text-[10px] leading-relaxed line-clamp-2"
                        style={{ color: 'rgba(255,255,255,0.65)' }}
                      >
                        {activeCorner.description}
                      </p>
                    )}
                  </>
                ) : (
                  <p
                    className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                  >
                    TRACK MAP · {name.toUpperCase()}
                    {cornersWithPercent.length > 0 && (
                      <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {' · '}{cornersWithPercent.length} TURNS
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Corner legend — 2-col data grid */}
              {cornersWithPercent.length > 0 && (
                <div
                  className="shrink-0 mt-3 pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <div className="grid grid-cols-2 gap-x-6">
                    {cornersWithPercent.map((corner, i) => (
                      <div
                        key={corner.corner_number}
                        className="flex items-center gap-2 h-5 cursor-crosshair"
                        style={{
                          opacity: hoveredCorner === null ? 0.9 : (hoveredCorner === i ? 1 : 0.35),
                          transition: 'opacity 100ms ease',
                        }}
                        onMouseEnter={() => setHoveredCorner(i)}
                        onMouseLeave={() => setHoveredCorner(null)}
                      >
                        <span
                          className="shrink-0"
                          style={{
                            display: 'inline-block',
                            width: '5px',
                            height: '5px',
                            background: corner.is_drs_zone ? 'var(--red)' : 'rgba(255,255,255,0.3)',
                          }}
                        />
                        <span
                          className="font-mono text-[11px] tabular-nums shrink-0"
                          style={{ color: 'rgba(255,255,255,0.55)' }}
                        >
                          {String(corner.corner_number).padStart(2, '0')}
                        </span>
                        <span
                          className="font-mono text-[11px] font-bold truncate"
                          style={{ color: corner.name ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.3)' }}
                        >
                          {corner.name ?? '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            );
          })() : (
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


    </div>
  );
}
