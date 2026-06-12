'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

interface TrackDrawProps {
  pathData: string;
  viewBox: string;
  circuitName: string;
  motionOk: boolean;
  height?: string;
}

// The flying lap: circuit outline draws 0→100% scrubbed to scroll.
export default function TrackDraw({
  pathData, viewBox, circuitName, motionOk, height = 'clamp(180px, 30vw, 320px)',
}: TrackDrawProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!motionOk || !pathRef.current || !wrapRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(pathRef.current,
        { drawSVG: '0%' },
        {
          drawSVG: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: wrapRef.current,
            start: 'top 88%',
            end: 'bottom 45%',
            scrub: 1,
          },
        },
      );
    }, wrapRef);
    return () => ctx.revert();
  }, [motionOk]);

  return (
    <div ref={wrapRef} className="w-full" style={{ height }}>
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block"
        role="img"
        aria-label={`Track map — ${circuitName}`}
        style={{ padding: '8px' }}
      >
        <path
          d={pathData}
          stroke="var(--border-subtle)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          ref={pathRef}
          d={pathData}
          stroke="var(--text-1)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
