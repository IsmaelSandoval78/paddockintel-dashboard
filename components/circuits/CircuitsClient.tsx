'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { Circuit, CircuitInfo } from '@/lib/types';
import MapClientWrapper from '@/components/map/MapClientWrapper';
import InlineCircuitPanel from './InlineCircuitPanel';

const COLLAPSE_MS = 200;

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
  const panelRef = useRef<HTMLDivElement>(null);

  async function handleSelect(circuit: Circuit) {
    const data = await fetchCircuitData(circuit.id);
    setCircuitInfo(data);
    setIsOpen(true);
    // Scroll panel into view after grid animation starts
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleClose() {
    setIsOpen(false);
    // Keep content rendered until collapse animation completes
    setTimeout(() => setCircuitInfo(null), COLLAPSE_MS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {/* ── Map — fills viewport minus navbar + header + legend ── */}
      <div className="h-[calc(100dvh-9rem)] bg-bg">
        <MapClientWrapper circuits={circuits} onSelect={handleSelect} />
      </div>

      {/* ── Legend ───────────────────────────────────────────── */}
      <div className="h-10 px-5 border-t border-border flex items-center gap-6 shrink-0">
        <div className="flex items-center gap-2">
          {/* matches CircuitMap 2026 dot color */}
          <div className="w-2 h-2 rounded-full bg-red" />
          <span className="font-mono text-xs text-text-3">{t('legend.season')}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* matches CircuitMap historical dot color */}
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
