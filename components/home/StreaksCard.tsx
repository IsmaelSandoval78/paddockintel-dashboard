import { useTranslations } from 'next-intl';
import type { HomeStreaksData } from '@/lib/types';

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
  cadillac:     '#ffffff',
  audi:         '#bb0000',
};

function teamColor(ref: string): string {
  return TEAM_COLORS[ref] ?? 'var(--text-3)';
}

// Pip row: filled = consecutive wins ending at most recent race
function StreakPips({
  streak,
  total,
  color,
}: {
  streak: number;
  total: number;
  color: string;
}) {
  return (
    <div className="flex gap-1 items-center mt-2">
      {Array.from({ length: total }).map((_, i) => {
        const isWin = i >= total - streak;
        return (
          <div
            key={i}
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: isWin ? color : 'var(--border)' }}
          />
        );
      })}
    </div>
  );
}

// Progress bar: current streak vs all-time record
function RecordBar({
  current,
  allTime,
}: {
  current: number;
  allTime: number;
}) {
  const pct = Math.min(100, Math.round((current / allTime) * 100));
  return (
    <div className="mt-2 h-[3px] w-full bg-border overflow-hidden">
      <div
        className="h-full bg-text-2 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface PanelProps {
  label: string;
  name: string;
  constructorRef: string;
  streak: number;
  totalRounds: number;
  allTimeLabel?: string;
  allTimeStreak?: number;
  allTimeYear?: number;
  t: ReturnType<typeof useTranslations>;
}

function StreakPanel({
  label,
  name,
  constructorRef,
  streak,
  totalRounds,
  allTimeLabel,
  allTimeStreak,
  allTimeYear,
  t,
}: PanelProps) {
  const color = teamColor(constructorRef);
  const hasAllTime = allTimeLabel && allTimeStreak && allTimeYear;
  const pct = hasAllTime ? Math.round((streak / allTimeStreak!) * 100) : null;

  return (
    <div className="flex flex-col">
      {/* Section label */}
      <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-3">
        {label}
      </p>

      {/* Name + team dot */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span
          className="text-[clamp(1.1rem,2vw,1.3rem)] uppercase leading-none tracking-[-0.02em] text-text-1"
          style={{ fontFamily: 'var(--pi-display)' }}
        >
          {name}
        </span>
      </div>

      {/* Win count */}
      <div className="flex items-baseline gap-1.5 mt-2">
        <span
          className="tabular-nums leading-none text-text-1"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2rem,4vw,2.8rem)' }}
        >
          {streak}
        </span>
        <span className="font-mono text-[11px] text-text-2 uppercase tracking-[0.05em]">
          {t('streakConsecutive')}
        </span>
      </div>

      {/* Pip row */}
      <StreakPips streak={streak} total={totalRounds} color={color} />

      {/* Progress bar vs all-time — only when we have the reference */}
      {hasAllTime && pct !== null && (
        <>
          <RecordBar current={streak} allTime={allTimeStreak!} />
          <p className="font-mono text-[10px] text-text-3 mt-1 tabular-nums">
            {pct}% {t('streakAllTime').toLowerCase()}
          </p>

          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
              {t('streakAllTime')}
            </span>
            <span
              className="text-[13px] uppercase leading-none text-text-2 tracking-[-0.01em]"
              style={{ fontFamily: 'var(--pi-display)' }}
            >
              {allTimeLabel}
            </span>
            <span className="font-mono text-[11px] text-text-1 tabular-nums shrink-0">
              {allTimeStreak}
            </span>
            <span className="font-mono text-[10px] text-text-3 tabular-nums shrink-0">
              ·{allTimeYear}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function StreaksCard({ data }: { data: HomeStreaksData }) {
  const t = useTranslations('hub.home');

  const { driverActive, constructorActive, driverAllTime, constructorAllTime, totalRounds2026 } =
    data;

  if (!driverActive && !constructorActive) return null;

  return (
    <div>
      {/* Header */}
      <p className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] mb-5">
        02 · {t('streaks').toUpperCase()} · 2026
      </p>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">

        {/* Drivers */}
        {driverActive && (
          <StreakPanel
            label={t('streakDrivers').toUpperCase()}
            name={driverActive.surname}
            constructorRef={driverActive.constructor_ref}
            streak={driverActive.streak}
            totalRounds={totalRounds2026}
            allTimeLabel={driverAllTime ? `${driverAllTime.forename[0]}. ${driverAllTime.surname}` : undefined}
            allTimeStreak={driverAllTime?.streak}
            allTimeYear={driverAllTime?.year}
            t={t}
          />
        )}

        {/* Constructors */}
        {constructorActive && (
          <StreakPanel
            label={t('streakConstructors').toUpperCase()}
            name={constructorActive.name}
            constructorRef={constructorActive.constructor_ref}
            streak={constructorActive.streak}
            totalRounds={totalRounds2026}
            allTimeLabel={constructorAllTime?.name}
            allTimeStreak={constructorAllTime?.streak}
            allTimeYear={constructorAllTime?.year}
            t={t}
          />
        )}

      </div>
    </div>
  );
}
