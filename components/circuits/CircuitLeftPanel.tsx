'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Link } from '@/lib/i18n/navigation';
import type { CircuitInfo } from '@/lib/types';

gsap.registerPlugin(DrawSVGPlugin);

function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${ns} · ${Math.abs(lng).toFixed(2)}°${ew}`;
}

function TrackDrawing({ path, viewBox }: { path: string; viewBox: string }) {
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

  return (
    <svg
      viewBox={viewBox}
      className="w-full h-full block"
      fill="none"
      overflow="visible"
      style={{ maxHeight: '180px' }}
    >
      <path
        d={path}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        ref={drawRef}
        d={path}
        stroke="var(--red)"
        strokeWidth="4"
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
          <TrackDrawing key={info.circuit_ref} path={info.track_path.path} viewBox={info.track_path.viewBox} />
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
