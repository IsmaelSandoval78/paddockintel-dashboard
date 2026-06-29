'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Link } from '@/lib/i18n/navigation';
import type { CircuitInfo } from '@/lib/types';

gsap.registerPlugin(DrawSVGPlugin);

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

function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns} · ${Math.abs(lng).toFixed(2)}°${ew}`;
}

function TrackDrawing({ path, viewBox, country }: { path: string; viewBox: string; country: string }) {
  const drawRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!drawRef.current) return;
    gsap.set(drawRef.current, { drawSVG: '0%' });
    gsap.to(drawRef.current, {
      drawSVG: '100%',
      duration: 1.8,
      ease: 'expo.inOut',
      delay: 0.1,
    });
  }, [path]);

  const flagColors = getFlagColors(country);
  const [vx, , vw] = viewBox.split(' ').map(Number);
  const gradId = `panel-flag-grad-${country.replace(/\s+/g, '')}`;

  return (
    <svg
      viewBox={viewBox}
      className="w-full h-full block"
      fill="none"
      overflow="visible"
      style={{ maxHeight: '180px' }}
    >
      <defs>
        <linearGradient
          id={gradId}
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
      <path
        d={path}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        ref={drawRef}
        d={path}
        stroke={`url(#${gradId})`}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function CircuitLeftPanel({
  info,
  onClose,
}: {
  info: CircuitInfo;
  onClose: () => void;
}) {
  const t = useTranslations('circuits.panel');

  return (
    <div className="flex flex-col h-full bg-bg border-r border-border overflow-y-auto">

      {/* ── Header: name + coords + close ──────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-border shrink-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className="leading-tight text-text-1 uppercase tracking-[-0.02em]"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.15rem, 2vw, 1.5rem)' }}
          >
            {info.name}
          </h2>
          <p className="font-mono text-[11px] text-text-2 mt-1.5 uppercase tracking-[0.05em]">
            {info.location} · {info.country}
          </p>
          <p className="font-mono text-[10px] text-text-3 mt-0.5 tabular-nums">
            {formatCoord(info.lat, info.lng)}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 w-7 h-7 flex items-center justify-center text-text-3 hover:text-text-1 transition-colors duration-100 text-xl leading-none mt-0.5"
        >
          ×
        </button>
      </div>

      {/* ── Track SVG — dark panel ──────────────────────────── */}
      {info.track_path && (
        <div
          className="px-8 py-6 shrink-0 flex items-center justify-center"
          style={{ background: 'var(--text-1)' }}
        >
          <TrackDrawing key={info.circuit_ref} path={info.track_path.path} viewBox={info.track_path.viewBox} country={info.country} />
        </div>
      )}

      {/* ── First Race | Total Races ────────────────────────── */}
      <div className="flex divide-x divide-border border-b border-border shrink-0">
        <div className="flex-1 px-5 py-4">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
            {t('firstRace')}
          </p>
          <p
            className="leading-none tabular-nums text-text-1"
            style={{ fontFamily: 'var(--pi-display)', fontSize: '2rem' }}
          >
            {info.first_year ?? '—'}
          </p>
        </div>
        <div className="flex-1 px-5 py-4">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
            {t('totalRaces')}
          </p>
          <p
            className="leading-none tabular-nums text-text-1"
            style={{ fontFamily: 'var(--pi-display)', fontSize: '2rem' }}
          >
            {info.total_races}
          </p>
        </div>
      </div>

      {/* ── Last 5 Winners ──────────────────────────────────── */}
      {info.champions.length > 0 && (
        <div className="border-b border-border shrink-0">
          <p className="px-5 py-2.5 font-mono text-[10px] text-text-3 uppercase tracking-[0.07em] border-b border-border">
            {t('champions')}
          </p>
          {info.champions.map((c, i) => (
            <div
              key={c.year}
              className="flex items-center gap-3 px-5 h-10 border-b border-border last:border-b-0"
              style={{ opacity: 1 - i * 0.12 }}
            >
              <span className="font-mono text-[11px] text-text-3 tabular-nums w-9 shrink-0 leading-none">
                {c.year}
              </span>
              <p
                className="uppercase leading-none tracking-[-0.02em] text-text-1 truncate"
                style={{ fontFamily: 'var(--pi-display)', fontSize: '1.05rem' }}
              >
                {c.forename[0]}. {c.surname}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Laps | Lap Record ───────────────────────────────── */}
      <div className="border-b border-border shrink-0">
        {/* Laps count */}
        {info.laps !== null && (
          <div className="flex items-center gap-4 px-5 py-4 border-b border-border">
            <div>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">
                {t('laps')}
              </p>
              <p
                className="leading-none tabular-nums text-text-1"
                style={{ fontFamily: 'var(--pi-display)', fontSize: '2rem' }}
              >
                {info.laps}
              </p>
            </div>
          </div>
        )}

        {/* Lap Record */}
        {info.fastest_lap && (
          <div className="px-5 py-4">
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-2">
              {t('fastestLap')}
            </p>
            <p
              className="font-mono tabular-nums leading-none mb-1.5"
              style={{ fontSize: '1.5rem', color: 'var(--red)' }}
            >
              {info.fastest_lap.time}
            </p>
            <p className="font-mono text-[11px] text-text-2">
              {info.fastest_lap.forename[0]}. {info.fastest_lap.surname}
              <span className="text-text-3 ml-1.5 tabular-nums">{info.fastest_lap.year}</span>
            </p>
          </div>
        )}
      </div>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <div className="mt-auto px-5 py-4 shrink-0">
        <Link
          href={`/circuits/${info.circuit_ref}`}
          className="font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-150 hover:opacity-70"
          style={{ color: 'var(--red)' }}
        >
          {t('viewFull')} →
        </Link>
      </div>

    </div>
  );
}
