'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { Circuit, CircuitInfo, CalendarStop } from '@/lib/types';
import CircuitLeftPanel from './CircuitLeftPanel';
import BottomSheet from '@/components/ui/BottomSheet';

gsap.registerPlugin(SplitText);

const CircuitMapSVG = dynamic(() => import('@/components/map/CircuitMapSVG'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-bg" />,
});

// ─── Region config ────────────────────────────────────────────────

type Region = 'all' | 'europe' | 'americas' | 'asia' | 'africaMiddleEast' | 'oceania';

const REGIONS: Array<{ key: Region; label: string }> = [
  { key: 'all',              label: 'All' },
  { key: 'europe',           label: 'Europe' },
  { key: 'americas',         label: 'Americas' },
  { key: 'asia',             label: 'Asia & Pacific' },
  { key: 'africaMiddleEast', label: 'Africa & Middle East' },
  { key: 'oceania',          label: 'Oceania' },
];

// ─── Fetch circuit inline data ────────────────────────────────────

async function fetchCircuitInfo(id: number): Promise<CircuitInfo | null> {
  try {
    const res = await fetch(`/api/circuits/${id}`);
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Component ───────────────────────────────────────────────────

export default function CircuitsClient({
  circuits,
  totalCount,
  calendar2026,
}: {
  circuits: Circuit[];
  totalCount: number;
  calendar2026: CalendarStop[];
}) {
  const t = useTranslations('circuits');

  const [circuitInfo,  setCircuitInfo]  = useState<CircuitInfo | null>(null);
  const [selectedId,   setSelectedId]   = useState<number | null>(null);
  const [isOpen,       setIsOpen]       = useState(false);
  const [activeRegion, setActiveRegion] = useState<Region>('all');
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; nonce: number } | null>(null);

  const searchMatches = search.trim()
    ? circuits.filter((c) => {
        const q = search.trim().toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef  = useRef<HTMLHeadingElement>(null);

  // Header entrance animation
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const ctx = gsap.context(() => {
        document.fonts.ready.then(() => {
          if (!titleRef.current) return;
          const split = new SplitText(titleRef.current, { type: 'chars' });
          gsap.set(titleRef.current, { visibility: 'visible' });
          gsap.from(split.chars, { yPercent: 110, duration: 0.7, stagger: 0.04, ease: 'power4.out' });
          gsap.from('.circuits-filter-btn', { opacity: 0, y: 6, duration: 0.4, stagger: 0.05, ease: 'power3.out', delay: 0.35 });
        });
      }, headerRef);
      return () => ctx.revert();
    }
  }, []);

  async function handleSelect(circuit: Circuit) {
    setLoading(true);
    setSelectedId(circuit.id);
    const data = await fetchCircuitInfo(circuit.id);
    setCircuitInfo(data);
    setIsOpen(true);
    setLoading(false);
  }

  function handleClose() {
    setIsOpen(false);
    setSelectedId(null);
    setTimeout(() => setCircuitInfo(null), 250);
  }

  function handleRegion(region: Region) {
    setActiveRegion(region);
  }

  function handleSearchSelect(circuit: Circuit) {
    setFlyTo((prev) => ({ lat: circuit.lat, lng: circuit.lng, nonce: (prev?.nonce ?? 0) + 1 }));
    handleSelect(circuit);
    setSearch('');
  }

  return (
    <main className="flex flex-col" style={{ height: '100dvh' }}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div
        ref={headerRef}
        className="h-12 px-5 border-b border-border flex items-center gap-3 shrink-0 overflow-hidden bg-bg"
      >
        <span className="font-mono text-[10px] text-text-2 uppercase tracking-[0.1em] shrink-0">02 ·</span>
        <div className="kinetic-mask shrink-0">
          <h1
            ref={titleRef}
            className="text-[clamp(1.4rem,2vw,1.8rem)] uppercase leading-none tracking-[-0.03em]"
            style={{ fontFamily: 'var(--pi-display)', visibility: 'hidden' }}
          >
            {t('title')}
          </h1>
        </div>
        <span className="font-mono text-[10px] text-text-3 tracking-[0.1em] uppercase ml-1">
          {t('count', { count: totalCount })}
        </span>
        {loading && (
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em] ml-auto animate-pulse">
            loading…
          </span>
        )}
      </div>

      {/* ── Filter bar ───────────────────────────────────────── */}
      <div className="h-9 px-5 border-b border-border flex items-center gap-5 shrink-0 overflow-x-auto bg-bg">
        {REGIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleRegion(key)}
            className="circuits-filter-btn font-mono text-[11px] text-text-1 uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 p-0 shrink-0 transition-colors duration-150"
            style={{ color: activeRegion === key ? 'var(--red)' : undefined }}
          >
            {label}
          </button>
        ))}
        {calendar2026.length > 1 && (
          <>
            <div className="w-px h-4 shrink-0" style={{ background: 'var(--border-subtle)' }} />
            <button
              onClick={() => setShowCalendar((v) => !v)}
              className="font-mono text-[11px] uppercase tracking-[0.1em] cursor-pointer bg-transparent border-0 p-0 shrink-0 transition-colors duration-150"
              style={{ color: showCalendar ? 'var(--red)' : 'var(--text-2)' }}
            >
              {t('calendar.toggle')}
            </button>
          </>
        )}
      </div>

      {/* ── Search row — own row, no clipping ancestors for the dropdown ── */}
      <div className="h-9 px-5 border-b border-border flex items-center shrink-0 relative bg-bg">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search.placeholder')}
          className="font-mono text-[11px] text-text-2 bg-transparent border-0 p-0 focus:outline-none placeholder:text-text-3 w-full max-w-[280px]"
        />
        {search.trim() && (
          <div className="absolute left-5 top-full w-[300px] max-h-[260px] overflow-y-auto bg-bg border border-border">
            {searchMatches.length > 0 ? (
              searchMatches.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSearchSelect(c)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-raised transition-colors duration-100 flex flex-col gap-0.5 border-b border-border last:border-0"
                >
                  <span className="text-[13px] text-text-1">{c.name}</span>
                  <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">
                    {c.location} · {c.country}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 font-mono text-[11px] text-text-3 uppercase tracking-[0.06em]">
                {t('search.noResults')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Main: left panel + globe ─────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

        {/* Left panel — desktop slide-in */}
        <div
          className="hidden md:flex flex-col border-r border-border overflow-hidden transition-[width] duration-300 ease-out shrink-0"
          style={{ width: isOpen ? '42%' : '0%' }}
        >
          {circuitInfo && (
            <CircuitLeftPanel info={circuitInfo} onClose={handleClose} />
          )}
        </div>

        {/* Map */}
        <div className="flex-1 min-w-0 h-[55vw] md:h-full bg-bg">
          <CircuitMapSVG
            circuits={circuits}
            onSelect={handleSelect}
            targetRegion={activeRegion}
            selectedId={selectedId}
          />
        </div>

      </div>

      {/* ── Legend ───────────────────────────────────────────── */}
      <div className="h-9 px-5 border-t border-border flex items-center gap-6 shrink-0 bg-bg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--red)' }} />
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('legend.season')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border-subtle)' }} />
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.06em]">{t('legend.historical')}</span>
        </div>
      </div>

      {/* ── Bottom sheet — mobile only ───────────────────────── */}
      <BottomSheet open={isOpen} onClose={handleClose}>
        {circuitInfo && (
          <CircuitLeftPanel info={circuitInfo} onClose={handleClose} />
        )}
      </BottomSheet>

    </main>
  );
}
