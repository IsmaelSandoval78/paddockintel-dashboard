import type { QualiDominance } from '@/lib/raceHighlights';

// Front-row track dominance: the circuit drawn from the pole lap, each corner section coloured by
// who was faster through it (pole-sitter warm, challenger ice), the gap at every section boundary,
// and the section-by-section table. Server-rendered SVG, zero client JS. Data from
// race_highlights.py `qualiDominance` (laps aligned on official sector times).

type Labels = {
  title: string;
  sub: string;
  badge: string;
  gapTitle: string;
  ahead: (driver: string) => string;
  sectorEnd: (n: number) => string;
  caption: string;
  mapAria: string;
  gapAria: string;
  source: string;
};

type Props = { data: QualiDominance; labels: Labels; format: (n: number) => string; highlightCorner?: string };

const PAD = 70;
const GW = 420;
const GH = 240;
const GL = 46;
const GR = 14;
const GT = 14;
const GB = 28;

export default function TrackDominance({ data, labels, format, highlightCorner }: Props) {
  const a = data.pole.driver;
  const colour = (driver: string) => (driver === a ? 'var(--dusk-warm)' : 'var(--dusk-ice)');
  const gaps = data.gapAtBoundaries;
  const lim = Math.max(0.1, Math.ceil(Math.max(...gaps.map(Math.abs)) * 10) / 10);
  const gx = (d: number) => GL + (d / data.lapLength) * (GW - GL - GR);
  const gy = (v: number) => GT + (1 - (v + lim) / (2 * lim)) * (GH - GT - GB);
  const linePts = gaps.map((v, i) => `${gx(data.boundaries[i]).toFixed(1)},${gy(v).toFixed(1)}`);
  const area = `M${gx(data.boundaries[0])},${gy(0)} L${linePts.join(' L')} L${gx(data.boundaries[data.boundaries.length - 1])},${gy(0)} Z`;
  const last = gaps[gaps.length - 1];
  const sectionsWithCorners = data.sections.filter((s) => s.corners.length);

  return (
    <figure className="dusk-island dusk-card m-0 my-8 p-5 sm:p-6 flex flex-col gap-4 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold m-0 text-[color:var(--dusk-ink)]">{labels.title}</h3>
          <p className="text-[13px] text-[color:var(--dusk-muted)] mt-0.5 mb-0">{labels.sub}</p>
        </div>
        <span className="dusk-delta dusk-delta-warm">{labels.badge}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-5 items-center">
        <div>
          <svg
            viewBox={`${-PAD} ${-PAD} ${data.width + PAD * 2} ${data.height + PAD * 2}`}
            role="img"
            aria-label={labels.mapAria}
            className="block w-full h-auto overflow-visible"
          >
            {data.sections.map((s, i) =>
              s.path.length > 1 ? (
                <polyline key={`c-${i}`} points={s.path.map((p) => p.join(',')).join(' ')} fill="none" stroke={colour(s.faster)} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
              ) : null,
            )}
            {data.sections.map((s, i) =>
              s.path.length > 1 ? (
                <polyline key={`l-${i}`} points={s.path.map((p) => p.join(',')).join(' ')} fill="none" stroke="#0E0D12" strokeWidth="3" opacity="0.55" strokeLinecap="round" />
              ) : null,
            )}
            {data.corners.map((c) => {
              const hot = c.number === highlightCorner;
              return (
                <g key={c.number}>
                  <circle cx={c.at[0]} cy={c.at[1]} r={hot ? 27 : 20} fill={hot ? '#F3EFF2' : '#2B2733'} stroke="#0E0D12" strokeWidth="3" />
                  <text x={c.at[0]} y={c.at[1] + (hot ? 10 : 8)} textAnchor="middle" fontSize={hot ? 28 : 22} fontWeight="600" fill={hot ? '#0E0D12' : '#CFC8D2'}>
                    {c.number}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="flex flex-wrap gap-3.5 mt-2.5 text-[12.5px] text-[color:var(--dusk-muted)]">
            {[data.pole, data.challenger].map((d) => (
              <span key={d.driver} className="inline-flex items-center gap-1.5">
                <i className="inline-block w-[18px] h-1.5 rounded-sm" style={{ background: colour(d.driver) }} />
                {d.driver} {d.lapTime}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="dusk-label m-0 mb-1.5">{labels.gapTitle}</p>
          <svg viewBox={`0 0 ${GW} ${GH}`} role="img" aria-label={labels.gapAria} className="dusk-trend block w-full h-auto overflow-visible">
            <defs>
              <clipPath id="dusk-dom-above"><rect x={GL} y={GT} width={GW - GL - GR} height={gy(0) - GT} /></clipPath>
              <clipPath id="dusk-dom-below"><rect x={GL} y={gy(0)} width={GW - GL - GR} height={GH - GB - gy(0)} /></clipPath>
            </defs>
            {[-lim, 0, lim].map((v) => (
              <g key={`g-${v}`}>
                <line x1={GL} x2={GW - GR} y1={gy(v)} y2={gy(v)} stroke="var(--dusk-line)" strokeDasharray={v ? '3 5' : undefined} />
                <text x={GL - 6} y={gy(v) + 4} textAnchor="end" fontSize="11" fill="var(--dusk-muted)">{`${v > 0 ? '+' : ''}${v.toFixed(1)}s`}</text>
              </g>
            ))}
            {data.sectorEnds.map((d, i) => (
              <g key={`s-${i}`}>
                <line x1={gx(d)} x2={gx(d)} y1={GT} y2={GH - GB} stroke="rgba(255,255,255,.18)" strokeDasharray="2 4" />
                <text x={gx(d)} y={GH - 10} textAnchor="middle" fontSize="10.5" fill="var(--dusk-muted)">{labels.sectorEnd(i + 1)}</text>
              </g>
            ))}
            <text x={GL + 4} y={GT + 11} fontSize="11" fill="var(--dusk-warm)">{labels.ahead(a)}</text>
            <text x={GL + 4} y={GH - GB - 5} fontSize="11" fill="var(--dusk-ice)">{labels.ahead(data.challenger.driver)}</text>
            <path d={area} fill="rgba(240,122,69,.32)" clipPath="url(#dusk-dom-above)" />
            <path d={area} fill="rgba(143,211,255,.30)" clipPath="url(#dusk-dom-below)" />
            <polyline points={linePts.join(' ')} fill="none" stroke="var(--dusk-ink)" strokeWidth="2" strokeLinejoin="round" />
            {gaps.map((v, i) => (
              <circle key={`p-${i}`} cx={gx(data.boundaries[i])} cy={gy(v)} r="3" fill={v >= 0 ? 'var(--dusk-warm)' : 'var(--dusk-ice)'} />
            ))}
            <text x={gx(data.boundaries[data.boundaries.length - 1]) - 4} y={gy(last) - 9} textAnchor="end" fontSize="11" fill="var(--dusk-ink)">
              {`${last >= 0 ? '+' : ''}${format(last)}s`}
            </text>
          </svg>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 dusk-mono text-[11.5px] m-0">
            {sectionsWithCorners.map((s) => (
              <div key={s.corners.join('-')} className="flex justify-between gap-2 border-b border-[color:var(--dusk-line)] py-1">
                <dt className="text-[color:var(--dusk-muted)] whitespace-nowrap">T{s.corners.join('–')}</dt>
                <dd className="m-0 whitespace-nowrap" style={{ color: colour(s.faster) }}>
                  {s.faster} {format(s.gain)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <figcaption className="flex flex-col gap-2">
        <p className="text-[14.5px] leading-[1.5] text-[color:var(--dusk-ink-2)] m-0">{labels.caption}</p>
        <p className="dusk-mono text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)] m-0">{labels.source}</p>
      </figcaption>
    </figure>
  );
}
