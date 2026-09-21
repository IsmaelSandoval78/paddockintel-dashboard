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
  /** Narrow-column rendering — drivers stacked above constructors (never
   * side by side) and no outer glass panel/padding, for use as a bento
   * tile whose parent already supplies those. */
  compact?: boolean;
}

export default async function StandingsPanel({ drivers, constructors, compact = false }: StandingsPanelProps) {
  const t = await getTranslations('magazine.standings');
  if (drivers.length === 0 && constructors.length === 0) return null;

  const leaderDriverPts = drivers[0]?.points ?? 1;
  const leaderConstructorPts = constructors[0]?.points ?? 1;

  if (compact) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-6 flex items-baseline justify-between gap-3">
          <h2 className="font-sans font-semibold text-text-1 tracking-[-0.01em] text-lg">
            {t('title')}
          </h2>
          <a
            href="https://hub.paddockintel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-2 hover:text-accent transition-colors duration-150 shrink-0"
          >
            {t('cta')} →
          </a>
        </div>
        <div className="flex flex-col gap-8 flex-1">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-4">{t('drivers')}</p>
            <div className="flex flex-col gap-2.5">
              {drivers.map((d) => (
                <div key={d.driver_id} className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] text-text-3 tabular-nums w-4 shrink-0">{d.position}</span>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: teamColor(d.constructor_ref) }} />
                  <span className="font-sans text-sm text-text-1 flex-1 min-w-0 truncate">{d.forename} {d.surname}</span>
                  <span className="font-sans font-bold tabular-nums text-sm shrink-0">{d.points}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-4">{t('constructors')}</p>
            <div className="flex flex-col gap-2.5">
              {constructors.map((c) => (
                <div key={c.constructor_id} className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] text-text-3 tabular-nums w-4 shrink-0">{c.position}</span>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: teamColor(c.constructor_ref) }} />
                  <span className="font-sans text-sm text-text-1 flex-1 min-w-0 truncate">{c.name}</span>
                  <span className="font-sans font-bold tabular-nums text-sm shrink-0">{c.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="glass-panel p-8 md:p-10">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-sans font-semibold text-text-1 tracking-[-0.01em]" style={{ fontSize: 'clamp(1.35rem, 2.6vw, 1.75rem)' }}>
          {t('title')}
        </h2>
        <a
          href="https://hub.paddockintel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-accent transition-colors duration-150 shrink-0"
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
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-mono text-[11px] text-text-3 tabular-nums w-4 shrink-0">
                      {d.position}
                    </span>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-sans text-sm text-text-1 flex-1 min-w-0 truncate">
                      {d.forename} {d.surname}
                    </span>
                    <span className="font-mono text-[11px] text-text-3 shrink-0 hidden sm:inline">
                      {d.constructor_name}
                    </span>
                    <span className="flex flex-col items-end shrink-0">
                      <span className="font-sans font-bold tabular-nums text-base leading-none">
                        {d.points}
                      </span>
                      <span
                        className="font-mono text-[9px] tabular-nums tracking-[0.04em] mt-1"
                        style={{ color: d.position === 1 ? 'var(--text-2)' : 'var(--accent)' }}
                      >
                        {d.position === 1 ? t('leader') : `−${leaderDriverPts - d.points}`}
                      </span>
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full ml-[28px] bg-border-subtle overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
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
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-mono text-[11px] text-text-3 tabular-nums w-4 shrink-0">
                      {c.position}
                    </span>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-sans text-sm text-text-1 flex-1 min-w-0 truncate">
                      {c.name}
                    </span>
                    <span className="flex flex-col items-end shrink-0">
                      <span className="font-sans font-bold tabular-nums text-base leading-none">
                        {c.points}
                      </span>
                      <span
                        className="font-mono text-[9px] tabular-nums tracking-[0.04em] mt-1"
                        style={{ color: c.position === 1 ? 'var(--text-2)' : 'var(--accent)' }}
                      >
                        {c.position === 1 ? t('leader') : `−${leaderConstructorPts - c.points}`}
                      </span>
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full ml-[28px] bg-border-subtle overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
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
