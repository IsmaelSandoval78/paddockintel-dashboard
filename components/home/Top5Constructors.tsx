import { useTranslations } from 'next-intl';
import type { HomeConstructorRow } from '@/lib/types';

const NEU_SHADOW = '6px 6px 12px rgba(5,5,5,0.12), -4px -4px 8px rgba(255,255,255,0.7)';

const TEAM_COLORS: Record<string, string> = {
  mercedes:     'var(--team-mercedes)',
  mclaren:      'var(--team-mclaren)',
  red_bull:     'var(--team-redbull)',
  ferrari:      'var(--team-ferrari)',
  alpine:       'var(--team-alpine)',
  aston_martin: 'var(--team-aston)',
  haas:         'var(--team-haas)',
  williams:     'var(--team-williams)',
  sauber:       'var(--team-sauber)',
  kick_sauber:  'var(--team-sauber)',
  rb:           'var(--team-rb)',
  alphatauri:   'var(--team-rb)',
};

function teamColor(ref: string): string {
  return TEAM_COLORS[ref] ?? 'var(--text-3)';
}

export default function Top5Constructors({ constructors }: { constructors: HomeConstructorRow[] }) {
  const t = useTranslations('hub.home');

  const leaderPoints = constructors[0]?.points ?? 1;

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg)', boxShadow: NEU_SHADOW }}
    >
      {/* ASCII section label */}
      <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-4">
        02 · {t('top5').toUpperCase()}
      </p>

      {constructors.length === 0 ? (
        <p className="font-mono text-[13px] text-text-3">[ AWAITING DATA ]</p>
      ) : (
        <div className="flex flex-col gap-3">
          {constructors.map((c) => {
            const color = teamColor(c.constructor_ref);
            const pct = Math.round((c.points / leaderPoints) * 100);

            return (
              <div key={c.constructor_id}>
                <div className="flex items-center gap-2 mb-1.5">
                  {/* POS */}
                  <span className="font-mono text-[11px] text-text-3 tabular-nums w-4 shrink-0">
                    {c.position}
                  </span>

                  {/* DOT */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />

                  {/* NAME */}
                  <span className="font-mono text-[13px] text-text-1 flex-1 min-w-0 truncate">
                    {c.name}
                  </span>

                  {/* PTS */}
                  <span
                    className="tabular-nums text-[16px] shrink-0 text-text-1"
                    style={{ fontFamily: 'var(--pi-display)' }}
                  >
                    {c.points}
                  </span>
                </div>

                {/* Proportional bar — --radius-sm per DESIGN.md v3.0.0 */}
                <div
                  className="h-[3px] ml-[24px]"
                  style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)' }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
