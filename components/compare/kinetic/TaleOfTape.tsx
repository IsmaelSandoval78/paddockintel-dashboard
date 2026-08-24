'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { fitToWidth, observeFit } from '@/components/home/kinetic/fitText';

gsap.registerPlugin(SplitText);

export type TapeSide = {
  name: string;
  sub: string;
  meta: string;
  championships: number;
  color: string;
};

const LIGHT_COUNT = 5;

function Side({
  side,
  alignRight,
  nameRef,
  titlesLabel,
}: {
  side: TapeSide;
  alignRight: boolean;
  nameRef: React.RefObject<HTMLHeadingElement | null>;
  titlesLabel: string;
}) {
  return (
    <div className={`flex flex-col min-w-0 ${alignRight ? 'items-end text-right' : 'items-start text-left'}`}>
      <span className="tape-meta font-mono text-[10px] text-text-2 uppercase tracking-[0.12em] mb-2 flex items-center gap-2">
        {!alignRight && <span className="w-2 h-2 shrink-0" style={{ background: side.color }} />}
        {side.sub}
        {alignRight && <span className="w-2 h-2 shrink-0" style={{ background: side.color }} />}
      </span>
      <div className="kinetic-mask w-full">
        {/* fontSize must live in a class: fitToWidth clears el.style.fontSize to re-measure */}
        <h2
          ref={nameRef}
          className={`uppercase whitespace-nowrap leading-[0.9] text-[clamp(26px,5.5vw,76px)] tracking-[-0.03em] ${alignRight ? 'text-right' : ''}`}
          style={{
            fontFamily: 'var(--pi-display)',
            color: 'var(--text-1)',
            visibility: 'hidden',
          }}
        >
          {side.name}
        </h2>
      </div>
      <span className="tape-meta font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] mt-2 tabular-nums">
        {side.meta}
      </span>
      <div className={`tape-meta flex items-baseline gap-2 mt-3 ${alignRight ? 'flex-row-reverse' : ''}`}>
        <span
          className="tape-champ tabular-nums leading-none"
          data-val={side.championships}
          style={{
            fontFamily: 'var(--pi-display)',
            fontSize: 'clamp(24px, 2.6vw, 36px)',
            color: side.championships > 0 ? 'var(--gold)' : 'var(--text-3)',
          }}
        >
          {side.championships}
        </span>
        <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em]">
          {titlesLabel}
        </span>
      </div>
    </div>
  );
}

// Boxing-poster hero. On a fresh pairing the start-light gantry runs:
// five lights ignite in sequence, hold (randomized, like a real F1 start),
// go out together — and the names launch from opposite sides.
export default function TaleOfTape({
  a,
  b,
  pairKey,
  motionOk,
}: {
  a: TapeSide;
  b: TapeSide;
  pairKey: string;
  motionOk: boolean;
}) {
  const t = useTranslations('compare.tape');
  const rootRef = useRef<HTMLDivElement>(null);
  const nameARef = useRef<HTMLHeadingElement>(null);
  const nameBRef = useRef<HTMLHeadingElement>(null);

  // Keep both display names fitted to their half
  useEffect(() => {
    const cleanups: Array<(() => void) | undefined> = [];
    document.fonts.ready.then(() => {
      for (const el of [nameARef.current, nameBRef.current]) {
        if (!el) continue;
        fitToWidth(el);
        cleanups.push(observeFit(el));
      }
    });
    return () => cleanups.forEach((fn) => fn?.());
  }, [pairKey]);

  useEffect(() => {
    if (!rootRef.current) return;
    if (!motionOk) {
      gsap.set([nameARef.current, nameBRef.current], { visibility: 'visible' });
      return;
    }
    const ctx = gsap.context(() => {
      const lights = gsap.utils.toArray<HTMLElement>('.tape-light');

      document.fonts.ready.then(() => {
        if (!nameARef.current || !nameBRef.current) return;
        // Timeline must be created here: an empty timeline completes instantly,
        // and tweens added after fonts.ready would join a finished playhead.
        const tl = gsap.timeline();
        const splitA = new SplitText(nameARef.current, { type: 'chars' });
        const splitB = new SplitText(nameBRef.current, { type: 'chars' });
        gsap.set([nameARef.current, nameBRef.current], { visibility: 'visible' });

        // Lights on, one by one
        lights.forEach((light, i) => {
          tl.to(light, { backgroundColor: 'var(--terracotta)', duration: 0.06 }, 0.22 * i);
        });
        // Hold — randomized like the real start procedure
        const hold = 0.35 + Math.random() * 0.5;
        // Lights out, all at once
        tl.to(lights, { backgroundColor: 'transparent', duration: 0.05 }, 0.22 * LIGHT_COUNT + hold);
        // Names launch from opposite edges
        tl.from(splitA.chars, {
          yPercent: 110,
          duration: 0.8,
          stagger: { each: Math.min(0.035, 0.24 / splitA.chars.length) },
          ease: 'power4.out',
        }, '>-0.02');
        tl.from(splitB.chars, {
          yPercent: 110,
          duration: 0.8,
          stagger: { each: Math.min(0.035, 0.24 / splitB.chars.length), from: 'end' },
          ease: 'power4.out',
        }, '<');
        // Meta + title counts
        tl.from('.tape-meta', { autoAlpha: 0, y: 8, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, '<0.25');
        gsap.utils.toArray<HTMLElement>('.tape-champ').forEach((el) => {
          const target = Number(el.dataset.val ?? 0);
          const obj = { v: 0 };
          tl.to(obj, {
            v: target,
            duration: 1.2,
            ease: 'expo.out',
            onUpdate() { el.textContent = String(Math.round(obj.v)); },
          }, '<');
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk, pairKey]);

  return (
    <div ref={rootRef} className="border-b border-border px-5 py-7 md:py-9">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-start">
        <Side side={a} alignRight={false} nameRef={nameARef} titlesLabel={t('titles')} />

        {/* Start-light gantry + VS */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: LIGHT_COUNT }).map((_, i) => (
              <span
                key={i}
                className="tape-light w-3 h-3 md:w-4 md:h-4 border border-border-subtle"
                style={{ backgroundColor: 'transparent' }}
              />
            ))}
          </div>
          <span className="font-mono text-[11px] text-text-3 uppercase tracking-[0.2em]">
            {t('vs')}
          </span>
        </div>

        <Side side={b} alignRight nameRef={nameBRef} titlesLabel={t('titles')} />
      </div>
    </div>
  );
}
