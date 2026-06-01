'use client';

import dynamic from 'next/dynamic';
import type { Circuit } from '@/lib/types';

const CircuitMap = dynamic(() => import('./CircuitMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-bg" />,
});

interface Props {
  circuits: Circuit[];
  onSelect?: (circuit: Circuit) => void;
}

export default function MapClientWrapper({ circuits, onSelect }: Props) {
  return <CircuitMap circuits={circuits} onSelect={onSelect} />;
}
