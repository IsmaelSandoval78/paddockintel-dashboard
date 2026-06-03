'use client';

import { useState, useEffect, type ReactNode } from 'react';
import type { Circuit, CircuitInfo } from '@/lib/types';
import MapClientWrapper from '@/components/map/MapClientWrapper';
import CircuitPanel from '@/components/panels/CircuitPanel';

const FADE_MS = 150;
const CIRCUIT_PARAM = 'c';

interface Props {
  circuits: Circuit[];
  children: ReactNode; // DefaultPanel — server-rendered, passed as prop
}

async function fetchCircuitData(id: number): Promise<CircuitInfo | null> {
  try {
    const res = await fetch(`/api/circuits/${id}`);
    return await res.json();
  } catch {
    return null;
  }
}

export default function HubClient({ circuits, children }: Props) {
  const [circuitInfo, setCircuitInfo] = useState<CircuitInfo | null>(null);
  const [visible, setVisible] = useState(true);

  function openPanel(id: number) {
    setVisible(false);
    setTimeout(async () => {
      const data = await fetchCircuitData(id);
      setCircuitInfo(data);
      setVisible(true);
    }, FADE_MS);
  }

  // Restore circuit from URL on mount (handles locale switches that preserve ?c=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get(CIRCUIT_PARAM);
    if (id) {
      const num = parseInt(id, 10);
      if (!isNaN(num)) openPanel(num);
    }
    // intentionally runs once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(circuit: Circuit) {
    // Encode selection in URL without causing navigation
    const params = new URLSearchParams(window.location.search);
    params.set(CIRCUIT_PARAM, circuit.id.toString());
    window.history.replaceState({}, '', `?${params.toString()}`);
    openPanel(circuit.id);
  }

  function handleClose() {
    // Remove circuit param from URL
    const params = new URLSearchParams(window.location.search);
    params.delete(CIRCUIT_PARAM);
    const search = params.toString();
    window.history.replaceState({}, '', search ? `?${search}` : window.location.pathname);
    setVisible(false);
    setTimeout(() => {
      setCircuitInfo(null);
      setVisible(true);
    }, FADE_MS);
  }

  return (
    <main className="flex flex-col md:flex-row md:h-[calc(100vh-3rem)]">
      {/* Map — 50vh on mobile, 62% on desktop */}
      <div className="h-[50vh] md:h-full md:w-[62%] bg-bg shrink-0">
        <MapClientWrapper circuits={circuits} onSelect={handleSelect} />
      </div>

      {/* Panel — full-width below on mobile, 38% side on desktop */}
      <div
        className={[
          'w-full md:w-[38%] shrink-0 bg-bg border-t border-border md:border-t-0 md:border-l overflow-y-auto',
          'transition-opacity duration-150',
          visible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        {circuitInfo ? (
          <CircuitPanel info={circuitInfo} onClose={handleClose} />
        ) : (
          children
        )}
      </div>
    </main>
  );
}
