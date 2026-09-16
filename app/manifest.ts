import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

// Confirmed 2026-08-04 (CLAUDE.md "Mobile strategy"): PWA, not a native app.
// This was decided but never actually built until now. Same host-detection
// pattern as sitemap.ts/robots.ts -- the Hub and the Magazine are different
// installable apps on the same deployment, so they get distinct names/colors
// rather than one generic manifest.
const MAGAZINE_HOSTS = new Set(['paddockintel.com', 'www.paddockintel.com']);

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const host = (await headers()).get('host')?.split(':')[0] ?? '';
  const isMagazine = MAGAZINE_HOSTS.has(host);

  return {
    name: isMagazine ? 'PaddockIntel Magazine' : 'PaddockIntel Hub',
    short_name: 'PaddockIntel',
    description: isMagazine
      ? 'F1 economics and data journalism, sourced and verified.'
      : 'F1 economic and performance intelligence, from 1950 to present.',
    start_url: '/',
    display: 'standalone',
    background_color: '#EDE3D0',
    theme_color: '#EDE3D0',
    icons: [
      { src: '/api/pwa-icon/?size=192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/api/pwa-icon/?size=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
