'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  densifyLastLap,
  getPointsAtPercents,
  widthForDelta,
  widthCapForRace,
  buildRibbonPolygon,
  segmentByKey,
  runPathD,
  type Point,
  type RibbonFrame,
} from './deltaRibbon/geometry';

export interface DeltaRibbonDriver {
  id: number;
  code: string | null;
  forename: string;
  surname: string;
  teamColor: string;
}

export interface DeltaRibbonEventRow {
  path_percent: number;
  lap: number;
  event_type: 'snap' | 'defend' | 'braid_start' | 'braid_end';
  corner_name: string | null;
}

interface DeltaRibbonSectionProps {
  trackPathData: { path: string; viewBox: string } | null;
  frames: RibbonFrame[];
  events: DeltaRibbonEventRow[];
  driverA: DeltaRibbonDriver;
  driverB: DeltaRibbonDriver;
}

const STEP_PERCENT = 0.5;

export default function DeltaRibbonSection({
  trackPathData, frames, events, driverA, driverB,
}: DeltaRibbonSectionProps) {
  const t = useTranslations('circuitDetail.deltaRibbon');

  const samples = useMemo(() => densifyLastLap(frames, STEP_PERCENT), [frames]);
  const maxLap = useMemo(
    () => (frames.length ? Math.max(...frames.map((f) => f.lap)) : null),
    [frames],
  );

  const markerEvents = useMemo(
    () => events.filter((e) => e.event_type === 'snap' || e.event_type === 'defend'),
    [events],
  );
  const braidRanges = useMemo(() => {
    const starts = events.filter((e) => e.event_type === 'braid_start' && e.lap === maxLap)
      .sort((a, b) => a.path_percent - b.path_percent);
    const ends = events.filter((e) => e.event_type === 'braid_end' && e.lap === maxLap)
      .sort((a, b) => a.path_percent - b.path_percent);
    // Braid geometry only renders when start/end land on the same lap the ribbon shows —
    // pairs on other laps still get their own point markers, just no hatch on the band.
    const n = Math.min(starts.length, ends.length);
    return Array.from({ length: n }, (_, i) => ({ start: starts[i].path_percent, end: ends[i].path_percent }));
  }, [events, maxLap]);

  const [trackPoints, setTrackPoints] = useState<Point[]>([]);
  const [eventPoints, setEventPoints] = useState<Point[]>([]);

  // Offscreen-clone getPointAtLength lookup — see geometry.ts for why (GSAP DrawSVG breaks
  // getTotalLength() on the visible, CSS-scaled path). Batched: one clone, all points at once.
  useEffect(() => {
    if (!trackPathData || samples.length === 0) return;
    const allPercents = [...samples.map((s) => s.percent), ...markerEvents.map((e) => e.path_percent)];
    const points = getPointsAtPercents(trackPathData.path, allPercents);
    setTrackPoints(points.slice(0, samples.length));
    setEventPoints(points.slice(samples.length));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackPathData, frames, events]);

  if (!trackPathData || samples.length === 0 || trackPoints.length === 0) return null;

  const vbNums = trackPathData.viewBox.split(' ').map(Number);
  const vw = vbNums[2] ?? 500;

  const capSeconds = widthCapForRace(frames);
  const widths = samples.map((s) => widthForDelta(Math.abs(s.deltaSeconds), vw, capSeconds));
  const { left, right } = buildRibbonPolygon(trackPoints, widths);

  const isInBraid = (percent: number) =>
    braidRanges.some(({ start, end }) => (start <= end ? percent >= start && percent <= end : percent >= start || percent <= end));

  const segmentKeys = samples.map((s) => (isInBraid(s.percent) ? 'braid' : String(s.leaderId)));
  const runs = segmentByKey(segmentKeys);

  const colorFor = (key: string) => {
    if (key === 'braid') return 'url(#delta-ribbon-braid)';
    const leaderId = Number(key);
    if (leaderId === driverA.id) return driverA.teamColor;
    if (leaderId === driverB.id) return driverB.teamColor;
    return 'var(--text-3)';
  };

  const finalSample = samples[samples.length - 1];
  const finalLeader = finalSample.leaderId === driverA.id ? driverA : driverB;
  const snapCount = markerEvents.filter((e) => e.event_type === 'snap').length;
  const defendCount = markerEvents.filter((e) => e.event_type === 'defend').length;

  return (
    <div>
      <svg
        viewBox={trackPathData.viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full block"
        style={{ height: 'clamp(240px, 36vw, 440px)' }}
        role="img"
        aria-label={t('title')}
      >
        <defs>
          <pattern
            id="delta-ribbon-braid"
            patternUnits="userSpaceOnUse"
            width={vw * 0.02}
            height={vw * 0.02}
            patternTransform="rotate(45)"
          >
            <rect width={vw * 0.01} height={vw * 0.02} fill={driverA.teamColor} />
            <rect x={vw * 0.01} width={vw * 0.01} height={vw * 0.02} fill={driverB.teamColor} />
          </pattern>
        </defs>

        {/* Ghost — track reference, same treatment as TrackDraw.tsx */}
        <path
          d={trackPathData.path}
          stroke="var(--border-subtle)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Delta Ribbon — one filled polygon per contiguous leader/braid run */}
        {runs.map((run, i) => {
          const d = runPathD(left, right, run.startIdx, run.endIdx);
          if (!d) return null;
          return <path key={i} d={d} fill={colorFor(run.key)} stroke="none" />;
        })}

        {/* Snap / defend markers */}
        {markerEvents.map((e, i) => {
          const pt = eventPoints[i];
          if (!pt) return null;
          const isSnap = e.event_type === 'snap';
          return (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={vw * 0.008}
                fill={isSnap ? 'var(--red)' : 'var(--text-1)'}
                stroke="var(--bg)"
                strokeWidth={vw * 0.002}
              />
            </g>
          );
        })}
      </svg>

      <div className="px-6 py-4 border-t border-border grid grid-cols-3 gap-4">
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-md p-3">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">{t('finalGap')}</p>
          <p className="font-mono text-[16px] text-text-1 tabular-nums">
            {finalLeader.code ?? finalLeader.surname} +{Math.abs(finalSample.deltaSeconds).toFixed(3)}s
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-md p-3">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">{t('snap')}</p>
          <p className="font-mono text-[16px] text-text-1 tabular-nums">{snapCount}</p>
        </div>
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-md p-3">
          <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-1">{t('defend')}</p>
          <p className="font-mono text-[16px] text-text-1 tabular-nums">{defendCount}</p>
        </div>
      </div>
    </div>
  );
}
