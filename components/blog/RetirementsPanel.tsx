import { getTranslations } from 'next-intl/server';

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

interface Retirement {
  forename: string;
  surname: string;
  constructor_name: string;
  constructor_ref: string;
  lap: number;
  status: string;
}

function teamColor(ref: string): string {
  return TEAM_COLORS[ref] ?? 'var(--text-3)';
}

interface RetirementsPanelProps {
  retirements: Retirement[];
}

export default async function RetirementsPanel({ retirements }: RetirementsPanelProps) {
  const t = await getTranslations('magazine.retirements');

  return (
    <div>
      <h2
        className="font-display uppercase text-text-1 tracking-[-0.02em] mb-6"
        style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
      >
        {t('title')}
      </h2>

      {retirements.length === 0 ? (
        <p className="font-mono text-[11px] text-text-3 uppercase tracking-[0.1em]">{t('none')}</p>
      ) : (
        <div>
          {retirements.map((r, i) => (
            <div
              key={`${r.surname}-${i}`}
              className="grid grid-cols-[1fr_auto] items-center gap-4 py-2 border-b border-border-subtle last:border-b-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 shrink-0" style={{ backgroundColor: teamColor(r.constructor_ref) }} />
                <span className="font-sans text-sm text-text-1 truncate">
                  {r.forename} {r.surname}
                </span>
                <span className="font-mono text-[11px] text-text-2 shrink-0 hidden sm:inline">
                  {r.constructor_name}
                </span>
              </div>
              <span className="font-mono text-[11px] text-text-3 tabular-nums shrink-0">
                {/* lap 0 means the loader didn't record a real lap count for this
                    race (confirmed: every driver in it shows laps=0, not just
                    retirees) -- showing it would read as "retired before lap 1",
                    which is never true. Status alone is still real, shown either way. */}
                {r.lap > 0 ? `${t('lap', { lap: r.lap })} · ` : ''}
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
