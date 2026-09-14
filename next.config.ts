import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  trailingSlash: true,
  // Lets the dev server accept requests forwarded through GitHub Codespaces'
  // preview domain, which is a different origin than localhost.
  allowedDevOrigins: ['*.app.github.dev'],
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
