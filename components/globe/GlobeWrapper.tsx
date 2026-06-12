'use client';

import dynamic from 'next/dynamic';
import type { GlobeCircuit } from './F1Globe';

const F1Globe = dynamic(() => import('./F1Globe'), { ssr: false });

export default function GlobeWrapper({ circuits }: { circuits: GlobeCircuit[] }) {
  return <F1Globe circuits={circuits} />;
}
