import type { ReactNode } from 'react';

// Zentra's stat cards (G/H): a big number, one line of context, a small chart and the source.
// Server-rendered; every chart is drawn from the data it's handed, never a placeholder.

type ShellProps = {
  title: string;
  sub: string;
  value: ReactNode;
  badge: string;
  badgeTone?: 'good' | 'warm';
  source: string;
  children: ReactNode;
  className?: string;
};

function KpiShell({ title, sub, value, badge, badgeTone = 'good', source, children, className = '' }: ShellProps) {
  return (
    <section className={`dusk-card flex flex-col gap-4 p-5 sm:p-6 ${className}`}>
      <div>
        <h2 className="text-[17px] font-semibold m-0">{title}</h2>
        <p className="text-[13px] text-[color:var(--dusk-muted)] mt-0.5">{sub}</p>
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <p className="dusk-display tabular-nums leading-none tracking-[-0.03em] text-[3rem]">{value}</p>
        <span className={`dusk-delta ${badgeTone === 'warm' ? 'dusk-delta-warm' : ''}`}>{badge}</span>
      </div>
      {children}
      <p className="dusk-mono text-[10.5px] tracking-[0.03em] text-[color:var(--dusk-muted)] mt-auto">{source}</p>
    </section>
  );
}

const Unit = ({ children }: { children: ReactNode }) => (
  <small className="dusk-mono text-[13px] tracking-normal text-[color:var(--dusk-muted)] ml-1.5">{children}</small>
);

export function SpeedKpi(props: {
  title: string;
  sub: string;
  topSpeed: string;
  unit: string;
  badge: string;
  speeds: number[];
  ariaLabel: string;
  source: string;
  className?: string;
}) {
  const { speeds } = props;
  const W = 300;
  const H = 64;
  const min = Math.min(...speeds);
  const max = Math.max(...speeds);
  const pts = speeds.map((v, i) => `${((i * W) / (speeds.length - 1)).toFixed(1)},${(H - 4 - ((v - min) / (max - min || 1)) * (H - 10)).toFixed(1)}`);
  return (
    <KpiShell
      title={props.title}
      sub={props.sub}
      value={<>{props.topSpeed}<Unit>{props.unit}</Unit></>}
      badge={props.badge}
      badgeTone="warm"
      source={props.source}
      className={props.className}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={props.ariaLabel} className="block w-full h-16">
        <defs>
          <linearGradient id="dusk-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F07A45" stopOpacity="0.35" />
            <stop offset="1" stopColor="#F07A45" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M0,${H} L${pts.join(' L')} L${W},${H} Z`} fill="url(#dusk-spark-fill)" />
        <polyline points={pts.join(' ')} fill="none" stroke="var(--dusk-warm)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </KpiShell>
  );
}

export function LapsLedKpi(props: {
  title: string;
  sub: string;
  laps: number;
  total: number;
  badge: string;
  // One entry per lap: did the winner lead at the end of it (from the race's own lap positions).
  led: boolean[];
  vscLaps: number[];
  ledLabel: string;
  vscLabel: string;
  ariaLabel: string;
  source: string;
  className?: string;
}) {
  const vsc = new Set(props.vscLaps);
  const columns = Math.ceil(props.total / 2);
  return (
    <KpiShell
      title={props.title}
      sub={props.sub}
      value={<>{props.laps}<Unit>/ {props.total}</Unit></>}
      badge={props.badge}
      source={props.source}
      className={props.className}
    >
      <div role="img" aria-label={props.ariaLabel} className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {props.led.map((isLed, i) => (
          <i key={i} className={`dusk-dot ${isLed ? (vsc.has(i + 1) ? 'dusk-dot-ice' : 'dusk-dot-on') : ''}`} />
        ))}
      </div>
      {props.vscLaps.length > 0 && (
        <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[12px] text-[color:var(--dusk-muted)]">
          <span className="inline-flex items-center gap-1.5"><i className="dusk-dot dusk-dot-on w-[9px]" />{props.ledLabel}</span>
          <span className="inline-flex items-center gap-1.5"><i className="dusk-dot dusk-dot-ice w-[9px]" />{props.vscLabel}</span>
        </div>
      )}
    </KpiShell>
  );
}

export function PoleToWinKpi(props: {
  title: string;
  sub: string;
  wins: number;
  races: number;
  badge: string;
  history: Array<{ year: number; grid: number; title: string }>;
  currentYear: number;
  ariaLabel: string;
  source: string;
  className?: string;
}) {
  const first = props.history[0]?.year;
  const last = props.history[props.history.length - 1]?.year;
  return (
    <KpiShell
      title={props.title}
      sub={props.sub}
      value={<>{props.wins}<Unit>/ {props.races}</Unit></>}
      badge={props.badge}
      badgeTone="warm"
      source={props.source}
      className={props.className}
    >
      <div>
        <div role="img" aria-label={props.ariaLabel} className="grid gap-1 items-end" style={{ gridTemplateColumns: `repeat(${props.history.length}, minmax(0, 1fr))` }}>
          {props.history.map((h) => (
            <i
              key={h.year}
              title={h.title}
              className={`dusk-dot ${h.grid === 1 ? 'dusk-dot-on' : ''} ${h.year === props.currentYear ? 'dusk-dot-now' : ''}`}
            />
          ))}
        </div>
        <div className="flex justify-between dusk-mono text-[10px] text-[color:var(--dusk-muted)] mt-2">
          <span>{first}</span>
          <span>{last}</span>
        </div>
      </div>
    </KpiShell>
  );
}
