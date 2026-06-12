'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from '@/lib/i18n/navigation';
import { teamColor } from './teamColors';
import type { HomeDriverRow } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

interface TheGridProps {
  drivers: HomeDriverRow[];
  motionOk: boolean;
}

export default function TheGrid({ drivers, motionOk }: TheGridProps) {
  const t = useTranslations('hub.home');
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const leaderPts = drivers[0]?.points ?? 1;

  useEffect(() => {
    if (!motionOk || drivers.length === 0) return;
    const ctx = gsap.context(() => {

      // Rows launch from the left, staggered — the grid forming
      gsap.from('.grid-row', {
        x: -48,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.055,
        ease: 'power4.out',
        scrollTrigger: { trigger: listRef.current, start: 'top 82%', once: true },
      });

      // Point bars fill scrubbed to scroll — the gap, visualized
      gsap.utils.toArray<HTMLElement>('.grid-bar').forEach((bar) => {
        gsap.fromTo(bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: 'left center',
            ease: 'none',
            scrollTrigger: {
              trigger: bar.closest('.grid-row'),
              start: 'top 92%',
              end: 'top 55%',
              scrub: 1,
            },
          },
        );
      });

      // Points count up when each row arrives
      gsap.utils.toArray<HTMLElement>('.grid-pts').forEach((el) => {
        const target = Number(el.dataset.pts ?? 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate() { el.textContent = String(Math.round(obj.v)); },
        });
      });

      // G-force: scroll velocity skews the whole grid, then settles
      const proxy = { skew: 0 };
      const skewSetter = gsap.quickSetter(listRef.current, 'skewY', 'deg');
      const clampSkew = gsap.utils.clamp(-3.5, 3.5);
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate(self) {
          const skew = clampSkew(self.getVelocity() / -350);
          if (Math.abs(skew) > Math.abs(proxy.skew)) {
            proxy.skew = skew;
            gsap.to(proxy, {
              skew: 0,
              duration: 0.8,
              ease: 'power3',
              overwrite: true,
              onUpdate: () => skewSetter(proxy.skew),
            });
          }
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, drivers.length]);

  if (drivers.length === 0) return null;

  return (
    <section ref={rootRef} className="border-t border-border px-5 md:px-10 py-10 md:py-16 overflow-hidden">

      <p className="font-mono text-[9px] md:text-[10px] text-text-2 uppercase tracking-[0.18em] mb-2">
        05 · {t('top10').toUpperCase()}
      </p>
      <h2
        className="uppercase leading-[0.9] mb-8 md:mb-12"
        style={{
          fontFamily:    'var(--pi-display)',
          fontSize:      'clamp(34px, 6.5vw, 92px)',
          letterSpacing: '-0.03em',
        }}
      >
        THE GRID
      </h2>

      <div ref={listRef} className="flex flex-col will-change-transform">
        {drivers.map((d) => {
          const color = teamColor(d.constructor_ref);
          const isP1 = d.position === 1;
          const gap = d.points - leaderPts;
          return (
            <Link
              key={d.driver_id}
              href={`/drivers/${d.driver_ref}`}
              data-cursor
              className="grid-row group relative flex items-center gap-4 md:gap-8 py-3 md:py-4 border-b border-border-subtle overflow-hidden"
            >
              {/* Hover flood — team color washes in from the left */}
              <span
                className="absolute inset-0 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out pointer-events-none"
                style={{ background: color, opacity: 0.07 }}
              />

              {/* Ghost numeral */}
              <span
                aria-hidden="true"
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 tabular-nums select-none pointer-events-none leading-none"
                style={{
                  fontFamily:    'var(--pi-display)',
                  fontSize:      'clamp(56px, 9vw, 130px)',
                  letterSpacing: '-0.05em',
                  color:         'var(--text-1)',
                  opacity:       0.05,
                }}
              >
                {String(d.position).padStart(2, '0')}
              </span>

              {/* Position */}
              <span
                className="relative tabular-nums shrink-0 w-8 md:w-12 leading-none"
                style={{
                  fontFamily: 'var(--pi-display)',
                  fontSize:   'clamp(16px, 2.2vw, 26px)',
                  color:      isP1 ? 'var(--red)' : 'var(--text-3)',
                }}
              >
                {d.position}
              </span>

              {/* Team bar slot */}
              <span className="relative w-1 self-stretch shrink-0" style={{ background: color }} />

              {/* Name + constructor */}
              <span className="relative flex-1 min-w-0">
                <span
                  className="uppercase leading-none block truncate group-hover:translate-x-2 transition-transform duration-300 ease-out"
                  style={{
                    fontFamily:    'var(--pi-display)',
                    fontSize:      isP1 ? 'clamp(24px, 4vw, 48px)' : 'clamp(18px, 2.8vw, 34px)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {d.surname}
                </span>
                <span className="font-mono text-[8px] md:text-[9px] text-text-3 uppercase tracking-[0.14em] mt-1 block">
                  {d.constructor_name}
                  {d.wins > 0 && <span> · {d.wins} {t('wins').toUpperCase()}</span>}
                </span>
                {/* Points bar — fills scrubbed to scroll */}
                <span className="block h-[2px] mt-2 w-full max-w-[420px]" style={{ background: 'var(--surface-raised)' }}>
                  <span
                    className="grid-bar block h-full"
                    style={{
                      background: color,
                      width: `${(d.points / leaderPts) * 100}%`,
                      transform: motionOk ? 'scaleX(0)' : undefined,
                    }}
                  />
                </span>
              </span>

              {/* Points + gap */}
              <span className="relative flex flex-col items-end shrink-0">
                <span
                  className="grid-pts tabular-nums leading-none"
                  data-pts={d.points}
                  style={{
                    fontFamily:    'var(--pi-display)',
                    fontSize:      isP1 ? 'clamp(22px, 3.2vw, 40px)' : 'clamp(17px, 2.4vw, 28px)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {d.points}
                </span>
                <span
                  className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.12em] mt-1 tabular-nums"
                  style={{ color: isP1 ? 'var(--red)' : 'var(--text-3)' }}
                >
                  {isP1 ? 'LEADER' : gap}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
