'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { Circuit, CircuitInfo } from '@/lib/types';
import MapClientWrapper from '@/components/map/MapClientWrapper';
import InlineCircuitPanel from './InlineCircuitPanel';
import BottomSheet from '@/components/ui/BottomSheet';

const COLLAPSE_MS = 200;

type Region = 'all' | 'europe' | 'americas' | 'asia' | 'africaMiddleEast' | 'oceania';

const REGIONS: Array<{ key: Region; labelKey: string }> = [
  { key: 'all',              labelKey: 'filter.all' },
  { key: 'europe',           labelKey: 'filter.europe' },
  { key: 'americas',         labelKey: 'filter.americas' },
  { key: 'asia',             labelKey: 'filter.asia' },
  { key: 'africaMiddleEast', labelKey: 'filter.africaMiddleEast' },
  { key: 'oceania',          labelKey: 'filter.oceania' },
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
  'Yugoslavia': 'europe',
  // Americas
  'USA': 'americas',
  'United States': 'americas',
  'Canada': 'americas',
  'Brazil': 'americas',
  'Mexico': 'americas',
  'Argentina': 'americas',
  'Venezuela': 'americas',
  // Asia & Pacific (incl. Middle East per spec)
  'Japan': 'asia',
  'China': 'asia',
  'South Korea': 'asia',
  'Korea': 'asia',
  'Malaysia': 'asia',
  'Singapore': 'asia',
  'India': 'asia',
  'Kazakhstan': 'asia',
  'Vietnam': 'asia',
  'Bahrain': 'asia',
  'UAE': 'asia',
  'United Arab Emirates': 'asia',
  'Saudi Arabia': 'asia',
  'Qatar': 'asia',
  'Azerbaijan': 'asia',
  'Turkey': 'asia',
  'Russia': 'asia',
  // Africa & Middle East
  'South Africa': 'africaMiddleEast',
  'Morocco': 'africaMiddleEast',
  // Oceania
  'Australia': 'oceania',
  'New Zealand': 'oceania',
};

interface FlyTarget {
  center: [number, number];
  zoom: number;
  seq: number;
}

const FLY_COORDS: Record<Region, { center: [number, number]; zoom: number }> = {
  all:              { center: [20,   0],   zoom: 2 },
  europe:           { center: [50,  10],   zoom: 4 },
  americas:         { center: [10, -80],   zoom: 3 },
  asia:             { center: [25, 100],   zoom: 3 },
  africaMiddleEast: { center: [20,  35],   zoom: 3 },
  oceania:          { center: [-25, 135],  zoom: 4 },
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
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const flySeqRef = useRef(0);
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
    flySeqRef.current += 1;
    setFlyTarget({ ...FLY_COORDS[region], seq: flySeqRef.current });
    if (isOpen) {
      setIsOpen(false);
      setTimeout(() => setCircuitInfo(null), COLLAPSE_MS);
    }
  }

  return (
    <main className="flex flex-col">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="h-12 px-5 border-b border-border flex items-center gap-3 shrink-0">
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em]">02 ·</span>
        <h1
          className="text-[clamp(1.4rem,2vw,1.8rem)] uppercase leading-none tracking-[-0.03em]"
          style={{ fontFamily: 'var(--pi-display)' }}
        >
          {t('title')}
        </h1>
        <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-1">
          {t('count', { count: totalCount })}
        </span>
      </div>

      {/* ── Continent filter bar ─────────────────────────────── */}
      <div className="h-9 px-5 border-b border-border flex items-center gap-5 shrink-0 overflow-x-auto">
        {REGIONS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => handleRegionChange(key)}
            className="font-mono text-[11px] uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 p-0 shrink-0"
            style={{ color: activeRegion === key ? 'var(--red)' : 'var(--text-2)' }}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* ── Map — 50vh on mobile, full remaining height on desktop ── */}
      <div className="h-[50vh] md:h-[calc(100dvh-11.25rem)] bg-bg">
        <MapClientWrapper
          circuits={filteredCircuits}
          onSelect={handleSelect}
          flyTarget={flyTarget}
        />
      </div>

      {/* ── Legend ───────────────────────────────────────────── */}
      <div className="h-10 px-5 border-t border-border flex items-center gap-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E61919' }} />
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('legend.season')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#B0AFA8' }} />
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('legend.historical')}</span>
        </div>
      </div>

      {/* ── Inline panel — desktop only ──────────────────────── */}
      <div
        ref={panelRef}
        className={[
          'hidden md:grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="overflow-hidden">
          {circuitInfo && (
            <InlineCircuitPanel info={circuitInfo} onClose={handleClose} />
          )}
        </div>
      </div>

      {/* ── Bottom sheet — mobile only ───────────────────────── */}
      <BottomSheet open={isOpen} onClose={handleClose}>
        {circuitInfo && (
          <InlineCircuitPanel info={circuitInfo} onClose={handleClose} />
        )}
      </BottomSheet>

    </main>
  );
}
