'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface WinnerRow {
  year: number;
  forename: string;
  surname: string;
  constructor: string;
}

interface Props {
  winnerRows: WinnerRow[];
  motionOk: boolean;
}

const ERAS = [
  { label: 'GROUND EFFECT RETURN', start: 2022, end: 2099 },
  { label: 'HYBRID',               start: 2014, end: 2021 },
  { label: 'V8',                   start: 2006, end: 2013 },
  { label: 'V10 · REFUELING',      start: 1994, end: 2005 },
  { label: 'NATURALLY ASPIRATED',  start: 1989, end: 1993 },
  { label: 'TURBO',                start: 1977, end: 1988 },
  { label: 'COSWORTH DFV',         start: 1967, end: 1976 },
  { label: 'PIONEERING',           start: 1950, end: 1966 },
];

export default function CircuitTimeline({ winnerRows, motionOk }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const sorted = [...winnerRows].sort((a, b) => b.year - a.year);

  useEffect(() => {
    if (!motionOk || !rootRef.current) return;
    const ctx = gsap.context(() => {
      if (lineRef.current) {
        gsap.fromTo(lineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: 'top center',
            ease: 'none',
            scrollTrigger: {
              trigger: lineRef.current,
              start: 'top 82%',
              end: 'bottom 12%',
              scrub: 0.6,
            },
          },
        );
      }

      gsap.from('.timeline-row', {
        x: -18,
        autoAlpha: 0,
        duration: 0.38,
        stagger: 0.012,
        ease: 'power3.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk]);

  return (
    <div ref={rootRef} className="px-6 py-6">
      <div className="relative">

        {/* Vertical line — draws on scroll */}
        <div
          ref={lineRef}
          className="absolute top-0 bottom-0 bg-border"
          style={{ left: '56px', width: '1px', transformOrigin: 'top' }}
        />

        {ERAS.map((era) => {
          const eraWinners = sorted.filter(w => w.year >= era.start && w.year <= era.end);
          if (!eraWinners.length) return null;

          const years = eraWinners.map(w => w.year);
          const from  = Math.min(...years);
          const to    = Math.max(...years);

          return (
            <div key={era.label}>

              {/* Era separator */}
              <div className="flex items-center h-10">
                {/* left column — aligned with year column */}
                <div className="shrink-0" style={{ width: '56px' }} />
                <div className="flex items-center gap-3 flex-1 border-t border-border pt-0 pl-5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.09em] text-text-2">
                    {era.label}
                  </span>
                  <span className="font-mono text-[10px] text-text-3 tabular-nums ml-auto">
                    {from === to ? from : `${from}–${to}`}
                    <span className="ml-2 text-text-3">· {eraWinners.length}W</span>
                  </span>
                </div>
              </div>

              {/* Winner rows */}
              {eraWinners.map((w) => (
                <div key={`${w.year}-${w.surname}`} className="timeline-row flex items-center h-9">

                  {/* Year — left of line */}
                  <div
                    className="shrink-0 flex items-center justify-end pr-3"
                    style={{ width: '56px' }}
                  >
                    <span className="font-mono text-[10px] text-text-3 tabular-nums">{w.year}</span>
                  </div>

                  {/* Square tick on the line */}
                  <div className="relative w-0 shrink-0">
                    <div
                      className="absolute top-1/2 bg-text-2"
                      style={{ width: '5px', height: '5px', left: '-2px', transform: 'translateY(-50%)' }}
                    />
                  </div>

                  {/* Driver + constructor — right of line */}
                  <div className="flex items-center gap-3 pl-5 flex-1 min-w-0">
                    <p
                      className="uppercase leading-none text-text-1 shrink-0"
                      style={{
                        fontFamily: 'var(--pi-display)',
                        fontSize: '1rem',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {w.forename[0]}. {w.surname}
                    </p>
                    <span className="font-mono text-[11px] text-text-3 min-w-0 truncate">
                      {w.constructor}
                    </span>
                  </div>

                </div>
              ))}

            </div>
          );
        })}

      </div>
    </div>
  );
}
