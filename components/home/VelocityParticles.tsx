'use client';

import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import type { ISourceOptions } from '@tsparticles/engine';

const OPTIONS: ISourceOptions = {
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  detectRetina: true,
  particles: {
    color: { value: '#050505' },
    move: {
      direction: 'right',
      enable: true,
      outModes: { default: 'out' },
      speed: { min: 12, max: 30 },
      straight: true,
    },
    number: {
      value: 60,
      density: { enable: true, width: 1440, height: 120 },
    },
    opacity: { value: { min: 0.03, max: 0.12 } },
    shape: { type: 'circle' },
    size: { value: { min: 0.5, max: 2 } },
  },
};

async function initEngine(engine: Engine) {
  await loadSlim(engine);
}

export default function VelocityParticles() {
  return (
    <ParticlesProvider init={initEngine}>
      <Particles
        id="velocity"
        className="absolute inset-0 w-full h-full pointer-events-none"
        options={OPTIONS}
      />
    </ParticlesProvider>
  );
}
