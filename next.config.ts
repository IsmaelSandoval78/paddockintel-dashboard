import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  trailingSlash: true,
  // Lets the dev server accept requests forwarded through GitHub Codespaces'
  // preview domain, which is a different origin than localhost.
  allowedDevOrigins: ['*.app.github.dev'],
  async redirects() {
    return [
      // 2026-09-15: antonelli-2m-salary-mercedes-contract-2026 and
      // antonelli-salary-2026 were two near-duplicate articles on the same
      // query (published 15 days apart), splitting Google's ranking signal
      // between them -- confirmed via Search Console (stuck at ~position
      // 8.7 for "Kimi Antonelli salary"). Consolidating into the newer,
      // more complete one; the older article's DB row stays untouched.
      {
        source: '/antonelli-2m-salary-mercedes-contract-2026',
        destination: '/antonelli-salary-2026',
        permanent: true,
      },
      {
        source: '/es/antonelli-2m-salary-mercedes-contract-2026',
        destination: '/es/antonelli-salary-2026',
        permanent: true,
      },
      {
        source: '/pt/antonelli-2m-salary-mercedes-contract-2026',
        destination: '/pt/antonelli-salary-2026',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'paddockintel.com',
        pathname: '/content/images/**',
      },
      {
        protocol: 'https',
        hostname: 'hub.paddockintel.com',
        pathname: '/charts/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
