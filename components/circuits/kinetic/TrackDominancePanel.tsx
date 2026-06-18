'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { DriverSelectorRow } from '@/lib/types';

interface H2HResult {
  winsA: number;
  winsB: number;
  total: number;
}

export default function TrackDominancePanel({
  circuitId,
  drivers,
}: {
  circuitId: number;
  drivers: DriverSelectorRow[];
}) {
  const t = useTranslations('circuitDetail.headToHead');
  const [driverA, setDriverA] = useState('');
  const [driverB, setDriverB] = useState('');
  const [result, setResult] = useState<H2HResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [noOverlap, setNoOverlap] = useState(false);

  useEffect(() => {
    if (!driverA || !driverB || driverA === driverB) {
      setResult(null);
      setNoOverlap(false);
      return;
    }
    setLoading(true);
    setNoOverlap(false);
    fetch(`/api/circuits/dominance?a=${driverA}&b=${driverB}`)
      .then((r) => r.json())
      .then((data: { results: Array<{ circuit_id: number; wins_a: number; wins_b: number; total: number }> }) => {
        const row = data.results.find((r) => r.circuit_id === circuitId);
        if (!row) {
          setNoOverlap(true);
          setResult(null);
        } else {
          setResult({ winsA: row.wins_a, winsB: row.wins_b, total: row.total });
          setNoOverlap(false);
        }
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [driverA, driverB, circuitId]);

  const driverAObj = drivers.find((d) => d.driver_ref === driverA);
  const driverBObj = drivers.find((d) => d.driver_ref === driverB);

  const pctA = result ? result.winsA / result.total : 0;
  const pctB = result ? result.winsB / result.total : 0;
  const ties = result ? result.total - result.winsA - result.winsB : 0;

  return (
    <div className="px-6 py-5 flex flex-col gap-5">

      {/* Driver selectors */}
      <div className="flex items-center gap-4 flex-wrap">
        <select
          value={driverA}
          onChange={(e) => setDriverA(e.target.value)}
          className="font-mono text-[11px] uppercase tracking-[0.08em] bg-surface border border-border px-3 py-1.5 outline-none cursor-pointer appearance-none"
          style={{ color: driverA ? 'var(--red)' : 'var(--text-3)', minWidth: '14ch' }}
        >
          <option value="">{t('driverA').toUpperCase()}</option>
          {drivers.map((d) => (
            <option key={d.driver_ref} value={d.driver_ref}>
              {d.surname.toUpperCase()}{d.wins > 0 ? ` (${d.wins}W)` : ''}
            </option>
          ))}
        </select>

        <span className="font-mono text-[11px] text-text-3">{t('vs')}</span>

        <select
          value={driverB}
          onChange={(e) => setDriverB(e.target.value)}
          className="font-mono text-[11px] uppercase tracking-[0.08em] bg-surface border border-border px-3 py-1.5 outline-none cursor-pointer appearance-none"
          style={{ color: driverB ? 'var(--team-redbull)' : 'var(--text-3)', minWidth: '14ch' }}
        >
          <option value="">{t('driverB').toUpperCase()}</option>
          {drivers.map((d) => (
            <option key={d.driver_ref} value={d.driver_ref}>
              {d.surname.toUpperCase()}{d.wins > 0 ? ` (${d.wins}W)` : ''}
            </option>
          ))}
        </select>

        {loading && (
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('loading')}</span>
        )}
      </div>

      {/* Result */}
      {result && !loading && (
        <div className="flex flex-col gap-3">

          {/* Score */}
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-start">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] mb-1" style={{ color: 'var(--red)' }}>
                {driverAObj?.surname.toUpperCase() ?? 'A'}
              </span>
              <span
                className="tabular-nums leading-none"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2.5rem,5vw,4rem)', color: 'var(--red)' }}
              >
                {result.winsA}
              </span>
            </div>

            <span
              className="font-mono text-text-3 mb-2"
              style={{ fontSize: 'clamp(1rem,2vw,1.5rem)' }}
            >
              —
            </span>

            <div className="flex flex-col items-start">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] mb-1" style={{ color: 'var(--team-redbull)' }}>
                {driverBObj?.surname.toUpperCase() ?? 'B'}
              </span>
              <span
                className="tabular-nums leading-none"
                style={{ fontFamily: 'var(--pi-display)', fontSize: 'clamp(2.5rem,5vw,4rem)', color: 'var(--team-redbull)' }}
              >
                {result.winsB}
              </span>
            </div>

            <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] mb-2 ml-2">
              {t('racesTogether', { count: result.total })}
            </span>
          </div>

          {/* H2H bar */}
          <div className="flex h-1.5 w-full overflow-hidden bg-border" style={{ maxWidth: '320px' }}>
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{ width: `${pctA * 100}%`, backgroundColor: 'var(--red)' }}
            />
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{ width: `${pctB * 100}%`, backgroundColor: 'var(--team-redbull)' }}
            />
          </div>

          {/* Ties */}
          {ties > 0 && (
            <span className="font-mono text-[10px] text-text-3">
              {t('ties', { count: ties })}
            </span>
          )}

        </div>
      )}

      {noOverlap && !loading && driverA && driverB && (
        <p className="font-mono text-[12px] text-text-3">{t('noOverlap')}</p>
      )}

      {!driverA && !driverB && (
        <p className="font-mono text-[11px] text-text-3">{t('prompt')}</p>
      )}

    </div>
  );
}
