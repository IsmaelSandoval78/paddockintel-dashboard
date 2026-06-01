'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { Circuit, CircuitInfo } from '@/lib/types';
import MapClientWrapper from '@/components/map/MapClientWrapper';
import InlineCircuitPanel from './InlineCircuitPanel';

const COLLAPSE_MS = 200;

type Region = 'all' | 'europe' | 'americas' | 'asia' | 'africaMiddleEast';

const REGIONS: Array<{ key: Region; labelKey: string }> = [
  { key: 'all',             labelKey: 'filter.all' },
  { key: 'europe',          labelKey: 'filter.europe' },
  { key: 'americas',        labelKey: 'filter.americas' },
  { key: 'asia',            labelKey: 'filter.asia' },
  { key: 'africaMiddleEast', labelKey: 'filter.africaMiddleEast' },
];

const COUNTRY_REGION: Record<string, Region> = {
  // Europe
  'UK': 'europe',
  'United Kingdom': 'europe',
  'Germany': 'europe',
  'France': 'europe',
  'Italy': 'europe',
  'Spain': 'europe',
  'Belgium': 'europe',
  'Netherlands': 'europe',
  'Austria': 'europe',
  'Hungary': 'europe',
  'Switzerland': 'europe',
  'Portugal': 'europe',
  'Monaco': 'europe',
  'Sweden': 'europe',
  'Luxembourg': 'europe',
  'San Marino': 'europe',
  'Russia': 'europe',
  'Azerbaijan': 'europe',
  'Yugoslavia': 'europe',
  'Turkey': 'europe',
  // Americas
  'USA': 'americas',
  'United States': 'americas',
  'Canada': 'americas',
  'Brazil': 'americas',
  'Mexico': 'americas',
  'Argentina': 'americas',
  'Venezuela': 'americas',
  // Asia & Pacific
  'Japan': 'asia',
  'China': 'asia',
  'South Korea': 'asia',
  'Korea': 'asia',
  'Malaysia': 'asia',
  'Singapore': 'asia',
  'India': 'asia',
  'Australia': 'asia',
  'Kazakhstan': 'asia',
  // Africa & Middle East
  'South Africa': 'africaMiddleEast',
  'Morocco': 'africaMiddleEast',
  'Bahrain': 'africaMiddleEast',
  'UAE': 'africaMiddleEast',
  'United Arab Emirates': 'africaMiddleEast',
  'Qatar': 'africaMiddleEast',
  'Saudi Arabia': 'africaMiddleEast',
};

async function fetchCircuitData(id: number): Promise<CircuitInfo | null> {
  try {
    const res = await fetch(`/api/circuits/${id}`);
    return await res.json();
  } catch {
    return null;
  }
}

export default function CircuitsClient({
  circuits,
  totalCount,
}: {
  circuits: Circuit[];
  totalCount: number;
}) {
  const t = useTranslations('circuits');
  const [circuitInfo, setCircuitInfo] = useState<CircuitInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState<Region>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  const filteredCircuits =
    activeRegion === 'all'
      ? circuits
      : circuits.filter((c) => COUNTRY_REGION[c.country] === activeRegion);

  async function handleSelect(circuit: Circuit) {
    const data = await fetchCircuitData(circuit.id);
    setCircuitInfo(data);
    setIsOpen(true);
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleClose() {
    setIsOpen(false);
    setTimeout(() => setCircuitInfo(null), COLLAPSE_MS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleRegionChange(region: Region) {
    setActiveRegion(region);
    if (isOpen) {
      setIsOpen(false);
      setTimeout(() => setCircuitInfo(null), COLLAPSE_MS);
    }
  }

  return (
    <main className="flex flex-col">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="h-12 px-5 border-b border-border flex items-center gap-3 shrink-0">
        <span className="font-mono text-xs text-text-3">02 ·</span>
        <h1 className="font-serif text-2xl text-text-1">{t('title')}</h1>
        <span className="font-mono text-xs text-text-3 ml-1">
          {t('count', { count: totalCount })}
        </span>
      </div>

      {/* ── Filter bar ───────────────────────────────────────── */}
      <div className="h-9 px-5 border-b border-border flex items-center gap-5 shrink-0">
        {REGIONS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => handleRegionChange(key)}
            className={[
              'font-mono text-[11px] uppercase tracking-[0.06em] transition-colors duration-150 cursor-pointer bg-transparent border-0 p-0',
              activeRegion === key ? 'text-red' : 'text-text-2 hover:text-text-1',
            ].join(' ')}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* ── Map — fills viewport minus navbar + header + filter + legend ── */}
      <div className="h-[calc(100dvh-11.25rem)] bg-bg">
        <MapClientWrapper circuits={filteredCircuits} onSelect={handleSelect} />
      </div>

      {/* ── Legend ───────────────────────────────────────────── */}
      <div className="h-10 px-5 border-t border-border flex items-center gap-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red" />
          <span className="font-mono text-xs text-text-3">{t('legend.season')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#CCCCCC]" />
          <span className="font-mono text-xs text-text-3">{t('legend.historical')}</span>
        </div>
      </div>

      {/* ── Inline panel — CSS grid-rows height animation ──── */}
      <div
        ref={panelRef}
        className={[
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="overflow-hidden">
          {circuitInfo && (
            <InlineCircuitPanel info={circuitInfo} onClose={handleClose} />
          )}
        </div>
      </div>

    </main>
  );
}
