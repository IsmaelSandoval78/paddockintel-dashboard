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
      // 2026-10-01: digest_issues.slug had non-sequential and duplicate vol-NN
      // numbers (two issues both titled "vol-12", vol-15 sent before vol-13)
      // -- the weekly page's issueNumber() parses the display number straight
      // out of the slug, so readers literally saw a broken issue count.
      // Renumbered sequentially by published_at in Supabase; these redirects
      // keep every already-sent welcome/digest email link resolving.
      ...[
        ['vol-05-zandvoort-week-2026', 'vol-03-zandvoort-week-2026'],
        ['vol-06-week-2026-09-04', 'vol-04-week-2026-09-04'],
        ['vol-07-week-2026-09-09', 'vol-05-week-2026-09-09'],
        ['vol-08-week-2026-09-11', 'vol-06-week-2026-09-11'],
        ['vol-09-week-2026-09-14', 'vol-07-week-2026-09-14'],
        ['vol-10-week-2026-09-16', 'vol-08-week-2026-09-16'],
        ['vol-11-week-2026-09-17', 'vol-09-week-2026-09-17'],
        ['vol-13-week-2026-09-29', 'vol-10-week-2026-09-29'],
        ['vol-14-week-2026-09-21', 'vol-11-week-2026-09-21'],
        ['vol-15-week-2026-09-23', 'vol-13-week-2026-09-23'],
        ['vol-12-week-2026-09-25', 'vol-14-week-2026-09-25'],
      ].flatMap(([from, to]) =>
        ['', '/es', '/pt'].map((prefix) => ({
          source: `${prefix}/weekly/${from}`,
          destination: `${prefix}/weekly/${to}`,
          permanent: true,
        }))
      ),
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
