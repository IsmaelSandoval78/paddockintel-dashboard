'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import {
  US_EASTERN_TZ,
  formatSessionClock,
  utcOffsetLabel,
  zonedDayKey,
  type ScheduleSession,
  type SessionKey,
  type WeekendSchedule,
} from '@/lib/weekendSchedule';

const SESSION_KEYS: Record<SessionKey, 'fp1' | 'fp2' | 'fp3' | 'sprint' | 'qualifying' | 'race'> = {
  fp1: 'fp1',
  fp2: 'fp2',
  fp3: 'fp3',
  sprint: 'sprint',
  qualifying: 'qualifying',
  race: 'race',
};

export default function WeekendScheduleStrip({
  schedule,
  location,
}: {
  schedule: WeekendSchedule;
  location: string;
}) {
  const t = useTranslations('circuitDetail.schedule');
  const format = useFormatter();
  const zone = schedule.timeZone;
  const dayZone = zone ?? 'UTC';
  const showLocal = zone !== null;
  const offset = zone ? utcOffsetLabel(zone, schedule.sessions[0].startUtc) : null;

  const groups: { key: string; label: string; sessions: ScheduleSession[] }[] = [];
  for (const session of schedule.sessions) {
    const key = zonedDayKey(session.startUtc, dayZone);
    const current = groups[groups.length - 1];
    if (current && current.key === key) {
      current.sessions.push(session);
    } else {
      groups.push({
        key,
        label: format.dateTime(new Date(session.startUtc), {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          timeZone: dayZone,
        }),
        sessions: [session],
      });
    }
  }

  const rowGrid = showLocal
    ? 'sm:grid-cols-[minmax(6.5rem,1.15fr)_repeat(3,minmax(0,1fr))]'
    : 'sm:grid-cols-[minmax(6.5rem,1.15fr)_repeat(2,minmax(0,1fr))]';

  return (
    <div className="border-t border-border">
      <div className="px-6 py-3 flex items-baseline gap-3 border-b border-border-subtle">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3">
          {t('title')}
        </h3>
        {showLocal && offset && (
          <p className="ml-auto font-mono text-[10px] uppercase tracking-[0.08em] text-text-3 tabular-nums">
            {location} · {offset}
          </p>
        )}
      </div>

      <div className={`hidden sm:grid px-6 pt-2 pb-1 gap-3 ${rowGrid}`}>
        <span />
        {showLocal && (
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-3">{t('local')}</span>
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-3" title={t('etFull')}>
          {t('et')}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-3">{t('utc')}</span>
      </div>

      {groups.map((group) => (
        <div key={group.key}>
          <p className="px-6 pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-text-2">
            {group.label}
          </p>
          {group.sessions.map((session) => {
            const localClock = zone ? formatSessionClock(session.startUtc, zone) : null;
            const etClock = formatSessionClock(session.startUtc, US_EASTERN_TZ);
            const utcClock = formatSessionClock(session.startUtc, 'UTC');
            const primary = session.key === 'race' ? 'text-accent-2' : 'text-text-1';
            const localClass = `font-mono text-[13px] tabular-nums ${showLocal ? primary : 'text-text-1'}`;
            const etClass = `font-mono text-[13px] tabular-nums ${showLocal ? 'text-text-1' : primary}`;

            return (
              <div
                key={session.key}
                className={`px-6 py-2 border-b border-border-subtle grid grid-cols-1 gap-0.5 sm:items-baseline sm:gap-3 sm:py-1.5 ${rowGrid}`}
              >
                <span className="text-[13px] text-text-1">{t(SESSION_KEYS[session.key])}</span>
                <p className="font-mono text-[12px] tabular-nums text-text-1 sm:hidden">
                  {showLocal && localClock && (
                    <>
                      <span className="text-text-3">{t('local')} </span>
                      <span className={primary}>{localClock}</span>
                      <span className="text-text-3"> · </span>
                    </>
                  )}
                  <span className="text-text-3">{t('et')} </span>
                  <span className={showLocal ? 'text-text-1' : primary}>{etClock}</span>
                  <span className="text-text-3"> · {t('utc')} </span>
                  <span className="text-text-3">{utcClock}</span>
                </p>
                {showLocal && localClock && <span className={`hidden sm:block ${localClass}`}>{localClock}</span>}
                <span className={`hidden sm:block ${etClass}`}>{etClock}</span>
                <span className="hidden sm:block font-mono text-[13px] tabular-nums text-text-3">{utcClock}</span>
              </div>
            );
          })}
        </div>
      ))}

      {(schedule.noteKey || schedule.feedSlug) && (
        <div className="px-6 py-3 flex flex-col gap-2">
          {schedule.noteKey === 'bakuSaturday' && (
            <p className="text-[13px] leading-snug text-text-2">{t('notes.bakuSaturday')}</p>
          )}
          {schedule.feedSlug && (
            <Link
              href={`/feed/${schedule.feedSlug}`}
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent hover:text-text-1 transition-colors duration-150 w-fit"
            >
              {t('feedCta')} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
