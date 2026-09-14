import { getTranslations } from 'next-intl/server';

interface RaceDayFastestPanelProps {
  fastestLap: { forename: string; surname: string; time: string } | null;
  fastestPit: { forename: string; surname: string; constructor_name: string; duration: string } | null;
}

export default async function RaceDayFastestPanel({ fastestLap, fastestPit }: RaceDayFastestPanelProps) {
  const t = await getTranslations('magazine.fastestFacts');
  if (!fastestLap && !fastestPit) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-xl mx-auto text-center">
      {fastestLap && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-3">{t('lap')}</p>
          <p
            className="tabular-nums leading-none"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.6rem, 2.6vw, 2.1rem)', color: 'var(--terracotta)' }}
          >
            {fastestLap.time}
          </p>
          <p className="font-sans text-sm text-text-1 mt-2">
            {fastestLap.forename} {fastestLap.surname}
          </p>
        </div>
      )}
      {fastestPit && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-2 mb-3">{t('pit')}</p>
          <p
            className="tabular-nums leading-none"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.6rem, 2.6vw, 2.1rem)', color: 'var(--terracotta)' }}
          >
            {fastestPit.duration}
          </p>
          <p className="font-sans text-sm text-text-1 mt-2">
            {fastestPit.forename} {fastestPit.surname}
            {fastestPit.constructor_name && <span className="text-text-2"> · {fastestPit.constructor_name}</span>}
          </p>
        </div>
      )}
    </div>
  );
}
