'use client';

import dynamic from 'next/dynamic';
import type { Circuit } from '@/lib/types';
import type { CircuitDominance } from './CircuitMap';

const CircuitMap = dynamic(() => import('./CircuitMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-bg" />,
});

interface FlyTarget {
  center: [number, number];
  zoom: number;
  seq: number;
}

interface Props {
  circuits: Circuit[];
  onSelect?: (circuit: Circuit) => void;
  flyTarget?: FlyTarget | null;
  dominanceData?: Record<number, CircuitDominance> | null;
}

export default function MapClientWrapper({ circuits, onSelect, flyTarget, dominanceData }: Props) {
  return (
    <CircuitMap
      circuits={circuits}
      onSelect={onSelect}
      flyTarget={flyTarget}
      dominanceData={dominanceData}
    />
  );
}
