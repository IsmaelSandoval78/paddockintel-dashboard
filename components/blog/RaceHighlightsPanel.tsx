import { getTranslations } from 'next-intl/server';
import type { RaceHighlights, RaceHighlightMover } from '@/app/[locale]/(blog)/magazine-home/data';

const TEAM_COLORS: Record<string, string> = {
  mercedes: 'var(--team-mercedes)',
  mclaren: 'var(--team-mclaren)',
  red_bull: 'var(--team-redbull)',
  ferrari: 'var(--team-ferrari)',
  alpine: 'var(--team-alpine)',
  aston_martin: 'var(--team-aston)',
  haas: 'var(--team-haas)',
  williams: 'var(--team-williams)',
  sauber: 'var(--team-sauber)',
  kick_sauber: 'var(--team-sauber)',
  rb: 'var(--team-rb)',
};

function teamColor(ref: string): string {
  return TEAM_COLORS[ref] ?? 'var(--text-3)';
}

// Every bar is scaled against the same maxAbsDelta, so the day's two most
// dramatic moves (e.g. a P19->P1 win) render as the two longest bars on the
// page — not just numbers in a list.
function MoverBar({ mover, maxAbsDelta }: { mover: RaceHighlightMover; maxAbsDelta: number }) {
  const up = mover.delta > 0;
  const pct = Math.round((Math.abs(mover.delta) / maxAbsDelta) * 100);
  const color = up ? 'var(--green)' : 'var(--terracotta)';

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2 border-b border-border-subtle last:border-b-0">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 shrink-0" style={{ backgroundColor: teamColor(mover.constructor_ref) }} />
          <span className="font-sans text-sm text-text-1 truncate">{mover.forename} {mover.surname}</span>
          <span className="font-mono text-[11px] tabular-nums shrink-0" style={{ color }}>
            {up ? '+' : '−'}{Math.abs(mover.delta)}
          </span>
        </div>
        <div className="h-[3px] bg-border-subtle relative">
          <div
            className="h-full absolute top-0"
            style={{ width: `${pct}%`, backgroundColor: color, [up ? 'left' : 'right']: 0 }}
          />
        </div>
      </div>
      <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0">
        P{mover.grid}→P{mover.finish}
      </span>
    </div>
  );
}

interface RaceHighlightsPanelProps {
  highlights: RaceHighlights;
}

export default async function RaceHighlightsPanel({ highlights }: RaceHighlightsPanelProps) {
  const t = await getTranslations('magazine.raceHighlights');
  if (highlights.gainers.length === 0 && highlights.fallers.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h2
          className="font-display uppercase text-text-1 tracking-[-0.02em]"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
        >
          {t('title')}
        </h2>
        {highlights.raceName && (
          <span className="font-mono text-sm uppercase tracking-[0.06em] text-text-1 shrink-0">
            {highlights.raceName}
          </span>
        )}
      </div>
      <div>
        {highlights.gainers.map((m) => (
          <MoverBar key={`g-${m.driver_id}`} mover={m} maxAbsDelta={highlights.maxAbsDelta} />
        ))}
        {highlights.fallers.map((m) => (
          <MoverBar key={`f-${m.driver_id}`} mover={m} maxAbsDelta={highlights.maxAbsDelta} />
        ))}
      </div>
    </div>
  );
}
