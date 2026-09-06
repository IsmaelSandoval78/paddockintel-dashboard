import { getTranslations } from 'next-intl/server';
import EpicenterMap, { type EpicenterEvent } from '@/components/circuits/EpicenterMap';

interface LastRaceArticle {
  title: string;
  metaDescription: string;
  href: string;
}

interface CircuitOverviewProps {
  name: string;
  location: string;
  country: string;
  firstYear: number | null;
  totalRaces: number;
  rankLapRecord: { time: string; forename: string; surname: string; year: number } | null;
  topWinDriver: { forename: string; surname: string; wins: number } | null;
  trackPathData: { path: string; viewBox: string } | null;
  event: EpicenterEvent | null;
  lastRaceArticle: LastRaceArticle | null;
}

// Vintage Editorial overview block, prepended above the existing (untouched)
// CircuitDetailExperience — same featured-card pattern as the /circuits index
// (app/[locale]/(hub)/circuits/page.tsx): epicenter map, name/stat band, then a last-race
// recap that only renders when a real published article is linked to that race (never a
// placeholder or a broken link).
export default async function CircuitOverview({
  name,
  location,
  country,
  firstYear,
  totalRaces,
  rankLapRecord,
  topWinDriver,
  trackPathData,
  event,
  lastRaceArticle,
}: CircuitOverviewProps) {
  const t = await getTranslations('circuits');
  const tRecap = await getTranslations('circuitDetail.recap');

  return (
    <section className="border-b border-border px-6 py-10 flex flex-col items-center gap-6">
      <EpicenterMap name={name} trackPathData={trackPathData} event={event} />

      <div className="text-center">
        <h1
          className="uppercase leading-none tracking-[-0.02em] text-text-1"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2rem, 5vw, 3rem)' }}
        >
          {name}
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-2 mt-2">
          {location} · {country}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-md pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex flex-col items-center text-center">
          <p
            className="tabular-nums leading-none text-text-1"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)' }}
          >
            {firstYear ?? '—'}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-2 mt-1">
            {t('featured.since')} · {totalRaces} {t('list.races')}
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <p
            className="tabular-nums leading-none"
            style={{ fontFamily: 'var(--pi-mono)', fontSize: 'clamp(1.1rem, 2.6vw, 1.4rem)', color: 'var(--terracotta)' }}
          >
            {rankLapRecord?.time ?? '—'}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-2 mt-1">
            {rankLapRecord
              ? `${t('panel.fastestLap')} · ${rankLapRecord.forename[0]}. ${rankLapRecord.surname} · ${rankLapRecord.year}`
              : t('panel.fastestLap')}
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <p
            className="tabular-nums leading-none text-text-1"
            style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)' }}
          >
            {topWinDriver?.wins ?? '—'}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-2 mt-1">
            {topWinDriver
              ? `${t('panel.mostWins')} · ${topWinDriver.forename[0]}. ${topWinDriver.surname}`
              : t('panel.mostWins')}
          </p>
        </div>
      </div>

      {lastRaceArticle && (
        <a
          href={lastRaceArticle.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-md pt-6 flex flex-col gap-2 hover:opacity-80 transition-opacity duration-150"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-3">
            {tRecap('title')}
          </p>
          <p className="text-[14px] text-text-1 leading-snug">{lastRaceArticle.title}</p>
          <p className="text-[12px] text-text-2 leading-relaxed">{lastRaceArticle.metaDescription}</p>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--terracotta)' }}>
            {tRecap('readMore')} →
          </span>
        </a>
      )}

      <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-3">
        SOURCE: SUPABASE (circuits, results{event ? ', circuit_corners' : ''}{lastRaceArticle ? ', articles' : ''})
      </p>
    </section>
  );
}
