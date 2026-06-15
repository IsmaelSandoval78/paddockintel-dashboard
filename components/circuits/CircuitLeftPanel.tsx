'use client';

import { useEffect, useRef } from 'react';
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

// ─── Track SVG with DrawSVG animation ────────────────────────────
function TrackDrawing({ path, viewBox }: { path: string; viewBox: string }) {
  const ghostRef = useRef<SVGPathElement>(null);
  const drawRef  = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!drawRef.current) return;
    gsap.set(drawRef.current, { drawSVG: '0%' });
    gsap.to(drawRef.current, {
      drawSVG: '100%',
      duration: 1.8,
      ease: 'expo.inOut',
      delay: 0.1,
    });
  }, [path]);   // re-animate on circuit change

  return (
    <svg
      viewBox={viewBox}
      className="w-full"
      style={{ maxHeight: '140px' }}
      fill="none"
      overflow="visible"
    >
      {/* Ghost */}
      <path
        ref={ghostRef}
        d={path}
        stroke="var(--border)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Animated */}
      <path
        ref={drawRef}
        d={path}
        stroke="var(--text-1)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Panel ───────────────────────────────────────────────────────
export default function CircuitLeftPanel({
  info,
  onClose,
}: {
  info: CircuitInfo;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-bg border-r border-border overflow-y-auto">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h2
            className="text-[clamp(1.1rem,2vw,1.4rem)] leading-tight text-text-1 uppercase tracking-[-0.02em]"
            style={{ fontFamily: 'var(--pi-display)' }}
          >
            {info.name}
          </h2>
          <p className="font-mono text-[11px] text-text-2 mt-1 uppercase tracking-[0.06em]">
            {info.location} · {info.country}
          </p>
          <p className="font-mono text-[10px] text-text-3 mt-0.5">
            {formatCoord(info.lat, info.lng)}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 w-7 h-7 flex items-center justify-center text-text-3 hover:text-text-1 transition-colors duration-100 text-lg leading-none mt-0.5"
        >
          ×
        </button>
      </div>

      {/* ── Track SVG ─────────────────────────────────────────────── */}
      {info.track_path && (
        <div className="px-8 py-5 border-b border-border shrink-0 flex items-center justify-center bg-surface">
          <TrackDrawing key={info.circuit_ref} path={info.track_path.path} viewBox={info.track_path.viewBox} />
        </div>
      )}

      {/* ── First race + Total ────────────────────────────────────── */}
      <div className="flex divide-x divide-border border-b border-border shrink-0">
        <div className="flex-1 px-5 py-4">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">First Race</p>
          <p
            className="text-[2rem] text-text-1 leading-none tabular-nums"
            style={{ fontFamily: 'var(--pi-display)' }}
          >
            {info.first_year ?? '—'}
          </p>
        </div>
        <div className="flex-1 px-5 py-4">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">Total Races</p>
          <p
            className="text-[2rem] text-text-1 leading-none tabular-nums"
            style={{ fontFamily: 'var(--pi-display)' }}
          >
            {info.total_races}
          </p>
        </div>
      </div>

      {/* ── 01 · Last 5 Champions ─────────────────────────────────── */}
      {info.champions.length > 0 && (
        <div className="border-b border-border shrink-0">
          <div className="px-5 py-2.5 flex items-baseline gap-2 border-b border-border">
            <span className="font-mono text-[10px] text-text-2">01 ·</span>
            <span className="font-mono text-[11px] text-text-2 uppercase tracking-[0.06em]">Last 5 Champions</span>
          </div>
          {info.champions.map((c) => (
            <div key={c.year} className="flex items-center gap-3 px-5 h-9 border-b border-border last:border-0">
              <span className="font-mono text-[11px] text-text-3 tabular-nums w-9 shrink-0">{c.year}</span>
              <span className="text-[12px] text-text-2 shrink-0">{c.forename}</span>
              <span className="text-[13px] font-semibold text-text-1 uppercase tracking-[0.02em] truncate">{c.surname}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── 02 · Fastest Pit ──────────────────────────────────────── */}
      {info.fastest_pit && (
        <div className="border-b border-border shrink-0">
          <div className="px-5 py-2.5 flex items-baseline gap-2 border-b border-border">
            <span className="font-mono text-[10px] text-text-2">02 ·</span>
            <span className="font-mono text-[11px] text-text-2 uppercase tracking-[0.06em]">Fastest Pit Stop</span>
          </div>
          <div className="px-5 py-3 flex items-center gap-3">
            <span className="text-[13px] text-text-1 flex-1 min-w-0 truncate">{info.fastest_pit.constructor}</span>
            <span className="font-mono text-[13px] tabular-nums shrink-0" style={{ color: 'var(--red)' }}>{info.fastest_pit.duration}s</span>
            <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0">{info.fastest_pit.year}</span>
          </div>
        </div>
      )}

      {/* ── 03 · Fastest Lap ──────────────────────────────────────── */}
      {info.fastest_lap && (
        <div className="border-b border-border shrink-0">
          <div className="px-5 py-2.5 flex items-baseline gap-2 border-b border-border">
            <span className="font-mono text-[10px] text-text-2">03 ·</span>
            <span className="font-mono text-[11px] text-text-2 uppercase tracking-[0.06em]">Fastest Lap</span>
          </div>
          <div className="px-5 py-3 flex items-center gap-3">
            <span className="text-[13px] text-text-1 flex-1 min-w-0 truncate">
              {info.fastest_lap.forename[0]}. {info.fastest_lap.surname}
            </span>
            <span className="font-mono text-[13px] tabular-nums shrink-0" style={{ color: 'var(--red)' }}>{info.fastest_lap.time}</span>
            <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0">{info.fastest_lap.year}</span>
          </div>
        </div>
      )}

      {/* ── 04 · Top Constructor ──────────────────────────────────── */}
      {info.top_constructor && (
        <div className="border-b border-border shrink-0">
          <div className="px-5 py-2.5 flex items-baseline gap-2 border-b border-border">
            <span className="font-mono text-[10px] text-text-2">04 ·</span>
            <span className="font-mono text-[11px] text-text-2 uppercase tracking-[0.06em]">Top Constructor</span>
          </div>
          <div className="px-5 py-3 flex items-center gap-3">
            <span className="text-[13px] text-text-1 flex-1 min-w-0 truncate">{info.top_constructor.name}</span>
            <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0">{info.top_constructor.wins}W</span>
          </div>
        </div>
      )}

      {/* ── 05 · Most Wins ────────────────────────────────────────── */}
      {info.top_win_driver && (
        <div className="border-b border-border shrink-0">
          <div className="px-5 py-2.5 flex items-baseline gap-2 border-b border-border">
            <span className="font-mono text-[10px] text-text-2">05 ·</span>
            <span className="font-mono text-[11px] text-text-2 uppercase tracking-[0.06em]">Most Wins</span>
          </div>
          <div className="px-5 py-3 flex items-center gap-3">
            <span className="text-[13px] text-text-1 flex-1 min-w-0 truncate">
              {info.top_win_driver.forename[0]}. {info.top_win_driver.surname}
            </span>
            <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0">{info.top_win_driver.wins}W</span>
          </div>
        </div>
      )}

      {/* ── 06 · Most Poles ───────────────────────────────────────── */}
      {info.top_pole_driver && (
        <div className="border-b border-border shrink-0">
          <div className="px-5 py-2.5 flex items-baseline gap-2 border-b border-border">
            <span className="font-mono text-[10px] text-text-2">06 ·</span>
            <span className="font-mono text-[11px] text-text-2 uppercase tracking-[0.06em]">Most Poles</span>
          </div>
          <div className="px-5 py-3 flex items-center gap-3">
            <span className="text-[13px] text-text-1 flex-1 min-w-0 truncate">
              {info.top_pole_driver.forename[0]}. {info.top_pole_driver.surname}
            </span>
            <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0">{info.top_pole_driver.poles}P</span>
          </div>
        </div>
      )}

      {/* ── 07 · Avg. Start ───────────────────────────────────────── */}
      {info.avg_winner_grid !== null && (
        <div className="border-b border-border shrink-0">
          <div className="px-5 py-2.5 flex items-baseline gap-2 border-b border-border">
            <span className="font-mono text-[10px] text-text-2">07 ·</span>
            <span className="font-mono text-[11px] text-text-2 uppercase tracking-[0.06em]">Avg. Start</span>
          </div>
          <div className="px-5 py-3">
            <span
              className="text-[2rem] text-text-1 leading-none tabular-nums"
              style={{ fontFamily: 'var(--pi-display)' }}
            >
              P{info.avg_winner_grid}
            </span>
          </div>
        </div>
      )}

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <div className="mt-auto px-5 py-4 border-t border-border shrink-0">
        <Link
          href={`/circuits/${info.circuit_ref}`}
          className="font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-150"
          style={{ color: 'var(--red)' }}
        >
          Full Circuit →
        </Link>
      </div>

    </div>
  );
}
