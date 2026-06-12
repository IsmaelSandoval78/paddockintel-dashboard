'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export default function KineticFooter({ motionOk }: { motionOk: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!motionOk) return;
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        if (!markRef.current) return;
        const split = new SplitText(markRef.current, { type: 'chars' });
        gsap.set(markRef.current, { visibility: 'visible' });
        gsap.from(split.chars, {
          yPercent: 110,
          duration: 0.8,
          stagger: 0.02,
          ease: 'power4.out',
          scrollTrigger: { trigger: markRef.current, start: 'top 92%', once: true },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk]);

  return (
    <footer ref={rootRef} className="border-t border-border px-5 md:px-10 pt-10 pb-6 overflow-hidden">
      {/* Wordmark at viewport scale */}
      <div className="kinetic-mask -my-[0.06em] py-[0.06em]">
        <p
          ref={markRef}
          className="uppercase leading-[0.85] whitespace-nowrap select-none"
          style={{
            fontFamily:    'var(--pi-display)',
            fontSize:      'clamp(38px, 9.2vw, 150px)',
            letterSpacing: '-0.04em',
            visibility:    motionOk ? 'hidden' : 'visible',
          }}
        >
          PADDOCKINTEL
        </p>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em]">
          © PADDOCKINTEL · MMXXVI
        </span>
        <span className="font-mono text-[9px] text-text-3 uppercase tracking-[0.14em] flex items-center gap-1.5">
          <span className="pulse-red inline-block w-1.5 h-1.5 rounded-full bg-red" />
          DATA · CONTEXT · EDGE
        </span>
      </div>
    </footer>
  );
}
