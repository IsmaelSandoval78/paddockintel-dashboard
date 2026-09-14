import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  trailingSlash: true,
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
