import { getTranslations } from 'next-intl/server';
import type { RaceTrace } from '@/lib/raceHighlights';
import type { RaceStoryLabels } from './RaceStoryCard';

// Everything RaceStoryCard needs besides the trace itself: the biggest late-race faller (the
// "mover"), and every label and summary sentence built from the trace. Shared by the home and
// the race-report article so the two never describe the same race differently.

export type RaceStoryMover = { driver: string; peakLap: number; peakPos: number; note: string; final: number };

export async function buildRaceStory(
  trace: RaceTrace,
  surname: (code: string) => string,
  fmt3: (n: number) => string,
): Promise<{ mover: RaceStoryMover | null; labels: RaceStoryLabels }> {
  const t = await getTranslations('homeDusk.story');

  let mover: RaceStoryMover | null = null;
  for (const d of trace.drivers.slice(1)) {
    const later = d.positions.slice(1).filter((p): p is number => p !== null);
    const final = d.positions[d.positions.length - 1];
    if (!later.length || final === null) continue;
    const peak = Math.min(...later);
    if (final - peak >= 2 && (!mover || final - peak > mover.final - mover.peakPos)) {
      mover = {
        driver: d.driver,
        peakPos: peak,
        peakLap: d.positions.indexOf(peak, 1) + 1,
        final,
        note: t('moverNote', { driver: d.driver, peak, final }),
      };
    }
  }

  const gap = trace.gap;
  const stops = gap
    ? trace.drivers
        .filter((d) => (d.driver === gap.chaser || d.driver === gap.leader) && d.pitLaps.length)
        .map((d) => t('stop', { driver: d.driver, laps: d.pitLaps.join(', ') }))
        .join('; ')
    : '';
  const leaderCode = trace.drivers[0]?.driver ?? '';
  const ledCount = trace.drivers[0]?.positions.filter((p) => p === 1).length ?? 0;
  const summaryOrder = [
    ledCount === trace.totalLaps
      ? t('summaryOrderAll', { leader: surname(leaderCode) })
      : t('summaryOrder', { leader: surname(leaderCode), led: ledCount, total: trace.totalLaps }),
    mover ? t('mover', { driver: surname(mover.driver), peak: mover.peakPos, final: mover.final }) : '',
  ]
    .filter(Boolean)
    .join(' ');
  const flagGap = gap ? fmt3(gap.seconds[gap.seconds.length - 1]) : '';

  return {
    mover,
    labels: {
      title: t('title'),
      subGap: gap ? t('subGap', { leader: surname(gap.leader), chaser: surname(gap.chaser) }) : '',
      subOrder: t('subOrder', { n: trace.drivers.length }),
      tabGap: gap ? t('tabGap', { chaser: surname(gap.chaser) }) : '',
      tabOrder: t('tabOrder'),
      tablist: t('tablist'),
      summaryGap: gap ? t('summaryGap', { gap: flagGap, stops }) : '',
      summaryOrder,
      source: t('source'),
      vsc: t('vsc'),
      lap: t('lap', { lap: '{lap}' }),
      pit: t('pit', { driver: '{driver}' }),
      pitVsc: t('pitVsc', { driver: '{driver}' }),
      tip: t('tip', { lap: '{lap}', driver: '{driver}', gap: '{gap}' }),
      ariaGap: gap ? t('ariaGap', { leader: surname(gap.leader), chaser: surname(gap.chaser), gap: flagGap }) : '',
      ariaOrder: t('ariaOrder', { n: trace.drivers.length }),
    },
  };
}
