import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import type { HomeConstructorOfDay } from '@/lib/types';

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

export default function ConstructorOfTheDay({ constructor: c }: { constructor: HomeConstructorOfDay | null }) {
  const t = useTranslations('hub.home');

  if (!c) {
    return (
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--bg)', boxShadow: NEU_SHADOW }}
      >
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">
          [ CONSTRUCTOR OF THE DAY ]
        </p>
      </div>
    );
  }

  const color = teamColor(c.constructor_ref);

  return (
    <div
      className="rounded-xl p-5 flex flex-col"
      style={{ background: 'var(--bg)', boxShadow: NEU_SHADOW }}
    >
      {/* ASCII label */}
      <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-4">
        [ CONSTRUCTOR OF THE DAY ]
      </p>

      {/* Team dot (32px) + name */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="shrink-0 rounded-full"
          style={{ width: '32px', height: '32px', backgroundColor: color }}
        />
        <div className="min-w-0">
          <h2
            className="text-[28px] uppercase leading-[0.92] tracking-[-0.02em] text-text-1"
            style={{ fontFamily: 'var(--pi-display)' }}
          >
            {c.name}
          </h2>
          <p className="font-mono text-[11px] text-text-2 mt-1 uppercase tracking-[0.06em]">
            {c.nationality}
          </p>
        </div>
      </div>

      {/* Stats — 4 columns */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: t('races').toUpperCase(), value: c.races },
          { label: t('wins').toUpperCase(), value: c.wins },
          { label: t('from').toUpperCase(), value: c.first_year },
          { label: t('to').toUpperCase(), value: c.last_year },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] mb-1">
              {label}
            </p>
            <p
              className="tabular-nums leading-none text-text-1"
              style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)' }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href={`/constructors/${c.constructor_ref}`}
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-100"
      >
        [ {t('viewConstructor').toUpperCase()} → ]
      </Link>
    </div>
  );
}
