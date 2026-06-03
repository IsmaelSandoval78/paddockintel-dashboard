import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import type { HomeNextRace } from '@/lib/types';

const NEU_SHADOW = '6px 6px 12px rgba(5,5,5,0.12), -4px -4px 8px rgba(255,255,255,0.7)';

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export default function NextRaceCard({ race }: { race: HomeNextRace | null }) {
  const t = useTranslations('hub.home');

  if (!race) {
    return (
      <div
        className="rounded-xl p-6"
        style={{ background: 'var(--bg)', boxShadow: NEU_SHADOW }}
      >
        <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-4">
          [ NEXT RACE ]
        </p>
        <p className="font-mono text-[13px] text-text-3">{t('noRace')}</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-0"
      style={{ background: 'var(--bg)', boxShadow: NEU_SHADOW }}
    >
      {/* ASCII label */}
      <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-4">
        [ NEXT RACE ]
      </p>

      {/* Round */}
      <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.1em] mb-1">
        RD.{String(race.round).padStart(2, '0')}
      </p>

      {/* Circuit name — display hero */}
      <h2
        className="text-[clamp(1.4rem,2.5vw,1.6rem)] uppercase leading-[0.92] tracking-[-0.02em] text-text-1"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        {race.circuit_name}
      </h2>

      {/* Location · Country */}
      <p className="font-mono text-[11px] text-text-2 mt-2">
        {race.location} · {race.country}
      </p>

      {/* Divider */}
      <div className="my-4" style={{ height: '1px', background: 'var(--border-subtle)' }} />

      {/* Date */}
      <p
        className="text-[20px] tabular-nums leading-none text-text-1"
        style={{ fontFamily: 'var(--pi-display)' }}
      >
        {formatDate(race.date)}
      </p>

      {/* Countdown */}
      <p
        className="font-mono text-[11px] uppercase tracking-[0.06em] mt-1"
        style={{ color: race.days_remaining === 0 ? 'var(--red)' : 'var(--red)' }}
      >
        {race.days_remaining === 0
          ? t('raceDay').toUpperCase()
          : t('inDays', { days: race.days_remaining }).toUpperCase()}
      </p>

      {/* CTA */}
      <Link
        href={`/circuits/${race.circuit_ref}`}
        className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-text-1 transition-colors duration-100 mt-5 block"
      >
        [ {t('viewCircuit').toUpperCase()} → ]
      </Link>
    </div>
  );
}
