'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link } from '@/lib/i18n/navigation';

// Zentra's insight card: one number and the line that explains it, rotating through the key
// numbers of the race-week analysis. Every slide is a stat already published (and sourced) in
// one of our articles, and links to it. Auto-advances every 7s; stops for good on hover, focus
// or a click, and never moves under prefers-reduced-motion.

export type InsightSlide = {
  key: string;
  chip: string;
  value: string;
  label: string;
  context: string | null;
  href: string;
  linkLabel: string;
};

type Props = { slides: InsightSlide[]; ariaLabel: string; pickLabels: string[]; className?: string };

const INTERVAL_MS = 7000;
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const prefersReducedMotion = () => window.matchMedia(MOTION_QUERY).matches;
function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia(MOTION_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export default function InsightCarousel({ slides, ariaLabel, pickLabels, className = '' }: Props) {
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  // Server render and reduced-motion users both get a still carousel.
  const reduced = useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => true);
  const playing = !stopped && !reduced && slides.length > 1;
  const stop = () => setStopped(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, slides.length]);

  if (!slides.length) return null;

  return (
    <section
      className={`dusk-card dusk-insight flex flex-col justify-between gap-5 p-5 sm:p-6 ${className}`}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={stop}
      onFocus={stop}
    >
      <div className="grid flex-1">
        {slides.map((s, i) => (
          <article
            key={s.key}
            aria-roledescription="slide"
            aria-hidden={i !== index}
            className={`dusk-slide [grid-area:1/1] flex flex-col gap-3 ${i === index ? 'opacity-100' : 'opacity-0 translate-y-2 pointer-events-none'}`}
          >
            <span className="dusk-insight-chip dusk-mono uppercase self-start text-[11px] tracking-[0.08em]">{s.chip}</span>
            <p className="dusk-display tabular-nums leading-[0.95] tracking-[-0.03em] mt-4 text-[clamp(3rem,5.6vw,4.4rem)]">{s.value}</p>
            <p className="dusk-mono uppercase text-[12.5px] leading-[1.45] tracking-[0.06em] text-[color:var(--dusk-peach)]">{s.label}</p>
            {s.context && <p className="dusk-insight-more text-[15px] leading-[1.45]">{s.context}</p>}
            <Link href={s.href} tabIndex={i === index ? 0 : -1} className="mt-auto text-[14px] font-semibold text-[color:var(--dusk-ink)] underline underline-offset-4 decoration-[color:var(--dusk-peach)] hover:text-[color:var(--dusk-peach)]">
              {s.linkLabel}
            </Link>
          </article>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="flex gap-1.5" role="tablist" aria-label={ariaLabel}>
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={pickLabels[i]}
              onClick={() => {
                setIndex(i);
                stop();
              }}
              className="flex-1 h-7 flex items-center cursor-pointer bg-transparent border-0 p-0"
            >
              <span className="dusk-progress block w-full h-[3px] rounded-full overflow-hidden">
                <span
                  key={`${s.key}-${index}-${playing}`}
                  data-playing={playing && i === index ? 'true' : 'false'}
                  className={`dusk-progress-fill block h-full ${i === index ? (playing ? 'w-0' : 'w-full') : 'w-0'}`}
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
