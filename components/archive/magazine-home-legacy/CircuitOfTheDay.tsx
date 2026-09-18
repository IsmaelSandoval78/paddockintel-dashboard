// UNUSED as of 2026-09-18 — the full expanded circuit history (sessions, champions, lap
// records) was cut from magazine-home in favor of components/blog/RaceSnapshotPanel.tsx's
// compact next-race countdown (name + days to go only). getCircuitOfTheDay() in
// app/[locale]/(blog)/magazine-home/data.ts is still used for that countdown data — only
// this full display component became unused.

import { getTranslations } from 'next-intl/server';
import type { CircuitOfTheDay as CircuitOfTheDayData } from '@/app/[locale]/(blog)/magazine-home/data';

function formatDate(iso: string, locale: string): string {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return date.toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale, {
    month: 'long',
    day: 'numeric',
  });
}

function formatSessionDay(iso: string, locale: string): string {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return date.toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale, { weekday: 'short' });
}

export default async function CircuitOfTheDay({ circuit, locale }: { circuit: CircuitOfTheDayData; locale: string }) {
  const t = await getTranslations('magazine.circuit');
  const hubUrl = `https://hub.paddockintel.com/circuits/${circuit.circuit_ref}`;

  const sessionLabels: Record<string, string> = {
    fp1: 'FP1',
    fp2: 'FP2',
    fp3: 'FP3',
    sprint: t('sessionSprint'),
    qualifying: t('sessionQualifying'),
    race: t('sessionRace'),
  };

  const stats: { label: string; value: string }[] = [];
  if (circuit.first_year) {
    stats.push({ label: t('since'), value: `${circuit.first_year} · ${circuit.total_races} ${t('races')}` });
  }
  if (circuit.laps) stats.push({ label: t('raceLaps'), value: String(circuit.laps) });
  if (circuit.avg_winner_grid) stats.push({ label: t('avgWinnerGrid'), value: `P${circuit.avg_winner_grid}` });
  if (circuit.fastest_lap) {
    stats.push({
      label: t('lapRecord'),
      value: `${circuit.fastest_lap.time} — ${circuit.fastest_lap.forename} ${circuit.fastest_lap.surname} (${circuit.fastest_lap.year})`,
    });
  }
  if (circuit.fastest_pit) {
    stats.push({
      label: t('fastestPit'),
      value: `${circuit.fastest_pit.duration}s — ${circuit.fastest_pit.constructor} (${circuit.fastest_pit.year})`,
    });
  }
  if (circuit.top_win_driver) {
    stats.push({
      label: t('mostWins'),
      value: `${circuit.top_win_driver.forename} ${circuit.top_win_driver.surname} (${circuit.top_win_driver.wins})`,
    });
  }
  if (circuit.top_constructor) {
    stats.push({ label: t('topConstructor'), value: `${circuit.top_constructor.name} (${circuit.top_constructor.wins})` });
  }

  return (
    <div>
      <div className="text-center mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-2 mb-2">
          {t('kicker')} · {t('round', { round: circuit.round })} · {formatDate(circuit.race_date, locale)}
        </p>
        <h2
          className="font-display uppercase text-text-1 tracking-[-0.02em]"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
        >
          {circuit.name}
        </h2>
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-text-2 mt-1">
          {circuit.location}, {circuit.country}
        </p>
      </div>

      <div className="text-center mb-10">
        <p
          className="tabular-nums leading-none"
          style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(1.6rem, 2.6vw, 2.1rem)', color: 'var(--terracotta)' }}
        >
          {t('daysUntil', { days: Math.max(circuit.days_until, 0) })}
        </p>
      </div>

      {circuit.sessions.length > 0 && (
        <div className="mb-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-3 text-center">
            {t('schedule')}
          </p>
          <div className="flex flex-col gap-2 max-w-sm mx-auto">
            {circuit.sessions.map((s) => (
              <div key={s.key} className="flex items-baseline justify-between border-b border-border-subtle pb-2">
                <span className="font-sans text-sm text-text-1">{sessionLabels[s.key]}</span>
                <span className="font-mono text-[11px] text-text-2 tabular-nums">
                  {formatSessionDay(s.date, locale)} · {s.time.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 pt-10 border-t border-border-subtle">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-1">{s.label}</p>
              <p className="font-sans text-text-1 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {circuit.champions.length > 0 && (
        <div className={stats.length > 0 ? 'mt-10 pt-10 border-t border-border-subtle' : 'pt-10 border-t border-border-subtle'}>
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-2 mb-3">{t('lastWinners')}</p>
          <div className="flex flex-col gap-1.5">
            {circuit.champions.map((c) => (
              <div key={c.year} className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-text-3 tabular-nums w-10 shrink-0">{c.year}</span>
                <span className="font-sans text-sm text-text-1">{c.forename} {c.surname}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <a
        href={hubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-8 font-mono text-[11px] uppercase tracking-[0.1em] text-text-2 hover:text-terracotta transition-colors duration-150"
      >
        {t('cta')} →
      </a>
    </div>
  );
}
