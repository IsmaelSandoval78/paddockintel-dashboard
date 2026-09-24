import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

// Same host-detection pattern as app/sitemap.ts -- both domains share this one
// deployment, so /robots.txt points back at whichever host actually asked
// for it, not a hardcoded one. Apex /robots.txt is 308'd to www in middleware
// before this runs, so a magazine request that reaches here is already on www.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host')?.split(':')[0] ?? 'www.paddockintel.com';
  const base = `https://${host}`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
