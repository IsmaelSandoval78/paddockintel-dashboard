import { getTranslations } from 'next-intl/server';
import type { Mover, MoversResult } from '@/app/[locale]/(blog)/magazine-home/data';

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

function MoverCard({ label, mover }: { label: string; mover: Mover }) {
  const sign = mover.positionDelta > 0 ? '+' : '−';
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-3">
        {label}
      </p>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 shrink-0" style={{ backgroundColor: teamColor(mover.constructor_ref) }} />
        <span className="font-sans text-sm text-text-1 truncate">{mover.name}</span>
      </div>
      <span
        className="tabular-nums block leading-none"
        style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }}
      >
        {sign}{Math.abs(mover.positionDelta)}
      </span>
      <p className="font-mono text-[11px] text-text-3 tabular-nums mt-1">
        P{mover.prevPosition} → P{mover.position}
      </p>
    </div>
  );
}

interface MoversPanelProps {
  movers: MoversResult;
}

export default async function MoversPanel({ movers }: MoversPanelProps) {
  const t = await getTranslations('magazine.movers');
  const cards: Array<{ key: string; label: string; mover: Mover }> = [
    movers.driverRiser && { key: 'driverRiser', label: t('driverRiser'), mover: movers.driverRiser },
    movers.driverFaller && { key: 'driverFaller', label: t('driverFaller'), mover: movers.driverFaller },
    movers.constructorRiser && { key: 'constructorRiser', label: t('constructorRiser'), mover: movers.constructorRiser },
    movers.constructorFaller && { key: 'constructorFaller', label: t('constructorFaller'), mover: movers.constructorFaller },
  ].filter((c): c is { key: string; label: string; mover: Mover } => Boolean(c));

  if (cards.length === 0) return null;

  return (
    <section className="border-b border-border py-12 md:py-16">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-display uppercase text-text-1 tracking-[-0.02em]" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
          {t('title')}
        </h2>
        {movers.raceName && (
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 shrink-0">
            {movers.raceName}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
        {cards.map((c) => (
          <MoverCard key={c.key} label={c.label} mover={c.mover} />
        ))}
      </div>
    </section>
  );
}
