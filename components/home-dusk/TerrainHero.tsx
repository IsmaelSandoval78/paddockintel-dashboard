import type { ReactNode } from 'react';
import { Link } from '@/lib/i18n/navigation';

// Server-rendered SVG, zero client JS (same discipline as components/blog/charts/*).
// The pole lap's speed trace drawn as three ridges: back = smoothed ±10 samples at 62% of the
// front ridge's amplitude, mid = ±4 samples at 82%, front = the raw trace with a glowing line.
// Every peak is a straight, every valley a corner.

const W = 1000;
const H = 300;
const BASE = 280;
const AMP = 220;

function smooth(values: number[], radius: number): number[] {
  return values.map((_, i) => {
    const from = Math.max(0, i - radius);
    const to = Math.min(values.length - 1, i + radius);
    let sum = 0;
    for (let j = from; j <= to; j++) sum += values[j];
    return sum / (to - from + 1);
  });
}

function ridgePoints(values: number[], min: number, max: number, scale: number): string {
  const span = max - min || 1;
  const step = W / (values.length - 1);
  return values
    .map((v, i) => `${(i * step).toFixed(1)},${(BASE - ((v - min) / span) * AMP * scale).toFixed(1)}`)
    .join(' ');
}

function areaPath(points: string): string {
  return `M0,${H} L${points.split(' ').join(' L')} L${W},${H} Z`;
}

export type TerrainData = {
  speeds: number[];
  caption: string;
  ariaLabel: string;
};

type Props = {
  kicker: string;
  title: string;
  dek: string | null;
  href: string;
  ctaLabel: string;
  keyNumber: { value: string; label: string } | null;
  terrain: TerrainData | null;
  // Rendered under the key number (the circuit map).
  aside?: ReactNode;
};

export default function TerrainHero({ kicker, title, dek, href, ctaLabel, keyNumber, terrain, aside }: Props) {
  const speeds = terrain?.speeds ?? [];
  const hasTerrain = speeds.length > 1;
  const min = hasTerrain ? Math.min(...speeds) : 0;
  const max = hasTerrain ? Math.max(...speeds) : 0;
  const front = hasTerrain ? ridgePoints(speeds, min, max, 1) : '';
  const mid = hasTerrain ? ridgePoints(smooth(speeds, 4), min, max, 0.82) : '';
  const back = hasTerrain ? ridgePoints(smooth(speeds, 10), min, max, 0.62) : '';

  return (
    <section className="dusk-hero relative overflow-hidden flex flex-col justify-between min-h-[420px] md:min-h-[560px]">
      <div className="relative z-10 px-5 pt-6 sm:px-9 sm:pt-9 flex flex-wrap gap-7 justify-between items-start">
        <div className="flex-[1_1_420px] max-w-[640px] min-w-0">
          <p className="dusk-mono uppercase text-[12px] sm:text-[13px] tracking-[0.12em] text-[color:var(--dusk-sunset)]">{kicker}</p>
          <h2
            className="dusk-display mt-3 leading-[1.04] tracking-[-0.02em] text-balance [overflow-wrap:anywhere]"
            style={{ fontSize: 'clamp(2rem, 4.6vw, 3.4rem)' }}
          >
            {title}
          </h2>
          {dek && <p className="mt-4 text-[16px] sm:text-[18px] leading-[1.5] text-[#E4D9D2] max-w-[540px]">{dek}</p>}
          <Link href={href} className="dusk-pill mt-6 text-[15px]">
            {ctaLabel}
          </Link>
        </div>
        {(keyNumber || aside) && (
          <div className="flex-[1_1_260px] min-w-0">
            {keyNumber && (
              <>
                <p
                  className="dusk-display dusk-number-glow leading-[0.9] tracking-[-0.03em] text-white tabular-nums"
                  style={{ fontSize: 'clamp(3.2rem, 7.5vw, 5.5rem)' }}
                >
                  {keyNumber.value}
                </p>
                <p className="dusk-mono uppercase mt-2 text-[12px] tracking-[0.08em] text-[#F4E3D7]">{keyNumber.label}</p>
              </>
            )}
            {aside}
          </div>
        )}
      </div>

      {hasTerrain && terrain && (
        <figure className="relative m-0 mt-6 h-[220px] sm:h-[300px]">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={terrain.ariaLabel}
            className="block"
          >
            <defs>
              <linearGradient id="dusk-front-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0D0E12" stopOpacity="0.55" />
                <stop offset="1" stopColor="#0D0E12" />
              </linearGradient>
            </defs>
            <path d={areaPath(back)} fill="#3A1B2C" opacity="0.85" />
            <path d={areaPath(mid)} fill="#22141F" opacity="0.9" />
            <path d={areaPath(front)} fill="url(#dusk-front-fill)" />
            <polyline
              points={front}
              fill="none"
              stroke="var(--dusk-warm)"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              className="dusk-glow-warm"
            />
          </svg>
          <figcaption className="dusk-mono uppercase absolute left-5 sm:left-9 right-5 bottom-4 text-[11px] leading-[1.5] tracking-[0.04em] text-[color:var(--dusk-muted)]">
            {terrain.caption}
          </figcaption>
        </figure>
      )}
    </section>
  );
}
