import { Link } from '@/lib/i18n/navigation';

// Server-rendered SVG, zero client JS. The pole lap's speed trace drawn as a landscape of
// three ridges (back = smoothed ±10 samples at 62% amplitude, mid = ±4 at 82%, front = raw,
// with a glowing ridge line): every peak is a straight, every valley a corner. The featured
// article's key number sits in a sun that sets behind the ridges.

const W = 1000;
const H = 300;
const BASE = 292;
const AMP = 235;

function smooth(values: number[], radius: number): number[] {
  return values.map((_, i) => {
    const from = Math.max(0, i - radius);
    const to = Math.min(values.length - 1, i + radius);
    let sum = 0;
    for (let j = from; j <= to; j++) sum += values[j];
    return sum / (to - from + 1);
  });
}

function ridge(values: number[], min: number, max: number, scale: number): string {
  const span = max - min || 1;
  const step = W / (values.length - 1);
  return values.map((v, i) => `${(i * step).toFixed(1)},${(BASE - ((v - min) / span) * AMP * scale).toFixed(1)}`).join(' ');
}

const area = (points: string) => `M0,${H} L${points.split(' ').join(' L')} L${W},${H} Z`;

export type TerrainData = { speeds: number[]; caption: string; ariaLabel: string };

type Props = {
  kicker: string;
  title: string;
  dek: string | null;
  href: string;
  ctaLabel: string;
  keyNumber: { value: string; label: string } | null;
  terrain: TerrainData | null;
  className?: string;
};

export default function HeroLandscape({ kicker, title, dek, href, ctaLabel, keyNumber, terrain, className = '' }: Props) {
  return (
    <section className={`dusk-card dusk-hero flex flex-col justify-between ${className}`} aria-labelledby="dusk-hero-title">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-5 px-5 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-14">
        <div className="relative z-[3] min-w-0">
          <p className="dusk-mono uppercase text-[12px] tracking-[0.12em] text-[color:var(--dusk-sunset)]">{kicker}</p>
          <h2
            id="dusk-hero-title"
            className="dusk-display mt-3 leading-[1.03] tracking-[-0.02em] text-balance [overflow-wrap:anywhere] text-[clamp(1.9rem,3.6vw,3rem)]"
          >
            {title}
          </h2>
          {dek && <p className="dusk-hero-dek mt-3.5 text-[16px] sm:text-[17px] leading-[1.5] max-w-[46ch]">{dek}</p>}
          <Link href={href} className="dusk-pill mt-5 text-[14.5px]">
            {ctaLabel} <span aria-hidden="true">&nbsp;→</span>
          </Link>
        </div>
        {keyNumber && (
          <div className="relative z-[1] flex justify-center items-end">
            <div className="dusk-sun flex flex-col items-center justify-center text-center -mb-[80px] md:-mb-[110px] w-[210px] md:w-[min(300px,100%)]">
              <span className="dusk-display tabular-nums leading-none tracking-[-0.03em] text-[clamp(2rem,4.2vw,3.3rem)]">
                {keyNumber.value}
              </span>
              <span className="dusk-sun-label dusk-mono uppercase text-[10.5px] tracking-[0.12em] mt-2 max-w-[80%]">{keyNumber.label}</span>
            </div>
          </div>
        )}
      </div>

      {terrain && <TerrainFigure terrain={terrain} className="relative z-[2] m-0 -mt-[70px] md:-mt-[100px]" />}
    </section>
  );
}

// The three ridges + caption on their own, so the article cover can draw the same landscape.
export function TerrainFigure({ terrain, className = '' }: { terrain: TerrainData; className?: string }) {
  const speeds = terrain.speeds;
  if (speeds.length < 2) return null;
  const min = Math.min(...speeds);
  const max = Math.max(...speeds);
  const front = ridge(speeds, min, max, 1);
  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={terrain.ariaLabel}
        className="block w-full h-[170px] md:h-[250px]"
      >
        <defs>
          <linearGradient id="dusk-front-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0E0D12" stopOpacity="0.55" />
            <stop offset="1" stopColor="#0E0D12" />
          </linearGradient>
        </defs>
        <path d={area(ridge(smooth(speeds, 10), min, max, 0.62))} fill="#4A2234" opacity="0.9" />
        <path d={area(ridge(smooth(speeds, 4), min, max, 0.82))} fill="#2A1520" opacity="0.95" />
        <path d={area(front)} fill="url(#dusk-front-fill)" />
        <polyline
          points={front}
          fill="none"
          stroke="var(--dusk-warm)"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          className="dusk-glow-ridge"
        />
      </svg>
      <figcaption className="dusk-terrain-caption dusk-mono uppercase text-[10.5px] leading-[1.5] tracking-[0.06em] px-5 pb-4 pt-1 bg-[color:var(--dusk-ground)] md:bg-transparent md:absolute md:left-8 md:right-8 md:bottom-3.5 md:p-0">
        {terrain.caption}
      </figcaption>
    </figure>
  );
}
