'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { HomeDriverRow } from '@/lib/types';

interface TickerProps {
  drivers: HomeDriverRow[];
  motionOk: boolean;
}

export default function Ticker({ drivers, motionOk }: TickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!motionOk || !trackRef.current) return;
    const tween = gsap.to(trackRef.current, {
      xPercent: -50,
      duration: 36,
      ease: 'none',
      repeat: -1,
    });
    return () => { tween.kill(); };
  }, [motionOk]);

  const feed = drivers.map((d) =>
    `P${d.position} ${d.surname.toUpperCase()} ${d.points}`
  );

  const renderHalf = (half: 0 | 1) => (
    <div className="flex items-center shrink-0">
      {feed.map((item, i) => (
        <span key={`${half}-${i}`} className="flex items-center shrink-0">
          <span
            className="uppercase whitespace-nowrap px-5 md:px-7"
            style={{
              fontFamily:    'var(--pi-display)',
              fontSize:      'clamp(14px, 2vw, 20px)',
              letterSpacing: '-0.01em',
              color:         'var(--text-on-accent)',
            }}
          >
            {item}
          </span>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--text-on-accent)', opacity: 0.5 }} />
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="overflow-hidden py-2.5 md:py-3 border-y border-border select-none"
      style={{ background: 'var(--terracotta)' }}
      aria-hidden="true"
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        {renderHalf(0)}
        {renderHalf(1)}
      </div>
    </div>
  );
}
