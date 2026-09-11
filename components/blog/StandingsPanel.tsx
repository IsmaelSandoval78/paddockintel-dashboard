import { getTranslations } from 'next-intl/server';
import type { Top5Driver, Top5Constructor } from '@/app/[locale]/(blog)/magazine-home/data';

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

interface StandingsPanelProps {
  drivers: Top5Driver[];
  constructors: Top5Constructor[];
}

export default async function StandingsPanel({ drivers, constructors }: StandingsPanelProps) {
  const t = await getTranslations('magazine.standings');
  if (drivers.length === 0 && constructors.length === 0) return null;

  const leaderDriverPts = drivers[0]?.points ?? 1;
  const leaderConstructorPts = constructors[0]?.points ?? 1;

  return (
    <section className="border-t border-b border-border py-12 md:py-16">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-display uppercase text-text-1 tracking-[-0.02em]" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
          {t('title')}
        </h2>
        <a
          href="https://hub.paddockintel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-terracotta transition-colors duration-150 shrink-0"
        >
          {t('cta')} →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-4">
            {t('drivers')}
          </p>
          <div className="flex flex-col gap-3">
            {drivers.map((d) => {
              const color = teamColor(d.constructor_ref);
              const pct = Math.round((d.points / leaderDriverPts) * 100);
              return (
                <div key={d.driver_id}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-[11px] text-text-3 tabular-nums w-4 shrink-0">
                      {d.position}
                    </span>
                    <span className="w-2 h-2 shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-sans text-sm text-text-1 flex-1 min-w-0 truncate">
                      {d.forename} {d.surname}
                    </span>
                    <span className="font-mono text-[11px] text-text-3 shrink-0 hidden sm:inline">
                      {d.constructor_name}
                    </span>
                    <span className="tabular-nums text-base shrink-0" style={{ fontFamily: 'var(--pi-display)' }}>
                      {d.points}
                    </span>
                  </div>
                  <div className="h-[2px] ml-[28px] bg-border-subtle">
                    <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-4">
            {t('constructors')}
          </p>
          <div className="flex flex-col gap-3">
            {constructors.map((c) => {
              const color = teamColor(c.constructor_ref);
              const pct = Math.round((c.points / leaderConstructorPts) * 100);
              return (
                <div key={c.constructor_id}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-[11px] text-text-3 tabular-nums w-4 shrink-0">
                      {c.position}
                    </span>
                    <span className="w-2 h-2 shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-sans text-sm text-text-1 flex-1 min-w-0 truncate">
                      {c.name}
                    </span>
                    <span className="tabular-nums text-base shrink-0" style={{ fontFamily: 'var(--pi-display)' }}>
                      {c.points}
                    </span>
                  </div>
                  <div className="h-[2px] ml-[28px] bg-border-subtle">
                    <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
