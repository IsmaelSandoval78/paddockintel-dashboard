'use client';

import { useEffect, useState } from 'react';
import { computeEpicenterFrame, pointAtPercent, type EpicenterFrame } from '@/lib/circuitGeometry';

export interface EpicenterEvent {
  cornerNumber: number;
  cornerName: string | null;
  pathPercent: number;
}

interface EpicenterMapProps {
  name: string;
  trackPathData: { path: string; viewBox: string } | null;
  // Binary marker only — one verified circuit_corners event, or none. Never an approximated
  // position, never a magnitude/intensity gradient (see docs/advisors/DATA-EXPERT.md — there's
  // no structured source today that could support ranking incident severity).
  event: EpicenterEvent | null;
}

// Vintage Editorial's "illustrated single-subject diagram" — a navy circle containing the
// real track ghost-traced and scaled via computeEpicenterFrame (real bbox center + farthest-
// point radius + 14% padding), with a single ring marking a verified event, if one exists.
export default function EpicenterMap({ name, trackPathData, event }: EpicenterMapProps) {
  const [frame, setFrame] = useState<EpicenterFrame | null>(null);
  const [markerPoint, setMarkerPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!trackPathData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFrame(null);
      setMarkerPoint(null);
      return;
    }
    setFrame(computeEpicenterFrame(trackPathData.path));
    setMarkerPoint(event ? pointAtPercent(trackPathData.path, event.pathPercent) : null);
  }, [trackPathData, event]);

  const ringRadius = frame ? frame.radius * 0.035 : 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="aspect-square w-full max-w-[280px] rounded-full overflow-hidden shrink-0"
        style={{ background: 'var(--navy)' }}
      >
        {trackPathData && frame ? (
          <svg
            viewBox={frame.viewBox}
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            role="img"
            aria-label={`Track outline — ${name}`}
          >
            <path
              d={trackPathData.path}
              stroke="var(--text-2-on-accent)"
              strokeWidth={frame.radius * 0.03}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {event && markerPoint && (
              <circle
                cx={markerPoint.x}
                cy={markerPoint.y}
                r={ringRadius}
                stroke="var(--terracotta)"
                strokeWidth={frame.radius * 0.018}
                fill="none"
              />
            )}
          </svg>
        ) : (
          // Measuring, or no track path available — quiet navy circle, not an error state.
          <div className="w-full h-full" />
        )}
      </div>

      {event && (
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 text-center">
          T{event.cornerNumber}
          {event.cornerName ? ` · ${event.cornerName}` : ''}
        </p>
      )}
    </div>
  );
}
