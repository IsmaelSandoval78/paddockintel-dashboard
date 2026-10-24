import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

// Same host-detection pattern as app/sitemap.ts -- both domains share this one
// deployment, so /robots.txt points back at whichever host actually asked
// for it, not a hardcoded one. Apex /robots.txt is 308'd to www in middleware
// before this runs, so a magazine request that reaches here is already on www.
const MAGAZINE_HOSTS = new Set(['paddockintel.com', 'www.paddockintel.com']);

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host')?.split(':')[0] ?? 'www.paddockintel.com';
  const base = `https://${host}`;

  return {
    rules: {
      userAgent: '*',
      // /api/og/ serves the per-article share images; Twitterbot honors robots.txt and drops
      // the image from a card it isn't allowed to fetch.
      allow: ['/', '/api/og/'],
      disallow: ['/api/'],
    },
    // The image sitemap only lists magazine pages (data cards), so the Hub doesn't advertise it.
    sitemap: MAGAZINE_HOSTS.has(host) ? [`${base}/sitemap.xml`, `${base}/sitemap-images.xml`] : `${base}/sitemap.xml`,
  };
}
