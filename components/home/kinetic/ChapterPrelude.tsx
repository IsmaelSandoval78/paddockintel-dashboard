'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ChapterPreludeProps {
  number: string;
  eyebrow: string;
  title: string;
  copy: string;
  motionOk: boolean;
}

export default function ChapterPrelude({ number, eyebrow, title, copy, motionOk }: ChapterPreludeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!motionOk) return;
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        yPercent: 35,
        autoAlpha: 0,
        duration: 0.9,
        ease: 'power4.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 72%', once: true },
      });
      gsap.fromTo(ruleRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'left',
          duration: 1.1,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: rootRef.current, start: 'top 72%', once: true },
        },
      );
    }, rootRef);
    return () => ctx.revert();
  }, [motionOk]);

  return (
    <div ref={rootRef} className="relative overflow-hidden border-t border-border px-5 md:px-10 py-14 md:py-24">
      <span
        className="absolute -right-3 -top-8 select-none tabular-nums leading-none text-terracotta opacity-[0.10]"
        style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(130px, 24vw, 340px)' }}
        aria-hidden="true"
      >
        {number}
      </span>
      <div className="relative z-10 grid gap-8 md:grid-cols-[1fr_2fr] md:items-end">
        <div>
          <p className="font-mono text-[9px] md:text-[10px] text-text-2 uppercase tracking-[0.18em]">
            {number} / 06 · {eyebrow}
          </p>
          <p className="mt-4 max-w-[30rem] font-prose text-sm md:text-base leading-relaxed text-text-2">
            {copy}
          </p>
        </div>
        <div className="kinetic-mask">
          <h2
            ref={titleRef}
            className="uppercase leading-[0.86] text-[clamp(44px,8vw,118px)]"
            style={{ fontFamily: 'var(--pi-display)', letterSpacing: '-0.045em' }}
          >
            {title}
          </h2>
        </div>
      </div>
      <div ref={ruleRef} className="relative z-10 mt-10 h-1 bg-terracotta" />
    </div>
  );
}
