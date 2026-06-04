'use client';

import dynamic from 'next/dynamic';
import type { Circuit } from '@/lib/types';

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
}

export default function MapClientWrapper({ circuits, onSelect, flyTarget }: Props) {
  return <CircuitMap circuits={circuits} onSelect={onSelect} flyTarget={flyTarget} />;
}
